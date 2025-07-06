# NXD Platform - Required API Secrets Configuration

## Overview
This document lists all the API secrets needed to configure in Replit Secrets panel for full NXD Platform functionality.

## 🔐 Required API Secrets

### 1. AI Services (AgentKit Integration)
```
XAI_API_KEY=your_xai_grok_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_claude_api_key_here
DEEPSEEK_API_KEY=your_deepseek_api_key_here
POE_API_KEY=your_poe_api_key_here
```

### 2. Blockchain Infrastructure
```
ETHEREUM_RPC_URL=your_ethereum_mainnet_rpc_url
POLYGON_RPC_URL=your_polygon_rpc_url
ARBITRUM_RPC_URL=your_arbitrum_rpc_url
PRIVATE_KEY=your_deployer_private_key
ETHERSCAN_API_KEY=your_etherscan_api_key
POLYGONSCAN_API_KEY=your_polygonscan_api_key
```

### 3. Paymaster System
```
PAYMASTER_PRIVATE_KEY=your_paymaster_private_key
GELATO_API_KEY=your_gelato_relay_api_key
BICONOMY_API_KEY=your_biconomy_paymaster_api_key
```

### 4. AggLayer & Cross-Chain
```
POLYGON_AGGLAYER_RPC=your_polygon_agglayer_rpc_url
LAYERZERO_API_KEY=your_layerzero_api_key
HYPERLANE_API_KEY=your_hyperlane_api_key
```

### 5. Database & Storage
```
DATABASE_URL=your_postgresql_connection_string
REDIS_URL=your_redis_connection_string
IPFS_API_KEY=your_ipfs_pinata_api_key
IPFS_SECRET_KEY=your_ipfs_pinata_secret_key
```

### 6. External Services
```
COINGECKO_API_KEY=your_coingecko_pro_api_key
COINMARKETCAP_API_KEY=your_coinmarketcap_api_key
DUNE_API_KEY=your_dune_analytics_api_key
MORALIS_API_KEY=your_moralis_web3_api_key
```

### 7. Communication & Messaging
```
WAKU_API_KEY=your_waku_network_api_key
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number
```

### 8. Security & Authentication
```
JWT_SECRET=your_jwt_secret_key_256_bit
ADMIN_PASSWORD_HASH=your_bcrypt_hashed_admin_password
SESSION_SECRET=your_session_secret_key
```

### 9. Monitoring & Analytics
```
PROMETHEUS_API_KEY=your_prometheus_api_key
GRAFANA_API_KEY=your_grafana_api_key
SENTRY_DSN=your_sentry_error_tracking_dsn
```

### 10. Development & Testing
```
NODE_ENV=production
PORT=5000
VITE_API_URL=your_production_api_url
```

## 🚀 Setup Instructions

### Step 1: Access Replit Secrets
1. Go to your Replit project
2. Click on "Secrets" tab in the left sidebar
3. Click "Add Secret" button

### Step 2: Add Each Secret
For each secret listed above:
1. Enter the secret name (left field)
2. Enter the secret value (right field)
3. Click "Add Secret"

### Step 3: Priority Secrets (Essential for basic functionality)
Start with these if you don't have all secrets yet:
```
DATABASE_URL=your_postgresql_url
XAI_API_KEY=your_xai_grok_key
OPENAI_API_KEY=your_openai_key
ETHEREUM_RPC_URL=your_ethereum_rpc
JWT_SECRET=your_jwt_secret
```

### Step 4: Verify Integration
1. Restart your Replit application
2. Check the Admin Panel > AgentKit tab for AI service status
3. Check the Admin Panel > Paymaster tab for gas sponsorship status
4. Check the Admin Panel > AggLayer tab for cross-chain connectivity

## 📋 Secret Sources & How to Obtain

### AI Services
- **xAI Grok**: https://x.ai/api (Elon Musk's xAI platform)
- **OpenAI**: https://platform.openai.com/api-keys
- **Anthropic**: https://console.anthropic.com/
- **DeepSeek**: https://platform.deepseek.com/

### Blockchain
- **Alchemy**: https://dashboard.alchemy.com/ (Ethereum/Polygon RPC)
- **Infura**: https://infura.io/ (Alternative RPC provider)
- **QuickNode**: https://quicknode.com/ (Premium RPC)

### Paymaster
- **Gelato**: https://app.gelato.network/
- **Biconomy**: https://dashboard.biconomy.io/

### Database
- **Neon**: https://neon.tech/ (Serverless PostgreSQL)
- **Railway**: https://railway.app/ (Alternative PostgreSQL)
- **Upstash**: https://upstash.com/ (Redis)

## 🔒 Security Best Practices

1. **Never commit secrets to code**
2. **Use different keys for development/production**
3. **Rotate keys regularly**
4. **Monitor API usage and spending**
5. **Set spending limits on paid APIs**

## 🎯 Current Integration Status

✅ **AgentKit**: Multi-provider AI system with autonomous operations
✅ **Paymaster**: NXD token gas sponsorship system  
✅ **AggLayer**: Polygon cross-chain domain management
✅ **Token Studio**: Claude 4 enhanced 3D token generator
✅ **Admin Panel**: Comprehensive management interface

## 📞 Support

If you need help obtaining any of these API keys or configuring the secrets:
1. Check the official documentation for each service
2. Many services offer free tiers for development
3. Contact NXD Platform support for enterprise configurations