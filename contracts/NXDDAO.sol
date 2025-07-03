// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/governance/Governor.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorSettings.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotesQuorumFraction.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorTimelockControl.sol";
import "@openzeppelin/contracts/governance/TimelockController.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./NXDToken.sol";

/**
 * @title NXDDAO
 * @dev Comprehensive DAO governance for the NXD platform
 * Features: Weighted voting, timelock, emergency functions, proposal categories
 */
contract NXDDAO is 
    Governor,
    GovernorSettings,
    GovernorCountingSimple,
    GovernorVotes,
    GovernorVotesQuorumFraction,
    GovernorTimelockControl,
    AccessControl,
    ReentrancyGuard 
{
    bytes32 public constant EMERGENCY_ROLE = keccak256("EMERGENCY_ROLE");
    bytes32 public constant PROPOSER_ROLE = keccak256("PROPOSER_ROLE");

    NXDToken public nxdToken;
    TimelockController public timelock;

    uint256 public constant EMERGENCY_QUORUM = 50_000_000 * 10**18; // 50M NXD for emergency stop
    uint256 public constant MIN_PROPOSAL_THRESHOLD = 1_000_000 * 10**18; // 1M NXD to propose
    uint256 public constant VOTING_DELAY = 1 days; // 1 day delay before voting starts
    uint256 public constant VOTING_PERIOD = 7 days; // 7 days voting period
    uint256 public constant TIMELOCK_DELAY = 2 days; // 2 day timelock for execution

    // Proposal categories
    enum ProposalCategory {
        PLATFORM_UPGRADE,
        FEE_ADJUSTMENT,
        NEW_TLD,
        TREASURY_USE,
        EMERGENCY_ACTION,
        TOKENOMICS_CHANGE,
        GOVERNANCE_CHANGE
    }

    // Enhanced proposal structure
    struct ProposalInfo {
        uint256 id;
        address proposer;
        string title;
        string description;
        ProposalCategory category;
        uint256 createdAt;
        uint256 executionDate;
        bool isExecuted;
        bool isEmergency;
        mapping(address => bool) hasVoted;
        mapping(address => uint8) vote; // 0=Against, 1=For, 2=Abstain
    }

    mapping(uint256 => ProposalInfo) public proposalInfo;
    mapping(address => uint256[]) public userProposals;
    mapping(ProposalCategory => uint256) public categoryCount;

    // Emergency state
    bool public emergencyStop;
    uint256 public emergencyActivatedAt;
    mapping(address => bool) public emergencyVoters;

    // Delegation tracking
    mapping(address => address) public delegations;
    mapping(address => uint256) public delegatedPower;

    // Events
    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed proposer,
        string title,
        ProposalCategory category,
        bool isEmergency
    );
    event VoteCast(
        address indexed voter,
        uint256 indexed proposalId,
        uint8 support,
        uint256 weight,
        string reason
    );
    event ProposalExecuted(uint256 indexed proposalId);
    event EmergencyActivated(address indexed activator, uint256 timestamp);
    event EmergencyDeactivated(address indexed deactivator, uint256 timestamp);
    event DelegationChanged(address indexed delegator, address indexed fromDelegate, address indexed toDelegate);

    constructor(
        address _nxdToken,
        TimelockController _timelock
    )
        Governor("NXD DAO")
        GovernorSettings(VOTING_DELAY, VOTING_PERIOD, MIN_PROPOSAL_THRESHOLD)
        GovernorVotes(IVotes(_nxdToken))
        GovernorVotesQuorumFraction(10) // 10% quorum
        GovernorTimelockControl(_timelock)
    {
        nxdToken = NXDToken(_nxdToken);
        timelock = _timelock;
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(EMERGENCY_ROLE, msg.sender);
        _grantRole(PROPOSER_ROLE, msg.sender);
    }

    /**
     * @dev Create a new proposal with enhanced metadata
     */
    function propose(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description,
        string memory title,
        ProposalCategory category
    ) public returns (uint256) {
        require(
            getVotes(msg.sender, block.number - 1) >= proposalThreshold(),
            "Governor: proposer votes below proposal threshold"
        );

        uint256 proposalId = super.propose(targets, values, calldatas, description);
        
        ProposalInfo storage info = proposalInfo[proposalId];
        info.id = proposalId;
        info.proposer = msg.sender;
        info.title = title;
        info.description = description;
        info.category = category;
        info.createdAt = block.timestamp;
        info.isEmergency = (category == ProposalCategory.EMERGENCY_ACTION);

        userProposals[msg.sender].push(proposalId);
        categoryCount[category]++;

        emit ProposalCreated(proposalId, msg.sender, title, category, info.isEmergency);
        
        return proposalId;
    }

    /**
     * @dev Enhanced voting with delegation support
     */
    function castVoteWithReasonAndParams(
        uint256 proposalId,
        uint8 support,
        string calldata reason,
        bytes memory params
    ) public override returns (uint256) {
        require(!emergencyStop || proposalInfo[proposalId].isEmergency, "DAO paused except emergency proposals");
        
        address voter = msg.sender;
        uint256 weight = _getVotes(voter, proposalSnapshot(proposalId), params);
        
        // Add delegated voting power
        weight += delegatedPower[voter];
        
        ProposalInfo storage info = proposalInfo[proposalId];
        require(!info.hasVoted[voter], "Already voted");
        
        info.hasVoted[voter] = true;
        info.vote[voter] = support;

        emit VoteCast(voter, proposalId, support, weight, reason);
        
        return super.castVoteWithReasonAndParams(proposalId, support, reason, params);
    }

    /**
     * @dev Delegate voting power to another address
     */
    function delegateVotingPower(address delegatee) external {
        address currentDelegate = delegations[msg.sender];
        
        if (currentDelegate != address(0)) {
            delegatedPower[currentDelegate] -= getVotes(msg.sender, block.number - 1);
        }
        
        delegations[msg.sender] = delegatee;
        
        if (delegatee != address(0)) {
            delegatedPower[delegatee] += getVotes(msg.sender, block.number - 1);
        }
        
        emit DelegationChanged(msg.sender, currentDelegate, delegatee);
    }

    /**
     * @dev Emergency stop function - can be activated by large token holders
     */
    function activateEmergencyStop() external {
        require(!emergencyStop, "Emergency already active");
        require(
            getVotes(msg.sender, block.number - 1) >= EMERGENCY_QUORUM,
            "Insufficient voting power for emergency stop"
        );

        emergencyStop = true;
        emergencyActivatedAt = block.timestamp;
        emergencyVoters[msg.sender] = true;

        emit EmergencyActivated(msg.sender, block.timestamp);
    }

    /**
     * @dev Deactivate emergency stop
     */
    function deactivateEmergencyStop() external onlyRole(EMERGENCY_ROLE) {
        require(emergencyStop, "Emergency not active");
        
        emergencyStop = false;
        emergencyActivatedAt = 0;

        emit EmergencyDeactivated(msg.sender, block.timestamp);
    }

    /**
     * @dev Execute proposal with enhanced tracking
     */
    function execute(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) public payable override returns (uint256) {
        uint256 proposalId = hashProposal(targets, values, calldatas, descriptionHash);
        
        require(state(proposalId) == ProposalState.Succeeded, "Governor: proposal not successful");
        
        proposalInfo[proposalId].isExecuted = true;
        proposalInfo[proposalId].executionDate = block.timestamp;

        emit ProposalExecuted(proposalId);
        
        return super.execute(targets, values, calldatas, descriptionHash);
    }

    /**
     * @dev Get proposal details
     */
    function getProposalInfo(uint256 proposalId) external view returns (
        address proposer,
        string memory title,
        string memory description,
        ProposalCategory category,
        uint256 createdAt,
        bool isExecuted,
        bool isEmergency
    ) {
        ProposalInfo storage info = proposalInfo[proposalId];
        return (
            info.proposer,
            info.title,
            info.description,
            info.category,
            info.createdAt,
            info.isExecuted,
            info.isEmergency
        );
    }

    /**
     * @dev Get user's proposals
     */
    function getUserProposals(address user) external view returns (uint256[] memory) {
        return userProposals[user];
    }

    /**
     * @dev Get governance statistics
     */
    function getGovernanceStats() external view returns (
        uint256 totalProposals,
        uint256 activeProposals,
        uint256 executedProposals,
        uint256 totalVoters,
        bool isEmergencyActive
    ) {
        // This would require tracking in practice
        totalProposals = proposalCount();
        isEmergencyActive = emergencyStop;
        
        // Additional stats would be calculated based on stored data
    }

    /**
     * @dev Check if user can vote on proposal
     */
    function canVote(address user, uint256 proposalId) external view returns (bool) {
        return !proposalInfo[proposalId].hasVoted[user] && 
               getVotes(user, proposalSnapshot(proposalId)) > 0;
    }

    /**
     * @dev Get voting power including delegations
     */
    function getEffectiveVotingPower(address user) external view returns (uint256) {
        return getVotes(user, block.number - 1) + delegatedPower[user];
    }

    // Required overrides for Governor
    function votingDelay() public view override(IGovernor, GovernorSettings) returns (uint256) {
        return super.votingDelay();
    }

    function votingPeriod() public view override(IGovernor, GovernorSettings) returns (uint256) {
        return super.votingPeriod();
    }

    function quorum(uint256 blockNumber)
        public
        view
        override(IGovernor, GovernorVotesQuorumFraction)
        returns (uint256)
    {
        return super.quorum(blockNumber);
    }

    function proposalThreshold()
        public
        view
        override(Governor, GovernorSettings)
        returns (uint256)
    {
        return super.proposalThreshold();
    }

    function _execute(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockControl) {
        super._execute(proposalId, targets, values, calldatas, descriptionHash);
    }

    function _cancel(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockControl) returns (uint256) {
        return super._cancel(targets, values, calldatas, descriptionHash);
    }

    function _executor()
        internal
        view
        override(Governor, GovernorTimelockControl)
        returns (address)
    {
        return super._executor();
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(Governor, GovernorTimelockControl, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}