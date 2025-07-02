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
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API with comprehensive route structure
- **Database**: PostgreSQL with Drizzle ORM
- **Session Management**: Express sessions with PostgreSQL store
- **Development**: Hot module replacement with Vite integration

### Database Design
- **ORM**: Drizzle ORM with type-safe queries
- **Database**: PostgreSQL (configured for Neon serverless)
- **Schema**: Comprehensive domain management with user authentication, staking, governance, and marketplace features

## Key Components

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
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```