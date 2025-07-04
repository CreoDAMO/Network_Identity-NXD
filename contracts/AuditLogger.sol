// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title AuditLogger
 * @dev Immutable audit logging system for NXD Platform operations
 * Features: Deployment logging, AI action tracking, admin overrides, IPFS integration
 */
contract AuditLogger is AccessControl, ReentrancyGuard {
    using Counters for Counters.Counter;
    
    bytes32 public constant LOGGER_ROLE = keccak256("LOGGER_ROLE");
    bytes32 public constant AI_ROLE = keccak256("AI_ROLE");
    bytes32 public constant DEPLOYMENT_ROLE = keccak256("DEPLOYMENT_ROLE");
    
    Counters.Counter private _auditIds;
    
    // Audit entry categories
    enum AuditCategory {
        DEPLOYMENT,
        AI_ACTION,
        ADMIN_OVERRIDE,
        USER_ACTION,
        SYSTEM_EVENT,
        SECURITY_EVENT,
        GOVERNANCE_ACTION
    }
    
    // Audit entry severity levels
    enum Severity {
        LOW,
        MEDIUM,
        HIGH,
        CRITICAL
    }
    
    // Audit entry structure
    struct AuditEntry {
        uint256 id;
        AuditCategory category;
        Severity severity;
        address actor;          // Who performed the action
        string action;          // What action was performed
        string details;         // Detailed description
        string ipfsHash;        // IPFS hash for additional data
        uint256 timestamp;      // When the action occurred
        bytes32 transactionHash; // Related transaction hash (if any)
        bool verified;          // Whether the entry has been verified
        address verifier;       // Who verified the entry
    }
    
    // Storage
    mapping(uint256 => AuditEntry) public auditEntries;
    mapping(address => uint256[]) public actorAudits;
    mapping(AuditCategory => uint256[]) public categoryAudits;
    mapping(bytes32 => uint256) public transactionAudits;
    
    // Statistics
    uint256 public totalAudits;
    mapping(AuditCategory => uint256) public categoryCount;
    mapping(Severity => uint256) public severityCount;
    
    // Events
    event AuditEntryCreated(
        uint256 indexed id,
        AuditCategory indexed category,
        Severity indexed severity,
        address actor,
        string action
    );
    
    event AuditEntryVerified(uint256 indexed id, address verifier);
    event IPFSHashUpdated(uint256 indexed id, string ipfsHash);
    event BatchAuditCreated(uint256[] ids, AuditCategory category);
    
    constructor(address admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(LOGGER_ROLE, admin);
        _grantRole(AI_ROLE, admin);
        _grantRole(DEPLOYMENT_ROLE, admin);
    }

    /**
     * @dev Create a new audit entry
     * @param category Audit category
     * @param severity Severity level
     * @param actor Address of the actor performing the action
     * @param action Action description
     * @param details Detailed description
     * @param ipfsHash IPFS hash for additional data
     * @param relatedTxHash Related transaction hash
     */
    function createAuditEntry(
        AuditCategory category,
        Severity severity,
        address actor,
        string memory action,
        string memory details,
        string memory ipfsHash,
        bytes32 relatedTxHash
    ) external onlyRole(LOGGER_ROLE) nonReentrant returns (uint256) {
        _auditIds.increment();
        uint256 auditId = _auditIds.current();
        
        AuditEntry storage entry = auditEntries[auditId];
        entry.id = auditId;
        entry.category = category;
        entry.severity = severity;
        entry.actor = actor;
        entry.action = action;
        entry.details = details;
        entry.ipfsHash = ipfsHash;
        entry.timestamp = block.timestamp;
        entry.transactionHash = relatedTxHash;
        entry.verified = false;
        
        // Update indices
        actorAudits[actor].push(auditId);
        categoryAudits[category].push(auditId);
        if (relatedTxHash != bytes32(0)) {
            transactionAudits[relatedTxHash] = auditId;
        }
        
        // Update statistics
        totalAudits++;
        categoryCount[category]++;
        severityCount[severity]++;
        
        emit AuditEntryCreated(auditId, category, severity, actor, action);
        return auditId;
    }

    /**
     * @dev Log deployment action
     * @param component Component being deployed (backend, frontend, contracts)
     * @param version Version being deployed
     * @param environment Target environment (production, staging, testing)
     * @param deployer Address of the deployer
     * @param status Deployment status
     * @param ipfsHash IPFS hash containing deployment details
     */
    function logDeployment(
        string memory component,
        string memory version,
        string memory environment,
        address deployer,
        string memory status,
        string memory ipfsHash
    ) external onlyRole(DEPLOYMENT_ROLE) returns (uint256) {
        string memory action = string(abi.encodePacked("Deploy ", component, " v", version, " to ", environment));
        string memory details = string(abi.encodePacked("Status: ", status, ", Deployer: ", addressToString(deployer)));
        
        return createAuditEntry(
            AuditCategory.DEPLOYMENT,
            Severity.MEDIUM,
            deployer,
            action,
            details,
            ipfsHash,
            bytes32(0)
        );
    }

    /**
     * @dev Log AI action
     * @param aiAgent Address of the AI agent
     * @param action AI action performed
     * @param confidence Confidence level (0-100)
     * @param reasoning AI reasoning for the action
     * @param ipfsHash IPFS hash containing detailed AI logs
     */
    function logAIAction(
        address aiAgent,
        string memory action,
        uint8 confidence,
        string memory reasoning,
        string memory ipfsHash
    ) external onlyRole(AI_ROLE) returns (uint256) {
        Severity severity = confidence > 90 ? Severity.LOW : confidence > 70 ? Severity.MEDIUM : Severity.HIGH;
        string memory details = string(abi.encodePacked("Confidence: ", uint2str(confidence), "%, Reasoning: ", reasoning));
        
        return createAuditEntry(
            AuditCategory.AI_ACTION,
            severity,
            aiAgent,
            action,
            details,
            ipfsHash,
            bytes32(0)
        );
    }

    /**
     * @dev Log admin override action
     * @param admin Address of the admin
     * @param overriddenAction Action that was overridden
     * @param justification Justification for the override
     * @param ipfsHash IPFS hash containing override documentation
     */
    function logAdminOverride(
        address admin,
        string memory overriddenAction,
        string memory justification,
        string memory ipfsHash
    ) external onlyRole(DEFAULT_ADMIN_ROLE) returns (uint256) {
        string memory action = string(abi.encodePacked("Admin Override: ", overriddenAction));
        
        return createAuditEntry(
            AuditCategory.ADMIN_OVERRIDE,
            Severity.HIGH,
            admin,
            action,
            justification,
            ipfsHash,
            bytes32(0)
        );
    }

    /**
     * @dev Log governance action
     * @param voter Address of the voter/proposer
     * @param proposalId Proposal ID
     * @param action Governance action (propose, vote, execute)
     * @param details Action details
     */
    function logGovernanceAction(
        address voter,
        uint256 proposalId,
        string memory action,
        string memory details
    ) external onlyRole(LOGGER_ROLE) returns (uint256) {
        string memory fullAction = string(abi.encodePacked("Governance ", action, " - Proposal #", uint2str(proposalId)));
        
        return createAuditEntry(
            AuditCategory.GOVERNANCE_ACTION,
            Severity.MEDIUM,
            voter,
            fullAction,
            details,
            "",
            bytes32(0)
        );
    }

    /**
     * @dev Log security event
     * @param actor Address involved in the security event
     * @param eventType Type of security event
     * @param severity Severity of the event
     * @param details Event details
     */
    function logSecurityEvent(
        address actor,
        string memory eventType,
        Severity severity,
        string memory details
    ) external onlyRole(LOGGER_ROLE) returns (uint256) {
        string memory action = string(abi.encodePacked("Security Event: ", eventType));
        
        return createAuditEntry(
            AuditCategory.SECURITY_EVENT,
            severity,
            actor,
            action,
            details,
            "",
            bytes32(0)
        );
    }

    /**
     * @dev Verify an audit entry
     * @param auditId ID of the audit entry to verify
     */
    function verifyAuditEntry(uint256 auditId) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(auditId <= _auditIds.current(), "Invalid audit ID");
        require(!auditEntries[auditId].verified, "Already verified");
        
        auditEntries[auditId].verified = true;
        auditEntries[auditId].verifier = msg.sender;
        
        emit AuditEntryVerified(auditId, msg.sender);
    }

    /**
     * @dev Update IPFS hash for an audit entry
     * @param auditId ID of the audit entry
     * @param ipfsHash New IPFS hash
     */
    function updateIPFSHash(uint256 auditId, string memory ipfsHash) external onlyRole(LOGGER_ROLE) {
        require(auditId <= _auditIds.current(), "Invalid audit ID");
        
        auditEntries[auditId].ipfsHash = ipfsHash;
        emit IPFSHashUpdated(auditId, ipfsHash);
    }

    /**
     * @dev Create multiple audit entries in batch
     * @param categories Array of categories
     * @param severities Array of severities
     * @param actors Array of actors
     * @param actions Array of actions
     * @param detailsArray Array of details
     */
    function createBatchAuditEntries(
        AuditCategory[] memory categories,
        Severity[] memory severities,
        address[] memory actors,
        string[] memory actions,
        string[] memory detailsArray
    ) external onlyRole(LOGGER_ROLE) returns (uint256[] memory) {
        require(categories.length == severities.length, "Array length mismatch");
        require(categories.length == actors.length, "Array length mismatch");
        require(categories.length == actions.length, "Array length mismatch");
        require(categories.length == detailsArray.length, "Array length mismatch");
        
        uint256[] memory auditIds = new uint256[](categories.length);
        
        for (uint256 i = 0; i < categories.length; i++) {
            auditIds[i] = createAuditEntry(
                categories[i],
                severities[i],
                actors[i],
                actions[i],
                detailsArray[i],
                "",
                bytes32(0)
            );
        }
        
        emit BatchAuditCreated(auditIds, categories[0]);
        return auditIds;
    }

    /**
     * @dev Get audit entry by ID
     * @param auditId ID of the audit entry
     */
    function getAuditEntry(uint256 auditId) external view returns (AuditEntry memory) {
        require(auditId <= _auditIds.current(), "Invalid audit ID");
        return auditEntries[auditId];
    }

    /**
     * @dev Get audit entries by actor
     * @param actor Address of the actor
     * @param offset Starting index
     * @param limit Number of entries to return
     */
    function getAuditsByActor(
        address actor,
        uint256 offset,
        uint256 limit
    ) external view returns (AuditEntry[] memory) {
        uint256[] memory actorAuditIds = actorAudits[actor];
        require(offset < actorAuditIds.length, "Offset out of bounds");
        
        uint256 end = offset + limit;
        if (end > actorAuditIds.length) {
            end = actorAuditIds.length;
        }
        
        AuditEntry[] memory entries = new AuditEntry[](end - offset);
        for (uint256 i = offset; i < end; i++) {
            entries[i - offset] = auditEntries[actorAuditIds[i]];
        }
        
        return entries;
    }

    /**
     * @dev Get audit entries by category
     * @param category Audit category
     * @param offset Starting index
     * @param limit Number of entries to return
     */
    function getAuditsByCategory(
        AuditCategory category,
        uint256 offset,
        uint256 limit
    ) external view returns (AuditEntry[] memory) {
        uint256[] memory categoryAuditIds = categoryAudits[category];
        require(offset < categoryAuditIds.length, "Offset out of bounds");
        
        uint256 end = offset + limit;
        if (end > categoryAuditIds.length) {
            end = categoryAuditIds.length;
        }
        
        AuditEntry[] memory entries = new AuditEntry[](end - offset);
        for (uint256 i = offset; i < end; i++) {
            entries[i - offset] = auditEntries[categoryAuditIds[i]];
        }
        
        return entries;
    }

    /**
     * @dev Get audit statistics
     */
    function getAuditStats() external view returns (
        uint256 _totalAudits,
        uint256 deploymentsCount,
        uint256 aiActionsCount,
        uint256 adminOverridesCount,
        uint256 securityEventsCount,
        uint256 verifiedCount
    ) {
        _totalAudits = totalAudits;
        deploymentsCount = categoryCount[AuditCategory.DEPLOYMENT];
        aiActionsCount = categoryCount[AuditCategory.AI_ACTION];
        adminOverridesCount = categoryCount[AuditCategory.ADMIN_OVERRIDE];
        securityEventsCount = categoryCount[AuditCategory.SECURITY_EVENT];
        
        // Count verified entries
        for (uint256 i = 1; i <= _auditIds.current(); i++) {
            if (auditEntries[i].verified) {
                verifiedCount++;
            }
        }
    }

    /**
     * @dev Get recent audit entries
     * @param limit Number of recent entries to return
     */
    function getRecentAudits(uint256 limit) external view returns (AuditEntry[] memory) {
        uint256 currentCount = _auditIds.current();
        if (limit > currentCount) {
            limit = currentCount;
        }
        
        AuditEntry[] memory entries = new AuditEntry[](limit);
        for (uint256 i = 0; i < limit; i++) {
            entries[i] = auditEntries[currentCount - i];
        }
        
        return entries;
    }

    // Utility functions
    function addressToString(address _addr) internal pure returns (string memory) {
        bytes32 value = bytes32(uint256(uint160(_addr)));
        bytes memory alphabet = "0123456789abcdef";
        bytes memory str = new bytes(42);
        str[0] = '0';
        str[1] = 'x';
        for (uint256 i = 0; i < 20; i++) {
            str[2+i*2] = alphabet[uint8(value[i + 12] >> 4)];
            str[3+i*2] = alphabet[uint8(value[i + 12] & 0x0f)];
        }
        return string(str);
    }

    function uint2str(uint256 _i) internal pure returns (string memory) {
        if (_i == 0) {
            return "0";
        }
        uint256 j = _i;
        uint256 len;
        while (j != 0) {
            len++;
            j /= 10;
        }
        bytes memory bstr = new bytes(len);
        uint256 k = len;
        while (_i != 0) {
            k = k-1;
            uint8 temp = (48 + uint8(_i - _i / 10 * 10));
            bytes1 b1 = bytes1(temp);
            bstr[k] = b1;
            _i /= 10;
        }
        return string(bstr);
    }

    // Emergency functions
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        // Implementation for emergency pause
    }

    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        // Implementation for emergency unpause
    }
}