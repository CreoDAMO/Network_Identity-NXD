// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

/**
 * @title NXDRevenueSplitter
 * @dev Automatic revenue distribution system for the NXD Platform
 * Splits revenue between founder, LPs, DAO, and white-label partners
 */
contract NXDRevenueSplitter is AccessControl, ReentrancyGuard, Pausable {
    using SafeMath for uint256;

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant REVENUE_MANAGER_ROLE = keccak256("REVENUE_MANAGER_ROLE");

    IERC20 public nxdToken;

    struct RevenueShare {
        uint256 founderShare;    // Percentage (e.g., 2000 = 20%)
        uint256 lpShare;         // Percentage
        uint256 daoShare;        // Percentage
        uint256 whiteLabelShare; // Percentage
        uint256 totalPercentage; // Should equal 10000 (100%)
    }

    struct WhiteLabelPartner {
        address partnerAddress;
        uint256 sharePercentage; // Of the whiteLabelShare
        bool isActive;
        uint256 totalEarned;
        string partnerName;
    }

    struct RevenueDistribution {
        uint256 distributionId;
        uint256 totalAmount;
        address token; // ETH = address(0), NXD = nxdToken address
        uint256 founderAmount;
        uint256 lpAmount;
        uint256 daoAmount;
        uint256 whiteLabelAmount;
        uint256 timestamp;
        string revenueSource;
    }

    // Revenue sharing configuration
    RevenueShare public revenueShare;
    
    // Addresses for different recipients
    address public founderAddress;
    address public lpPoolAddress;
    address public daoTreasuryAddress;
    
    // White label partners
    mapping(uint256 => WhiteLabelPartner) public whiteLabelPartners;
    uint256 public nextPartnerId = 1;
    uint256 public totalWhiteLabelPartners;
    
    // Revenue tracking
    mapping(address => uint256) public totalRevenueByToken;
    mapping(address => uint256) public pendingDistribution;
    RevenueDistribution[] public distributions;
    
    // Partner earnings tracking
    mapping(uint256 => mapping(address => uint256)) public partnerEarnings; // partnerId => token => amount
    
    // Events
    event RevenueReceived(address indexed token, uint256 amount, string source);
    event RevenueDistributed(
        uint256 indexed distributionId,
        address indexed token,
        uint256 totalAmount,
        uint256 founderAmount,
        uint256 lpAmount,
        uint256 daoAmount,
        uint256 whiteLabelAmount
    );
    event WhiteLabelPartnerAdded(uint256 indexed partnerId, address partnerAddress, uint256 sharePercentage);
    event WhiteLabelPartnerUpdated(uint256 indexed partnerId, uint256 newSharePercentage, bool isActive);
    event RevenueShareUpdated(uint256 founderShare, uint256 lpShare, uint256 daoShare, uint256 whiteLabelShare);

    constructor(
        address _nxdToken,
        address _founderAddress,
        address _lpPoolAddress,
        address _daoTreasuryAddress
    ) {
        nxdToken = IERC20(_nxdToken);
        founderAddress = _founderAddress;
        lpPoolAddress = _lpPoolAddress;
        daoTreasuryAddress = _daoTreasuryAddress;
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(REVENUE_MANAGER_ROLE, msg.sender);

        // Initialize default revenue sharing (20% founder, 50% LP, 30% DAO, 0% white-label initially)
        revenueShare = RevenueShare({
            founderShare: 2000,    // 20%
            lpShare: 5000,         // 50%
            daoShare: 3000,        // 30%
            whiteLabelShare: 0,    // 0%
            totalPercentage: 10000 // 100%
        });
    }

    /**
     * @dev Receive ETH revenue
     */
    receive() external payable {
        if (msg.value > 0) {
            _recordRevenue(address(0), msg.value, "eth_deposit");
        }
    }

    /**
     * @dev Receive NXD revenue
     */
    function receiveNXDRevenue(uint256 amount, string memory source) external nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        require(nxdToken.transferFrom(msg.sender, address(this), amount), "NXD transfer failed");
        
        _recordRevenue(address(nxdToken), amount, source);
    }

    /**
     * @dev Receive revenue from other ERC20 tokens
     */
    function receiveTokenRevenue(address token, uint256 amount, string memory source) external nonReentrant {
        require(token != address(0), "Invalid token address");
        require(amount > 0, "Amount must be greater than 0");
        require(IERC20(token).transferFrom(msg.sender, address(this), amount), "Token transfer failed");
        
        _recordRevenue(token, amount, source);
    }

    /**
     * @dev Distribute pending revenue for a specific token
     */
    function distributeRevenue(address token) external onlyRole(REVENUE_MANAGER_ROLE) nonReentrant whenNotPaused {
        uint256 amount = pendingDistribution[token];
        require(amount > 0, "No pending distribution for this token");
        
        pendingDistribution[token] = 0;
        
        // Calculate distribution amounts
        uint256 founderAmount = amount.mul(revenueShare.founderShare).div(10000);
        uint256 lpAmount = amount.mul(revenueShare.lpShare).div(10000);
        uint256 daoAmount = amount.mul(revenueShare.daoShare).div(10000);
        uint256 whiteLabelAmount = amount.mul(revenueShare.whiteLabelShare).div(10000);
        
        // Distribute to founder
        if (founderAmount > 0) {
            _transferTokens(token, founderAddress, founderAmount);
        }
        
        // Distribute to LP pool
        if (lpAmount > 0) {
            _transferTokens(token, lpPoolAddress, lpAmount);
        }
        
        // Distribute to DAO treasury
        if (daoAmount > 0) {
            _transferTokens(token, daoTreasuryAddress, daoAmount);
        }
        
        // Distribute to white-label partners
        if (whiteLabelAmount > 0) {
            _distributeToWhiteLabelPartners(token, whiteLabelAmount);
        }
        
        // Record distribution
        uint256 distributionId = distributions.length;
        distributions.push(RevenueDistribution({
            distributionId: distributionId,
            totalAmount: amount,
            token: token,
            founderAmount: founderAmount,
            lpAmount: lpAmount,
            daoAmount: daoAmount,
            whiteLabelAmount: whiteLabelAmount,
            timestamp: block.timestamp,
            revenueSource: "manual_distribution"
        }));
        
        emit RevenueDistributed(
            distributionId,
            token,
            amount,
            founderAmount,
            lpAmount,
            daoAmount,
            whiteLabelAmount
        );
    }

    /**
     * @dev Add white-label partner
     */
    function addWhiteLabelPartner(
        address partnerAddress,
        uint256 sharePercentage,
        string memory partnerName
    ) external onlyRole(ADMIN_ROLE) {
        require(partnerAddress != address(0), "Invalid partner address");
        require(sharePercentage > 0 && sharePercentage <= 10000, "Invalid share percentage");
        
        uint256 partnerId = nextPartnerId++;
        
        whiteLabelPartners[partnerId] = WhiteLabelPartner({
            partnerAddress: partnerAddress,
            sharePercentage: sharePercentage,
            isActive: true,
            totalEarned: 0,
            partnerName: partnerName
        });
        
        totalWhiteLabelPartners = totalWhiteLabelPartners.add(1);
        
        emit WhiteLabelPartnerAdded(partnerId, partnerAddress, sharePercentage);
    }

    /**
     * @dev Update white-label partner
     */
    function updateWhiteLabelPartner(
        uint256 partnerId,
        uint256 newSharePercentage,
        bool isActive
    ) external onlyRole(ADMIN_ROLE) {
        require(whiteLabelPartners[partnerId].partnerAddress != address(0), "Partner does not exist");
        require(newSharePercentage <= 10000, "Invalid share percentage");
        
        WhiteLabelPartner storage partner = whiteLabelPartners[partnerId];
        
        if (partner.isActive && !isActive) {
            totalWhiteLabelPartners = totalWhiteLabelPartners.sub(1);
        } else if (!partner.isActive && isActive) {
            totalWhiteLabelPartners = totalWhiteLabelPartners.add(1);
        }
        
        partner.sharePercentage = newSharePercentage;
        partner.isActive = isActive;
        
        emit WhiteLabelPartnerUpdated(partnerId, newSharePercentage, isActive);
    }

    /**
     * @dev Update revenue sharing percentages
     */
    function updateRevenueShare(
        uint256 founderShare,
        uint256 lpShare,
        uint256 daoShare,
        uint256 whiteLabelShare
    ) external onlyRole(ADMIN_ROLE) {
        require(
            founderShare.add(lpShare).add(daoShare).add(whiteLabelShare) == 10000,
            "Total percentages must equal 100%"
        );
        
        revenueShare = RevenueShare({
            founderShare: founderShare,
            lpShare: lpShare,
            daoShare: daoShare,
            whiteLabelShare: whiteLabelShare,
            totalPercentage: 10000
        });
        
        emit RevenueShareUpdated(founderShare, lpShare, daoShare, whiteLabelShare);
    }

    /**
     * @dev Update recipient addresses
     */
    function updateRecipientAddresses(
        address newFounderAddress,
        address newLpPoolAddress,
        address newDaoTreasuryAddress
    ) external onlyRole(ADMIN_ROLE) {
        if (newFounderAddress != address(0)) {
            founderAddress = newFounderAddress;
        }
        if (newLpPoolAddress != address(0)) {
            lpPoolAddress = newLpPoolAddress;
        }
        if (newDaoTreasuryAddress != address(0)) {
            daoTreasuryAddress = newDaoTreasuryAddress;
        }
    }

    /**
     * @dev Get pending distribution amount for a token
     */
    function getPendingDistribution(address token) external view returns (uint256) {
        return pendingDistribution[token];
    }

    /**
     * @dev Get total revenue for a token
     */
    function getTotalRevenue(address token) external view returns (uint256) {
        return totalRevenueByToken[token];
    }

    /**
     * @dev Get white-label partner details
     */
    function getWhiteLabelPartner(uint256 partnerId) external view returns (
        address partnerAddress,
        uint256 sharePercentage,
        bool isActive,
        uint256 totalEarned,
        string memory partnerName
    ) {
        WhiteLabelPartner memory partner = whiteLabelPartners[partnerId];
        return (
            partner.partnerAddress,
            partner.sharePercentage,
            partner.isActive,
            partner.totalEarned,
            partner.partnerName
        );
    }

    /**
     * @dev Get partner earnings for a specific token
     */
    function getPartnerEarnings(uint256 partnerId, address token) external view returns (uint256) {
        return partnerEarnings[partnerId][token];
    }

    /**
     * @dev Get all active white-label partners
     */
    function getActivePartners() external view returns (uint256[] memory) {
        uint256[] memory activePartnerIds = new uint256[](totalWhiteLabelPartners);
        uint256 index = 0;
        
        for (uint256 i = 1; i < nextPartnerId; i++) {
            if (whiteLabelPartners[i].isActive) {
                activePartnerIds[index] = i;
                index++;
            }
        }
        
        // Resize array to actual size
        uint256[] memory result = new uint256[](index);
        for (uint256 j = 0; j < index; j++) {
            result[j] = activePartnerIds[j];
        }
        
        return result;
    }

    /**
     * @dev Get distribution history
     */
    function getDistributionHistory(uint256 limit) external view returns (RevenueDistribution[] memory) {
        uint256 length = distributions.length;
        uint256 returnLength = limit > 0 && limit < length ? limit : length;
        
        RevenueDistribution[] memory result = new RevenueDistribution[](returnLength);
        
        for (uint256 i = 0; i < returnLength; i++) {
            result[i] = distributions[length - 1 - i]; // Return in reverse order (newest first)
        }
        
        return result;
    }

    /**
     * @dev Get contract balance for a token
     */
    function getBalance(address token) external view returns (uint256) {
        if (token == address(0)) {
            return address(this).balance;
        } else {
            return IERC20(token).balanceOf(address(this));
        }
    }

    /**
     * @dev Emergency withdrawal (admin only)
     */
    function emergencyWithdraw(address token, uint256 amount) external onlyRole(ADMIN_ROLE) {
        require(amount > 0, "Amount must be greater than 0");
        
        if (token == address(0)) {
            require(address(this).balance >= amount, "Insufficient ETH balance");
            payable(msg.sender).transfer(amount);
        } else {
            require(IERC20(token).balanceOf(address(this)) >= amount, "Insufficient token balance");
            require(IERC20(token).transfer(msg.sender, amount), "Token transfer failed");
        }
    }

    /**
     * @dev Pause contract
     */
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    /**
     * @dev Unpause contract
     */
    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }

    // Internal functions

    function _recordRevenue(address token, uint256 amount, string memory source) internal {
        totalRevenueByToken[token] = totalRevenueByToken[token].add(amount);
        pendingDistribution[token] = pendingDistribution[token].add(amount);
        
        emit RevenueReceived(token, amount, source);
    }

    function _transferTokens(address token, address recipient, uint256 amount) internal {
        if (token == address(0)) {
            // Transfer ETH
            payable(recipient).transfer(amount);
        } else {
            // Transfer ERC20 token
            require(IERC20(token).transfer(recipient, amount), "Token transfer failed");
        }
    }

    function _distributeToWhiteLabelPartners(address token, uint256 totalAmount) internal {
        if (totalWhiteLabelPartners == 0) {
            // If no partners, send to DAO treasury
            _transferTokens(token, daoTreasuryAddress, totalAmount);
            return;
        }
        
        uint256 totalDistributed = 0;
        
        for (uint256 i = 1; i < nextPartnerId; i++) {
            WhiteLabelPartner storage partner = whiteLabelPartners[i];
            
            if (partner.isActive) {
                uint256 partnerAmount = totalAmount.mul(partner.sharePercentage).div(10000);
                
                if (partnerAmount > 0) {
                    _transferTokens(token, partner.partnerAddress, partnerAmount);
                    
                    // Update partner earnings tracking
                    partnerEarnings[i][token] = partnerEarnings[i][token].add(partnerAmount);
                    partner.totalEarned = partner.totalEarned.add(partnerAmount);
                    
                    totalDistributed = totalDistributed.add(partnerAmount);
                }
            }
        }
        
        // Send any remaining amount to DAO treasury (due to rounding)
        uint256 remainder = totalAmount.sub(totalDistributed);
        if (remainder > 0) {
            _transferTokens(token, daoTreasuryAddress, remainder);
        }
    }

    /**
     * @dev Get platform revenue statistics
     */
    function getRevenueStats() external view returns (
        uint256 totalETHRevenue,
        uint256 totalNXDRevenue,
        uint256 totalDistributions,
        uint256 pendingETH,
        uint256 pendingNXD
    ) {
        totalETHRevenue = totalRevenueByToken[address(0)];
        totalNXDRevenue = totalRevenueByToken[address(nxdToken)];
        totalDistributions = distributions.length;
        pendingETH = pendingDistribution[address(0)];
        pendingNXD = pendingDistribution[address(nxdToken)];
    }
}