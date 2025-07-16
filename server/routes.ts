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
  app.post("/api/ai/chat", isAuthenticated, async (req, res) => {
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
  app.post("/api/scraping/start", isAuthenticated, async (req, res) => {
    try {
      const { source } = req.body;
      const job = await scraperService.startScraping(source);
      res.json(job);
    } catch (error) {
      console.error("Error starting scraping:", error);
      res.status(500).json({ error: "Failed to start scraping" });
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

  // Start scheduler
  schedulerService.start();

  return server;
}