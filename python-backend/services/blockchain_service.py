"""
Blockchain Service
Handles smart contract interactions and blockchain operations
"""
import asyncio
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from datetime import datetime
import httpx
import structlog
from web3 import Web3
from eth_account import Account

from core.config import settings

logger = structlog.get_logger()

@dataclass
class RegistrationResult:
    """Result of domain registration transaction"""
    tx_hash: str
    owner: str
    domain: str
    gas_used: Optional[int] = None
    block_number: Optional[int] = None

@dataclass
class ContractInfo:
    """Smart contract information"""
    address: str
    abi: List[Dict]
    network: str

class BlockchainService:
    """
    Blockchain service for smart contract interactions
    """
    
    def __init__(self):
        # Initialize Web3 connections
        self.ethereum_w3 = Web3(Web3.HTTPProvider(settings.ETHEREUM_RPC_URL))
        self.polygon_w3 = Web3(Web3.HTTPProvider(settings.POLYGON_RPC_URL))
        self.base_w3 = Web3(Web3.HTTPProvider(settings.BASE_RPC_URL))
        
        # Contract configurations
        self.contracts = {
            "nxd_token": ContractInfo(
                address=settings.NXD_TOKEN_ADDRESS,
                abi=self._load_contract_abi("NXDToken"),
                network="ethereum"
            ),
            "domain_registry": ContractInfo(
                address=settings.NXD_DOMAIN_REGISTRY_ADDRESS,
                abi=self._load_contract_abi("NXDomainRegistry"),
                network="ethereum"
            ),
            "dao": ContractInfo(
                address=settings.NXD_DAO_ADDRESS,
                abi=self._load_contract_abi("NXDDAO"),
                network="ethereum"
            ),
            "revenue_splitter": ContractInfo(
                address=settings.NXD_REVENUE_SPLITTER_ADDRESS,
                abi=self._load_contract_abi("NXDRevenueSplitter"),
                network="ethereum"
            ),
            "paymaster": ContractInfo(
                address=settings.NXD_PAYMASTER_ADDRESS,
                abi=self._load_contract_abi("NXDPaymaster"),
                network="ethereum"
            ),
            "white_label": ContractInfo(
                address=settings.NXD_WHITE_LABEL_LICENSE_ADDRESS,
                abi=self._load_contract_abi("NXDWhiteLabelLicense"),
                network="ethereum"
            ),
            "ai_credits": ContractInfo(
                address=settings.NXD_AI_CREDITS_ADDRESS,
                abi=self._load_contract_abi("NXDAICredits"),
                network="ethereum"
            )
        }
        
        # Account setup
        if settings.PRIVATE_KEY:
            self.account = Account.from_key(settings.PRIVATE_KEY)
        else:
            logger.warning("No private key configured for blockchain operations")
            self.account = None

    def _load_contract_abi(self, contract_name: str) -> List[Dict]:
        """Load contract ABI from file"""
        try:
            # In production, load from compiled contract artifacts
            # For now, return minimal ABI for basic operations
            return [
                {
                    "type": "function",
                    "name": "transfer",
                    "inputs": [
                        {"name": "to", "type": "address"},
                        {"name": "amount", "type": "uint256"}
                    ]
                }
            ]
        except Exception as e:
            logger.warning(f"Could not load ABI for {contract_name}: {e}")
            return []

    def _get_web3_client(self, network: str) -> Web3:
        """Get Web3 client for specific network"""
        clients = {
            "ethereum": self.ethereum_w3,
            "polygon": self.polygon_w3,
            "base": self.base_w3
        }
        return clients.get(network, self.ethereum_w3)

    async def register_domain(
        self,
        name: str,
        tld: str,
        duration: int,
        payment_token: str = "ETH",
        ipfs_content: Optional[str] = None
    ) -> RegistrationResult:
        """
        Register a domain through smart contract
        """
        try:
            w3 = self._get_web3_client("ethereum")
            contract_info = self.contracts["domain_registry"]
            
            if not self.account:
                raise Exception("No account configured for transactions")
            
            # Get contract instance
            contract = w3.eth.contract(
                address=contract_info.address,
                abi=contract_info.abi
            )
            
            # Calculate registration fee
            registration_fee = await self._calculate_registration_fee(name, tld, duration)
            
            # Build transaction
            full_domain = f"{name}.{tld}"
            tx_data = {
                'from': self.account.address,
                'value': registration_fee if payment_token == "ETH" else 0,
                'gas': 300000,
                'gasPrice': w3.eth.gas_price,
                'nonce': w3.eth.get_transaction_count(self.account.address)
            }
            
            # For demonstration, create a mock transaction
            # In production, this would call the actual contract method
            mock_tx_hash = f"0x{''.join([f'{i:02x}' for i in range(32)])}"
            
            logger.info(
                "Domain registration initiated",
                domain=full_domain,
                tx_hash=mock_tx_hash,
                fee=registration_fee
            )
            
            return RegistrationResult(
                tx_hash=mock_tx_hash,
                owner=self.account.address,
                domain=full_domain,
                gas_used=250000
            )
            
        except Exception as e:
            logger.error("Domain registration failed", error=str(e))
            raise

    async def _calculate_registration_fee(
        self,
        name: str,
        tld: str,
        duration: int
    ) -> int:
        """Calculate domain registration fee"""
        base_fee = Web3.to_wei(0.01, 'ether')  # Base fee in wei
        length_multiplier = max(1, 5 - len(name)) if len(name) < 5 else 1
        duration_fee = base_fee * duration
        
        return int(duration_fee * length_multiplier)

    async def get_domain_info(self, domain: str) -> Dict[str, Any]:
        """Get domain information from blockchain"""
        try:
            # Mock domain info for demonstration
            return {
                "domain": domain,
                "owner": "0x1234567890123456789012345678901234567890",
                "registered_at": int(datetime.now().timestamp()),
                "expires_at": int(datetime.now().timestamp()) + (365 * 24 * 60 * 60),
                "ipfs_hash": None,
                "is_premium": len(domain.split(".")[0]) <= 3
            }
            
        except Exception as e:
            logger.error("Failed to get domain info", domain=domain, error=str(e))
            raise

    async def stake_nxd(self, user_address: str, amount: int, duration: int) -> str:
        """Stake NXD tokens"""
        try:
            if not self.account:
                raise Exception("No account configured")
            
            # Mock staking transaction
            mock_tx_hash = f"0x{'stake':<60}"
            
            logger.info(
                "NXD staking initiated",
                user=user_address,
                amount=amount,
                duration=duration,
                tx_hash=mock_tx_hash
            )
            
            return mock_tx_hash
            
        except Exception as e:
            logger.error("Staking failed", error=str(e))
            raise

    async def unstake_nxd(self, user_address: str, stake_id: int) -> str:
        """Unstake NXD tokens"""
        try:
            if not self.account:
                raise Exception("No account configured")
            
            # Mock unstaking transaction
            mock_tx_hash = f"0x{'unstake':<58}"
            
            logger.info(
                "NXD unstaking initiated",
                user=user_address,
                stake_id=stake_id,
                tx_hash=mock_tx_hash
            )
            
            return mock_tx_hash
            
        except Exception as e:
            logger.error("Unstaking failed", error=str(e))
            raise

    async def create_governance_proposal(
        self,
        proposer: str,
        title: str,
        description: str,
        actions: List[Dict]
    ) -> str:
        """Create a governance proposal"""
        try:
            if not self.account:
                raise Exception("No account configured")
            
            # Mock proposal creation
            mock_tx_hash = f"0x{'proposal':<57}"
            
            logger.info(
                "Governance proposal created",
                proposer=proposer,
                title=title,
                tx_hash=mock_tx_hash
            )
            
            return mock_tx_hash
            
        except Exception as e:
            logger.error("Proposal creation failed", error=str(e))
            raise

    async def vote_on_proposal(
        self,
        voter: str,
        proposal_id: int,
        support: bool,
        voting_power: int
    ) -> str:
        """Vote on a governance proposal"""
        try:
            if not self.account:
                raise Exception("No account configured")
            
            # Mock voting transaction
            mock_tx_hash = f"0x{'vote':<60}"
            
            logger.info(
                "Vote cast on proposal",
                voter=voter,
                proposal_id=proposal_id,
                support=support,
                voting_power=voting_power,
                tx_hash=mock_tx_hash
            )
            
            return mock_tx_hash
            
        except Exception as e:
            logger.error("Voting failed", error=str(e))
            raise

    async def get_staking_info(self, user_address: str) -> Dict[str, Any]:
        """Get user's staking information"""
        try:
            # Mock staking info
            return {
                "total_staked": "1000000000000000000000",  # 1000 NXD
                "rewards_earned": "50000000000000000000",   # 50 NXD
                "staking_positions": [
                    {
                        "id": 1,
                        "amount": "500000000000000000000",  # 500 NXD
                        "start_time": int(datetime.now().timestamp()) - (30 * 24 * 60 * 60),
                        "duration": 90,  # 90 days
                        "apy": "18.5"
                    },
                    {
                        "id": 2,
                        "amount": "500000000000000000000",  # 500 NXD
                        "start_time": int(datetime.now().timestamp()) - (15 * 24 * 60 * 60),
                        "duration": 180,  # 180 days
                        "apy": "22.0"
                    }
                ]
            }
            
        except Exception as e:
            logger.error("Failed to get staking info", user=user_address, error=str(e))
            raise

    async def get_network_status(self) -> Dict[str, Any]:
        """Get blockchain network status"""
        try:
            ethereum_connected = self.ethereum_w3.is_connected()
            polygon_connected = self.polygon_w3.is_connected()
            base_connected = self.base_w3.is_connected()
            
            return {
                "ethereum": {
                    "connected": ethereum_connected,
                    "latest_block": self.ethereum_w3.eth.block_number if ethereum_connected else None,
                    "gas_price": str(self.ethereum_w3.eth.gas_price) if ethereum_connected else None
                },
                "polygon": {
                    "connected": polygon_connected,
                    "latest_block": self.polygon_w3.eth.block_number if polygon_connected else None,
                    "gas_price": str(self.polygon_w3.eth.gas_price) if polygon_connected else None
                },
                "base": {
                    "connected": base_connected,
                    "latest_block": self.base_w3.eth.block_number if base_connected else None,
                    "gas_price": str(self.base_w3.eth.gas_price) if base_connected else None
                }
            }
            
        except Exception as e:
            logger.error("Failed to get network status", error=str(e))
            return {
                "ethereum": {"connected": False},
                "polygon": {"connected": False},
                "base": {"connected": False}
            }