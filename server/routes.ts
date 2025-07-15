import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { scraperService } from "./services/scraper";
import { contactEnrichmentService } from "./services/contactEnrichment";
import { aiService } from "./services/aiService";
import { pdfGeneratorService } from "./services/pdfGenerator";
import { emailService } from "./services/emailService";
import { mapService } from "./services/mapService";
import { schedulerService } from "./services/scheduler";
import { insertPropertySchema, insertContactSchema, insertLeadSchema, insertAIInteractionSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Start scheduler
  schedulerService.start();

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Properties API
  app.get("/api/properties", isAuthenticated, async (req: any, res) => {
    try {
      const { status, priority, limit, offset } = req.query;
      const properties = await storage.getProperties({
        status,
        priority,
        limit: limit ? parseInt(limit) : undefined,
        offset: offset ? parseInt(offset) : undefined,
      });
      res.json(properties);
    } catch (error) {
      console.error("Error fetching properties:", error);
      res.status(500).json({ message: "Failed to fetch properties" });
    }
  });

  app.get("/api/properties/:id", isAuthenticated, async (req, res) => {
    try {
      const property = await storage.getProperty(parseInt(req.params.id));
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      res.json(property);
    } catch (error) {
      console.error("Error fetching property:", error);
      res.status(500).json({ message: "Failed to fetch property" });
    }
  });

  app.post("/api/properties", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertPropertySchema.parse(req.body);
      const property = await storage.createProperty(validatedData);
      res.status(201).json(property);
    } catch (error) {
      console.error("Error creating property:", error);
      res.status(400).json({ message: "Invalid property data" });
    }
  });

  app.get("/api/properties/stats", isAuthenticated, async (req, res) => {
    try {
      const stats = await storage.getPropertiesStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching property stats:", error);
      res.status(500).json({ message: "Failed to fetch property stats" });
    }
  });

  // Contacts API
  app.get("/api/properties/:propertyId/contacts", isAuthenticated, async (req, res) => {
    try {
      const contacts = await storage.getContactsByProperty(parseInt(req.params.propertyId));
      res.json(contacts);
    } catch (error) {
      console.error("Error fetching contacts:", error);
      res.status(500).json({ message: "Failed to fetch contacts" });
    }
  });

  app.post("/api/contacts", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertContactSchema.parse(req.body);
      const contact = await storage.createContact(validatedData);
      
      // Trigger contact enrichment
      contactEnrichmentService.enrichContact(contact.id);
      
      res.status(201).json(contact);
    } catch (error) {
      console.error("Error creating contact:", error);
      res.status(400).json({ message: "Invalid contact data" });
    }
  });

  // Leads API
  app.get("/api/leads", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { status, priority, limit, offset } = req.query;
      const leads = await storage.getLeads({
        status,
        priority,
        userId,
        limit: limit ? parseInt(limit) : undefined,
        offset: offset ? parseInt(offset) : undefined,
      });
      res.json(leads);
    } catch (error) {
      console.error("Error fetching leads:", error);
      res.status(500).json({ message: "Failed to fetch leads" });
    }
  });

  app.post("/api/leads", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertLeadSchema.parse({ ...req.body, userId });
      const lead = await storage.createLead(validatedData);
      res.status(201).json(lead);
    } catch (error) {
      console.error("Error creating lead:", error);
      res.status(400).json({ message: "Invalid lead data" });
    }
  });

  app.patch("/api/leads/:id", isAuthenticated, async (req, res) => {
    try {
      const leadId = parseInt(req.params.id);
      const lead = await storage.updateLead(leadId, req.body);
      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
      }
      res.json(lead);
    } catch (error) {
      console.error("Error updating lead:", error);
      res.status(500).json({ message: "Failed to update lead" });
    }
  });

  app.get("/api/leads/pipeline", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const pipeline = await storage.getLeadsPipeline(userId);
      res.json(pipeline);
    } catch (error) {
      console.error("Error fetching pipeline:", error);
      res.status(500).json({ message: "Failed to fetch pipeline" });
    }
  });

  // Scraping API
  app.post("/api/scraping/run", isAuthenticated, async (req, res) => {
    try {
      const { source } = req.body;
      if (!['star_advertiser', 'tax_delinquent'].includes(source)) {
        return res.status(400).json({ message: "Invalid scraping source" });
      }
      
      const job = await scraperService.startScraping(source);
      res.json(job);
    } catch (error) {
      console.error("Error starting scraping:", error);
      res.status(500).json({ message: "Failed to start scraping" });
    }
  });

  app.get("/api/scraping/jobs", isAuthenticated, async (req, res) => {
    try {
      const jobs = await storage.getScrapingJobs(10);
      res.json(jobs);
    } catch (error) {
      console.error("Error fetching scraping jobs:", error);
      res.status(500).json({ message: "Failed to fetch scraping jobs" });
    }
  });

  app.get("/api/scraping/status", isAuthenticated, async (req, res) => {
    try {
      const starAdvertiserJob = await storage.getLatestScrapingJob('star_advertiser');
      const taxDelinquentJob = await storage.getLatestScrapingJob('tax_delinquent');
      
      res.json({
        star_advertiser: starAdvertiserJob,
        tax_delinquent: taxDelinquentJob,
      });
    } catch (error) {
      console.error("Error fetching scraping status:", error);
      res.status(500).json({ message: "Failed to fetch scraping status" });
    }
  });

  // AI API
  app.post("/api/ai/chat", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { message, contextId, contextType } = req.body;
      
      const response = await aiService.processChat(message, { contextId, contextType });
      
      // Save interaction
      await storage.createAIInteraction({
        userId,
        type: 'chat',
        prompt: message,
        response,
        contextId,
        contextType,
      });
      
      res.json({ response });
    } catch (error) {
      console.error("Error processing chat:", error);
      res.status(500).json({ message: "Failed to process chat" });
    }
  });

  app.post("/api/ai/property-summary", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { propertyId } = req.body;
      
      const property = await storage.getProperty(propertyId);
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      
      const summary = await aiService.generatePropertySummary(property);
      
      // Update property with summary
      await storage.updateProperty(propertyId, { aiSummary: summary });
      
      // Save interaction
      await storage.createAIInteraction({
        userId,
        type: 'summary',
        prompt: `Generate summary for property: ${property.address}`,
        response: summary,
        contextId: propertyId.toString(),
        contextType: 'property',
      });
      
      res.json({ summary });
    } catch (error) {
      console.error("Error generating property summary:", error);
      res.status(500).json({ message: "Failed to generate property summary" });
    }
  });

  // Outreach API
  app.post("/api/outreach/email", isAuthenticated, async (req, res) => {
    try {
      const { leadId, templateId, customMessage } = req.body;
      
      const lead = await storage.getLead(leadId);
      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
      }
      
      const result = await emailService.sendEmail(lead, templateId, customMessage);
      res.json(result);
    } catch (error) {
      console.error("Error sending email:", error);
      res.status(500).json({ message: "Failed to send email" });
    }
  });

  app.get("/api/outreach/campaigns", isAuthenticated, async (req, res) => {
    try {
      const campaigns = await storage.getOutreachCampaigns();
      res.json(campaigns);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      res.status(500).json({ message: "Failed to fetch campaigns" });
    }
  });

  // PDF Generation API
  app.post("/api/pdf/generate", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { propertyId } = req.body;
      
      const property = await storage.getProperty(propertyId);
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      
      const pdfPath = await pdfGeneratorService.generatePropertyBinder(property, userId);
      res.json({ pdfPath });
    } catch (error) {
      console.error("Error generating PDF:", error);
      res.status(500).json({ message: "Failed to generate PDF" });
    }
  });

  // Map API
  app.get("/api/map/property/:id", isAuthenticated, async (req, res) => {
    try {
      const propertyId = parseInt(req.params.id);
      const property = await storage.getProperty(propertyId);
      
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      
      const mapData = await mapService.getPropertyMap(property);
      res.json(mapData);
    } catch (error) {
      console.error("Error fetching map data:", error);
      res.status(500).json({ message: "Failed to fetch map data" });
    }
  });

  app.post("/api/map/geocode", isAuthenticated, async (req, res) => {
    try {
      const { address } = req.body;
      const coordinates = await mapService.geocodeAddress(address);
      res.json(coordinates);
    } catch (error) {
      console.error("Error geocoding address:", error);
      res.status(500).json({ message: "Failed to geocode address" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
