// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title NXDToken
 * @dev NXD ERC20 token with staking, burning, and governance features
 * Total supply: 1 billion tokens
 * Features: Staking rewards, deflationary burning, DAO governance
 */
contract NXDToken is ERC20, ERC20Burnable, ERC20Pausable, AccessControl, ReentrancyGuard {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");

    uint256 public constant TOTAL_SUPPLY = 1_000_000_000 * 10**18; // 1 billion tokens
    uint256 public constant ANNUAL_EMISSION = 40_000_000 * 10**18; // 40M tokens per year
    uint256 public constant EMISSION_DURATION = 5 * 365 days; // 5 years

    uint256 public immutable deploymentTime;
    uint256 public totalStaked;
    uint256 public totalBurned;
    uint256 public lastRewardDistribution;

    // Staking structure
    struct StakeInfo {
        uint256 amount;
        uint256 timestamp;
        uint256 rewardDebt;
        uint256 lockPeriod; // 0 = no lock, timestamp for lock end
    }

    mapping(address => StakeInfo) public stakes;
    mapping(address => uint256) public pendingRewards;
    
    // Staking tiers with different APY
    struct StakingTier {
        uint256 minAmount;
        uint256 apyBasisPoints; // 1000 = 10%
        uint256 lockDuration;
        bool active;
    }

    mapping(uint256 => StakingTier) public stakingTiers;
    uint256 public tierCount;

    // Events
    event Staked(address indexed user, uint256 amount, uint256 tier);
    event Unstaked(address indexed user, uint256 amount);
    event RewardsClaimed(address indexed user, uint256 amount);
    event RewardsDistributed(uint256 totalAmount, uint256 timestamp);
    event TierAdded(uint256 tier, uint256 minAmount, uint256 apy, uint256 lockDuration);
    event TokensBurned(uint256 amount, string reason);

    constructor() ERC20("NXD Token", "NXD") {
        deploymentTime = block.timestamp;
        lastRewardDistribution = block.timestamp;
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        _grantRole(BURNER_ROLE, msg.sender);

        // Mint total supply to deployer
        _mint(msg.sender, TOTAL_SUPPLY);

        // Initialize staking tiers
        _initializeStakingTiers();
    }

    function _initializeStakingTiers() internal {
        // Bronze tier: 1,000 NXD minimum, 5% APY, no lock
        stakingTiers[0] = StakingTier({
            minAmount: 1_000 * 10**18,
            apyBasisPoints: 500,
            lockDuration: 0,
            active: true
        });

        // Silver tier: 10,000 NXD minimum, 10% APY, 30 days lock
        stakingTiers[1] = StakingTier({
            minAmount: 10_000 * 10**18,
            apyBasisPoints: 1000,
            lockDuration: 30 days,
            active: true
        });

        // Gold tier: 50,000 NXD minimum, 15% APY, 90 days lock
        stakingTiers[2] = StakingTier({
            minAmount: 50_000 * 10**18,
            apyBasisPoints: 1500,
            lockDuration: 90 days,
            active: true
        });

        // Platinum tier: 100,000 NXD minimum, 20% APY, 180 days lock
        stakingTiers[3] = StakingTier({
            minAmount: 100_000 * 10**18,
            apyBasisPoints: 2000,
            lockDuration: 180 days,
            active: true
        });

        tierCount = 4;
    }

    /**
     * @dev Stake tokens for rewards
     * @param amount Amount to stake
     * @param tier Staking tier (0-3)
     */
    function stake(uint256 amount, uint256 tier) external nonReentrant whenNotPaused {
        require(amount > 0, "Cannot stake 0 tokens");
        require(tier < tierCount, "Invalid tier");
        require(stakingTiers[tier].active, "Tier not active");
        require(amount >= stakingTiers[tier].minAmount, "Below minimum tier amount");

        StakeInfo storage userStake = stakes[msg.sender];
        
        // Claim any pending rewards first
        if (userStake.amount > 0) {
            _claimRewards(msg.sender);
        }

        // Transfer tokens to contract
        _transfer(msg.sender, address(this), amount);

        // Update stake info
        userStake.amount += amount;
        userStake.timestamp = block.timestamp;
        userStake.lockPeriod = block.timestamp + stakingTiers[tier].lockDuration;
        userStake.rewardDebt = 0;

        totalStaked += amount;

        emit Staked(msg.sender, amount, tier);
    }

    /**
     * @dev Unstake tokens
     * @param amount Amount to unstake
     */
    function unstake(uint256 amount) external nonReentrant {
        StakeInfo storage userStake = stakes[msg.sender];
        require(userStake.amount >= amount, "Insufficient staked amount");
        require(block.timestamp >= userStake.lockPeriod, "Tokens still locked");

        // Claim rewards first
        _claimRewards(msg.sender);

        // Update stake
        userStake.amount -= amount;
        totalStaked -= amount;

        // Transfer tokens back
        _transfer(address(this), msg.sender, amount);

        emit Unstaked(msg.sender, amount);
    }

    /**
     * @dev Claim pending rewards
     */
    function claimRewards() external nonReentrant {
        _claimRewards(msg.sender);
    }

    /**
     * @dev Internal function to claim rewards
     */
    function _claimRewards(address user) internal {
        uint256 rewards = calculatePendingRewards(user);
        if (rewards > 0) {
            pendingRewards[user] = 0;
            stakes[user].rewardDebt = block.timestamp;
            
            // Mint new tokens as rewards (within emission limits)
            if (_canMintRewards(rewards)) {
                _mint(user, rewards);
                emit RewardsClaimed(user, rewards);
            }
        }
    }

    /**
     * @dev Calculate pending rewards for a user
     */
    function calculatePendingRewards(address user) public view returns (uint256) {
        StakeInfo memory userStake = stakes[user];
        if (userStake.amount == 0) return 0;

        uint256 stakingDuration = block.timestamp - userStake.timestamp;
        uint256 tier = _getUserTier(userStake.amount, userStake.lockPeriod);
        
        if (tier >= tierCount) return 0;

        uint256 apy = stakingTiers[tier].apyBasisPoints;
        uint256 annualRewards = (userStake.amount * apy) / 10000;
        uint256 rewards = (annualRewards * stakingDuration) / 365 days;

        return rewards;
    }

    /**
     * @dev Get user's staking tier based on amount and lock period
     */
    function _getUserTier(uint256 amount, uint256 lockPeriod) internal view returns (uint256) {
        for (uint256 i = tierCount; i > 0; i--) {
            uint256 tier = i - 1;
            if (amount >= stakingTiers[tier].minAmount && 
                (stakingTiers[tier].lockDuration == 0 || lockPeriod > block.timestamp)) {
                return tier;
            }
        }
        return tierCount; // Invalid tier
    }

    /**
     * @dev Check if rewards can be minted (within emission limits)
     */
    function _canMintRewards(uint256 amount) internal view returns (bool) {
        uint256 timeElapsed = block.timestamp - deploymentTime;
        uint256 maxEmittedSoFar = (ANNUAL_EMISSION * timeElapsed) / 365 days;
        uint256 totalEmitted = totalSupply() - TOTAL_SUPPLY;
        
        return (totalEmitted + amount <= maxEmittedSoFar) && 
               (timeElapsed <= EMISSION_DURATION);
    }

    /**
     * @dev Burn tokens from domain registration fees
     * @param amount Amount to burn
     * @param reason Reason for burning
     */
    function burnFromFees(uint256 amount, string memory reason) external onlyRole(BURNER_ROLE) {
        require(balanceOf(address(this)) >= amount, "Insufficient contract balance");
        _burn(address(this), amount);
        totalBurned += amount;
        emit TokensBurned(amount, reason);
    }

    /**
     * @dev Add new staking tier (admin only)
     */
    function addStakingTier(
        uint256 minAmount,
        uint256 apyBasisPoints,
        uint256 lockDuration
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        stakingTiers[tierCount] = StakingTier({
            minAmount: minAmount,
            apyBasisPoints: apyBasisPoints,
            lockDuration: lockDuration,
            active: true
        });
        
        emit TierAdded(tierCount, minAmount, apyBasisPoints, lockDuration);
        tierCount++;
    }

    /**
     * @dev Get staking statistics
     */
    function getStakingStats() external view returns (
        uint256 _totalStaked,
        uint256 _totalSupply,
        uint256 _totalBurned,
        uint256 _stakingParticipation,
        uint256 _currentAPY
    ) {
        _totalStaked = totalStaked;
        _totalSupply = totalSupply();
        _totalBurned = totalBurned;
        _stakingParticipation = totalStaked > 0 ? (totalStaked * 10000) / _totalSupply : 0;
        
        // Calculate weighted average APY
        if (totalStaked > 0) {
            uint256 weightedAPY = 0;
            for (uint256 i = 0; i < tierCount; i++) {
                weightedAPY += stakingTiers[i].apyBasisPoints;
            }
            _currentAPY = weightedAPY / tierCount;
        }
    }

    /**
     * @dev Get user staking info
     */
    function getUserStakingInfo(address user) external view returns (
        uint256 stakedAmount,
        uint256 stakingTier,
        uint256 pendingReward,
        uint256 lockEndTime,
        bool canUnstake
    ) {
        StakeInfo memory userStake = stakes[user];
        stakedAmount = userStake.amount;
        stakingTier = _getUserTier(userStake.amount, userStake.lockPeriod);
        pendingReward = calculatePendingRewards(user);
        lockEndTime = userStake.lockPeriod;
        canUnstake = block.timestamp >= userStake.lockPeriod;
    }

    // Pause functions
    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    // Required overrides
    function _beforeTokenTransfer(address from, address to, uint256 amount)
        internal
        whenNotPaused
        override(ERC20, ERC20Pausable)
    {
        super._beforeTokenTransfer(from, to, amount);
    }
}