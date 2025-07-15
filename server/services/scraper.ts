import puppeteer from 'puppeteer';
import { storage } from '../storage';

interface ScrapedProperty {
  address: string;
  ownerName?: string;
  propertyType?: string;
  lienAmount?: number;
  taxStatus?: string;
  auctionDate?: Date;
  description?: string;
  source: string;
}

class ScraperService {
  private browser: any = null;

  async initBrowser() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
    }
    return this.browser;
  }

  async startScraping(source: string) {
    const job = await storage.createScrapingJob(source, 'running');

    try {
      let properties: ScrapedProperty[] = [];

      if (source === 'star_advertiser') {
        properties = await this.scrapeStarAdvertiser();
      } else if (source === 'tax_delinquent') {
        properties = await this.scrapeTaxDelinquent();
      }

      // Save properties to database
      for (const prop of properties) {
        await storage.createProperty({
          address: prop.address,
          ownerName: prop.ownerName,
          propertyType: prop.propertyType || 'residential',
          status: 'new',
          priority: 'medium',
          source: prop.source,
          lienAmount: prop.lienAmount,
          taxStatus: prop.taxStatus,
          auctionDate: prop.auctionDate,
          description: prop.description,
        });
      }

      await storage.updateScrapingJob(job.id, {
        status: 'completed',
        propertiesFound: properties.length,
        completedAt: new Date(),
      });

      return { ...job, status: 'completed', propertiesFound: properties.length };
    } catch (error) {
      console.error(`Scraping error for ${source}:`, error);
      await storage.updateScrapingJob(job.id, {
        status: 'failed',
        error: error.message,
        completedAt: new Date(),
      });
      throw error;
    }
  }

  async scrapeStarAdvertiser(): Promise<ScrapedProperty[]> {
    const browser = await this.initBrowser();
    const page = await browser.newPage();
    const properties: ScrapedProperty[] = [];

    try {
      // Navigate to Star-Advertiser legal notices
      await page.goto('https://www.staradvertiser.com/classifieds/legal-notices/', {
        waitUntil: 'networkidle2'
      });

      // Look for foreclosure notices
      const notices = await page.evaluate(() => {
        const items = document.querySelectorAll('.legal-notice-item, .notice-item, .foreclosure-notice');
        return Array.from(items).map(item => {
          const text = item.textContent || '';
          const titleElement = item.querySelector('h3, h4, .title');
          const title = titleElement?.textContent || '';

          return { text, title };
        });
      });

      // Parse addresses and details from notices
      for (const notice of notices) {
        const addressMatch = notice.text.match(/(?:located at|situated at|property at)\s*([^,\n]+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Way|Circle|Cir|Court|Ct|Boulevard|Blvd)[^,\n]*)/i);

        if (addressMatch) {
          const address = addressMatch[1].trim();

          // Extract owner name
          const ownerMatch = notice.text.match(/(?:vs\.|versus|against)\s*([^,\n]+?)(?:\s*et\s*al\.?)?(?:\s*,|\s*defendant)/i);
          const ownerName = ownerMatch ? ownerMatch[1].trim() : undefined;

          // Extract lien amount
          const lienMatch = notice.text.match(/\$([0-9,]+\.?\d*)/);
          const lienAmount = lienMatch ? parseFloat(lienMatch[1].replace(/,/g, '')) : undefined;

          // Extract auction date
          const dateMatch = notice.text.match(/(?:auction|sale).*?(\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2})/i);
          const auctionDate = dateMatch ? new Date(dateMatch[1]) : undefined;

          properties.push({
            address,
            ownerName,
            lienAmount,
            auctionDate,
            description: notice.text.substring(0, 500),
            source: 'star_advertiser',
            taxStatus: 'foreclosure',
            propertyType: 'residential'
          });
        }
      }

    } catch (error) {
      console.error('Star-Advertiser scraping error:', error);
    } finally {
      await page.close();
    }

    return properties;
  }

  async scrapeTaxDelinquent(): Promise<ScrapedProperty[]> {
    const browser = await this.initBrowser();
    const page = await browser.newPage();
    const properties: ScrapedProperty[] = [];

    try {
      // Navigate to Hawaii tax delinquent properties
      await page.goto('https://www.realquest.com/hawaii/delinquent', {
        waitUntil: 'networkidle2'
      });

      // This would need to be customized based on the actual site structure
      const taxProperties = await page.evaluate(() => {
        const rows = document.querySelectorAll('tr, .property-row');
        return Array.from(rows).map(row => {
          const cells = row.querySelectorAll('td, .cell');
          if (cells.length >= 3) {
            return {
              address: cells[0]?.textContent?.trim() || '',
              owner: cells[1]?.textContent?.trim() || '',
              amount: cells[2]?.textContent?.trim() || ''
            };
          }
          return null;
        }).filter(Boolean);
      });

      for (const prop of taxProperties) {
        if (prop && prop.address) {
          const lienAmount = prop.amount ? parseFloat(prop.amount.replace(/[$,]/g, '')) : undefined;

          properties.push({
            address: prop.address,
            ownerName: prop.owner,
            lienAmount,
            source: 'tax_delinquent',
            taxStatus: 'delinquent',
            propertyType: 'residential'
          });
        }
      }

    } catch (error) {
      console.error('Tax delinquent scraping error:', error);
    } finally {
      await page.close();
    }

    return properties;
  }

  async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

export const scraperService = new ScraperService();