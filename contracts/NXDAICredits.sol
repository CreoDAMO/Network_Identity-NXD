// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

/**
 * @title NXDAICredits
 * @dev AI Credits system for NXD Platform AI services
 * Allows users to purchase credits with NXD/ETH for AI operations
 */
contract NXDAICredits is AccessControl, ReentrancyGuard, Pausable {
    using SafeMath for uint256;

    bytes32 public constant AI_SERVICE_ROLE = keccak256("AI_SERVICE_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    IERC20 public nxdToken;

    struct Subscription {
        uint256 tier;           // 1: Basic, 2: Pro, 3: Enterprise
        uint256 monthlyAllowance;
        uint256 usedCredits;
        uint256 lastResetTime;
        uint256 expiresAt;
        bool isActive;
    }

    struct CreditPurchase {
        uint256 amount;
        uint256 timestamp;
        uint256 priceInNXD;
        uint256 priceInETH;
        string paymentMethod;
    }

    // Mappings
    mapping(address => uint256) public userCredits;
    mapping(address => Subscription) public userSubscriptions;
    mapping(address => CreditPurchase[]) public userPurchaseHistory;
    mapping(uint256 => uint256) public tierMonthlyAllowance; // tier => monthly credits
    mapping(uint256 => uint256) public tierPriceNXD; // tier => price in NXD
    mapping(uint256 => uint256) public tierPriceETH; // tier => price in ETH

    // Credit pricing (per credit)
    uint256 public creditPriceNXD = 1e15; // 0.001 NXD per credit
    uint256 public creditPriceETH = 1e14; // 0.0001 ETH per credit

    // Discount tiers based on NXD holdings
    mapping(uint256 => uint256) public holdingDiscounts; // NXD amount => discount percentage

    // Events
    event Creditspurchased(address indexed user, uint256 amount, uint256 totalCost, string paymentMethod);
    event CreditsUsed(address indexed user, uint256 amount, string aiService, string operation);
    event SubscriptionActivated(address indexed user, uint256 tier, uint256 duration);
    event SubscriptionRenewed(address indexed user, uint256 tier);
    event CreditsGranted(address indexed user, uint256 amount, string reason);

    constructor(address _nxdToken) {
        nxdToken = IERC20(_nxdToken);
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);

        // Initialize subscription tiers
        tierMonthlyAllowance[1] = 1000;    // Basic: 1,000 credits/month
        tierMonthlyAllowance[2] = 5000;    // Pro: 5,000 credits/month
        tierMonthlyAllowance[3] = 20000;   // Enterprise: 20,000 credits/month

        tierPriceNXD[1] = 50e18;   // Basic: 50 NXD/month
        tierPriceNXD[2] = 200e18;  // Pro: 200 NXD/month
        tierPriceNXD[3] = 750e18;  // Enterprise: 750 NXD/month

        tierPriceETH[1] = 0.02 ether;  // Basic: 0.02 ETH/month
        tierPriceETH[2] = 0.08 ether;  // Pro: 0.08 ETH/month
        tierPriceETH[3] = 0.30 ether;  // Enterprise: 0.30 ETH/month

        // Initialize holding discounts
        holdingDiscounts[1000e18] = 5;   // 5% discount for 1,000+ NXD
        holdingDiscounts[5000e18] = 10;  // 10% discount for 5,000+ NXD
        holdingDiscounts[10000e18] = 15; // 15% discount for 10,000+ NXD
        holdingDiscounts[25000e18] = 20; // 20% discount for 25,000+ NXD
    }

    /**
     * @dev Purchase AI credits with NXD tokens
     */
    function purchaseCreditsWithNXD(uint256 creditAmount) external nonReentrant whenNotPaused {
        require(creditAmount > 0, "Credit amount must be greater than 0");

        uint256 totalCost = creditAmount.mul(creditPriceNXD);
        uint256 discountedCost = _applyDiscount(msg.sender, totalCost);

        require(nxdToken.transferFrom(msg.sender, address(this), discountedCost), "NXD transfer failed");

        userCredits[msg.sender] = userCredits[msg.sender].add(creditAmount);

        // Record purchase
        userPurchaseHistory[msg.sender].push(CreditPurchase({
            amount: creditAmount,
            timestamp: block.timestamp,
            priceInNXD: discountedCost,
            priceInETH: 0,
            paymentMethod: "NXD"
        }));

        emit Creditsurchased(msg.sender, creditAmount, discountedCost, "NXD");
    }

    /**
     * @dev Purchase AI credits with ETH
     */
    function purchaseCreditsWithETH(uint256 creditAmount) external payable nonReentrant whenNotPaused {
        require(creditAmount > 0, "Credit amount must be greater than 0");

        uint256 totalCost = creditAmount.mul(creditPriceETH);
        uint256 discountedCost = _applyDiscount(msg.sender, totalCost);

        require(msg.value >= discountedCost, "Insufficient ETH sent");

        userCredits[msg.sender] = userCredits[msg.sender].add(creditAmount);

        // Refund excess ETH
        uint256 excess = msg.value.sub(discountedCost);
        if (excess > 0) {
            payable(msg.sender).transfer(excess);
        }

        // Record purchase
        userPurchaseHistory[msg.sender].push(CreditPurchase({
            amount: creditAmount,
            timestamp: block.timestamp,
            priceInNXD: 0,
            priceInETH: discountedCost,
            paymentMethod: "ETH"
        }));

        emit Creditsurchased(msg.sender, creditAmount, discountedCost, "ETH");
    }

    /**
     * @dev Subscribe to monthly AI credit plan with NXD
     */
    function subscribeWithNXD(uint256 tier) external nonReentrant whenNotPaused {
        require(tier >= 1 && tier <= 3, "Invalid tier");
        require(tierPriceNXD[tier] > 0, "Tier not available");

        uint256 cost = tierPriceNXD[tier];
        uint256 discountedCost = _applyDiscount(msg.sender, cost);

        require(nxdToken.transferFrom(msg.sender, address(this), discountedCost), "NXD transfer failed");

        _activateSubscription(msg.sender, tier);

        emit SubscriptionActivated(msg.sender, tier, 30 days);
    }

    /**
     * @dev Subscribe to monthly AI credit plan with ETH
     */
    function subscribeWithETH(uint256 tier) external payable nonReentrant whenNotPaused {
        require(tier >= 1 && tier <= 3, "Invalid tier");
        require(tierPriceETH[tier] > 0, "Tier not available");

        uint256 cost = tierPriceETH[tier];
        uint256 discountedCost = _applyDiscount(msg.sender, cost);

        require(msg.value >= discountedCost, "Insufficient ETH sent");

        // Refund excess ETH
        uint256 excess = msg.value.sub(discountedCost);
        if (excess > 0) {
            payable(msg.sender).transfer(excess);
        }

        _activateSubscription(msg.sender, tier);

        emit SubscriptionActivated(msg.sender, tier, 30 days);
    }

    /**
     * @dev Use AI credits for operations (called by AI services)
     */
    function useCredits(
        address user, 
        uint256 amount, 
        string memory aiService, 
        string memory operation
    ) external onlyRole(AI_SERVICE_ROLE) {
        require(amount > 0, "Amount must be greater than 0");
        
        uint256 availableCredits = getAvailableCredits(user);
        require(availableCredits >= amount, "Insufficient credits");

        // Try to use subscription credits first
        Subscription storage subscription = userSubscriptions[user];
        if (subscription.isActive && subscription.expiresAt > block.timestamp) {
            _resetSubscriptionIfNeeded(user);
            
            uint256 subscriptionCreditsAvailable = subscription.monthlyAllowance.sub(subscription.usedCredits);
            if (subscriptionCreditsAvailable >= amount) {
                subscription.usedCredits = subscription.usedCredits.add(amount);
                emit CreditsUsed(user, amount, aiService, operation);
                return;
            } else if (subscriptionCreditsAvailable > 0) {
                // Use partial subscription credits
                subscription.usedCredits = subscription.monthlyAllowance;
                uint256 remainingAmount = amount.sub(subscriptionCreditsAvailable);
                userCredits[user] = userCredits[user].sub(remainingAmount);
                emit CreditsUsed(user, amount, aiService, operation);
                return;
            }
        }

        // Use purchased credits
        userCredits[user] = userCredits[user].sub(amount);
        emit CreditsUsed(user, amount, aiService, operation);
    }

    /**
     * @dev Get total available credits for a user
     */
    function getAvailableCredits(address user) public view returns (uint256) {
        uint256 totalCredits = userCredits[user];

        // Add subscription credits if active
        Subscription memory subscription = userSubscriptions[user];
        if (subscription.isActive && subscription.expiresAt > block.timestamp) {
            // Check if subscription needs reset
            uint256 monthsSinceReset = (block.timestamp - subscription.lastResetTime) / 30 days;
            if (monthsSinceReset > 0) {
                totalCredits = totalCredits.add(subscription.monthlyAllowance);
            } else {
                uint256 subscriptionCreditsLeft = subscription.monthlyAllowance.sub(subscription.usedCredits);
                totalCredits = totalCredits.add(subscriptionCreditsLeft);
            }
        }

        return totalCredits;
    }

    /**
     * @dev Grant credits to users (admin function)
     */
    function grantCredits(address user, uint256 amount, string memory reason) 
        external onlyRole(ADMIN_ROLE) {
        userCredits[user] = userCredits[user].add(amount);
        emit CreditsGranted(user, amount, reason);
    }

    /**
     * @dev Update credit pricing
     */
    function updateCreditPricing(uint256 _priceNXD, uint256 _priceETH) 
        external onlyRole(ADMIN_ROLE) {
        creditPriceNXD = _priceNXD;
        creditPriceETH = _priceETH;
    }

    /**
     * @dev Update subscription tier pricing
     */
    function updateTierPricing(
        uint256 tier, 
        uint256 monthlyAllowance, 
        uint256 priceNXD, 
        uint256 priceETH
    ) external onlyRole(ADMIN_ROLE) {
        require(tier >= 1 && tier <= 3, "Invalid tier");
        
        tierMonthlyAllowance[tier] = monthlyAllowance;
        tierPriceNXD[tier] = priceNXD;
        tierPriceETH[tier] = priceETH;
    }

    /**
     * @dev Withdraw accumulated fees
     */
    function withdrawFees() external onlyRole(ADMIN_ROLE) {
        uint256 ethBalance = address(this).balance;
        uint256 nxdBalance = nxdToken.balanceOf(address(this));

        if (ethBalance > 0) {
            payable(msg.sender).transfer(ethBalance);
        }

        if (nxdBalance > 0) {
            nxdToken.transfer(msg.sender, nxdBalance);
        }
    }

    /**
     * @dev Emergency pause
     */
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    /**
     * @dev Unpause
     */
    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }

    // Internal functions

    function _activateSubscription(address user, uint256 tier) internal {
        Subscription storage subscription = userSubscriptions[user];
        
        subscription.tier = tier;
        subscription.monthlyAllowance = tierMonthlyAllowance[tier];
        subscription.usedCredits = 0;
        subscription.lastResetTime = block.timestamp;
        subscription.expiresAt = block.timestamp.add(30 days);
        subscription.isActive = true;
    }

    function _resetSubscriptionIfNeeded(address user) internal {
        Subscription storage subscription = userSubscriptions[user];
        
        uint256 monthsSinceReset = (block.timestamp - subscription.lastResetTime) / 30 days;
        if (monthsSinceReset > 0) {
            subscription.usedCredits = 0;
            subscription.lastResetTime = subscription.lastResetTime.add(monthsSinceReset * 30 days);
        }
    }

    function _applyDiscount(address user, uint256 cost) internal view returns (uint256) {
        uint256 nxdBalance = nxdToken.balanceOf(user);
        uint256 discount = 0;

        // Find applicable discount tier
        if (nxdBalance >= 25000e18) {
            discount = holdingDiscounts[25000e18];
        } else if (nxdBalance >= 10000e18) {
            discount = holdingDiscounts[10000e18];
        } else if (nxdBalance >= 5000e18) {
            discount = holdingDiscounts[5000e18];
        } else if (nxdBalance >= 1000e18) {
            discount = holdingDiscounts[1000e18];
        }

        if (discount > 0) {
            uint256 discountAmount = cost.mul(discount).div(100);
            return cost.sub(discountAmount);
        }

        return cost;
    }

    /**
     * @dev Get user subscription info
     */
    function getUserSubscription(address user) external view returns (
        uint256 tier,
        uint256 monthlyAllowance,
        uint256 usedCredits,
        uint256 creditsLeft,
        uint256 expiresAt,
        bool isActive
    ) {
        Subscription memory subscription = userSubscriptions[user];
        
        uint256 creditsLeftInSubscription = 0;
        if (subscription.isActive && subscription.expiresAt > block.timestamp) {
            uint256 monthsSinceReset = (block.timestamp - subscription.lastResetTime) / 30 days;
            if (monthsSinceReset > 0) {
                creditsLeftInSubscription = subscription.monthlyAllowance;
            } else {
                creditsLeftInSubscription = subscription.monthlyAllowance.sub(subscription.usedCredits);
            }
        }

        return (
            subscription.tier,
            subscription.monthlyAllowance,
            subscription.usedCredits,
            creditsLeftInSubscription,
            subscription.expiresAt,
            subscription.isActive && subscription.expiresAt > block.timestamp
        );
    }

    /**
     * @dev Get user purchase history
     */
    function getUserPurchaseHistory(address user) external view returns (CreditPurchase[] memory) {
        return userPurchaseHistory[user];
    }
}