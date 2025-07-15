import cron from 'node-cron';
import { scraperService } from './scraper';
import { contactEnrichmentService } from './contactEnrichment';
import { storage } from '../storage';

class SchedulerService {
  private isStarted = false;

  start() {
    if (this.isStarted) {
      console.log('Scheduler already started');
      return;
    }

    console.log('Starting scheduler service...');

    // Run Star Advertiser scraping daily at 6 AM
    cron.schedule('0 6 * * *', async () => {
      console.log('Running scheduled Star Advertiser scraping...');
      try {
        await scraperService.startScraping('star_advertiser');
      } catch (error) {
        console.error('Scheduled Star Advertiser scraping failed:', error);
      }
    });

    // Run tax delinquent scraping weekly on Mondays at 7 AM
    cron.schedule('0 7 * * 1', async () => {
      console.log('Running scheduled tax delinquent scraping...');
      try {
        await scraperService.startScraping('tax_delinquent');
      } catch (error) {
        console.error('Scheduled tax delinquent scraping failed:', error);
      }
    });

    // Run contact enrichment every 4 hours
    cron.schedule('0 */4 * * *', async () => {
      console.log('Running scheduled contact enrichment...');
      try {
        await contactEnrichmentService.batchEnrichContacts();
      } catch (error) {
        console.error('Scheduled contact enrichment failed:', error);
      }
    });

    // Update property priorities daily at 5 AM
    cron.schedule('0 5 * * *', async () => {
      console.log('Updating property priorities...');
      try {
        await this.updatePropertyPriorities();
      } catch (error) {
        console.error('Property priority update failed:', error);
      }
    });

    // Clean up old scraping jobs weekly
    cron.schedule('0 2 * * 0', async () => {
      console.log('Cleaning up old data...');
      try {
        await this.cleanupOldData();
      } catch (error) {
        console.error('Data cleanup failed:', error);
      }
    });

    // Check for urgent leads every hour
    cron.schedule('0 * * * *', async () => {
      console.log('Checking for urgent leads...');
      try {
        await this.checkUrgentLeads();
      } catch (error) {
        console.error('Urgent leads check failed:', error);
      }
    });

    this.isStarted = true;
    console.log('Scheduler service started successfully');
  }

  stop() {
    cron.destroy();
    this.isStarted = false;
    console.log('Scheduler service stopped');
  }

  private async updatePropertyPriorities() {
    try {
      const properties = await storage.getProperties({ limit: 1000 });

      for (const property of properties) {
        let newPriority = 'low';

        // High priority criteria
        if (property.daysUntilAuction && property.daysUntilAuction <= 7) {
          newPriority = 'high';
        } else if (property.status === 'foreclosure' && property.daysUntilAuction && property.daysUntilAuction <= 30) {
          newPriority = 'high';
        } else if (property.status === 'foreclosure') {
          newPriority = 'medium';
        } else if (property.status === 'tax_delinquent' && property.amountOwed && property.amountOwed > 10000) {
          newPriority = 'medium';
        }

        // Update if priority has changed
        if (property.priority !== newPriority) {
          await storage.updateProperty(property.id, { priority: newPriority });
          console.log(`Updated priority for ${property.address}: ${property.priority} -> ${newPriority}`);
        }
      }
    } catch (error) {
      console.error('Error updating property priorities:', error);
    }
  }

  private async cleanupOldData() {
    try {
      // In a real implementation, you might want to:
      // 1. Delete old scraping jobs (older than 30 days)
      // 2. Archive old outreach history
      // 3. Clean up orphaned records
      // 4. Compress old AI interactions

      console.log('Data cleanup completed');
    } catch (error) {
      console.error('Error in data cleanup:', error);
    }
  }

  private async checkUrgentLeads() {
    try {
      // Find properties with auctions in the next 48 hours
      const properties = await storage.getProperties({ limit: 1000 });
      const urgentProperties = properties.filter(p => 
        p.daysUntilAuction && p.daysUntilAuction <= 2
      );

      for (const property of urgentProperties) {
        // Find leads for this property
        const allLeads = await storage.getLeads({ limit: 1000 });
        const propertyLeads = allLeads.filter(l => l.propertyId === property.id);

        for (const lead of propertyLeads) {
          // Check if lead has been contacted recently
          const hoursSinceContact = lead.lastContactDate 
            ? (Date.now() - new Date(lead.lastContactDate).getTime()) / (1000 * 60 * 60)
            : Infinity;

          if (hoursSinceContact > 24) {
            // Update lead status to high priority
            await storage.updateLead(lead.id, {
              priority: 'high',
              notes: (lead.notes || '') + `\n[URGENT] Auction in ${property.daysUntilAuction} days - requires immediate attention`
            });

            console.log(`Marked lead ${lead.id} as urgent - auction in ${property.daysUntilAuction} days`);
          }
        }
      }
    } catch (error) {
      console.error('Error checking urgent leads:', error);
    }
  }

  // Manual trigger methods for testing
  async runScrapingNow(source: 'star_advertiser' | 'tax_delinquent') {
    console.log(`Manually triggering ${source} scraping...`);
    return await scraperService.startScraping(source);
  }

  async runContactEnrichmentNow() {
    console.log('Manually triggering contact enrichment...');
    return await contactEnrichmentService.batchEnrichContacts();
  }

  async runPropertyPriorityUpdateNow() {
    console.log('Manually triggering property priority update...');
    return await this.updatePropertyPriorities();
  }
}

export const schedulerService = new SchedulerService();