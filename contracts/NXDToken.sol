// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title NXDToken
 * @dev NXD Token contract with staking, governance, and deflationary mechanisms
 * Total Supply: 1,000,000,000 NXD (1 billion tokens)
 * Features: Staking with tiers, governance voting, burning mechanisms
 */
contract NXDToken is ERC20, ERC20Burnable, Pausable, AccessControl, ReentrancyGuard {
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant STAKING_ROLE = keccak256("STAKING_ROLE");

    // Token Configuration
    uint256 public constant TOTAL_SUPPLY = 1_000_000_000 * 10**18; // 1 billion tokens
    uint256 public constant ANNUAL_EMISSIONS = 40_000_000 * 10**18; // 40M tokens per year
    uint256 public constant EMISSIONS_DURATION = 5 * 365 days; // 5 years
    
    // Staking Configuration
    struct StakingTier {
        uint256 minAmount;      // Minimum tokens to stake
        uint256 lockPeriod;     // Lock period in seconds
        uint256 multiplier;     // Reward multiplier (basis points, 10000 = 1x)
        bool active;            // Tier status
    }

    struct UserStake {
        uint256 amount;         // Staked amount
        uint256 tier;           // Staking tier
        uint256 startTime;      // Stake start timestamp
        uint256 lastClaim;      // Last reward claim timestamp
        uint256 pendingRewards; // Unclaimed rewards
        bool locked;            // Lock status
    }

    // State Variables
    mapping(uint256 => StakingTier) public stakingTiers;
    mapping(address => UserStake) public userStakes;
    mapping(address => uint256) public votingPower;
    
    uint256 public totalStaked;
    uint256 public emissionStartTime;
    uint256 public rewardPool;
    uint256 public tierCount;
    
    // Revenue sharing
    uint256 public totalBurned;
    uint256 public buybackFunds;
    
    // Events
    event Staked(address indexed user, uint256 amount, uint256 tier);
    event Unstaked(address indexed user, uint256 amount);
    event RewardsClaimed(address indexed user, uint256 amount);
    event TierAdded(uint256 indexed tierId, uint256 minAmount, uint256 lockPeriod, uint256 multiplier);
    event TierUpdated(uint256 indexed tierId, uint256 minAmount, uint256 lockPeriod, uint256 multiplier);
    event EmissionsStarted(uint256 startTime);
    event TokensBurned(uint256 amount, string reason);
    event BuybackExecuted(uint256 amount, uint256 tokens);

    constructor(address admin) ERC20("NXD Token", "NXD") {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(PAUSER_ROLE, admin);
        _grantRole(MINTER_ROLE, admin);
        _grantRole(STAKING_ROLE, admin);
        
        // Mint total supply to admin for initial distribution
        _mint(admin, TOTAL_SUPPLY);
        
        // Initialize default staking tiers
        _initializeStakingTiers();
        
        emissionStartTime = block.timestamp;
        emit EmissionsStarted(emissionStartTime);
    }

    function _initializeStakingTiers() private {
        // Tier 0: Basic (10K NXD minimum, 30 days, 1x multiplier)
        stakingTiers[0] = StakingTier({
            minAmount: 10_000 * 10**18,
            lockPeriod: 30 days,
            multiplier: 10000,
            active: true
        });
        
        // Tier 1: Premium (100K NXD minimum, 90 days, 1.5x multiplier)
        stakingTiers[1] = StakingTier({
            minAmount: 100_000 * 10**18,
            lockPeriod: 90 days,
            multiplier: 15000,
            active: true
        });
        
        // Tier 2: Elite (1M NXD minimum, 365 days, 2x multiplier)
        stakingTiers[2] = StakingTier({
            minAmount: 1_000_000 * 10**18,
            lockPeriod: 365 days,
            multiplier: 20000,
            active: true
        });
        
        tierCount = 3;
    }

    /**
     * @dev Stake tokens with specified tier
     * @param amount Amount of tokens to stake
     * @param tier Staking tier (0, 1, or 2)
     */
    function stake(uint256 amount, uint256 tier) external nonReentrant whenNotPaused {
        require(amount > 0, "Amount must be greater than 0");
        require(tier < tierCount, "Invalid tier");
        require(stakingTiers[tier].active, "Tier not active");
        require(amount >= stakingTiers[tier].minAmount, "Amount below tier minimum");
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");
        
        UserStake storage userStake = userStakes[msg.sender];
        
        // If user already has a stake, claim pending rewards first
        if (userStake.amount > 0) {
            _claimRewards(msg.sender);
        }
        
        // Transfer tokens to contract
        _transfer(msg.sender, address(this), amount);
        
        // Update user stake
        userStake.amount += amount;
        userStake.tier = tier;
        userStake.startTime = block.timestamp;
        userStake.lastClaim = block.timestamp;
        userStake.locked = true;
        
        // Update global state
        totalStaked += amount;
        votingPower[msg.sender] = userStake.amount;
        
        emit Staked(msg.sender, amount, tier);
    }

    /**
     * @dev Unstake tokens (after lock period)
     * @param amount Amount to unstake
     */
    function unstake(uint256 amount) external nonReentrant whenNotPaused {
        UserStake storage userStake = userStakes[msg.sender];
        require(userStake.amount >= amount, "Insufficient staked amount");
        
        StakingTier memory tier = stakingTiers[userStake.tier];
        require(
            block.timestamp >= userStake.startTime + tier.lockPeriod,
            "Tokens still locked"
        );
        
        // Claim pending rewards
        _claimRewards(msg.sender);
        
        // Update user stake
        userStake.amount -= amount;
        totalStaked -= amount;
        
        if (userStake.amount == 0) {
            userStake.locked = false;
            votingPower[msg.sender] = 0;
        } else {
            votingPower[msg.sender] = userStake.amount;
        }
        
        // Transfer tokens back to user
        _transfer(address(this), msg.sender, amount);
        
        emit Unstaked(msg.sender, amount);
    }

    /**
     * @dev Claim accumulated staking rewards
     */
    function claimRewards() external nonReentrant whenNotPaused {
        _claimRewards(msg.sender);
    }

    function _claimRewards(address user) private {
        UserStake storage userStake = userStakes[user];
        if (userStake.amount == 0) return;
        
        uint256 rewards = calculateRewards(user);
        if (rewards == 0) return;
        
        userStake.lastClaim = block.timestamp;
        userStake.pendingRewards = 0;
        
        // Mint rewards (within emission limits)
        if (totalSupply() + rewards <= TOTAL_SUPPLY + (ANNUAL_EMISSIONS * EMISSIONS_DURATION / 365 days)) {
            _mint(user, rewards);
        }
        
        emit RewardsClaimed(user, rewards);
    }

    /**
     * @dev Calculate pending rewards for a user
     * @param user User address
     * @return Pending reward amount
     */
    function calculateRewards(address user) public view returns (uint256) {
        UserStake memory userStake = userStakes[user];
        if (userStake.amount == 0 || !userStake.locked) return 0;
        
        StakingTier memory tier = stakingTiers[userStake.tier];
        uint256 stakingDuration = block.timestamp - userStake.lastClaim;
        
        // Base APY calculation (simplified)
        uint256 baseApy = 1000; // 10% base APY
        if (totalStaked > 0) {
            // Dynamic APY based on total staked percentage
            uint256 stakedPercentage = (totalStaked * 100) / totalSupply();
            baseApy = stakedPercentage < 20 ? 2000 : stakedPercentage < 50 ? 1000 : 500;
        }
        
        uint256 annualReward = (userStake.amount * baseApy * tier.multiplier) / (10000 * 10000);
        uint256 reward = (annualReward * stakingDuration) / 365 days;
        
        return reward + userStake.pendingRewards;
    }

    /**
     * @dev Burn tokens for deflationary mechanism
     * @param amount Amount to burn
     * @param reason Reason for burning
     */
    function burnTokens(uint256 amount, string memory reason) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(balanceOf(address(this)) >= amount, "Insufficient contract balance");
        _burn(address(this), amount);
        totalBurned += amount;
        emit TokensBurned(amount, reason);
    }

    /**
     * @dev Execute buyback with collected fees
     * @param ethAmount ETH amount for buyback
     */
    function executeBuyback(uint256 ethAmount) external payable onlyRole(DEFAULT_ADMIN_ROLE) {
        require(msg.value >= ethAmount, "Insufficient ETH sent");
        buybackFunds += ethAmount;
        // In production, this would integrate with DEX for actual buyback
        emit BuybackExecuted(ethAmount, 0);
    }

    /**
     * @dev Add new staking tier
     */
    function addStakingTier(
        uint256 minAmount,
        uint256 lockPeriod,
        uint256 multiplier
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        stakingTiers[tierCount] = StakingTier({
            minAmount: minAmount,
            lockPeriod: lockPeriod,
            multiplier: multiplier,
            active: true
        });
        
        emit TierAdded(tierCount, minAmount, lockPeriod, multiplier);
        tierCount++;
    }

    /**
     * @dev Update existing staking tier
     */
    function updateStakingTier(
        uint256 tierId,
        uint256 minAmount,
        uint256 lockPeriod,
        uint256 multiplier,
        bool active
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(tierId < tierCount, "Invalid tier ID");
        
        stakingTiers[tierId] = StakingTier({
            minAmount: minAmount,
            lockPeriod: lockPeriod,
            multiplier: multiplier,
            active: active
        });
        
        emit TierUpdated(tierId, minAmount, lockPeriod, multiplier);
    }

    /**
     * @dev Get user staking information
     */
    function getUserStakingInfo(address user) external view returns (
        uint256 amount,
        uint256 tier,
        uint256 startTime,
        uint256 pendingRewards,
        bool locked
    ) {
        UserStake memory userStake = userStakes[user];
        return (
            userStake.amount,
            userStake.tier,
            userStake.startTime,
            calculateRewards(user),
            userStake.locked
        );
    }

    /**
     * @dev Get global staking statistics
     */
    function getStakingStats() external view returns (
        uint256 _totalStaked,
        uint256 _totalSupply,
        uint256 _totalBurned,
        uint256 _rewardPool,
        uint256 _currentApy
    ) {
        uint256 currentApy = 1000; // Default 10%
        if (totalStaked > 0) {
            uint256 stakedPercentage = (totalStaked * 100) / totalSupply();
            currentApy = stakedPercentage < 20 ? 2000 : stakedPercentage < 50 ? 1000 : 500;
        }
        
        return (totalStaked, totalSupply(), totalBurned, rewardPool, currentApy);
    }

    // Admin functions
    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    function _beforeTokenTransfer(address from, address to, uint256 amount)
        internal
        whenNotPaused
        override
    {
        super._beforeTokenTransfer(from, to, amount);
    }

    // Receive function for buybacks
    receive() external payable {
        buybackFunds += msg.value;
    }
}