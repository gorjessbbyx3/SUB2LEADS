import { storage } from "../storage";

export class ContactEnrichmentService {
  async enrichContact(contactId: number) {
    try {
      const contact = await storage.getContact(contactId);
      if (!contact) {
        throw new Error('Contact not found');
      }

      console.log(`Starting contact enrichment for: ${contact.name}`);

      // Update status to processing
      await storage.updateContact(contactId, {
        enrichmentStatus: 'pending'
      });

      const enrichedData = await this.performEnrichment(contact);

      // Update contact with enriched data
      await storage.updateContact(contactId, {
        ...enrichedData,
        enrichmentStatus: 'completed',
        lastEnriched: new Date(),
      });

      console.log(`Contact enrichment completed for: ${contact.name}`);
    } catch (error) {
      console.error('Contact enrichment failed:', error);
      await storage.updateContact(contactId, {
        enrichmentStatus: 'failed',
      });
    }
  }

  private async performEnrichment(contact: any) {
    const enrichedData: any = {};

    try {
      // Calculate contact completeness score
      let score = 0;
      if (contact.name) score += 20;
      if (contact.email) score += 30;
      if (contact.phone) score += 30;
      if (contact.address) score += 10;
      if (contact.linkedinUrl) score += 5;
      if (contact.facebookUrl) score += 5;

      enrichedData.contactScore = score;

      // Enhanced mock enrichment for demo
      if (contact.name && !contact.email) {
        // Simulate finding an email with more realistic patterns
        const firstName = contact.name.split(' ')[0]?.toLowerCase();
        const lastName = contact.name.split(' ')[1]?.toLowerCase();
        if (firstName && lastName) {
          const emailProviders = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'hawaii.rr.com'];
          const provider = emailProviders[Math.floor(Math.random() * emailProviders.length)];
          const patterns = [
            `${firstName}.${lastName}@${provider}`,
            `${firstName}${lastName}@${provider}`,
            `${firstName}_${lastName}@${provider}`,
            `${firstName}${lastName[0]}@${provider}`,
          ];
          enrichedData.email = patterns[Math.floor(Math.random() * patterns.length)];
          enrichedData.contactScore += 30;
        }
      }

      if (contact.name && !contact.phone) {
        // Simulate finding a phone number with Hawaii area codes
        const areaCodes = ['808'];
        const areaCode = areaCodes[Math.floor(Math.random() * areaCodes.length)];
        const exchange = Math.floor(Math.random() * 900 + 100);
        const number = Math.floor(Math.random() * 9000 + 1000);
        enrichedData.phone = `(${areaCode}) ${exchange}-${number}`;
        enrichedData.contactScore += 30;
      }

      // Check if it's an LLC or corporation
      if (contact.name?.toLowerCase().includes('llc') || 
          contact.name?.toLowerCase().includes('inc') ||
          contact.name?.toLowerCase().includes('corp') ||
          contact.name?.toLowerCase().includes('ltd') ||
          contact.name?.toLowerCase().includes('limited')) {
        enrichedData.isLLC = true;
        enrichedData.contactType = 'business';
      } else {
        enrichedData.contactType = 'individual';
      }

      // Simulate finding social media profiles with more realistic probability
      if (contact.name && Math.random() > 0.4) {
        const namePart = contact.name.toLowerCase().replace(/\s+/g, '');
        enrichedData.linkedinUrl = `https://linkedin.com/in/${namePart}`;
        enrichedData.contactScore += 5;
      }

      if (contact.name && Math.random() > 0.6) {
        const namePart = contact.name.toLowerCase().replace(/\s+/g, '.');
        enrichedData.facebookUrl = `https://facebook.com/${namePart}`;
        enrichedData.contactScore += 5;
      }

      // Add estimated income/property value insights
      if (contact.estimatedValue) {
        if (contact.estimatedValue > 800000) {
          enrichedData.wealthIndicator = 'high';
        } else if (contact.estimatedValue > 400000) {
          enrichedData.wealthIndicator = 'medium';
        } else {
          enrichedData.wealthIndicator = 'low';
        }
      }

      // Add contact quality score
      enrichedData.leadQuality = enrichedData.contactScore >= 80 ? 'hot' : 
                                enrichedData.contactScore >= 60 ? 'warm' : 'cold';

      return enrichedData;
    } catch (error) {
      console.error('Error in contact enrichment:', error);
      return { contactScore: contact.contactScore || 0 };
    }
  }

  async batchEnrichContacts() {
    try {
      // Find contacts that need enrichment
      const allProperties = await storage.getProperties({ limit: 1000 });
      
      for (const property of allProperties) {
        const contacts = await storage.getContactsByProperty(property.id);
        
        for (const contact of contacts) {
          if (contact.enrichmentStatus === 'pending' || !contact.enrichmentStatus) {
            // Add delay to avoid rate limiting
            setTimeout(() => {
              this.enrichContact(contact.id);
            }, Math.random() * 5000);
          }
        }
      }
    } catch (error) {
      console.error('Error in batch contact enrichment:', error);
    }
  }
}

export const contactEnrichmentService = new ContactEnrichmentService();

class ContactEnrichmentService {
