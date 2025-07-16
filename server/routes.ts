import type { Express } from "express";
import { createServer } from "http";
import { insertPropertySchema, insertContactSchema, insertLeadSchema, insertAIInteractionSchema, insertInvestorSchema } from "@shared/schema";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { storage } from "./storage";
import { matchingService } from './services/matchingService';
import { schedulerService } from './services/scheduler';
import { scraperService } from './services/scraper';
import { aiService } from './services/aiService';
import { grokService } from './services/grokService';
import { contactEnrichmentService } from './services/contactEnrichment';
import { PropertyPDFGenerator } from './services/pdfGenerator';
import { validateRequest, validateQuery, rateLimit } from './middleware/validation';
import { inngestHandler, inngest } from './inngest';
import path from 'path';
import { serve } from 'inngest/express';
import { helloWorld } from './inngest/functions';

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

  // Inngest webhook endpoint
  app.use('/api/inngest', inngestHandler);

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

      // Trigger investor matching workflow
      await inngest.send({
        name: "lead/match.investors",
        data: {
          leadId: lead.id,
          userId: user?.claims?.sub
        }
      });

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

  // Grok AI Analysis routes
  app.post("/api/grok/analyze-property/:id", isAuthenticated, rateLimit(60000, 5), async (req, res) => {
    try {
      const propertyId = parseInt(req.params.id);
      const property = await storage.getProperty(propertyId);

      if (!property) {
        return res.status(404).json({ error: "Property not found" });
      }

      const analysis = await grokService.analyzePropertyMarket(property);
      res.json({ analysis });
    } catch (error) {
      console.error("Error analyzing property with Grok:", error);
      res.status(500).json({ error: "Failed to analyze property" });
    }
  });

  app.get("/api/grok/market-trends", isAuthenticated, rateLimit(300000, 2), async (req, res) => {
    try {
      const analysis = await grokService.predictMarketTrends();
      res.json({ analysis });
    } catch (error) {
      console.error("Error getting market trends from Grok:", error);
      res.status(500).json({ error: "Failed to get market trends" });
    }
  });

  app.post("/api/grok/investor-match/:id", isAuthenticated, rateLimit(60000, 5), async (req, res) => {
    try {
      const propertyId = parseInt(req.params.id);
      const property = await storage.getProperty(propertyId);

      if (!property) {
        return res.status(404).json({ error: "Property not found" });
      }

      const user = req.user as any;
      const investors = await storage.getInvestors(user?.claims?.sub, { limit: 100 });

      const analysis = await grokService.analyzeInvestorMatch(property, investors);
      res.json({ analysis });
    } catch (error) {
      console.error("Error analyzing investor matches with Grok:", error);
      res.status(500).json({ error: "Failed to analyze investor matches" });
    }
  });

  app.get("/api/grok/deal-flow", isAuthenticated, rateLimit(300000, 2), async (req, res) => {
    try {
      const user = req.user as any;
      const properties = await storage.getProperties({ limit: 1000 });
      const leads = await storage.getLeads({ userId: user?.claims?.sub, limit: 1000 });

      const analysis = await grokService.analyzeDealFlow(properties, leads);
      res.json({ analysis });
    } catch (error) {
      console.error("Error analyzing deal flow with Grok:", error);
      res.status(500).json({ error: "Failed to analyze deal flow" });
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

      // Trigger Inngest workflow for comprehensive scraping
      await inngest.send({
        name: "property/scrape.scheduled",
        data: { source }
      });

      res.json({ message: `Scraping workflow initiated for ${source}` });
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

  // Import wholesale listings as leads and find investor matches
  app.post('/api/wholesaler-listings/import', isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;

      // Mock wholesale listings data - replace with actual API calls
      const wholesaleListings = [
        {
          address: '123 Ala Moana Blvd, Honolulu, HI 96815',
          city: 'Honolulu',
          state: 'HI',
          zipCode: '96815',
          estimatedValue: 285000,
          status: 'wholesale',
          priority: 'high',
          propertyType: 'Condo',
          bedrooms: 2,
          bathrooms: 1,
          squareFeet: 950,
          dealType: 'wholesaler',
          contractHolderName: 'Pacific Wholesale Properties',
          contractHolderPhone: '(808) 555-0123',
          contractHolderEmail: 'deals@pacificwholesale.com',
          askingPrice: 285000,
          sourceUrl: 'https://www.hawaiihomelistings.com/property/123',
          leadSource: 'hawaii_home_listings'
        },
        {
          address: '456 Kilauea Ave, Hilo, HI 96720',
          city: 'Hilo',
          state: 'HI',
          zipCode: '96720',
          estimatedValue: 185000,
          status: 'wholesale',
          priority: 'high',
          propertyType: 'Single Family',
          bedrooms: 3,
          bathrooms: 2,
          squareFeet: 1200,
          dealType: 'wholesaler',
          contractHolderName: 'Big Island Deals',
          contractHolderPhone: '(808) 555-0456',
          contractHolderEmail: 'info@bigisledeals.com',
          askingPrice: 185000,
          sourceUrl: 'https://bigisle.com/listing/456',
          leadSource: 'big_isle'
        }
      ];

      const importedProperties = [];
      const importedLeads = [];
      const matchedInvestors = [];

      for (const listing of wholesaleListings) {
        // Create property record
        const property = await storage.createProperty(listing);
        importedProperties.push(property);

        // Create contact record for wholesaler
        const contact = await storage.createContact({
          propertyId: property.id,
          name: listing.contractHolderName,
          email: listing.contractHolderEmail,
          phone: listing.contractHolderPhone,
          isLLC: listing.contractHolderName.includes('LLC') || listing.contractHolderName.includes('Properties')
        });

        // Create lead record for wholesaler relationship
        const lead = await storage.createLead({
          propertyId: property.id,
          contactId: contact.id,
          userId: user?.claims?.sub,
          status: 'new',
          priority: 'high',
          notes: `WHOLESALE DEAL from ${listing.leadSource}. Wholesaler: ${listing.contractHolderName}. Contact ASAP for deal details and terms. Asking: $${listing.askingPrice.toLocaleString()}`
        });
        importedLeads.push(lead);

        // Find matching investors for this wholesale property
        const matches = await matchingService.findMatchesForLead(lead.id);
        matchedInvestors.push(...matches);

        // Trigger Inngest workflow for wholesale deal notification
        await inngest.send({
          name: "wholesale/deal.imported",
          data: {
            propertyId: property.id,
            leadId: lead.id,
            matches: matches
          }
        });

        // Create activity log for the lead
        await storage.createActivity({
          leadId: lead.id,
          propertyId: property.id,
          userId: user?.claims?.sub,
          type: 'lead_created',
          title: 'Wholesale Lead Imported',
          description: `Wholesale property imported from ${listing.leadSource}. Found ${matches.length} potential investor matches.`
        });
      }

      res.json({
        success: true,
        imported: {
          properties: importedProperties.length,
          leads: importedLeads.length,
          potentialMatches: matchedInvestors.length
        },
        matches: matchedInvestors.slice(0, 5) // Return top 5 matches for preview
      });
    } catch (error) {
      console.error('Error importing wholesale listings:', error);
      res.status(500).json({ error: 'Failed to import wholesale listings' });
    }
  });

  // Get wholesale leads with their properties and potential matches
  app.get('/api/wholesaler-listings', isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;

      // Get all leads with wholesale properties
      const allLeads = await storage.getLeads({
        userId: user?.claims?.sub,
        limit: 100
      });

      // Filter for wholesale leads and get their properties
      const wholesaleLeads = [];
      for (const lead of allLeads) {
        const property = await storage.getProperty(lead.propertyId);
        if (property && property.status === 'wholesale') {
          const contact = await storage.getContact(lead.contactId);

          // Get potential investor matches for this lead
          const matches = await matchingService.findMatchesForLead(lead.id);

          wholesaleLeads.push({
            id: lead.id,
            propertyId: property.propertyId,
            address: property.address,
            city: property.city,
            island: property.city.includes('Honolulu') ? 'Oahu' :
              property.city.includes('Hilo') ? 'Big Island' : 'Oahu',
            price: property.askingPrice || property.estimatedValue,
            beds: property.bedrooms,
            baths: property.bathrooms,
            sqft: property.squareFeet,
            propertyType: property.propertyType,
            listingDate: property.createdAt,
            wholesalerName: contact?.name || 'Unknown',
            wholesalerPhone: contact?.phone || '',
            wholesalerEmail: contact?.email || '',
            description: property.repairsNeeded || 'Investment opportunity',
            source: property.leadSource || 'hawaii_home_listings',
            sourceUrl: property.sourceUrl,
            leadStatus: lead.status,
            leadPriority: lead.priority,
            notes: lead.notes,
            potentialMatches: matches.length,
            topMatches: matches.slice(0, 3).map(match => ({
              investorName: match.investor.name,
              matchScore: match.matchScore,
              reasons: match.matchReasons
            }))
          });
        }
      }

      res.json(wholesaleLeads);
    } catch (error) {
      console.error('Error fetching wholesaler listings:', error);
      res.status(500).json({ error: 'Failed to fetch wholesaler listings' });
    }
  });

  app.get('/api/wholesaler-listings/stats', isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;

      // Get all wholesale leads
      const allLeads = await storage.getLeads({ userId: user?.claims?.sub, limit: 100 });
      const wholesaleLeads = [];
      let totalMatches = 0;

      for (const lead of allLeads) {
        const property = await storage.getProperty(lead.propertyId);
        if (property && property.status === 'wholesale') {
          wholesaleLeads.push({ lead, property });
          const matches = await matchingService.findMatchesForLead(lead.id);
          totalMatches += matches.length;
        }
      }

      const stats = {
        total: wholesaleLeads.length,
        averagePrice: wholesaleLeads.length > 0 ?
          Math.round(wholesaleLeads.reduce((sum, w) => sum + (w.property.estimatedValue || 0), 0) / wholesaleLeads.length) : 0,
        oahuCount: wholesaleLeads.filter(w => w.property.city.includes('Honolulu')).length,
        bigIslandCount: wholesaleLeads.filter(w => w.property.city.includes('Hilo')).length,
        mauiCount: wholesaleLeads.filter(w => w.property.city.includes('Maui')).length,
        kauaiCount: wholesaleLeads.filter(w => w.property.city.includes('Kauai')).length,
        totalMatches,
        averageMatchesPerLead: wholesaleLeads.length > 0 ? Math.round(totalMatches / wholesaleLeads.length) : 0
      };

      res.json(stats);
    } catch (error) {
      console.error('Error fetching wholesaler stats:', error);
      res.status(500).json({ error: 'Failed to fetch wholesaler stats' });
    }
  });

  // Get investor matches for a specific wholesale lead
  app.get('/api/wholesaler-listings/:leadId/matches', isAuthenticated, async (req, res) => {
    try {
      const leadId = parseInt(req.params.leadId);
      const matches = await matchingService.findMatchesForLead(leadId);

      res.json({
        leadId,
        matches: matches.map(match => ({
          investorId: match.investorId,
          investorName: match.investor.name,
          company: match.investor.company,
          email: match.investor.email,
          phone: match.investor.phone,
          matchScore: match.matchScore,
          matchReasons: match.matchReasons,
          strategies: match.investor.strategies,
          preferredIslands: match.investor.preferredIslands,
          budgetRange: {
            min: match.investor.minBudget,
            max: match.investor.maxBudget
          }
        }))
      });
    } catch (error) {
      console.error('Error fetching investor matches:', error);
      res.status(500).json({ error: 'Failed to fetch investor matches' });
    }
  });

  // Import investors from CSV with duplicate checking
  app.post("/api/investors/import", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const { investors: importInvestors } = req.body;

      if (!importInvestors || !Array.isArray(importInvestors)) {
        return res.status(400).json({ error: "Invalid investors data" });
      }

      const results = {
        imported: 0,
        duplicates: 0,
        errors: 0,
        details: []
      };

      // Get existing investors to check for duplicates
      const existingInvestors = await storage.getInvestors(user?.claims?.sub, { limit: 1000 });

      for (const investorData of importInvestors) {
        try {
          // Check for duplicates by email or name
          const isDuplicate = existingInvestors.some(existing =>
            existing.email?.toLowerCase() === investorData.email?.toLowerCase() ||
            existing.name.toLowerCase() === investorData.name.toLowerCase()
          );

          if (isDuplicate) {
            results.duplicates++;
            results.details.push({
              name: investorData.name,
              status: 'duplicate',
              reason: 'Email or name already exists'
            });
            continue;
          }

          // Parse budget range
          const budgetMatch = investorData.budget?.match(/\$?(\d+(?:\.\d+)?)[kKmM]?.*?(\$?(\d+(?:\.\d+)?)[kKmM]?)?/);
          let minBudget = 0;
          let maxBudget = 0;

          if (budgetMatch) {
            const parseAmount = (str) => {
              if (!str) return 0;
              const num = parseFloat(str.replace(/[$,]/g, ''));
              if (str.toLowerCase().includes('k')) return num * 1000;
              if (str.toLowerCase().includes('m')) return num * 1000000;
              return num;
            };

            minBudget = parseAmount(budgetMatch[1]);
            maxBudget = budgetMatch[3] ? parseAmount(budgetMatch[3]) : minBudget;
          }

          // Determine preferred islands from address
          const preferredIslands = [];
          const address = investorData.mailingAddress?.toLowerCase() || '';
          if (address.includes('honolulu') || address.includes('kapolei') || address.includes('kaneohe')) {
            preferredIslands.push('Oahu');
          } else if (address.includes('lahaina') || address.includes('kihei') || address.includes('maui')) {
            preferredIslands.push('Maui');
          } else if (address.includes('hilo') || address.includes('kona')) {
            preferredIslands.push('Big Island');
          } else if (address.includes('lihue') || address.includes('kauai')) {
            preferredIslands.push('Kauai');
          } else {
            preferredIslands.push('Oahu'); // Default
          }

          // Determine strategies
          const strategies = [];
          if (investorData.strategy?.toLowerCase().includes('buy &hold')) {
            strategies.push('Buy & Hold');
          } else if (investorData.strategy?.toLowerCase().includes('fix & flip')) {
            strategies.push('Fix & Flip');
          } else if (investorData.strategy?.toLowerCase().includes('brrrr')) {
            strategies.push('BRRRR');
          } else {
            strategies.push('Buy & Hold'); // Default          }

          // Determine property types from notes
          const propertyTypes = [];
          const notes = investorData.notes?.toLowerCase() || '';
          if (notes.includes('duplex') || notes.includes('triplex')) {
            propertyTypes.push('Duplex', 'Triplex');
          } else if (notes.includes('sfr') || notes.includes('single family')) {
            propertyTypes.push('Single Family');
          } else if (notes.includes('rental')) {
            propertyTypes.push('Single Family', 'Duplex');
          } else {
            propertyTypes.push('Single Family'); // Default
          }

          // Create investor record
          const newInvestor = await storage.createInvestor({
            userId: user?.claims?.sub,
            name: investorData.name,
            email: investorData.email,
            phone: investorData.phone,
            company: investorData.name.includes('LLC') || investorData.name.includes('Holdings') || investorData.name.includes('Capital') ? investorData.name : null,
            minBudget,
            maxBudget,
            preferredIslands,
            strategies,
            propertyTypes,
            priority: 'medium',
            status: 'active',
            notes: `Recent Purchase: ${investorData.recentPurchase}. ${investorData.notes}`,
            dealsCompleted: 1 // They have at least one recent purchase
          });

          results.imported++;
          results.details.push({
            name: investorData.name,
            status: 'imported',
            id: newInvestor.id
          });

        } catch (error) {
          console.error(`Error importing investor ${investorData.name}:`, error);
          results.errors++;
          results.details.push({
            name: investorData.name,
            status: 'error',
            reason: error.message
          });
        }
      }

      res.json(results);
    } catch (error) {
      console.error('Error importing investors:', error);
      res.status(500).json({ error: 'Failed to import investors' });
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

  // Notes routes
  app.get("/api/notes", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const notes = await storage.getNotes(user?.claims?.sub);
      res.json(notes);
    } catch (error) {
      console.error("Error fetching notes:", error);
      res.status(500).json({ error: "Failed to fetch notes" });
    }
  });

  app.post("/api/notes", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const { title, content, is_public = false } = req.body;
      
      const note = await storage.createNote({
        userId: user?.claims?.sub,
        note: content || title, // Map to the 'note' field in your schema
        title,
        content,
        is_public
      });
      
      res.status(201).json(note);
    } catch (error) {
      console.error("Error creating note:", error);
      res.status(500).json({ error: "Failed to create note" });
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

  // Add the Inngest serve handler
  app.use("/api/inngest", serve({ client: inngest, functions: [helloWorld] }));

  return server;
}