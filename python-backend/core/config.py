"""
NXD Platform Configuration
"""
import os
from typing import Optional
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    """Application settings"""
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://user:password@localhost:5432/nxd")
    
    # Redis
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379")
    
    # API Keys
    OPENAI_API_KEY: Optional[str] = os.getenv("OPENAI_API_KEY")
    ANTHROPIC_API_KEY: Optional[str] = os.getenv("ANTHROPIC_API_KEY")
    XAI_API_KEY: Optional[str] = os.getenv("XAI_API_KEY")
    DEEPSEEK_API_KEY: Optional[str] = os.getenv("DEEPSEEK_API_KEY")
    POE_API_KEY: Optional[str] = os.getenv("POE_API_KEY")
    
    # Blockchain
    ETHEREUM_RPC_URL: str = os.getenv("ETHEREUM_RPC_URL", "https://eth-mainnet.g.alchemy.com/v2/your-api-key")
    POLYGON_RPC_URL: str = os.getenv("POLYGON_RPC_URL", "https://polygon-mainnet.g.alchemy.com/v2/your-api-key")
    BASE_RPC_URL: str = os.getenv("BASE_RPC_URL", "https://base-mainnet.g.alchemy.com/v2/your-api-key")
    PRIVATE_KEY: Optional[str] = os.getenv("PRIVATE_KEY")
    
    # Smart Contract Addresses
    NXD_TOKEN_ADDRESS: str = os.getenv("NXD_TOKEN_ADDRESS", "0x...")
    NXD_DOMAIN_REGISTRY_ADDRESS: str = os.getenv("NXD_DOMAIN_REGISTRY_ADDRESS", "0x...")
    NXD_DAO_ADDRESS: str = os.getenv("NXD_DAO_ADDRESS", "0x...")
    NXD_REVENUE_SPLITTER_ADDRESS: str = os.getenv("NXD_REVENUE_SPLITTER_ADDRESS", "0x...")
    NXD_PAYMASTER_ADDRESS: str = os.getenv("NXD_PAYMASTER_ADDRESS", "0x...")
    NXD_WHITE_LABEL_LICENSE_ADDRESS: str = os.getenv("NXD_WHITE_LABEL_LICENSE_ADDRESS", "0x...")
    NXD_AI_CREDITS_ADDRESS: str = os.getenv("NXD_AI_CREDITS_ADDRESS", "0x...")
    
    # IPFS
    IPFS_GATEWAY_URL: str = os.getenv("IPFS_GATEWAY_URL", "https://ipfs.io/ipfs/")
    IPFS_API_URL: str = os.getenv("IPFS_API_URL", "http://localhost:5001")
    IPFS_CLUSTER_API_URL: str = os.getenv("IPFS_CLUSTER_API_URL", "http://localhost:9094")
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-here")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Communication Services
    WAKU_NODE_URL: str = os.getenv("WAKU_NODE_URL", "wss://node-01.ac-cn-hongkong-c.wakuv2.test.statusim.net/")
    WEBRTC_STUN_SERVERS: str = os.getenv("WEBRTC_STUN_SERVERS", "stun:stun.l.google.com:19302")
    
    # Tax and Compliance
    FLORIDA_CST_RATE: float = 0.0572  # 5.72%
    IRS_API_URL: Optional[str] = os.getenv("IRS_API_URL")
    
    # Satellite Services
    SATELLITE_API_URL: Optional[str] = os.getenv("SATELLITE_API_URL")
    SATELLITE_API_KEY: Optional[str] = os.getenv("SATELLITE_API_KEY")
    
    # IoT Services
    MQTT_BROKER_URL: str = os.getenv("MQTT_BROKER_URL", "mqtt://localhost:1883")
    MQTT_USERNAME: Optional[str] = os.getenv("MQTT_USERNAME")
    MQTT_PASSWORD: Optional[str] = os.getenv("MQTT_PASSWORD")
    
    # Monitoring
    PROMETHEUS_PORT: int = int(os.getenv("PROMETHEUS_PORT", "9090"))
    GRAFANA_URL: str = os.getenv("GRAFANA_URL", "http://localhost:3000")
    
    # Environment
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    DEBUG: bool = os.getenv("DEBUG", "true").lower() == "true"
    
    class Config:
        env_file = ".env"

# Global settings instance
settings = Settings()