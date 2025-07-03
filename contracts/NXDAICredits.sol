
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

interface INXDToken {
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

/**
 * @title NXDAICredits
 * @dev AI Credits for premium AI model access and additional usage
 */
contract NXDAICredits is ERC20, AccessControl, ReentrancyGuard {
    bytes32 public constant AI_GATEWAY_ROLE = keccak256("AI_GATEWAY_ROLE");
    bytes32 public constant CREDIT_ISSUER_ROLE = keccak256("CREDIT_ISSUER_ROLE");

    INXDToken public immutable nxdToken;
    
    // Credit pricing and limits
    uint256 public constant CREDITS_PER_NXD = 10; // 1 NXD = 10 AI Credits
    uint256 public constant MAX_DAILY_PURCHASE = 1000 * 10**18; // Max 1000 credits per day
    uint256 public constant TIER_BONUS_PERCENTAGE = 20; // 20% bonus for higher tiers

    // User usage tracking
    struct UserStats {
        uint256 totalPurchased;
        uint256 totalConsumed;
        uint256 lastPurchaseDay;
        uint256 dailyPurchased;
        uint256 tier; // 0=free, 1=bronze, 2=silver, 3=gold, 4=platinum
    }

    mapping(address => UserStats) public userStats;
    mapping(address => mapping(uint256 => uint256)) public dailyUsage; // user => day => credits used

    // Monthly subscriptions
    struct Subscription {
        uint256 tier;
        uint256 monthlyCredits;
        uint256 lastClaimMonth;
        bool active;
    }

    mapping(address => Subscription) public subscriptions;

    // Tier benefits
    uint256[] public tierCreditsPerMonth = [0, 100, 300, 750, 2000, 10000]; // Per tier monthly credits
    uint256[] public tierRequirements = [0, 1000, 5000, 10000, 50000, 100000]; // NXD required for each tier

    // Events
    event CreditsEarned(address indexed user, uint256 amount, string reason);
    event CreditsSpent(address indexed user, uint256 amount, string aiModel);
    event CreditsPurchased(address indexed user, uint256 nxdSpent, uint256 creditsReceived);
    event SubscriptionActivated(address indexed user, uint256 tier);
    event MonthlyCreditsIssued(address indexed user, uint256 amount);

    constructor(address _nxdToken) ERC20("NXD AI Credits", "NXDAI") {
        nxdToken = INXDToken(_nxdToken);
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(AI_GATEWAY_ROLE, msg.sender);
        _grantRole(CREDIT_ISSUER_ROLE, msg.sender);
    }

    /**
     * @dev Purchase AI credits with NXD tokens
     * @param nxdAmount Amount of NXD to spend
     */
    function purchaseCredits(uint256 nxdAmount) external nonReentrant {
        require(nxdAmount > 0, "Amount must be greater than 0");
        
        uint256 currentDay = block.timestamp / 1 days;
        UserStats storage stats = userStats[msg.sender];
        
        // Reset daily counter if new day
        if (stats.lastPurchaseDay != currentDay) {
            stats.dailyPurchased = 0;
            stats.lastPurchaseDay = currentDay;
        }
        
        // Check daily limit
        require(stats.dailyPurchased + (nxdAmount * CREDITS_PER_NXD) <= MAX_DAILY_PURCHASE, 
                "Daily purchase limit exceeded");
        
        // Transfer NXD from user
        require(nxdToken.transferFrom(msg.sender, address(this), nxdAmount), 
                "NXD transfer failed");
        
        // Calculate credits with tier bonus
        uint256 baseCredits = nxdAmount * CREDITS_PER_NXD;
        uint256 tierBonus = 0;
        
        uint256 userTier = getUserTier(msg.sender);
        if (userTier > 0) {
            tierBonus = (baseCredits * TIER_BONUS_PERCENTAGE * userTier) / 100;
        }
        
        uint256 totalCredits = baseCredits + tierBonus;
        
        // Mint credits to user
        _mint(msg.sender, totalCredits);
        
        // Update stats
        stats.totalPurchased += totalCredits;
        stats.dailyPurchased += totalCredits;
        stats.tier = userTier;
        
        emit CreditsPurchased(msg.sender, nxdAmount, totalCredits);
    }

    /**
     * @dev Spend credits for AI usage (called by AI Gateway)
     * @param user User spending credits
     * @param amount Amount of credits to spend
     * @param aiModel AI model being used
     */
    function spendCredits(address user, uint256 amount, string memory aiModel) 
        external 
        onlyRole(AI_GATEWAY_ROLE) 
    {
        require(balanceOf(user) >= amount, "Insufficient credits");
        
        _burn(user, amount);
        
        // Update usage stats
        uint256 currentDay = block.timestamp / 1 days;
        dailyUsage[user][currentDay] += amount;
        userStats[user].totalConsumed += amount;
        
        emit CreditsSpent(user, amount, aiModel);
    }

    /**
     * @dev Award free credits for various actions
     * @param user User to award credits
     * @param amount Amount of credits to award
     * @param reason Reason for awarding credits
     */
    function awardCredits(address user, uint256 amount, string memory reason) 
        external 
        onlyRole(CREDIT_ISSUER_ROLE) 
    {
        _mint(user, amount);
        userStats[user].totalPurchased += amount;
        
        emit CreditsEarned(user, amount, reason);
    }

    /**
     * @dev Activate monthly subscription based on NXD staking tier
     */
    function activateSubscription() external {
        uint256 userTier = getUserTier(msg.sender);
        require(userTier > 0, "Insufficient NXD balance for subscription");
        
        Subscription storage sub = subscriptions[msg.sender];
        sub.tier = userTier;
        sub.monthlyCredits = tierCreditsPerMonth[userTier];
        sub.active = true;
        
        emit SubscriptionActivated(msg.sender, userTier);
    }

    /**
     * @dev Claim monthly subscription credits
     */
    function claimMonthlyCredits() external {
        Subscription storage sub = subscriptions[msg.sender];
        require(sub.active, "No active subscription");
        
        uint256 currentMonth = block.timestamp / 30 days;
        require(currentMonth > sub.lastClaimMonth, "Already claimed this month");
        
        // Verify user still meets tier requirements
        uint256 currentTier = getUserTier(msg.sender);
        if (currentTier < sub.tier) {
            sub.tier = currentTier;
            sub.monthlyCredits = tierCreditsPerMonth[currentTier];
        }
        
        if (sub.monthlyCredits > 0) {
            _mint(msg.sender, sub.monthlyCredits);
            sub.lastClaimMonth = currentMonth;
            
            emit MonthlyCreditsIssued(msg.sender, sub.monthlyCredits);
        }
    }

    /**
     * @dev Get user's tier based on NXD balance
     */
    function getUserTier(address user) public view returns (uint256) {
        uint256 nxdBalance = nxdToken.balanceOf(user);
        
        for (uint256 i = tierRequirements.length; i > 0; i--) {
            if (nxdBalance >= tierRequirements[i - 1] * 10**18) {
                return i - 1;
            }
        }
        return 0;
    }

    /**
     * @dev Get comprehensive user information
     */
    function getUserInfo(address user) external view returns (
        uint256 balance,
        uint256 tier,
        uint256 totalPurchased,
        uint256 totalConsumed,
        uint256 dailyUsed,
        bool hasSubscription,
        uint256 monthlyCredits
    ) {
        UserStats memory stats = userStats[user];
        Subscription memory sub = subscriptions[user];
        uint256 currentDay = block.timestamp / 1 days;
        
        return (
            balanceOf(user),
            getUserTier(user),
            stats.totalPurchased,
            stats.totalConsumed,
            dailyUsage[user][currentDay],
            sub.active,
            sub.monthlyCredits
        );
    }

    /**
     * @dev Emergency function to withdraw NXD (admin only)
     */
    function emergencyWithdraw(uint256 amount) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(nxdToken.transfer(msg.sender, amount), "Transfer failed");
    }

    /**
     * @dev Update tier requirements (admin only)
     */
    function updateTierRequirements(uint256[] memory newRequirements) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        require(newRequirements.length == tierRequirements.length, "Invalid array length");
        tierRequirements = newRequirements;
    }

    /**
     * @dev Update monthly credit allocations (admin only)
     */
    function updateMonthlyCredits(uint256[] memory newCredits) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        require(newCredits.length == tierCreditsPerMonth.length, "Invalid array length");
        tierCreditsPerMonth = newCredits;
    }
}
