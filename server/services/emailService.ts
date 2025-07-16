import { storage } from '../storage';
import { aiService } from './aiService';

interface EmailResult {
  success: boolean;
  mailtoLink?: string;
  error?: string;
}

class EmailService {
  async sendEmail(lead: any, templateId: string, customMessage?: string): Promise<EmailResult> {
    try {
      // Get property and contact details
      const property = await storage.getProperty(lead.propertyId);
      const contacts = await storage.getContactsByProperty(lead.propertyId);
      const contact = contacts[0]; // Use first contact

      if (!property || !contact || !contact.email) {
        throw new Error('Missing property or contact information');
      }

      // Generate AI email content
      const emailContent = await aiService.generateEmail(property, contact, templateId, customMessage);

      // Extract subject and body
      const lines = emailContent.split('\n');
      const subjectLine = lines.find(line => line.toLowerCase().includes('subject:'));
      const subject = subjectLine 
        ? subjectLine.replace(/subject:\s*/i, '').trim()
        : `Regarding Your Property at ${property.address}`;

      const body = emailContent.replace(subjectLine || '', '').trim();

      // Create mailto link
      const mailtoLink = this.createMailtoLink(contact.email, subject, body);

      // Log email generation
      await storage.createEmailLog({
        leadId: lead.id,
        propertyId: property.id,
        contactId: contact.id,
        subject,
        content: body,
        status: 'generated',
        templateId,
        mailtoLink,
      });

      return {
        success: true,
        mailtoLink,
      };

    } catch (error) {
      console.error('Email generation error:', error);

      // Log failed email
      await storage.createEmailLog({
        leadId: lead.id,
        propertyId: lead.propertyId,
        subject: 'Failed to generate',
        content: error.message,
        status: 'failed',
        templateId,
      });

      return {
        success: false,
        error: error.message,
      };
    }
  }

  private createMailtoLink(email: string, subject: string, body: string): string {
    const encodedSubject = encodeURIComponent(subject);
    const encodedBody = encodeURIComponent(body.replace(/\n/g, '\r\n'));

    return `mailto:${email}?subject=${encodedSubject}&body=${encodedBody}`;
  }

  // Generate pre-written email templates
  generateEmailTemplate(lead: any, templateType: string): string {
    const templates = {
      foreclosure: (lead: any) => `Hi ${lead.contact?.name || 'Property Owner'},

I'm reaching out because I noticed your property at ${lead.property?.address} may be at risk of foreclosure. I work with buyers who are looking to help homeowners like you find a way out.

Would you be open to discussing your options?

Best,
Hawaii Investment Team
(808) 555-0123`,

      taxLien: (lead: any) => `Dear ${lead.contact?.name || 'Property Owner'},

I'm writing regarding a tax lien at ${lead.property?.address}. I understand this can be stressful, and I wanted to reach out to see if I could help.

We specialize in resolving tax situations quickly and fairly. Would you be interested in discussing your options?

Sincerely,
Hawaii Investment Team
(808) 555-0123`,

      auction: (lead: any) => `Hello ${lead.contact?.name || 'Property Owner'},

I noticed your property at ${lead.property?.address} is scheduled for auction soon. We may be able to provide a solution that works better for you.

Would you be interested in exploring your options before the auction?

Best,
Hawaii Investment Team
(808) 555-0123`
    };

    return templates[templateType] ? templates[templateType](lead) : templates.foreclosure(lead);
  }

  async getEmailTemplates() {
    return aiService.getEmailTemplates();
  }

  async markEmailSent(leadId: number, emailLogId?: string): Promise<{ success: boolean }> {
    try {
      // Update lead's last contact date
      await storage.updateLead(leadId, {
        lastContactDate: new Date().toISOString(),
      });

      // Create activity record
      await storage.createActivity({
        leadId,
        userId: 'system',
        type: 'email_sent',
        title: 'Email sent to contact',
        description: 'Email outreach completed via mailto link',
      });

      return { success: true };
    } catch (error) {
      console.error('Error marking email as sent:', error);
      return { success: false };
    }
  }

  async createEmailLog(data: any): Promise<any> {
    // This is a placeholder - in the real implementation you'd store email logs
    console.log('Email log created:', data);
    return data;
  }
}

export const emailService = new EmailService();