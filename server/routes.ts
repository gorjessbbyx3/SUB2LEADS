import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from './storage';
import { aiService } from './services/aiService';
import { scraperService } from './services/scraper';
import { schedulerService } from './services/scheduler';
import { emailService } from './services/emailService';
import { pdfGeneratorService } from './services/pdfGenerator';
import { contactEnrichmentService } from './services/contactEnrichment';
import { setupAuth, isAuthenticated } from "./replitAuth";
import { mapService } from "./services/mapService";
import { insertPropertySchema, insertContactSchema, insertLeadSchema, insertAIInteractionSchema, insertInvestorSchema } from "@shared/schema";
import { matchingService } from './services/matchingService.js';

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
      const updates = req.body;

      // Input validation
      if (!leadId || !Number.isInteger(leadId)) {
        return res.status(400).json({ message: "Valid lead ID is required" });
      }

      // Add timestamp for status changes
      if (updates.status) {
        updates.lastStatusChange = new Date();
      }

      const lead = await storage.updateLead(leadId, updates);
      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
      }

      res.json(lead);
    } catch (error) {
      console.error("Error updating lead:", error);
      res.status(500).json({ 
        message: "Failed to update lead",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
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

      // Input validation
      if (!message || typeof message !== 'string' || message.trim().length === 0) {
        return res.status(400).json({ 
          message: "Message is required and must be a non-empty string" 
        });
      }

      if (contextId && !Number.isInteger(parseInt(contextId))) {
        return res.status(400).json({ 
          message: "Context ID must be a valid integer" 
        });
      }

      if (contextType && !['property', 'lead', 'contact'].includes(contextType)) {
        return res.status(400).json({ 
          message: "Context type must be one of: property, lead, contact" 
        });
      }

      // Pass userId to processChat to handle storage there, avoiding duplication
      const result = await aiService.processChat(
        message.trim(), 
        { contextId, contextType }, 
        userId
      );

      res.json(result);
    } catch (error) {
      console.error("Error processing chat:", error);
      res.status(500).json({ 
        message: "Failed to process chat request",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  app.post("/api/ai/property-summary", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { propertyId } = req.body;

      if (!propertyId || !Number.isInteger(parseInt(propertyId))) {
        return res.status(400).json({ message: "Valid property ID is required" });
      }

      const property = await storage.getProperty(parseInt(propertyId));
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }

      // Check if summary already exists and is recent (within 24 hours)
      if (property.aiSummary && property.updatedAt) {
        const lastUpdate = new Date(property.updatedAt);
        const hoursSinceUpdate = (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60);

        if (hoursSinceUpdate < 24) {
          return res.json({ summary: property.aiSummary, cached: true });
        }
      }

      const summary = await aiService.generatePropertySummary(property);

      // Update property with summary
      await storage.updateProperty(parseInt(propertyId), { aiSummary: summary });

      // Save interaction
      await storage.createAIInteraction({
        userId,
        type: 'summary',
        prompt: `Generate summary for property: ${property.address}`,
        response: summary,
        contextId: propertyId.toString(),
        contextType: 'property',
      });

      res.json({ summary, cached: false });
    } catch (error) {
      console.error("Error generating property summary:", error);
      res.status(500).json({ 
        message: "Failed to generate property summary",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
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

  // Update lead


  // Generate mailto link for lead
  app.post('/api/leads/:id/generate-mailto', async (req, res) => {
    try {
      const leadId = parseInt(req.params.id);
      const { customMessage, templateId } = req.body;

      const lead = await storage.getLead(leadId);
      if (!lead) {
        return res.status(404).json({ error: 'Lead not found' });
      }

      const result = await emailService.sendEmail(lead, templateId, customMessage);
      res.json(result);
    } catch (error) {
      console.error('Email generation error:', error);
      res.status(500).json({ error: 'Failed to generate email' });
    }
  });

  // Mark email as sent
  app.post('/api/leads/:id/mark-email-sent', async (req, res) => {
    try {
      const leadId = parseInt(req.params.id);
      const { emailLogId } = req.body;

      const result = await emailService.markEmailSent(leadId, emailLogId);
      res.json(result);
    } catch (error) {
      console.error('Error marking email as sent:', error);
      res.status(500).json({ error: 'Failed to mark email as sent' });
    }
  });

  // Generate property binder PDF
  app.post('/api/properties/:id/generate-binder', async (req, res) => {
    try {
      const propertyId = parseInt(req.params.id);
      const { userId } = req.body;

      const property = await storage.getProperty(propertyId);
      if (!property) {
        return res.status(404).json({ error: 'Property not found' });
      }

      const pdfPath = await pdfGeneratorService.generatePropertyBinder(property, userId);

      res.json({ 
        success: true, 
        url: pdfPath,
        message: 'PDF binder generated successfully' 
      });
    } catch (error) {
      console.error('PDF generation error:', error);
      res.status(500).json({ error: 'Failed to generate PDF binder' });
    }
  });

  // Scraper endpoints
  app.post('/api/scraper/run', async (req, res) => {
    try {
      const { source } = req.body;

      if (!source) {
        return res.status(400).json({ error: 'Source is required' });
      }

      const result = await scraperService.startScraping(source);
      res.json(result);
    } catch (error) {
      console.error('Scraper error:', error);
      res.status(500).json({ error: 'Failed to run scraper' });
    }
  });

  app.post('/api/scraper/run-all', async (req, res) => {
    try {
      const result = await scraperService.runAllScrapers();
      res.json(result);
    } catch (error) {
      console.error('Run all scrapers error:', error);
      res.status(500).json({ error: 'Failed to run all scrapers' });
    }
  });

  app.get('/api/scraper/history', async (req, res) => {
    try {
      const history = await scraperService.getScrapingHistory();
      res.json(history);
    } catch (error) {
      console.error('Scraper history error:', error);
      res.status(500).json({ error: 'Failed to get scraper history' });
    }
  });

  app.get('/api/scraper/download', async (req, res) => {
    try {
      const zipBuffer = await scraperService.generateDataExport();

      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="property-records.zip"');
      res.send(zipBuffer);
    } catch (error) {
      console.error('Download error:', error);
      res.status(500).json({ error: 'Failed to generate download' });
    }
  });

  app.get('/api/scraper/stats', async (req, res) => {
    try {
      const stats = await storage.getPropertiesStats();
      const history = await scraperService.getScrapingHistory();

      const totalJobs = history.length;
      const successfulJobs = history.filter(job => job.status === 'completed').length;
      const successRate = totalJobs > 0 ? Math.round((successfulJobs / totalJobs) * 100) : 0;

      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const thisWeek = history.filter(job => 
        new Date(job.startedAt) >= oneWeekAgo
      ).reduce((sum, job) => sum + job.propertiesFound, 0);

      res.json({
        totalProperties: stats.total,
        thisWeek,
        successRate,
        totalJobs,
        successfulJobs
      });
    } catch (error) {
      console.error('Scraper stats error:', error);
      res.status(500).json({ error: 'Failed to get scraper stats' });
    }
  });

  // AI email generation
  app.post("/api/ai/generate-email", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { propertyId, contactId, campaignType } = req.body;

      const property = await storage.getProperty(propertyId);
      const contact = await storage.getContact(contactId);

      if (!property || !contact) {
        return res.status(404).json({ message: "Property or contact not found" });
      }

      const email = await aiService.generateEmail(property, contact, campaignType);

      // Save interaction
      await storage.createAIInteraction({
        userId,
        type: 'email_generation',
        prompt: `Generate ${campaignType} email for ${property.address}`,
        response: email,
        contextId: propertyId.toString(),
        contextType: 'property',
      });

      res.json({ email });
    } catch (error) {
      console.error("Error generating email:", error);
      res.status(500).json({ message: "Failed to generate email" });
    }
  });

    // Manual contact enrichment
  app.post('/api/contacts/:id/enrich', async (req, res) => {
    try {
      const contactId = parseInt(req.params.id);
      await contactEnrichmentService.enrichContact(contactId);
      res.json({ message: 'Contact enrichment started' });
    } catch (error) {
      console.error('Contact enrichment error:', error);
      res.status(500).json({ error: 'Failed to start contact enrichment' });
    }
  });

  // Email Templates API
  app.get('/api/email-templates', async (req, res) => {
    try {
      const templates = await emailService.getEmailTemplates();
      res.json(templates);
    } catch (error) {
      console.error('Error fetching email templates:', error);
      res.status(500).json({ message: 'Failed to fetch email templates' });
    }
  });

  // Activity Timeline API
  app.get('/api/leads/:id/activities', isAuthenticated, async (req, res) => {
    try {
      const leadId = parseInt(req.params.id);
      const activities = await storage.getActivitiesByLead(leadId);
      res.json(activities);
    } catch (error) {
      console.error('Error fetching activities:', error);
      res.status(500).json({ message: 'Failed to fetch activities' });
    }
  });

  app.get('/api/properties/:id/activities', isAuthenticated, async (req, res) => {
    try {
      const propertyId = parseInt(req.params.id);
      const activities = await storage.getActivitiesByProperty(propertyId);
      res.json(activities);
    } catch (error) {
      console.error('Error fetching activities:', error);
      res.status(500).json({ message: 'Failed to fetch activities' });
    }
  });

  app.post('/api/activities', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const data = { ...req.body, userId };
      const activity = await storage.createActivity(data);
      res.status(201).json(activity);
    } catch (error) {
      console.error('Error creating activity:', error);
      res.status(500).json({ message: 'Failed to create activity' });
    }
  });

  app.get('/api/activities/recent', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { limit } = req.query;
      const activities = await storage.getRecentActivities(userId, limit ? parseInt(limit) : 50);
      res.json(activities);
    } catch (error) {
      console.error('Error fetching recent activities:', error);
      res.status(500).json({ message: 'Failed to fetch recent activities' });
    }
  });

  // Investor API routes
  app.get('/api/investors', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { island, strategy, priority, limit, offset } = req.query;
      const investors = await storage.getInvestors(userId, {
        island,
        strategy,
        priority,
        limit: limit ? parseInt(limit) : undefined,
        offset: offset ? parseInt(offset) : undefined,
      });
      res.json(investors);
    } catch (error) {
      console.error('Error fetching investors:', error);
      res.status(500).json({ message: 'Failed to fetch investors' });
    }
  });

  app.get('/api/investors/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const stats = await storage.getInvestorStats(userId);
      res.json(stats);
    } catch (error) {
      console.error('Error fetching investor stats:', error);
      res.status(500).json({ message: 'Failed to fetch investor stats' });
    }
  });

  app.get('/api/investors/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const investor = await storage.getInvestor(id);

      if (!investor) {
        return res.status(404).json({ error: 'Investor not found' });
      }

      res.json(investor);
    } catch (error) {
      console.error('Error fetching investor:', error);
      res.status(500).json({ error: 'Failed to fetch investor' });
    }
  });

  app.post('/api/investors', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertInvestorSchema.parse({ ...req.body, userId });
      const investor = await storage.createInvestor(validatedData);
      res.status(201).json(investor);
    } catch (error) {
      console.error('Error creating investor:', error);
      res.status(400).json({ message: 'Invalid investor data' });
    }
  });

  app.put('/api/investors/:id', isAuthenticated, async (req, res) => {
    try {
      const investorId = parseInt(req.params.id);
      const validatedData = insertInvestorSchema.partial().parse(req.body);
      const investor = await storage.updateInvestor(investorId, validatedData);
      if (!investor) {
        return res.status(404).json({ message: 'Investor not found' });
      }
      res.json(investor);
    } catch (error) {
      console.error('Error updating investor:', error);
      res.status(400).json({ message: 'Invalid investor data' });
    }
  });

  // Delete investor
  app.delete('/api/investors/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteInvestor(id);
      if (!success) {
        return res.status(404).json({ message: 'Investor not found' });
      }
      res.json({ message: 'Investor deleted successfully' });
    } catch (error) {
      console.error('Error deleting investor:', error);
      res.status(500).json({ message: 'Failed to delete investor' });
    }
  });

  // Matching endpoints
  app.get('/api/matching/lead/:leadId', async (req, res) => {
    try {
      const leadId = parseInt(req.params.leadId);
      const matches = await matchingService.findMatchesForLead(leadId);
      res.json(matches);
    } catch (error) {
      console.error('Error finding matches for lead:', error);
      res.status(500).json({ error: 'Failed to find matches' });
    }
  });

  app.get('/api/matching/investor/:investorId', async (req, res) => {
    try {
      const investorId = parseInt(req.params.investorId);
      const matches = await matchingService.findMatchesForInvestor(investorId);
      res.json(matches);
    } catch (error) {
      console.error('Error finding matches for investor:', error);
      res.status(500).json({ error: 'Failed to find matches' });
    }
  });

  app.get('/api/matching/all', async (req, res) => {
    try {
      const matches = await matchingService.findMatchesForAllLeads();
      res.json(matches);
    } catch (error) {
      console.error('Error finding all matches:', error);
      res.status(500).json({ error: 'Failed to find matches' });
    }
  });

  app.get('/api/matching/stats', async (req, res) => {
    try {
      const stats = await matchingService.getMatchingStats();
      res.json(stats);
    } catch (error) {
      console.error('Error getting matching stats:', error);
      res.status(500).json({ error: 'Failed to get matching stats' });
    }
  });

  // Notify investor of match
  app.post('/api/email/notify-investor', async (req, res) => {
    try {
      const { investorId, propertyId, matchScore, matchReasons } = req.body;

      await emailService.notifyInvestorOfMatch(investorId, propertyId, matchScore, matchReasons);

      res.json({ success: true, message: 'Investor notified successfully' });
    } catch (error) {
      console.error('Error notifying investor:', error);
      res.status(500).json({ error: 'Failed to notify investor' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}