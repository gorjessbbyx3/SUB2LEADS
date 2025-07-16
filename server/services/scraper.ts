import { spawn } from 'child_process';
import { storage } from '../storage';
import { ContactEnrichmentService } from './contactEnrichment.js';
import type { InsertProperty, InsertContact, InsertScrapingJob } from '@shared/schema';
import path from 'path';

class ScraperService {
  private contactEnrichment: ContactEnrichmentService;

  constructor() {
    this.contactEnrichment = new ContactEnrichmentService();
  }

  async startScraping(source: string): Promise<{ success: boolean; message: string; propertiesFound: number }> {
    console.log(`Starting scraping job for source: ${source}`);

    // Create scraping job record
    const job = await storage.createScrapingJob({
      source,
      status: 'running',
      startedAt: new Date(),
      propertiesFound: 0,
      propertiesProcessed: 0,
    });

    try {
      let properties: any[] = [];

      switch (source) {
        case 'star_advertiser':
          properties = await this.scrapeStarAdvertiser();
          break;
        case 'honolulu_tax':
          properties = await this.scrapeHonoluluTax();
          break;
        case 'hawaii_judiciary':
          properties = await this.scrapeHawaiiJudiciary();
          break;
        case 'all':
          const starProps = await this.scrapeStarAdvertiser();
          const taxProps = await this.scrapeHonoluluTax();
          const judiciaryProps = await this.scrapeHawaiiJudiciary();
          properties = [...starProps, ...taxProps, ...judiciaryProps];
          break;
        default:
          throw new Error(`Unknown scraping source: ${source}`);
      }

      // Process and store properties
      const processedCount = await this.processProperties(properties);

      // Update job status
      await storage.updateScrapingJob(job.id, {
        status: 'completed',
        completedAt: new Date(),
        propertiesFound: properties.length,
        propertiesProcessed: processedCount,
      });

      return {
        success: true,
        message: `Successfully scraped ${properties.length} properties from ${source}`,
        propertiesFound: properties.length,
      };
    } catch (error) {
      console.error('Scraping job error:', error);

      // Update job with error
      await storage.updateScrapingJob(job.id, {
        status: 'failed',
        completedAt: new Date(),
        errorMessage: error.message,
      });

      throw error;
    }
  }

  private async runPythonScraper(scriptName: string, args: string[] = []): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const scriptPath = path.join(process.cwd(), 'server', 'scrapers', scriptName);
      const pythonProcess = spawn('python3', [scriptPath, ...args]);

      let output = '';
      let errorOutput = '';

      pythonProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code === 0) {
          try {
            // Try to parse JSON output from Python script
            const lines = output.trim().split('\n');
            const jsonLine = lines.find(line => line.startsWith('[') || line.startsWith('{'));

            if (jsonLine) {
              const data = JSON.parse(jsonLine);
              resolve(Array.isArray(data) ? data : [data]);
            } else {
              // Fallback to mock data if parsing fails
              resolve([]);
            }
          } catch (error) {
            console.warn(`Failed to parse JSON from ${scriptName}:`, error);
            resolve([]);
          }
        } else {
          console.error(`Python script ${scriptName} failed:`, errorOutput);
          reject(new Error(`Script failed with code ${code}: ${errorOutput}`));
        }
      });
    });
  }

  private async scrapeStarAdvertiser(): Promise<any[]> {
    console.log('Scraping Star Advertiser foreclosures...');

    try {
      const properties = await this.runPythonScraper('staradvertiser_foreclosure_scraper.py');
      return properties.map(prop => ({
        ...prop,
        priority: this.calculatePriority(prop),
        estimatedValue: prop.estimated_value || this.estimatePropertyValue(prop.address),
        daysUntilAuction: prop.auction_date ? this.calculateDaysUntilAuction(prop.auction_date) : null,
      }));
    } catch (error) {
      console.error('Star Advertiser scraping failed:', error);
      // Return empty array instead of mock data to maintain data integrity
      return [];
    }
  }

  private async scrapeHonoluluTax(): Promise<any[]> {
    console.log('Scraping Honolulu Property Tax delinquencies...');

    try {
      const properties = await this.runPythonScraper('honolulu_tax_scraper.py');
      return properties.map(prop => ({
        ...prop,
        priority: this.calculatePriority(prop),
        estimatedValue: prop.estimated_value || this.estimatePropertyValue(prop.address),
        status: 'tax_delinquent',
      }));
    } catch (error) {
      console.error('Honolulu Tax scraping failed:', error);
      // Return empty array instead of mock data to maintain data integrity
      return [];
    }
  }

  private async scrapeHawaiiJudiciary(): Promise<any[]> {
    console.log('Scraping Hawaii Judiciary foreclosure cases...');

    try {
      const properties = await this.runPythonScraper('pdf_parser.py');
      return properties.map(prop => ({
        ...prop,
        priority: this.calculatePriority(prop),
        estimatedValue: prop.estimated_value || this.estimatePropertyValue(prop.address),
        status: 'foreclosure',
        source: 'hawaii_judiciary',
      }));
    } catch (error) {
      console.error('Hawaii Judiciary scraping failed:', error);
      // Return empty array instead of mock data to maintain data integrity
      return [];
    }
  }

  private calculatePriority(property: any): string {
    const amountOwed = property.amount_owed || property.amountOwed || 0;
    const estimatedValue = property.estimated_value || property.estimatedValue || 0;
    const daysUntilAuction = property.days_until_auction || this.calculateDaysUntilAuction(property.auction_date);

    // High priority: high value, urgent timeline, or significant debt
    if (estimatedValue > 500000 || daysUntilAuction <= 30 || amountOwed > 300000) {
      return 'high';
    }

    // Medium priority: moderate value and debt
    if (estimatedValue > 200000 || amountOwed > 50000) {
      return 'medium';
    }

    return 'low';
  }

  private calculateDaysUntilAuction(auctionDate: string): number | null {
    if (!auctionDate) return null;

    try {
      const auction = new Date(auctionDate);
      const now = new Date();
      const diffTime = auction.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 0 ? diffDays : 0;
    } catch {
      return null;
    }
  }

  private estimatePropertyValue(address: string): number {
    // Simple estimation based on location patterns
    const lowerAddress = address.toLowerCase();

    if (lowerAddress.includes('kailua') || lowerAddress.includes('lanikai')) {
      return Math.floor(Math.random() * 500000) + 700000; // $700k-$1.2M
    } else if (lowerAddress.includes('honolulu') || lowerAddress.includes('waikiki')) {
      return Math.floor(Math.random() * 400000) + 500000; // $500k-$900k
    } else if (lowerAddress.includes('pearl city') || lowerAddress.includes('aiea')) {
      return Math.floor(Math.random() * 300000) + 400000; // $400k-$700k
    } else {
      return Math.floor(Math.random() * 250000) + 350000; // $350k-$600k
    }
  }

  private async processProperties(properties: any[]): Promise<number> {
    let processedCount = 0;

    for (const propertyData of properties) {
      try {
        // Check if property already exists
        const existingProperties = await storage.getProperties({ limit: 1000 });
        const exists = existingProperties.some(p => 
          p.address.toLowerCase() === propertyData.address?.toLowerCase()
        );

        if (exists) {
          console.log(`Property already exists: ${propertyData.address}`);
          continue;
        }

        // Create property record
        const property = await storage.createProperty({
          address: propertyData.address || '',
          city: this.extractCity(propertyData.address || ''),
          state: 'HI',
          zipCode: this.extractZipCode(propertyData.address || ''),
          estimatedValue: propertyData.estimatedValue || propertyData.estimated_value,
          status: propertyData.status,
          priority: propertyData.priority || 'medium',
          amountOwed: propertyData.amountOwed || propertyData.amount_owed,
          daysUntilAuction: propertyData.daysUntilAuction || this.calculateDaysUntilAuction(propertyData.auction_date),
          auctionDate: propertyData.auction_date ? new Date(propertyData.auction_date).toISOString().split('T')[0] : null,
          sourceUrl: propertyData.source_url || propertyData.sourceUrl,
          propertyType: propertyData.propertyType || propertyData.property_type || 'residential',
        });

        // Create contact if owner information exists
        const ownerName = propertyData.owner_name || propertyData.ownerName || propertyData.defendant;
        if (ownerName) {
          const contact = await storage.createContact({
            propertyId: property.id,
            name: ownerName,
            email: propertyData.owner_email || propertyData.ownerEmail,
            phone: propertyData.owner_phone || propertyData.ownerPhone,
          });

          // Enrich contact information in background
          this.contactEnrichment.enrichContact(contact.id).catch(error => {
            console.error(`Error enriching contact ${contact.id}:`, error);
          });
        }

        processedCount++;
      } catch (error) {
        console.error(`Error processing property ${propertyData.address}:`, error);
      }
    }

    return processedCount;
  }

  private extractCity(address: string): string {
    const parts = address.split(',');
    return parts.length >= 2 ? parts[1].trim() : 'Honolulu';
  }

  private extractZipCode(address: string): string {
    const zipMatch = address.match(/\b\d{5}\b/);
    return zipMatch ? zipMatch[0] : '';
  }

  async getScrapingHistory(): Promise<any[]> {
    return await storage.getScrapingJobs(20);
  }

  async runAllScrapers(): Promise<{ success: boolean; message: string; results: any[] }> {
    console.log('Running all scrapers...');

    const results = [];

    try {
      const starResult = await this.runScrapingJob('star_advertiser');
      results.push({ source: 'star_advertiser', ...starResult });
    } catch (error) {
      results.push({ source: 'star_advertiser', success: false, message: error.message });
    }

    try {
      const taxResult = await this.runScrapingJob('honolulu_tax');
      results.push({ source: 'honolulu_tax', ...taxResult });
    } catch (error) {
      results.push({ source: 'honolulu_tax', success: false, message: error.message });
    }

    try {
      const judiciaryResult = await this.runScrapingJob('hawaii_judiciary');
      results.push({ source: 'hawaii_judiciary', ...judiciaryResult });
    } catch (error) {
      results.push({ source: 'hawaii_judiciary', success: false, message: error.message });
    }

    const totalProperties = results.reduce((sum, result) => sum + (result.propertiesFound || 0), 0);

    return {
      success: true,
      message: `Completed all scrapers. Found ${totalProperties} total properties.`,
      results
    };
  }
}

export const scraperService = new ScraperService();