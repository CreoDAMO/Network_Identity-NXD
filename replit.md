# NXD Platform - Web3 Domain Management System

## Overview

NXD is a comprehensive Web3 domain management platform that combines decentralized domain registration, staking rewards, DAO governance, and AI-powered assistance. The platform enables users to discover, register, and manage Web3 domains while earning rewards through staking and participating in decentralized governance.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: Zustand for global state management
- **UI Framework**: Custom glassmorphism components with Radix UI primitives
- **Styling**: Tailwind CSS with custom cosmic-themed design system
- **Data Fetching**: TanStack Query (React Query) for server state management

### Backend Architecture
- **Primary Backend**: Python FastAPI with comprehensive AI integration and microservices
- **Secondary Backend**: Node.js with Express.js server (existing frontend integration)
- **Language**: TypeScript with ES modules + Python 3.11 with async/await
- **Performance Layer**: Rust components for domain scoring and crypto operations
- **API Design**: RESTful API with comprehensive route structure
- **Database**: PostgreSQL with Drizzle ORM and SQLAlchemy (dual support)
- **Session Management**: Express sessions with PostgreSQL store
- **Development**: Hot module replacement with Vite integration
- **Message Queue**: Redis with Celery for background tasks
- **Communication**: Waku network for Web3 messaging, WebRTC for voice calls
- **Storage**: IPFS cluster with 3+ nodes for decentralized content storage
- **Monitoring**: Prometheus metrics collection with Grafana dashboards
- **Deployment**: Docker Compose orchestration with health checks

### Database Design
- **ORM**: Drizzle ORM with type-safe queries
- **Database**: PostgreSQL (configured for Neon serverless)
- **Schema**: Comprehensive domain management with user authentication, staking, governance, and marketplace features

## Key Components

### Advanced Smart Contracts (New)
- **NXDAICredits.sol**: AI credits system with subscription tiers and NXD token integration
- **NXDPaymaster.sol**: Gas sponsorship system allowing NXD-to-ETH gas payment conversion
- **NXDRevenueSplitter.sol**: Automatic revenue distribution (20% founder, 50% LPs, 30% DAO)
- **NXDWhiteLabelLicense.sol**: NFT-based white-label licensing with API usage tracking

### Python FastAPI Backend Services (New)
- **AI Gateway**: Multi-provider AI service (xAI Grok, OpenAI, Anthropic, DeepSeek, Poe) with autonomous operations
- **IPFS Service**: Decentralized storage with cluster management and content verification
- **Domain Service**: Advanced domain scoring, suggestion generation, and market analysis
- **Communication Service**: Waku messaging, WebRTC voice calls, and file transfer via IPFS
- **Satellite Service**: Mock satellite communication for remote connectivity and telemetry
- **IoT Service**: MQTT broker integration for device management and data processing

### Rust Performance Components (New)
- **Domain Scorer**: High-performance domain scoring with phonetic analysis and pattern recognition
- **Crypto Operations**: Performance-critical cryptographic operations and domain validation

### Infrastructure Services (New)
- **Docker Compose**: Complete multi-service orchestration with health checks and monitoring
- **IPFS Cluster**: 3-node IPFS cluster with redundant storage and cluster management
- **Monitoring Stack**: Prometheus metrics collection with Grafana visualization dashboards
- **Message Queue**: Redis with Celery for background task processing
- **MQTT Broker**: Eclipse Mosquitto for IoT device communication
- **Waku Network**: Web3 messaging infrastructure for decentralized communication

### Domain Management System
- **Domain Registration**: Support for multiple TLDs with premium domain handling
- **Domain Search**: Real-time availability checking with AI-powered suggestions
- **Ownership Tracking**: Complete domain lifecycle management with expiration handling
- **IPFS Integration**: Decentralized content storage support

