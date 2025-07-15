
# Sub2Leads CRM - Real Estate Lead Management System

A full-stack web application for managing real estate leads, property data scraping, and automated outreach campaigns.

## Features

- **Property Data Scraping**: Automated scraping of foreclosure and delinquent property data
- **Lead Management**: Kanban-style lead pipeline with drag-and-drop functionality
- **Contact Enrichment**: Enhanced contact information with scoring
- **Email Campaigns**: Automated outreach with SendGrid integration
- **AI-Powered**: OpenAI integration for content generation and analysis
- **PDF Generation**: Automated property presentation binders
- **Real-time Updates**: WebSocket connections for live data updates

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Build Tool**: Vite
- **Authentication**: Replit Auth with session management
- **State Management**: TanStack Query

## Deployment Options

### Option 1: Replit Deployment (Recommended)

This project is optimized for Replit deployment and includes all necessary configuration.

#### Steps:
1. Your project is already configured for Replit
2. Click the "Deploy" button in the top-right corner
3. Select "Autoscale Deployment" for dynamic scaling
4. Configure environment variables in the Secrets tab
5. Deploy with the existing build and run commands

#### Database Setup for Replit:
1. Go to the Database tab in your Repl
2. Create a new PostgreSQL database
3. The `DATABASE_URL` will be automatically added to your environment
4. Run `npm run db:push` to apply migrations

### Option 2: Vercel Deployment

If you prefer Vercel, follow these steps:

#### Prerequisites:
- Vercel account
- PostgreSQL database (recommend Neon, Supabase, or PlanetScale)

#### Database Setup:
1. **Create a PostgreSQL database**:
   - **Neon** (Recommended): Go to [neon.tech](https://neon.tech)
   - **Supabase**: Go to [supabase.com](https://supabase.com)
   - **PlanetScale**: Go to [planetscale.com](https://planetscale.com)

2. **Get your connection string**:
   ```
   postgresql://username:password@host:port/database
   ```

3. **Set up environment variables** in Vercel dashboard:
   ```
   DATABASE_URL=your_postgresql_connection_string
   SESSION_SECRET=your_session_secret_key
   SENDGRID_API_KEY=your_sendgrid_api_key
   OPENAI_API_KEY=your_openai_api_key
   ```

#### Deployment Steps:
1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Build the project**:
   ```bash
   npm run build
   ```

3. **Deploy to Vercel**:
   ```bash
   vercel --prod
   ```

4. **Run database migrations**:
   ```bash
   npm run db:push
   ```

#### Vercel Configuration:
The project includes a `vercel.json` configuration file that:
- Builds the React frontend as static files
- Deploys the Express backend as serverless functions
- Routes API calls to `/api/*` and serves static files for everything else

## Environment Variables

Create a `.env` file (or configure in your deployment platform):

```env
# Database
DATABASE_URL=postgresql://username:password@host:port/database

# Authentication
SESSION_SECRET=your-super-secret-session-key

# Email Service
SENDGRID_API_KEY=your-sendgrid-api-key

# AI Service
OPENAI_API_KEY=your-openai-api-key

# Application
NODE_ENV=production
```

## Local Development

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   Copy `.env.example` to `.env` and fill in your values

3. **Set up database**:
   ```bash
   npm run db:push
   ```

4. **Start development server**:
   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:5000`

## Database Schema

The application uses the following main tables:
- `users`: User profiles and authentication
- `properties`: Property records with status and location data
- `contacts`: Contact information with enrichment data
- `leads`: Lead management with pipeline tracking
- `outreachCampaigns`: Email campaign management
- `scrapingJobs`: Automated scraping job tracking
- `aiInteractions`: AI conversation logs
- `pdfBinders`: Generated document metadata

## API Endpoints

- `GET /api/properties` - List all properties
- `GET /api/leads` - List all leads
- `POST /api/scraping/start` - Start scraping job
- `POST /api/outreach/send` - Send outreach email
- `GET /api/ai/chat` - AI chat interface
- `POST /api/pdf/generate` - Generate PDF binder

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run check` - TypeScript type checking
- `npm run db:push` - Push database schema changes

## Support

For issues or questions:
1. Check the troubleshooting section in the docs
2. Review the API documentation
3. Contact support for deployment-specific issues

---

**Note**: While this project can be deployed on Vercel, it's optimized for Replit deployment where database setup, environment variables, and deployment are handled automatically.
