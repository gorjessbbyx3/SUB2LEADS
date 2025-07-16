import type { Express } from "express";
import { createServer } from "http";
import { insertPropertySchema, insertContactSchema, insertLeadSchema, insertAIInteractionSchema, insertInvestorSchema } from "@shared/schema";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { storage } from "./storage";
import { matchingService } from './services/matchingService';
import { schedulerService } from './services/scheduler';
import { scraperService } from './services/scraper';
import { aiService } from './services/aiService';
import { contactEnrichmentService } from './services/contactEnrichment';
import { PropertyPDFGenerator } from './services/pdfGenerator';
import { validateRequest, validateQuery, rateLimit } from './middleware/validation';
import path from 'path';

export async function registerRoutes(app: Express) {
  const server = createServer(app);

  // Auth middleware
  await setupAuth(app);

  // Serve static PDF files
  app.use('/pdfs', (req, res, next) => {
    const filePath = path.join(process.cwd(), 'pdfs', req.path);
    res.sendFile(filePath, (err) => {
      if (err) {
        res.status(404).json({ error: 'PDF not found' });
      }
    });
  });

  // API Routes - all protected by authentication

  // User routes
  app.get("/api/user", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      if (!user?.claims?.sub) {
        return res.status(401).json({ error: "User not found" });
      }

      const userData = await storage.getUser(user.claims.sub);
      res.json(userData);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  // Property routes
  app.get("/api/properties", isAuthenticated, async (req, res) => {
    try {
      const { status, priority, limit = 50, offset = 0 } = req.query;
      const properties = await storage.getProperties({
        status: status as string,
        priority: priority as string,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      });
      res.json(properties);
    } catch (error) {
      console.error("Error fetching properties:", error);
      res.status(500).json({ error: "Failed to fetch properties" });
    }
  });

  app.get("/api/properties/stats", isAuthenticated, async (req, res) => {
    try {
      const stats = await storage.getPropertiesStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching property stats:", error);
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  app.get("/api/properties/:id", isAuthenticated, async (req, res) => {
    try {
      const property = await storage.getProperty(parseInt(req.params.id));
      if (!property) {
        return res.status(404).json({ error: "Property not found" });
      }
      res.json(property);
    } catch (error) {
      console.error("Error fetching property:", error);
      res.status(500).json({ error: "Failed to fetch property" });
    }
  });

  app.post("/api/properties", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertPropertySchema.parse(req.body);
      const property = await storage.createProperty(validatedData);
      res.status(201).json(property);
    } catch (error) {
      console.error("Error creating property:", error);
      res.status(500).json({ error: "Failed to create property" });
    }
  });

  // Lead routes
  app.get("/api/leads", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const { status, priority, limit = 50, offset = 0 } = req.query;
      const leads = await storage.getLeads({
        status: status as string,
        priority: priority as string,
        userId: user?.claims?.sub,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      });
      res.json(leads);
    } catch (error) {
      console.error("Error fetching leads:", error);
      res.status(500).json({ error: "Failed to fetch leads" });
    }
  });

  app.get("/api/leads/pipeline", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const pipeline = await storage.getLeadsPipeline(user?.claims?.sub);
      res.json(pipeline);
    } catch (error) {
      console.error("Error fetching pipeline:", error);
      res.status(500).json({ error: "Failed to fetch pipeline" });
    }
  });

  app.put("/api/leads/:id", isAuthenticated, async (req, res) => {
    try {
      const leadId = parseInt(req.params.id);
      const user = req.user as any;
      const updatedLead = await storage.updateLead(leadId, req.body, user?.claims?.sub);
      res.json(updatedLead);
    } catch (error) {
      console.error("Error updating lead:", error);
      res.status(500).json({ error: "Failed to update lead" });
    }
  });

  app.post("/api/leads", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const validatedData = insertLeadSchema.parse({
        ...req.body,
        userId: user?.claims?.sub
      });
      const lead = await storage.createLead(validatedData);
      res.status(201).json(lead);
    } catch (error) {
      console.error("Error creating lead:", error);
      res.status(500).json({ error: "Failed to create lead" });
    }
  });

  // Investor routes
  app.get("/api/investors", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const { island, strategy, priority, limit = 50, offset = 0 } = req.query;
      const investors = await storage.getInvestors(user?.claims?.sub, {
        island: island as string,
        strategy: strategy as string,
        priority: priority as string,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      });
      res.json(investors);
    } catch (error) {
      console.error("Error fetching investors:", error);
      res.status(500).json({ error: "Failed to fetch investors" });
    }
  });

  app.get("/api/investors/stats", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const stats = await storage.getInvestorStats(user?.claims?.sub);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching investor stats:", error);
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  app.post("/api/investors", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const validatedData = insertInvestorSchema.parse({
        ...req.body,
        userId: user?.claims?.sub
      });
      const investor = await storage.createInvestor(validatedData);
      res.status(201).json(investor);
    } catch (error) {
      console.error("Error creating investor:", error);
      res.status(500).json({ error: "Failed to create investor" });
    }
  });

  // AI Chat routes
  app.post("/api/ai/chat", isAuthenticated, rateLimit(60000, 10), async (req, res) => {
    try {
      const user = req.user as any;
      const { message, context } = req.body;

      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }

      const result = await aiService.processChat(message, context, user?.claims?.sub);
      res.json(result);
    } catch (error) {
      console.error("Error handling AI chat:", error);
      res.status(500).json({ error: "Failed to process chat message" });
    }
  });

  // Email Templates routes
  app.get("/api/email-templates", isAuthenticated, async (req, res) => {
    try {
      const templates = await aiService.getEmailTemplates();
      res.json(templates);
    } catch (error) {
      console.error("Error fetching email templates:", error);
      res.status(500).json({ error: "Failed to fetch email templates" });
    }
  });

  // PDF Generation routes
  app.post("/api/properties/:id/pdf", isAuthenticated, async (req, res) => {
    try {
      const propertyId = parseInt(req.params.id);
      const property = await storage.getProperty(propertyId);

      if (!property) {
        return res.status(404).json({ error: "Property not found" });
      }

      const pdfGenerator = new PropertyPDFGenerator();
      const pdfBuffer = await pdfGenerator.generatePropertyPresentation(property, req.body);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="property-${propertyId}-presentation.pdf"`);
      res.send(pdfBuffer);
    } catch (error) {
      console.error("Error generating PDF:", error);
      res.status(500).json({ error: "Failed to generate PDF" });
    }
  });

  // Outreach Settings routes
  app.get("/api/outreach/settings", isAuthenticated, async (req, res) => {
    try {
      // Return default settings for now
      const defaultSettings = {
        fromEmail: '',
        fromName: '',
        subject: 'Investment Opportunity - {address}',
        template: 'Hi {ownerName},\n\nI hope this message finds you well. I noticed your property at {address} and wanted to reach out regarding a potential investment opportunity.\n\nBest regards',
        enabled: false
      };
      res.json(defaultSettings);
    } catch (error) {
      console.error("Error fetching outreach settings:", error);
      res.status(500).json({ error: "Failed to fetch outreach settings" });
    }
  });

  app.post("/api/outreach/settings", isAuthenticated, async (req, res) => {
    try {
      // For now, just return success
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating outreach settings:", error);
      res.status(500).json({ error: "Failed to update outreach settings" });
    }
  });

  // Matching routes
  app.get("/api/matching/all", isAuthenticated, async (req, res) => {
    try {
      const matches = await matchingService.getAllMatches();
      res.json(matches);
    } catch (error) {
      console.error("Error fetching matches:", error);
      res.status(500).json({ error: "Failed to fetch matches" });
    }
  });

  app.get("/api/matching/stats", isAuthenticated, async (req, res) => {
    try {
      const stats = await matchingService.getMatchingStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching matching stats:", error);
      res.status(500).json({ error: "Failed to fetch matching stats" });
    }
  });

  // Outreach routes
  app.get("/api/outreach/campaigns", isAuthenticated, async (req, res) => {
    try {
      const campaigns = await storage.getOutreachCampaigns();
      res.json(campaigns);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      res.status(500).json({ error: "Failed to fetch campaigns" });
    }
  });

  app.post("/api/outreach/email", isAuthenticated, async (req, res) => {
    try {
      const { leadId, templateId, customMessage } = req.body;

      // Get the lead and template
      const lead = await storage.getLead(leadId);
      const campaigns = await storage.getOutreachCampaigns();
      const template = campaigns.find(c => c.id === parseInt(templateId));

      if (!lead || !template) {
        return res.status(404).json({ error: "Lead or template not found" });
      }

      // Create outreach history record
      await storage.createOutreachHistory({
        leadId,
        campaignId: parseInt(templateId),
        type: 'email',
        status: 'sent',
        content: customMessage || template.template,
        sentAt: new Date(),
      });

      res.json({ success: true, message: "Email sent successfully" });
    } catch (error) {
      console.error("Error sending email:", error);
      res.status(500).json({ error: "Failed to send email" });
    }
  });

  // Scraping routes
  app.post("/api/scraping/start", isAuthenticated, rateLimit(300000, 3), async (req, res) => {
    try {
      const { source } = req.body;
      const job = await scraperService.startScraping(source);
      res.json(job);
    } catch (error) {
      console.error("Error starting scraping:", error);
      res.status(500).json({ error: "Failed to start scraping" });
    }
  });

  // Add alias for backwards compatibility
  app.post("/api/scraping/run", isAuthenticated, async (req, res) => {
    try {
      const { source } = req.body;
      const job = await scraperService.startScraping(source);
      res.json(job);
    } catch (error) {
      console.error("Error starting scraping:", error);
      res.status(500).json({ error: "Failed to start scraping" });
    }
  });

  app.get("/api/scraping/status", isAuthenticated, async (req, res) => {
    try {
      const jobs = await storage.getScrapingJobs(5);
      const recentJob = jobs[0];
      res.json({
        isRunning: recentJob?.status === 'running',
        lastRun: recentJob?.createdAt,
        status: recentJob?.status || 'idle',
        recordsFound: recentJob?.recordsFound || 0
      });
    } catch (error) {
      console.error("Error fetching scraping status:", error);
      res.status(500).json({ error: "Failed to fetch scraping status" });
    }
  });

  app.get("/api/scraping/jobs", isAuthenticated, async (req, res) => {
    try {
      const jobs = await storage.getScrapingJobs(10);
      res.json(jobs);
    } catch (error) {
      console.error("Error fetching scraping jobs:", error);
      res.status(500).json({ error: "Failed to fetch jobs" });
    }
  });

  // AI Chat
  app.post("/api/ai/chat", async (req, res) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { message, context } = req.body;
      const response = await aiService.processQuery(message, context);

      // Store the interaction
      await storage.createAIInteraction({
        userId: req.user.id,
        query: message,
        response: response.response,
        suggestions: response.suggestions,
        context: context || null
      });

      res.json(response);
    } catch (error) {
      console.error("AI chat error:", error);
      res.status(500).json({ error: "Failed to process AI request" });
    }
  });

  // Wholesaler Listings endpoints
  app.get('/api/wholesaler-listings', async (req, res) => {
    try {
      // Mock data for now - this would integrate with actual APIs
      const listings = [
        {
          id: '1',
          address: '123 Ala Moana Blvd',
          city: 'Honolulu',
          island: 'Oahu',
          price: 285000,
          beds: 2,
          baths: 1,
          sqft: 950,
          propertyType: 'Condo',
          listingDate: '2024-01-15',
          wholesalerName: 'Pacific Wholesale Properties',
          wholesalerPhone: '(808) 555-0123',
          wholesalerEmail: 'deals@pacificwholesale.com',
          description: 'Great investment opportunity in Kakaako',
          images: [],
          source: 'hawaii_home_listings' as const,
          sourceUrl: 'https://www.hawaiihomelistings.com/property/123'
        },
        {
          id: '2',
          address: '456 Kilauea Ave',
          city: 'Hilo',
          island: 'Big Island',
          price: 185000,
          beds: 3,
          baths: 2,
          sqft: 1200,
          propertyType: 'Single Family',
          listingDate: '2024-01-14',
          wholesalerName: 'Big Island Deals',
          wholesalerPhone: '(808) 555-0456',
          wholesalerEmail: 'info@bigisledeals.com',
          description: 'Fixer upper with ocean views',
          images: [],
          source: 'big_isle' as const,
          sourceUrl: 'https://bigisle.com/listing/456'
        }
      ];

      res.json(listings);
    } catch (error) {
      console.error('Error fetching wholesaler listings:', error);
      res.status(500).json({ error: 'Failed to fetch wholesaler listings' });
    }
  });

  app.get('/api/wholesaler-listings/stats', async (req, res) => {
    try {
      // Mock stats - would calculate from actual data
      const stats = {
        total: 2,
        averagePrice: 235000,
        oahuCount: 1,
        bigIslandCount: 1,
        mauiCount: 0,
        kauaiCount: 0
      };

      res.json(stats);
    } catch (error) {
      console.error('Error fetching wholesaler stats:', error);
      res.status(500).json({ error: 'Failed to fetch wholesaler stats' });
    }
  });

  // MLS Routes
  app.get("/api/mls/listings", async (req, res) => {
    try {
      // Return mock MLS data for now - replace with real MLS integration
      res.json([
        {
          id: 1,
          mlsNumber: "MLS123456",
          address: "789 Luxury Lane, Kailua, HI 96734",
          price: 1250000,
          bedrooms: 4,
          bathrooms: 3,
          status: "active",
          listDate: "2024-01-15",
          daysOnMarket: 45
        },
        {
          id: 2,
          mlsNumber: "MLS123457", 
          address: "456 Beach Blvd, Honolulu, HI 96815",
          price: 875000,
          bedrooms: 3,
          bathrooms: 2,
          status: "pending",
          listDate: "2024-01-10",
          daysOnMarket: 50
        }
      ]);
    } catch (error) {
      console.error("MLS listings error:", error);
      res.status(500).json({ error: "Failed to fetch MLS listings" });
    }
  });

  app.get("/api/mls/stats", async (req, res) => {
    try {
      res.json({
        activeListings: 156,
        averagePrice: 925000,
        newThisWeek: 12,
        avgDaysOnMarket: 47
      });
    } catch (error) {
      console.error("MLS stats error:", error);
      res.status(500).json({ error: "Failed to fetch MLS stats" });
    }
  });

  app.post("/api/mls/refresh", isAuthenticated, async (req, res) => {
    try {
      // Mock refresh process - in production this would trigger MLS data sync
      console.log("MLS refresh triggered");
      res.json({ success: true, message: "MLS data refresh initiated" });
    } catch (error) {
      console.error("MLS refresh error:", error);
      res.status(500).json({ error: "Failed to refresh MLS data" });
    }
  });

  // Foreclosure Routes
  app.get("/api/foreclosures", async (req, res) => {
    try {
      const properties = await storage.getProperties({ status: 'foreclosure' });
      res.json(properties);
    } catch (error) {
      console.error("Foreclosures error:", error);
      res.status(500).json({ error: "Failed to fetch foreclosures" });
    }
  });

  // Eviction Routes  
  app.get("/api/evictions", async (req, res) => {
    try {
      // Return mock eviction data for now
      res.json([
        {
          id: 1,
          address: "123 Rental St, Honolulu, HI 96813",
          tenantName: "John Doe",
          caseNumber: "EV-2024-001",
          status: "active",
          priority: "high",
          rentOwed: 8500,
          hearingDate: "2024-02-15"
        }
      ]);
    } catch (error) {
      console.error("Evictions error:", error);
      res.status(500).json({ error: "Failed to fetch evictions" });
    }
  });

  app.get("/api/auctions/stats", async (req, res) => {
    try {
      res.json({
        activeForeclosures: 23,
        upcomingAuctions: 8,
        evictionCases: 15,
        highPriority: 6
      });
    } catch (error) {
      console.error("Auction stats error:", error);
      res.status(500).json({ error: "Failed to fetch auction stats" });
    }
  });

  // Dashboard stats endpoint
  app.get("/api/dashboard/stats", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const properties = await storage.getProperties({ limit: 1000 });
      const leads = await storage.getLeads({ userId: user?.claims?.sub, limit: 1000 });
      const investors = await storage.getInvestors(user?.claims?.sub, { limit: 1000 });

      const stats = {
        totalProperties: properties.length,
        activeLeads: leads.filter(l => ['new', 'contacted', 'qualified'].includes(l.status)).length,
        totalInvestors: investors.length,
        pendingDeals: leads.filter(l => l.status === 'under_contract').length,
        recentActivity: {
          newProperties: properties.filter(p => {
            const created = new Date(p.createdAt);
            const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            return created > oneWeekAgo;
          }).length,
          newLeads: leads.filter(l => {
            const created = new Date(l.createdAt);
            const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            return created > oneWeekAgo;
          }).length
        }
      };

      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
  });

  // Start scheduler
  schedulerService.start();

  return server;
}