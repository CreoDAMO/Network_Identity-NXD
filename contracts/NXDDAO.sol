// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/governance/Governor.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorSettings.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotesQuorumFraction.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorTimelockControl.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./NXDToken.sol";

/**
 * @title NXDDAO
 * @dev Governance contract for NXD Platform with timelock and emergency controls
 * Features: Proposal creation, voting, execution, emergency stop, fee adjustments
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
    bytes32 public constant TIMELOCK_ADMIN_ROLE = keccak256("TIMELOCK_ADMIN_ROLE");
    
    // Platform parameters that can be governed
    struct PlatformParams {
        uint256 domainRegistrationFeeETH;  // Base fee in ETH (wei)
        uint256 domainRegistrationFeeNXD;  // Base fee in NXD tokens
        uint256 nxdDiscountPercentage;     // Discount when paying with NXD (basis points)
        uint256 stakingMinimumTier0;       // Minimum stake for tier 0
        uint256 stakingMinimumTier1;       // Minimum stake for tier 1
        uint256 stakingMinimumTier2;       // Minimum stake for tier 2
        bool emergencyStop;                // Emergency stop status
        bool proposalCreationPaused;       // Proposal creation pause status
    }
    
    PlatformParams public platformParams;
    NXDToken public immutable nxdToken;
    
    // Proposal categories
    enum ProposalCategory {
        GENERAL,
        FEES,
        STAKING,
        EMERGENCY,
        TLD_CREATION,
        PLATFORM_UPGRADE
    }
    
    // Proposal tracking
    mapping(uint256 => ProposalCategory) public proposalCategories;
    mapping(uint256 => bool) public executedProposals;
    
    // Events
    event EmergencyStop(bool stopped, address initiator);
    event PlatformParamsUpdated(
        uint256 domainFeeETH,
        uint256 domainFeeNXD,
        uint256 discountPercentage
    );
    event ProposalCategorySet(uint256 indexed proposalId, ProposalCategory category);
    event CustomProposalExecuted(uint256 indexed proposalId, bytes[] results);
    
    // Constants
    uint256 public constant MINIMUM_VOTING_POWER = 10_000 * 10**18; // 10K NXD
    uint256 public constant EMERGENCY_VOTING_POWER = 50_000_000 * 10**18; // 50M NXD
    uint256 public constant PROPOSAL_THRESHOLD_PERCENTAGE = 100; // 1% of total supply
    
    constructor(
        NXDToken _token,
        TimelockController _timelock,
        address admin
    )
        Governor("NXD DAO")
        GovernorSettings(1, 45818, MINIMUM_VOTING_POWER) // 1 block delay, ~7 days voting, 10K threshold
        GovernorVotes(IVotes(address(_token)))
        GovernorVotesQuorumFraction(10) // 10% quorum
        GovernorTimelockControl(_timelock)
    {
        nxdToken = _token;
        
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(EMERGENCY_ROLE, admin);
        _grantRole(TIMELOCK_ADMIN_ROLE, admin);
        
        // Initialize platform parameters
        platformParams = PlatformParams({
            domainRegistrationFeeETH: 0.01 ether,
            domainRegistrationFeeNXD: 100 * 10**18,
            nxdDiscountPercentage: 2000, // 20% discount
            stakingMinimumTier0: 10_000 * 10**18,
            stakingMinimumTier1: 100_000 * 10**18,
            stakingMinimumTier2: 1_000_000 * 10**18,
            emergencyStop: false,
            proposalCreationPaused: false
        });
    }

    /**
     * @dev Create a proposal with category
     * @param targets Contract addresses to call
     * @param values ETH amounts to send
     * @param calldatas Function call data
     * @param description Proposal description
     * @param category Proposal category
     */
    function propose(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description,
        ProposalCategory category
    ) public returns (uint256) {
        require(!platformParams.proposalCreationPaused, "Proposal creation paused");
        require(
            getVotes(msg.sender, block.number - 1) >= proposalThreshold(),
            "Insufficient voting power"
        );
        
        uint256 proposalId = propose(targets, values, calldatas, description);
        proposalCategories[proposalId] = category;
        
        emit ProposalCategorySet(proposalId, category);
        return proposalId;
    }

    /**
     * @dev Emergency stop function - can be called by admin or with enough voting power
     * @param stop Whether to enable or disable emergency stop
     */
    function emergencyStop(bool stop) external nonReentrant {
        bool isAdmin = hasRole(EMERGENCY_ROLE, msg.sender);
        bool hasEmergencyVotes = getVotes(msg.sender, block.number - 1) >= EMERGENCY_VOTING_POWER;
        
        require(isAdmin || hasEmergencyVotes, "Insufficient authority for emergency stop");
        
        platformParams.emergencyStop = stop;
        emit EmergencyStop(stop, msg.sender);
    }

    /**
     * @dev Update platform parameters (only through governance)
     * @param domainFeeETH New domain registration fee in ETH
     * @param domainFeeNXD New domain registration fee in NXD
     * @param discountPercentage New NXD discount percentage
     */
    function updatePlatformParams(
        uint256 domainFeeETH,
        uint256 domainFeeNXD,
        uint256 discountPercentage
    ) external onlyGovernance {
        require(discountPercentage <= 5000, "Discount cannot exceed 50%");
        
        platformParams.domainRegistrationFeeETH = domainFeeETH;
        platformParams.domainRegistrationFeeNXD = domainFeeNXD;
        platformParams.nxdDiscountPercentage = discountPercentage;
        
        emit PlatformParamsUpdated(domainFeeETH, domainFeeNXD, discountPercentage);
    }

    /**
     * @dev Update staking parameters (only through governance)
     * @param tier0Min Minimum for tier 0 staking
     * @param tier1Min Minimum for tier 1 staking
     * @param tier2Min Minimum for tier 2 staking
     */
    function updateStakingParams(
        uint256 tier0Min,
        uint256 tier1Min,
        uint256 tier2Min
    ) external onlyGovernance {
        require(tier0Min < tier1Min && tier1Min < tier2Min, "Invalid tier structure");
        
        platformParams.stakingMinimumTier0 = tier0Min;
        platformParams.stakingMinimumTier1 = tier1Min;
        platformParams.stakingMinimumTier2 = tier2Min;
    }

    /**
     * @dev Pause or unpause proposal creation (admin only)
     * @param paused Whether to pause proposal creation
     */
    function pauseProposalCreation(bool paused) external onlyRole(DEFAULT_ADMIN_ROLE) {
        platformParams.proposalCreationPaused = paused;
    }

    /**
     * @dev Custom proposal execution for platform-specific actions
     * @param proposalId The proposal ID
     * @param targets Contract addresses
     * @param values ETH amounts
     * @param calldatas Function call data
     */
    function executeCustomProposal(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas
    ) external nonReentrant {
        require(state(proposalId) == ProposalState.Succeeded, "Proposal not succeeded");
        require(!executedProposals[proposalId], "Proposal already executed");
        
        executedProposals[proposalId] = true;
        
        bytes[] memory results = new bytes[](targets.length);
        for (uint256 i = 0; i < targets.length; i++) {
            (bool success, bytes memory result) = targets[i].call{value: values[i]}(calldatas[i]);
            require(success, "Proposal execution failed");
            results[i] = result;
        }
        
        emit CustomProposalExecuted(proposalId, results);
    }

    /**
     * @dev Get current platform parameters
     */
    function getPlatformParams() external view returns (PlatformParams memory) {
        return platformParams;
    }

    /**
     * @dev Get proposal information
     * @param proposalId The proposal ID
     */
    function getProposalInfo(uint256 proposalId) external view returns (
        ProposalState proposalState,
        ProposalCategory category,
        uint256 forVotes,
        uint256 againstVotes,
        uint256 abstainVotes,
        bool executed
    ) {
        proposalState = state(proposalId);
        category = proposalCategories[proposalId];
        executed = executedProposals[proposalId];
        
        (againstVotes, forVotes, abstainVotes) = proposalVotes(proposalId);
    }

    /**
     * @dev Check if user can create proposals
     * @param account User address
     */
    function canCreateProposal(address account) external view returns (bool) {
        return !platformParams.proposalCreationPaused && 
               getVotes(account, block.number - 1) >= proposalThreshold();
    }

    /**
     * @dev Check if user can trigger emergency stop
     * @param account User address
     */
    function canEmergencyStop(address account) external view returns (bool) {
        return hasRole(EMERGENCY_ROLE, account) || 
               getVotes(account, block.number - 1) >= EMERGENCY_VOTING_POWER;
    }

    // Override required functions
    function votingDelay() public view override(IGovernor, GovernorSettings) returns (uint256) {
        return super.votingDelay();
    }

    function votingPeriod() public view override(IGovernor, GovernorSettings) returns (uint256) {
        return super.votingPeriod();
    }

    function quorum(uint256 blockNumber) public view override(IGovernor, GovernorVotesQuorumFraction) returns (uint256) {
        return super.quorum(blockNumber);
    }

    function proposalThreshold() public view override(Governor, GovernorSettings) returns (uint256) {
        // Dynamic threshold based on total supply
        uint256 totalSupply = nxdToken.totalSupply();
        return (totalSupply * PROPOSAL_THRESHOLD_PERCENTAGE) / 10000;
    }

    function state(uint256 proposalId) public view override(Governor, GovernorTimelockControl) returns (ProposalState) {
        return super.state(proposalId);
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

    function _executor() internal view override(Governor, GovernorTimelockControl) returns (address) {
        return super._executor();
    }

    function supportsInterface(bytes4 interfaceId) public view override(Governor, GovernorTimelockControl, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    // Modifiers
    modifier onlyGovernance() {
        require(_msgSender() == _executor(), "Only governance can call this function");
        _;
    }

    // Emergency functions
    function rescueTokens(address token, uint256 amount) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(token != address(nxdToken), "Cannot rescue NXD tokens");
        IERC20(token).transfer(msg.sender, amount);
    }

    receive() external payable {}
}