### Staking System
- **NXD Token Staking**: Multi-tier staking with dynamic APY calculations
- **Reward Distribution**: Automated reward calculations based on staking duration and amount
- **Staking Positions**: Individual position tracking with compound interest
- **Statistics Tracking**: Real-time staking metrics and pool utilization

### DAO Governance
- **Proposal System**: Community-driven proposal creation and management
- **Voting Mechanism**: Weighted voting based on staking power
- **Execution Framework**: Automated proposal execution upon successful votes
- **Participation Tracking**: User voting history and governance analytics

### Marketplace
- **Domain Trading**: Peer-to-peer domain marketplace with multiple payment options
- **Price Discovery**: Dynamic pricing with ETH and NXD payment support
- **Listing Management**: Seller tools for domain portfolio management
- **Transaction Processing**: Secure blockchain transaction handling

### AI Assistant (Grok Integration)
- **Domain Suggestions**: AI-powered domain name generation based on user queries
- **Market Analysis**: Intelligent insights on domain values and trends
- **Platform Navigation**: Contextual help and guidance
- **Chat Interface**: Real-time conversational AI assistance

## Data Flow

### User Authentication
1. User registration/login through REST API
2. Session creation with PostgreSQL persistence
3. JWT-like session management with secure cookies
4. Frontend state synchronization via Zustand store

### Domain Operations
1. Search query triggers availability check
2. AI service generates contextual suggestions
3. Registration process initiates blockchain transaction
4. Database updates reflect ownership changes
5. Frontend updates through React Query invalidation

### Staking Workflow
1. User initiates staking transaction
2. Blockchain service processes the stake
3. Database records staking position
4. Reward calculations run periodically
5. Frontend displays real-time staking metrics

### Governance Process
1. Proposal creation with validation
2. Community voting with weighted calculations
3. Automatic execution upon threshold achievement
4. Blockchain integration for transparency
5. Historical tracking and analytics

## External Dependencies

### AI Services
- **Provider**: X.AI (Grok) API integration
- **Purpose**: Domain name generation and conversational assistance
- **Fallback**: Graceful degradation with mock responses

### Blockchain Infrastructure
- **Mock Service**: Simulated blockchain interactions for development
- **Transaction Handling**: Ethereum-compatible transaction processing
- **Wallet Integration**: MetaMask and wallet connection support

### Database Services
- **Neon PostgreSQL**: Serverless PostgreSQL hosting
- **Connection Pooling**: Optimized database connections
- **Migration Management**: Drizzle-kit for schema migrations

### UI Libraries
- **Radix UI**: Accessible component primitives
- **Lucide Icons**: Consistent iconography
- **Embla Carousel**: Touch-friendly carousels
- **React Hook Form**: Form validation and management

## Deployment Strategy

### Development Environment
- **Hot Reload**: Vite dev server with HMR
- **API Proxy**: Seamless frontend-backend integration
- **Database**: Local PostgreSQL or Neon development database
- **Environment Variables**: Secure configuration management

### Production Build
- **Frontend**: Static asset generation with Vite
- **Backend**: ESBuild compilation for Node.js
- **Asset Optimization**: Automatic code splitting and minification
- **Docker Support**: Containerized deployment ready

### Environment Configuration
- **Database URL**: PostgreSQL connection string
- **AI API Keys**: X.AI service authentication
- **Session Secrets**: Secure session management
- **Port Configuration**: Flexible port assignment

## Changelog

```
Changelog:
- July 02, 2025. Initial setup
- July 04, 2025. Major infrastructure expansion - Added comprehensive Python FastAPI backend with AI gateway, IPFS service, domain service, communication service, satellite service, Rust components for performance-critical operations, advanced smart contracts (NXDAICredits, NXDPaymaster, NXDRevenueSplitter), Docker Compose infrastructure with full service orchestration, MQTT for IoT, Waku for Web3 communication, IPFS cluster, monitoring stack (Prometheus/Grafana), and complete CI/CD pipeline
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```