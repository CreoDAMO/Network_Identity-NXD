// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./NXDToken.sol";

/**
 * @title NXDomainRegistry
 * @dev Complete Web3 domain registry with NXD integration and advanced features
 */
contract NXDomainRegistry is ERC721URIStorage, AccessControl, ReentrancyGuard, Pausable {
    using Counters for Counters.Counter;

    // Roles
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant RESOLVER_ROLE = keccak256("RESOLVER_ROLE");
    bytes32 public constant WHITE_LABEL_ROLE = keccak256("WHITE_LABEL_ROLE");

    NXDToken public nxdToken;
    Counters.Counter private _tokenIds;

    // Domain structure
    struct Domain {
        string name;
        string tld;
        string ipfsHash;
        address resolver;
        uint256 registeredAt;
        uint256 expiresAt;
        bool isPremium;
        uint256 subscriptionTier;
        uint256 whiteLabelId;
        mapping(string => string) records;
        mapping(string => bytes) advancedRecords;
        mapping(address => bool) subdomainOperators;
    }

    // TLD structure
    struct TLD {
        string name;
        address owner;
        uint256 registrationFee;
        uint256 premiumFee;
        uint256 nxdStakeRequired;
        bool isActive;
        bool requiresKYC;
        uint256 createdAt;
        uint256 totalDomains;
        address paymentToken;
        uint256 royaltyPercentage;
        uint256 whiteLabelId;
    }

    // Subscription tiers
    struct Subscription {
        uint256 tier;
        uint256 priceInETH;
        uint256 priceInNXD;
        uint256 duration;
        uint256 nxdStakeRequired;
        string[] features;
        bool isActive;
        uint256 gasCredits;
    }

    // Marketplace listing
    struct Listing {
        uint256 tokenId;
        uint256 priceInETH;
        uint256 priceInNXD;
        address preferredToken;
        bool isActive;
        uint256 listedAt;
        address seller;
    }

    // Mappings
    mapping(uint256 => Domain) public domains;
    mapping(string => uint256) public domainToTokenId;
    mapping(string => TLD) public tlds;
    mapping(address => uint256[]) public userDomains;
    mapping(uint256 => Subscription) public subscriptions;
    mapping(uint256 => Listing) public marketplace;
    mapping(address => uint256) public userSubscriptionTier;
    mapping(address => uint256) public nxdStaked;

    // Constants
    uint256 public constant NXD_DECIMALS = 18;
    uint256 public constant BASIS_POINTS = 10000;
    uint256 public constant MIN_TLD_STAKE = 100_000 * 10**NXD_DECIMALS;

    // Events
    event DomainRegistered(
        uint256 indexed tokenId,
        string domain,
        string tld,
        address indexed owner,
        uint256 subscriptionTier,
        uint256 whiteLabelId,
        bool paidInNXD
    );
    event TLDCreated(
        string indexed tld,
        address indexed owner,
        uint256 fee,
        uint256 nxdStaked,
        uint256 whiteLabelId
    );
    event DomainListed(uint256 indexed tokenId, uint256 priceETH, uint256 priceNXD);
    event DomainSold(
        uint256 indexed tokenId,
        address from,
        address to,
        uint256 price,
        bool paidInNXD
    );
    event DomainExpired(uint256 indexed tokenId, string domain);
    event RecordUpdated(uint256 indexed tokenId, string key, string value);

    constructor(address _nxdToken) ERC721("NXDomain", "NXDOM") {
        nxdToken = NXDToken(_nxdToken);
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        
        _initializeDefaultTLDs();
        _setupSubscriptions();
    }

    function _initializeDefaultTLDs() internal {
        // Create default .nxd TLD
        tlds["nxd"] = TLD({
            name: "nxd",
            owner: msg.sender,
            registrationFee: 0.01 ether,
            premiumFee: 0.1 ether,
            nxdStakeRequired: 0,
            isActive: true,
            requiresKYC: false,
            createdAt: block.timestamp,
            totalDomains: 0,
            paymentToken: address(0), // ETH
            royaltyPercentage: 500, // 5%
            whiteLabelId: 0
        });

        // Create premium .dao TLD
        tlds["dao"] = TLD({
            name: "dao",
            owner: msg.sender,
            registrationFee: 0.05 ether,
            premiumFee: 0.5 ether,
            nxdStakeRequired: 10_000 * 10**NXD_DECIMALS,
            isActive: true,
            requiresKYC: false,
            createdAt: block.timestamp,
            totalDomains: 0,
            paymentToken: address(0),
            royaltyPercentage: 1000, // 10%
            whiteLabelId: 0
        });
    }

    function _setupSubscriptions() internal {
        // Bronze subscription
        subscriptions[0] = Subscription({
            tier: 0,
            priceInETH: 0.01 ether,
            priceInNXD: 100 * 10**NXD_DECIMALS,
            duration: 30 days,
            nxdStakeRequired: 1_000 * 10**NXD_DECIMALS,
            features: new string[](2),
            isActive: true,
            gasCredits: 10
        });
        subscriptions[0].features[0] = "Basic DNS";
        subscriptions[0].features[1] = "IPFS Storage";

        // Silver subscription
        subscriptions[1] = Subscription({
            tier: 1,
            priceInETH: 0.05 ether,
            priceInNXD: 500 * 10**NXD_DECIMALS,
            duration: 90 days,
            nxdStakeRequired: 10_000 * 10**NXD_DECIMALS,
            features: new string[](4),
            isActive: true,
            gasCredits: 50
        });
        subscriptions[1].features[0] = "Advanced DNS";
        subscriptions[1].features[1] = "IPFS Storage";
        subscriptions[1].features[2] = "Custom Records";
        subscriptions[1].features[3] = "Email Forwarding";

        // Gold subscription
        subscriptions[2] = Subscription({
            tier: 2,
            priceInETH: 0.1 ether,
            priceInNXD: 1000 * 10**NXD_DECIMALS,
            duration: 365 days,
            nxdStakeRequired: 50_000 * 10**NXD_DECIMALS,
            features: new string[](6),
            isActive: true,
            gasCredits: 200
        });
        subscriptions[2].features[0] = "Premium DNS";
        subscriptions[2].features[1] = "Unlimited IPFS";
        subscriptions[2].features[2] = "Custom Records";
        subscriptions[2].features[3] = "Email Forwarding";
        subscriptions[2].features[4] = "API Access";
        subscriptions[2].features[5] = "Analytics";
    }

    /**
     * @dev Register domain with NXD payment option
     */
    function registerDomain(
        string memory _name,
        string memory _tld,
        string memory _ipfsHash,
        uint256 _subscriptionTier,
        bool _payWithNXD,
        uint256 _whiteLabelId
    ) external payable nonReentrant whenNotPaused {
        string memory fullDomain = string(abi.encodePacked(_name, ".", _tld));
        require(domainToTokenId[fullDomain] == 0, "Domain already registered");
        require(tlds[_tld].isActive, "TLD not active");
        require(bytes(_name).length >= 3, "Domain name too short");
        require(bytes(_name).length <= 63, "Domain name too long");

        TLD memory tld = tlds[_tld];
        uint256 registrationFee = tld.registrationFee;
        
        // Handle payment
        if (_payWithNXD) {
            uint256 nxdPrice = _convertETHToNXD(registrationFee);
            require(nxdToken.transferFrom(msg.sender, address(this), nxdPrice), "NXD payment failed");
            
            // Burn 10% of NXD payment
            uint256 burnAmount = nxdPrice / 10;
            nxdToken.burnFromFees(burnAmount, "Domain registration fee burn");
        } else {
            require(msg.value >= registrationFee, "Insufficient payment");
        }

        // Create domain
        _tokenIds.increment();
        uint256 tokenId = _tokenIds.current();
        
        domains[tokenId].name = _name;
        domains[tokenId].tld = _tld;
        domains[tokenId].ipfsHash = _ipfsHash;
        domains[tokenId].registeredAt = block.timestamp;
        domains[tokenId].expiresAt = block.timestamp + 365 days;
        domains[tokenId].subscriptionTier = _subscriptionTier;
        domains[tokenId].whiteLabelId = _whiteLabelId;

        domainToTokenId[fullDomain] = tokenId;
        userDomains[msg.sender].push(tokenId);
        tlds[_tld].totalDomains++;

        _mint(msg.sender, tokenId);
        _setTokenURI(tokenId, _ipfsHash);

        emit DomainRegistered(tokenId, _name, _tld, msg.sender, _subscriptionTier, _whiteLabelId, _payWithNXD);
    }

    /**
     * @dev Create new TLD (requires NXD stake)
     */
    function createTLD(
        string memory _name,
        uint256 _registrationFee,
        uint256 _premiumFee,
        uint256 _nxdStakeAmount,
        bool _requiresKYC,
        uint256 _whiteLabelId
    ) external nonReentrant {
        require(bytes(tlds[_name].name).length == 0, "TLD already exists");
        require(_nxdStakeAmount >= MIN_TLD_STAKE, "Insufficient NXD stake");
        require(nxdToken.transferFrom(msg.sender, address(this), _nxdStakeAmount), "NXD stake failed");

        tlds[_name] = TLD({
            name: _name,
            owner: msg.sender,
            registrationFee: _registrationFee,
            premiumFee: _premiumFee,
            nxdStakeRequired: _nxdStakeAmount,
            isActive: true,
            requiresKYC: _requiresKYC,
            createdAt: block.timestamp,
            totalDomains: 0,
            paymentToken: address(0),
            royaltyPercentage: 500,
            whiteLabelId: _whiteLabelId
        });

        nxdStaked[msg.sender] += _nxdStakeAmount;

        emit TLDCreated(_name, msg.sender, _registrationFee, _nxdStakeAmount, _whiteLabelId);
    }

    /**
     * @dev List domain for sale
     */
    function listDomain(
        uint256 _tokenId,
        uint256 _priceInETH,
        uint256 _priceInNXD,
        address _preferredToken
    ) external {
        require(ownerOf(_tokenId) == msg.sender, "Not domain owner");
        require(!marketplace[_tokenId].isActive, "Already listed");

        marketplace[_tokenId] = Listing({
            tokenId: _tokenId,
            priceInETH: _priceInETH,
            priceInNXD: _priceInNXD,
            preferredToken: _preferredToken,
            isActive: true,
            listedAt: block.timestamp,
            seller: msg.sender
        });

        emit DomainListed(_tokenId, _priceInETH, _priceInNXD);
    }

    /**
     * @dev Buy domain from marketplace
     */
    function buyDomain(uint256 _tokenId, bool _payWithNXD) external payable nonReentrant {
        Listing memory listing = marketplace[_tokenId];
        require(listing.isActive, "Domain not for sale");
        require(ownerOf(_tokenId) == listing.seller, "Seller no longer owns domain");

        uint256 price;
        if (_payWithNXD) {
            price = listing.priceInNXD;
            require(nxdToken.transferFrom(msg.sender, listing.seller, price), "NXD payment failed");
        } else {
            price = listing.priceInETH;
            require(msg.value >= price, "Insufficient payment");
            payable(listing.seller).transfer(price);
        }

        // Transfer domain
        _transfer(listing.seller, msg.sender, _tokenId);
        
        // Update user domains
        _removeFromUserDomains(listing.seller, _tokenId);
        userDomains[msg.sender].push(_tokenId);

        // Remove listing
        delete marketplace[_tokenId];

        emit DomainSold(_tokenId, listing.seller, msg.sender, price, _payWithNXD);
    }

    /**
     * @dev Set domain record
     */
    function setRecord(uint256 _tokenId, string memory _key, string memory _value) external {
        require(ownerOf(_tokenId) == msg.sender || hasRole(RESOLVER_ROLE, msg.sender), "Not authorized");
        domains[_tokenId].records[_key] = _value;
        emit RecordUpdated(_tokenId, _key, _value);
    }

    /**
     * @dev Get domain record
     */
    function getRecord(uint256 _tokenId, string memory _key) external view returns (string memory) {
        return domains[_tokenId].records[_key];
    }

    /**
     * @dev Renew domain
     */
    function renewDomain(uint256 _tokenId, bool _payWithNXD) external payable {
        require(ownerOf(_tokenId) == msg.sender, "Not domain owner");
        
        Domain storage domain = domains[_tokenId];
        TLD memory tld = tlds[domain.tld];
        
        if (_payWithNXD) {
            uint256 nxdPrice = _convertETHToNXD(tld.registrationFee);
            require(nxdToken.transferFrom(msg.sender, address(this), nxdPrice), "NXD payment failed");
        } else {
            require(msg.value >= tld.registrationFee, "Insufficient payment");
        }

        domain.expiresAt += 365 days;
    }

    /**
     * @dev Check if domain is available
     */
    function isDomainAvailable(string memory _name, string memory _tld) external view returns (bool) {
        string memory fullDomain = string(abi.encodePacked(_name, ".", _tld));
        return domainToTokenId[fullDomain] == 0 && tlds[_tld].isActive;
    }

    /**
     * @dev Get domain info
     */
    function getDomainInfo(uint256 _tokenId) external view returns (
        string memory name,
        string memory tld,
        string memory ipfsHash,
        address owner,
        uint256 registeredAt,
        uint256 expiresAt,
        bool isPremium
    ) {
        Domain storage domain = domains[_tokenId];
        return (
            domain.name,
            domain.tld,
            domain.ipfsHash,
            ownerOf(_tokenId),
            domain.registeredAt,
            domain.expiresAt,
            domain.isPremium
        );
    }

    /**
     * @dev Get user domains
     */
    function getUserDomains(address _user) external view returns (uint256[] memory) {
        return userDomains[_user];
    }

    /**
     * @dev Get TLD info
     */
    function getTLDInfo(string memory _tld) external view returns (
        address owner,
        uint256 registrationFee,
        uint256 totalDomains,
        bool isActive
    ) {
        TLD memory tld = tlds[_tld];
        return (tld.owner, tld.registrationFee, tld.totalDomains, tld.isActive);
    }

    /**
     * @dev Convert ETH to NXD price (simplified)
     */
    function _convertETHToNXD(uint256 _ethAmount) internal pure returns (uint256) {
        // Simplified conversion: 1 ETH = 1000 NXD
        return _ethAmount * 1000;
    }

    /**
     * @dev Remove token from user domains array
     */
    function _removeFromUserDomains(address _user, uint256 _tokenId) internal {
        uint256[] storage userTokens = userDomains[_user];
        for (uint256 i = 0; i < userTokens.length; i++) {
            if (userTokens[i] == _tokenId) {
                userTokens[i] = userTokens[userTokens.length - 1];
                userTokens.pop();
                break;
            }
        }
    }

    /**
     * @dev Admin functions
     */
    function pauseContract() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    function unpauseContract() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }

    function updateTLD(
        string memory _tld,
        uint256 _registrationFee,
        bool _isActive
    ) external onlyRole(ADMIN_ROLE) {
        tlds[_tld].registrationFee = _registrationFee;
        tlds[_tld].isActive = _isActive;
    }

    // Required override
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721URIStorage, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}