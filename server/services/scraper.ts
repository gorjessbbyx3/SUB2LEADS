import * as cheerio from 'cheerio';
import { storage } from '../storage';

interface ScrapedProperty {
  address: string;
  ownerName?: string;
  propertyType?: string;
  lienAmount?: number;
  estimatedValue?: number;
  auctionDate?: Date;
  status: 'foreclosure' | 'tax_delinquent' | 'active';
  priority: 'low' | 'medium' | 'high';
  source: string;
}

class ScraperService {
  async startScraping(source: 'star_advertiser' | 'tax_delinquent') {
    console.log(`Starting scraping for source: ${source}`);

    const job = await storage.createScrapingJob({
      source,
      status: 'running',
      startedAt: new Date(),
    });

    // Start scraping in background
    this.runScraping(job.id, source).catch(error => {
      console.error(`Scraping failed for job ${job.id}:`, error);
      storage.updateScrapingJob(job.id, {
        status: 'failed',
        error: error.message,
        completedAt: new Date(),
      });
    });

    return job;
  }

  private async runScraping(jobId: number, source: string) {
    try {
      let properties: ScrapedProperty[] = [];

      switch (source) {
        case 'star_advertiser':
          properties = await this.scrapeStarAdvertiser();
          break;
        case 'tax_delinquent':
          properties = await this.scrapeTaxDelinquent();
          break;
        default:
          throw new Error(`Unknown scraping source: ${source}`);
      }

      // Save properties to database
      const savedProperties = [];
      for (const prop of properties) {
        try {
          const saved = await storage.createProperty({
            address: prop.address,
            ownerName: prop.ownerName,
            propertyType: prop.propertyType,
            lienAmount: prop.lienAmount,
            estimatedValue: prop.estimatedValue,
            auctionDate: prop.auctionDate,
            status: prop.status,
            priority: prop.priority,
            source: prop.source,
            latitude: null,
            longitude: null,
          });
          savedProperties.push(saved);
        } catch (error) {
          console.error(`Failed to save property ${prop.address}:`, error);
        }
      }

      await storage.updateScrapingJob(jobId, {
        status: 'completed',
        propertiesFound: properties.length,
        propertiesSaved: savedProperties.length,
        completedAt: new Date(),
      });

      console.log(`Scraping completed: ${savedProperties.length}/${properties.length} properties saved`);
    } catch (error) {
      await storage.updateScrapingJob(jobId, {
        status: 'failed',
        error: error.message,
        completedAt: new Date(),
      });
      throw error;
    }
  }

  private async scrapeStarAdvertiser(): Promise<ScrapedProperty[]> {
    console.log('Scraping Honolulu Star-Advertiser legal notices...');

    // Mock data for now - in real implementation, you'd scrape the actual website
    return [
      {
        address: '123 Kalakaua Ave, Honolulu, HI 96815',
        ownerName: 'John Doe',
        propertyType: 'residential',
        lienAmount: 150000,
        estimatedValue: 450000,
        auctionDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        status: 'foreclosure',
        priority: 'high',
        source: 'star_advertiser',
      },
      {
        address: '456 Beretania St, Honolulu, HI 96814',
        ownerName: 'Jane Smith',
        propertyType: 'condo',
        lienAmount: 85000,
        estimatedValue: 320000,
        auctionDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days from now
        status: 'foreclosure',
        priority: 'medium',
        source: 'star_advertiser',
      },
    ];
  }

  private async scrapeTaxDelinquent(): Promise<ScrapedProperty[]> {
    console.log('Scraping tax delinquent properties...');

    // Mock data for now - in real implementation, you'd scrape the actual website
    return [
      {
        address: '789 King St, Honolulu, HI 96813',
        ownerName: 'Robert Johnson',
        propertyType: 'commercial',
        lienAmount: 25000,
        estimatedValue: 280000,
        status: 'tax_delinquent',
        priority: 'medium',
        source: 'tax_delinquent',
      },
      {
        address: '321 Queen St, Honolulu, HI 96813',
        ownerName: 'Maria Garcia',
        propertyType: 'residential',
        lienAmount: 15000,
        estimatedValue: 380000,
        status: 'tax_delinquent',
        priority: 'low',
        source: 'tax_delinquent',
      },
    ];
  }
}

export const scraperService = new ScraperService();