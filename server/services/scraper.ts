import { storage } from "../storage";
import { contactEnrichmentService } from "./contactEnrichment";
import { aiService } from "./aiService";
import type { InsertProperty, InsertContact, InsertScrapingJob } from "@shared/schema";

class ScraperService {
  async startScraping(source: 'star_advertiser' | 'tax_delinquent') {
    // Create scraping job
    const job = await storage.createScrapingJob({
      source,
      status: 'running',
      startedAt: new Date(),
    });

    // Run scraping in background
    this.runScraping(job.id, source).catch(error => {
      console.error(`Scraping failed for ${source}:`, error);
      storage.updateScrapingJob(job.id, {
        status: 'failed',
        errorMessage: error.message,
        completedAt: new Date(),
      });
    });

    return job;
  }

  private async runScraping(jobId: number, source: string) {
    try {
      let properties: any[] = [];
      
      if (source === 'star_advertiser') {
        properties = await this.scrapeStarAdvertiser();
      } else if (source === 'tax_delinquent') {
        properties = await this.scrapeTaxDelinquent();
      }

      await storage.updateScrapingJob(jobId, {
        propertiesFound: properties.length,
      });

      let processed = 0;
      for (const propertyData of properties) {
        try {
          // Check if property already exists
          const existingProperties = await storage.getProperties({
            limit: 1000, // Get all to check for duplicates
          });
          
          const exists = existingProperties.some(p => 
            p.address.toLowerCase() === propertyData.address.toLowerCase()
          );

          if (!exists) {
            // Create property
            const property = await storage.createProperty(propertyData);
            
            // Create contact if owner info is available
            if (propertyData.ownerName) {
              const contact = await storage.createContact({
                propertyId: property.id,
                name: propertyData.ownerName,
                address: propertyData.ownerAddress,
              });

              // Trigger contact enrichment
              contactEnrichmentService.enrichContact(contact.id);
            }

            // Generate AI summary
            if (property.id) {
              try {
                const summary = await aiService.generatePropertySummary(property);
                await storage.updateProperty(property.id, { aiSummary: summary });
              } catch (error) {
                console.error('Failed to generate AI summary:', error);
              }
            }
          }

          processed++;
          await storage.updateScrapingJob(jobId, {
            propertiesProcessed: processed,
          });
        } catch (error) {
          console.error('Error processing property:', error);
        }
      }

      await storage.updateScrapingJob(jobId, {
        status: 'completed',
        completedAt: new Date(),
        lastRunAt: new Date(),
      });

    } catch (error) {
      await storage.updateScrapingJob(jobId, {
        status: 'failed',
        errorMessage: error.message,
        completedAt: new Date(),
      });
      throw error;
    }
  }

  private async scrapeStarAdvertiser(): Promise<any[]> {
    // This would use puppeteer/selenium to scrape Star Advertiser legal notices
    // For now, returning mock data structure
    const properties = [];
    
    try {
      // Simulate scraping Star Advertiser legal notices
      // In real implementation, would use puppeteer to navigate pages
      
      const mockProperties = [
        {
          address: "530 S King St, Honolulu, HI 96813",
          city: "Honolulu",
          state: "HI",
          zipCode: "96813",
          status: "foreclosure",
          priority: "high",
          auctionDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 6 days from now
          daysUntilAuction: 6,
          estimatedValue: 720000,
          ownerName: "Maria Santos",
          sourceUrl: "https://www.staradvertiser.com/legal-notices/",
        },
        {
          address: "1247 Beretania St, Honolulu, HI 96814",
          city: "Honolulu", 
          state: "HI",
          zipCode: "96814",
          status: "tax_delinquent",
          priority: "medium",
          amountOwed: 15000,
          estimatedValue: 890000,
          ownerName: "David Kim",
          sourceUrl: "https://www.staradvertiser.com/legal-notices/",
        }
      ];

      // In real implementation, would extract data from scraped HTML
      properties.push(...mockProperties);
      
    } catch (error) {
      console.error('Error scraping Star Advertiser:', error);
      throw error;
    }

    return properties;
  }

  private async scrapeTaxDelinquent(): Promise<any[]> {
    // This would download and parse Hawaii tax delinquent PDFs
    const properties = [];
    
    try {
      // Simulate parsing tax delinquent PDF
      // In real implementation, would use pdf-parse or similar
      
      const mockProperties = [
        {
          address: "2140 Kapiolani Blvd, Honolulu, HI 96826",
          city: "Honolulu",
          state: "HI", 
          zipCode: "96826",
          status: "tax_delinquent",
          priority: "low",
          amountOwed: 8500,
          estimatedValue: 1200000,
          ownerName: "Pacific Holdings LLC",
          sourceUrl: "https://files.hawaii.gov/tax/news/announce/",
        }
      ];

      properties.push(...mockProperties);
      
    } catch (error) {
      console.error('Error scraping tax delinquent list:', error);
      throw error;
    }

    return properties;
  }

  async scheduleRegularScraping() {
    try {
      // Check if we should run scraping based on last run time
      const starAdvertiserJob = await storage.getLatestScrapingJob('star_advertiser');
      const taxDelinquentJob = await storage.getLatestScrapingJob('tax_delinquent');

      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Run Star Advertiser daily
      if (!starAdvertiserJob || !starAdvertiserJob.lastRunAt || new Date(starAdvertiserJob.lastRunAt) < oneDayAgo) {
        console.log('Starting scheduled Star Advertiser scraping...');
        this.startScraping('star_advertiser');
      }

      // Run tax delinquent weekly
      if (!taxDelinquentJob || !taxDelinquentJob.lastRunAt || new Date(taxDelinquentJob.lastRunAt) < oneWeekAgo) {
        console.log('Starting scheduled tax delinquent scraping...');
        this.startScraping('tax_delinquent');
      }
    } catch (error) {
      console.error('Error in scheduled scraping:', error);
    }
  }
}

export const scraperService = new ScraperService();
