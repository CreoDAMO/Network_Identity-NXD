// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

/**
 * @title NXDPaymaster
 * @dev Gas sponsorship system for NXD Platform - allows users to pay gas fees with NXD tokens
 */
contract NXDPaymaster is AccessControl, ReentrancyGuard, Pausable {
    using SafeMath for uint256;

    bytes32 public constant PAYMASTER_ROLE = keccak256("PAYMASTER_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    IERC20 public nxdToken;

    struct UserGasAllowance {
        uint256 dailyLimit;
        uint256 monthlyLimit;
        uint256 dailyUsed;
        uint256 monthlyUsed;
        uint256 lastDailyReset;
        uint256 lastMonthlyReset;
        uint256 tier; // 1: Basic, 2: Pro, 3: Enterprise
        bool isActive;
    }

    struct SponsoredTransaction {
        address user;
        uint256 gasUsed;
        uint256 nxdCost;
        uint256 ethEquivalent;
        string transactionType;
        uint256 timestamp;
        bytes32 txHash;
    }

    // Mappings
    mapping(address => UserGasAllowance) public userAllowances;
    mapping(uint256 => uint256) public tierDailyLimits;   // tier => daily limit in gas units
    mapping(uint256 => uint256) public tierMonthlyLimits; // tier => monthly limit in gas units
    mapping(address => SponsoredTransaction[]) public userTransactionHistory;

    // Gas price oracle and conversion rates
    uint256 public nxdToEthConversionRate = 1000; // 1000 NXD = 1 ETH (adjustable)
    uint256 public gasSubsidyPercentage = 80; // 80% subsidy, user pays 20%
    uint256 public maxGasPerTransaction = 500000; // Maximum gas per transaction

    // Total tracking
    uint256 public totalGasSponsored;
    uint256 public totalNXDSpent;
    uint256 public totalTransactionsSponsored;

    // Events
    event GasSponsored(
        address indexed user,
        uint256 gasUsed,
        uint256 nxdCost,
        uint256 ethEquivalent,
        string transactionType
    );
    event AllowanceUpdated(address indexed user, uint256 tier, uint256 dailyLimit, uint256 monthlyLimit);
    event ConversionRateUpdated(uint256 oldRate, uint256 newRate);
    event SubsidyPercentageUpdated(uint256 oldPercentage, uint256 newPercentage);

    constructor(address _nxdToken) {
        nxdToken = IERC20(_nxdToken);
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(PAYMASTER_ROLE, msg.sender);

        // Initialize tier limits (in gas units)
        tierDailyLimits[1] = 500000;    // Basic: 500k gas/day
        tierDailyLimits[2] = 2000000;   // Pro: 2M gas/day
        tierDailyLimits[3] = 10000000;  // Enterprise: 10M gas/day

        tierMonthlyLimits[1] = 10000000;   // Basic: 10M gas/month
        tierMonthlyLimits[2] = 50000000;   // Pro: 50M gas/month
        tierMonthlyLimits[3] = 200000000;  // Enterprise: 200M gas/month
    }

    /**
     * @dev Sponsor gas for a user transaction
     */
    function sponsorGas(
        address user,
        uint256 gasUsed,
        string memory transactionType,
        bytes32 txHash
    ) external onlyRole(PAYMASTER_ROLE) nonReentrant whenNotPaused returns (bool) {
        require(gasUsed <= maxGasPerTransaction, "Gas usage exceeds maximum");
        
        UserGasAllowance storage allowance = userAllowances[user];
        require(allowance.isActive, "User gas allowance not active");

        // Reset counters if needed
        _resetUserLimitsIfNeeded(user);

        // Check if user has enough allowance
        require(
            allowance.dailyUsed.add(gasUsed) <= allowance.dailyLimit,
            "Daily gas limit exceeded"
        );
        require(
            allowance.monthlyUsed.add(gasUsed) <= allowance.monthlyLimit,
            "Monthly gas limit exceeded"
        );

        // Calculate costs
        uint256 ethEquivalent = gasUsed.mul(tx.gasprice);
        uint256 subsidizedAmount = ethEquivalent.mul(gasSubsidyPercentage).div(100);
        uint256 nxdCost = subsidizedAmount.mul(nxdToEthConversionRate).div(1e18);

        // Check if contract has enough NXD balance to cover the cost
        require(nxdToken.balanceOf(address(this)) >= nxdCost, "Insufficient NXD balance in paymaster");

        // Update user usage
        allowance.dailyUsed = allowance.dailyUsed.add(gasUsed);
        allowance.monthlyUsed = allowance.monthlyUsed.add(gasUsed);

        // Record transaction
        userTransactionHistory[user].push(SponsoredTransaction({
            user: user,
            gasUsed: gasUsed,
            nxdCost: nxdCost,
            ethEquivalent: ethEquivalent,
            transactionType: transactionType,
            timestamp: block.timestamp,
            txHash: txHash
        }));

        // Update totals
        totalGasSponsored = totalGasSponsored.add(gasUsed);
        totalNXDSpent = totalNXDSpent.add(nxdCost);
        totalTransactionsSponsored = totalTransactionsSponsored.add(1);

        emit GasSponsored(user, gasUsed, nxdCost, ethEquivalent, transactionType);

        return true;
    }

    /**
     * @dev Set or update user gas allowance
     */
    function setUserAllowance(
        address user,
        uint256 tier,
        bool isActive
    ) external onlyRole(ADMIN_ROLE) {
        require(tier >= 1 && tier <= 3, "Invalid tier");

        UserGasAllowance storage allowance = userAllowances[user];
        
        allowance.tier = tier;
        allowance.dailyLimit = tierDailyLimits[tier];
        allowance.monthlyLimit = tierMonthlyLimits[tier];
        allowance.isActive = isActive;
        
        // Reset usage if activating
        if (isActive) {
            allowance.dailyUsed = 0;
            allowance.monthlyUsed = 0;
            allowance.lastDailyReset = block.timestamp;
            allowance.lastMonthlyReset = block.timestamp;
        }

        emit AllowanceUpdated(user, tier, allowance.dailyLimit, allowance.monthlyLimit);
    }

    /**
     * @dev Set custom gas limits for a specific user
     */
    function setCustomUserLimits(
        address user,
        uint256 dailyLimit,
        uint256 monthlyLimit,
        bool isActive
    ) external onlyRole(ADMIN_ROLE) {
        UserGasAllowance storage allowance = userAllowances[user];
        
        allowance.dailyLimit = dailyLimit;
        allowance.monthlyLimit = monthlyLimit;
        allowance.isActive = isActive;
        
        if (isActive && allowance.lastDailyReset == 0) {
            allowance.lastDailyReset = block.timestamp;
            allowance.lastMonthlyReset = block.timestamp;
        }

        emit AllowanceUpdated(user, allowance.tier, dailyLimit, monthlyLimit);
    }

    /**
     * @dev Update tier limits
     */
    function updateTierLimits(
        uint256 tier,
        uint256 dailyLimit,
        uint256 monthlyLimit
    ) external onlyRole(ADMIN_ROLE) {
        require(tier >= 1 && tier <= 3, "Invalid tier");
        
        tierDailyLimits[tier] = dailyLimit;
        tierMonthlyLimits[tier] = monthlyLimit;
    }

    /**
     * @dev Update NXD to ETH conversion rate
     */
    function updateConversionRate(uint256 newRate) external onlyRole(ADMIN_ROLE) {
        uint256 oldRate = nxdToEthConversionRate;
        nxdToEthConversionRate = newRate;
        
        emit ConversionRateUpdated(oldRate, newRate);
    }

    /**
     * @dev Update gas subsidy percentage
     */
    function updateSubsidyPercentage(uint256 newPercentage) external onlyRole(ADMIN_ROLE) {
        require(newPercentage <= 100, "Percentage cannot exceed 100");
        
        uint256 oldPercentage = gasSubsidyPercentage;
        gasSubsidyPercentage = newPercentage;
        
        emit SubsidyPercentageUpdated(oldPercentage, newPercentage);
    }

    /**
     * @dev Update maximum gas per transaction
     */
    function updateMaxGasPerTransaction(uint256 newMaxGas) external onlyRole(ADMIN_ROLE) {
        maxGasPerTransaction = newMaxGas;
    }

    /**
     * @dev Get user's remaining gas allowance
     */
    function getUserRemainingAllowance(address user) external view returns (
        uint256 dailyRemaining,
        uint256 monthlyRemaining,
        uint256 tier,
        bool isActive
    ) {
        UserGasAllowance memory allowance = userAllowances[user];
        
        // Calculate time-based resets
        uint256 daysPassed = (block.timestamp - allowance.lastDailyReset) / 1 days;
        uint256 monthsPassed = (block.timestamp - allowance.lastMonthlyReset) / 30 days;
        
        uint256 currentDailyUsed = daysPassed > 0 ? 0 : allowance.dailyUsed;
        uint256 currentMonthlyUsed = monthsPassed > 0 ? 0 : allowance.monthlyUsed;
        
        dailyRemaining = allowance.dailyLimit > currentDailyUsed ? 
            allowance.dailyLimit.sub(currentDailyUsed) : 0;
        monthlyRemaining = allowance.monthlyLimit > currentMonthlyUsed ? 
            allowance.monthlyLimit.sub(currentMonthlyUsed) : 0;
        tier = allowance.tier;
        isActive = allowance.isActive;
    }

    /**
     * @dev Calculate gas cost in NXD for a transaction
     */
    function calculateGasCost(uint256 gasAmount, uint256 gasPrice) external view returns (
        uint256 ethCost,
        uint256 subsidizedEthCost,
        uint256 nxdCost
    ) {
        ethCost = gasAmount.mul(gasPrice);
        subsidizedEthCost = ethCost.mul(gasSubsidyPercentage).div(100);
        nxdCost = subsidizedEthCost.mul(nxdToEthConversionRate).div(1e18);
    }

    /**
     * @dev Get user transaction history
     */
    function getUserTransactionHistory(address user, uint256 limit) 
        external view returns (SponsoredTransaction[] memory) {
        SponsoredTransaction[] memory userHistory = userTransactionHistory[user];
        
        if (limit == 0 || limit >= userHistory.length) {
            return userHistory;
        }
        
        // Return the most recent transactions
        SponsoredTransaction[] memory limitedHistory = new SponsoredTransaction[](limit);
        uint256 startIndex = userHistory.length.sub(limit);
        
        for (uint256 i = 0; i < limit; i++) {
            limitedHistory[i] = userHistory[startIndex.add(i)];
        }
        
        return limitedHistory;
    }

    /**
     * @dev Get platform statistics
     */
    function getPlatformStats() external view returns (
        uint256 _totalGasSponsored,
        uint256 _totalNXDSpent,
        uint256 _totalTransactionsSponsored,
        uint256 _activeUsers,
        uint256 _nxdBalance
    ) {
        _totalGasSponsored = totalGasSponsored;
        _totalNXDSpent = totalNXDSpent;
        _totalTransactionsSponsored = totalTransactionsSponsored;
        _nxdBalance = nxdToken.balanceOf(address(this));
        
        // Note: activeUsers would need to be calculated separately in production
        _activeUsers = 0; // Placeholder
    }

    /**
     * @dev Deposit NXD tokens to fund gas sponsorship
     */
    function depositNXD(uint256 amount) external onlyRole(ADMIN_ROLE) {
        require(nxdToken.transferFrom(msg.sender, address(this), amount), "NXD transfer failed");
    }

    /**
     * @dev Withdraw NXD tokens
     */
    function withdrawNXD(uint256 amount) external onlyRole(ADMIN_ROLE) {
        require(nxdToken.balanceOf(address(this)) >= amount, "Insufficient NXD balance");
        require(nxdToken.transfer(msg.sender, amount), "NXD transfer failed");
    }

    /**
     * @dev Emergency withdrawal of all NXD
     */
    function emergencyWithdrawNXD() external onlyRole(ADMIN_ROLE) {
        uint256 balance = nxdToken.balanceOf(address(this));
        require(nxdToken.transfer(msg.sender, balance), "NXD transfer failed");
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

    function _resetUserLimitsIfNeeded(address user) internal {
        UserGasAllowance storage allowance = userAllowances[user];
        
        // Reset daily limit if a day has passed
        if (block.timestamp >= allowance.lastDailyReset.add(1 days)) {
            allowance.dailyUsed = 0;
            allowance.lastDailyReset = block.timestamp;
        }
        
        // Reset monthly limit if a month has passed
        if (block.timestamp >= allowance.lastMonthlyReset.add(30 days)) {
            allowance.monthlyUsed = 0;
            allowance.lastMonthlyReset = block.timestamp;
        }
    }

    /**
     * @dev Check if user can afford gas sponsorship
     */
    function canSponsorGas(address user, uint256 gasAmount) external view returns (
        bool canSponsor,
        string memory reason
    ) {
        UserGasAllowance memory allowance = userAllowances[user];
        
        if (!allowance.isActive) {
            return (false, "User gas allowance not active");
        }
        
        if (gasAmount > maxGasPerTransaction) {
            return (false, "Gas usage exceeds maximum per transaction");
        }
        
        // Check daily limit (accounting for potential reset)
        uint256 daysPassed = (block.timestamp - allowance.lastDailyReset) / 1 days;
        uint256 currentDailyUsed = daysPassed > 0 ? 0 : allowance.dailyUsed;
        
        if (currentDailyUsed.add(gasAmount) > allowance.dailyLimit) {
            return (false, "Would exceed daily gas limit");
        }
        
        // Check monthly limit (accounting for potential reset)
        uint256 monthsPassed = (block.timestamp - allowance.lastMonthlyReset) / 30 days;
        uint256 currentMonthlyUsed = monthsPassed > 0 ? 0 : allowance.monthlyUsed;
        
        if (currentMonthlyUsed.add(gasAmount) > allowance.monthlyLimit) {
            return (false, "Would exceed monthly gas limit");
        }
        
        // Check if contract has enough NXD balance
        uint256 ethEquivalent = gasAmount.mul(tx.gasprice);
        uint256 subsidizedAmount = ethEquivalent.mul(gasSubsidyPercentage).div(100);
        uint256 nxdCost = subsidizedAmount.mul(nxdToEthConversionRate).div(1e18);
        
        if (nxdToken.balanceOf(address(this)) < nxdCost) {
            return (false, "Insufficient NXD balance in paymaster");
        }
        
        return (true, "Gas sponsorship available");
    }
}