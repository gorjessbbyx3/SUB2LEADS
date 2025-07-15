# Hawaii Real Estate CRM - Replit Development Guide

## Overview

This is a full-stack web application designed to help real estate professionals in Hawaii identify distressed properties, enrich contact data with AI, and convert leads into deals. The system automatically scrapes public notices for tax delinquencies, foreclosures, and auctions, then uses AI to find contact information and generate outreach materials.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Library**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **State Management**: TanStack Query (React Query) for server state
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ESM modules
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **Authentication**: Custom Replit Auth integration with OpenID Connect
- **Session Management**: PostgreSQL-backed sessions using connect-pg-simple

### Key Components

#### Data Scraping Module
- **Purpose**: Automatically scrape Hawaii property notices from multiple sources
- **Sources**: 
  - Star Advertiser legal notices (foreclosures/auctions)
  - Hawaii tax delinquent lists (PDF parsing)
  - Honolulu court records
- **Implementation**: Selenium for dynamic content, BeautifulSoup for static parsing
- **Scheduling**: Node-cron for automated daily/weekly scraping jobs

#### AI Integration
- **Provider**: OpenAI GPT-4o for natural language processing
- **Use Cases**:
  - Contact enrichment and lead scoring
  - Property analysis and investment summaries
  - Automated outreach email generation
  - Interactive chatbot for user assistance
- **Context-Aware**: AI responses are tailored based on property and contact data

#### Contact Enrichment Service
- **Goal**: Find contact details for property owners using AI and public data
- **Process**: Name + address → email, phone, social media profiles
- **Scoring**: Contact completeness scoring (0-100%) based on available data
- **Status Tracking**: pending, completed, failed states

#### PDF Generation Service
- **Purpose**: Create professional property binders for presentations
- **Content**: Property details, market analysis, contact info, maps, AI summaries
- **Technology**: PDFKit for programmatic PDF creation
- **Output**: Downloadable presentation-ready documents

#### Email Outreach System
- **Provider**: SendGrid for reliable email delivery
- **Features**: AI-generated personalized templates, tracking, automation
- **Integration**: Connected to lead management pipeline

#### Map Integration
- **Provider**: OpenStreetMap (no API key required)
- **Features**: Property geocoding, static map generation, street view integration
- **Implementation**: Nominatim for geocoding, static map services for imagery

### Data Flow

1. **Scraping Phase**: Automated scrapers collect property data from public sources
2. **Enrichment Phase**: AI services enhance property data and find contact information
3. **Lead Generation**: Enriched data becomes leads in the CRM pipeline
4. **Outreach Phase**: AI generates personalized outreach content
5. **Management Phase**: Users track leads through Kanban-style interface

### External Dependencies

#### Required Services
- **Database**: Neon PostgreSQL (configured via DATABASE_URL)
- **Authentication**: Replit Auth (REPL_ID, SESSION_SECRET required)
- **AI**: OpenAI API (OPENAI_API_KEY optional, fallback provided)
- **Email**: SendGrid (SENDGRID_API_KEY optional)

#### Optional Integrations
- **Maps**: OpenStreetMap (free, no API key needed)
- **Contact APIs**: PeopleDataLabs, FullContact (for enhanced contact enrichment)

### Database Schema

#### Core Tables
- **users**: User profiles for Replit Auth integration
- **properties**: Property records with status, priority, location data
- **contacts**: Contact information with enrichment status and scoring
- **leads**: Lead management with pipeline status tracking
- **outreachCampaigns**: Email campaign management
- **scrapingJobs**: Track automated scraping job status
- **aiInteractions**: Log AI chat conversations and generations
- **pdfBinders**: Generated PDF document metadata

#### Key Relationships
- Properties → Contacts (many-to-many through leads)
- Leads track the relationship between properties and contacts
- Outreach campaigns link to specific leads for tracking

### Deployment Strategy

#### Development
- Uses Vite dev server with Express backend
- Hot module replacement for frontend changes
- TypeScript compilation with strict type checking
- Database migrations via Drizzle Kit

#### Production Build
- Frontend: Vite builds optimized static assets
- Backend: esbuild bundles Node.js server with external packages
- Database: PostgreSQL with connection pooling via Neon
- Deployment: Single process serving both API and static files

#### Environment Variables
```
DATABASE_URL=postgresql://... (required)
REPL_ID=... (required for auth)
SESSION_SECRET=... (required for sessions)
OPENAI_API_KEY=... (optional, has fallback)
SENDGRID_API_KEY=... (optional)
FROM_EMAIL=... (optional, defaults provided)
```

#### Scheduled Tasks
- Daily Star Advertiser scraping (6 AM)
- Weekly tax delinquent scraping (Monday 7 AM)
- Contact enrichment every 4 hours
- Property priority updates daily (5 AM)

### Security Considerations
- All routes protected by Replit Auth middleware
- Database queries use parameterized statements via Drizzle ORM
- Session data encrypted and stored in PostgreSQL
- CORS properly configured for Replit environment
- Input validation using Zod schemas

### Performance Optimizations
- TanStack Query for intelligent caching and background updates
- Lazy loading of components and routes
- Optimized bundle splitting via Vite
- Database connection pooling
- Background job processing for scraping and enrichment