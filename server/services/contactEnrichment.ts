import { storage } from "../storage";

class ContactEnrichmentService {
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

      // In a real implementation, this would:
      // 1. Use people search APIs (PeopleDataLabs, FullContact, etc.)
      // 2. Search social media platforms
      // 3. Check public records
      // 4. Validate email addresses
      // 5. Lookup phone numbers

      // Mock enrichment for demo
      if (contact.name && !contact.email) {
        // Simulate finding an email
        const firstName = contact.name.split(' ')[0]?.toLowerCase();
        const lastName = contact.name.split(' ')[1]?.toLowerCase();
        if (firstName && lastName) {
          enrichedData.email = `${firstName}.${lastName}@email.com`;
          enrichedData.contactScore += 30;
        }
      }

      if (contact.name && !contact.phone) {
        // Simulate finding a phone number
        enrichedData.phone = '(808) 555-' + Math.floor(Math.random() * 9000 + 1000);
        enrichedData.contactScore += 30;
      }

      // Check if it's an LLC
      if (contact.name?.toLowerCase().includes('llc') || 
          contact.name?.toLowerCase().includes('inc') ||
          contact.name?.toLowerCase().includes('corp')) {
        enrichedData.isLLC = true;
      }

      // Simulate finding social media profiles
      if (contact.name && Math.random() > 0.5) {
        const namePart = contact.name.toLowerCase().replace(/\s+/g, '');
        enrichedData.linkedinUrl = `https://linkedin.com/in/${namePart}`;
        enrichedData.contactScore += 5;
      }

      if (contact.name && Math.random() > 0.7) {
        const namePart = contact.name.toLowerCase().replace(/\s+/g, '.');
        enrichedData.facebookUrl = `https://facebook.com/${namePart}`;
        enrichedData.contactScore += 5;
      }

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
