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

      // Only perform real contact enrichment - no mock data generation
      // TODO: Implement real contact enrichment APIs (PeopleDataLabs, FullContact, etc.)
      // For now, only calculate score and add metadata without generating fake contact info

      console.log('Contact enrichment requires external API integration - skipping mock data generation');

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

      // Skip social media profile generation - requires real API integration

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

      // Only use real email data - no fake generation
      const hasEmail = contact.email && contact.email.length > 0;
      if (!hasEmail) {
        console.log(`No email found for contact ${contact.id} - requires real contact enrichment API`);
      }

      return enrichedData;
    } catch (error) {
      console.error('Error in contact enrichment:', error);
      return { contactScore: contact.contactScore || 0 };
    }
  }



  async batchEnrichContacts(): Promise<{ processed: number; failed: number }> {
    try {
      // Get contacts that need enrichment (no enrichment status or failed status)
      const contactsToEnrich = await storage.getProperties({ limit: 100 })
        .then(properties => properties.flatMap(p => p.contacts || []))
        .catch(() => []);

      let processed = 0;
      let failed = 0;

      for (const contact of contactsToEnrich) {
        if (!contact.enrichmentStatus || contact.enrichmentStatus === 'failed') {
          try {
            await this.enrichContact(contact.id);
            processed++;
          } catch (error) {
            console.error(`Failed to enrich contact ${contact.id}:`, error);
            failed++;
          }
          // Add delay to prevent overwhelming external APIs
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      return { processed, failed };
    } catch (error) {
      console.error('Batch enrichment error:', error);
      return { processed: 0, failed: 0 };
    }
  }
}

export const contactEnrichmentService = new ContactEnrichmentService();