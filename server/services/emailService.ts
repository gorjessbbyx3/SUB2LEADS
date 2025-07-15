import sgMail from '@sendgrid/mail';
import { storage } from '../storage';
import { aiService } from './aiService';

sgMail.setApiKey(process.env.SENDGRID_API_KEY || 'your-sendgrid-key-here');

interface EmailResult {
  success: boolean;
  messageId?: string;
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

      const msg = {
        to: contact.email,
        from: {
          email: process.env.FROM_EMAIL || 'noreply@hawaiicrm.com',
          name: 'Hawaii Investment Team'
        },
        subject,
        html: this.formatEmailHTML(body, property, contact),
        text: body,
        trackingSettings: {
          clickTracking: { enable: true },
          openTracking: { enable: true },
          subscriptionTracking: { enable: false },
        },
        customArgs: {
          leadId: lead.id.toString(),
          propertyId: property.id.toString(),
          templateId,
        },
      };

      const response = await sgMail.send(msg);

      // Log email sent
      await storage.createEmailLog({
        leadId: lead.id,
        propertyId: property.id,
        contactId: contact.id,
        subject,
        content: body,
        status: 'sent',
        templateId,
        sendgridMessageId: response[0].headers['x-message-id'],
      });

      // Update lead status
      await storage.updateLead(lead.id, {
        status: 'contacted',
        lastContactDate: new Date(),
      });

      return {
        success: true,
        messageId: response[0].headers['x-message-id'],
      };

    } catch (error) {
      console.error('Email sending error:', error);

      // Log failed email
      await storage.createEmailLog({
        leadId: lead.id,
        propertyId: lead.propertyId,
        subject: 'Failed to send',
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

  private formatEmailHTML(body: string, property: any, contact: any): string {
    const htmlBody = body
      .replace(/\n/g, '<br>')
      .replace('{address}', property.address)
      .replace('{ownerName}', contact.name || 'Property Owner')
      .replace('{agentName}', 'Hawaii Investment Team')
      .replace('{agentPhone}', '(808) 555-0123')
      .replace('{agentEmail}', 'info@hawaiiinvestments.com');

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Hawaii Investment Opportunity</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h2 style="color: #2563eb; margin: 0;">Hawaii Investment Team</h2>
        <p style="margin: 5px 0; color: #6b7280;">Professional Real Estate Solutions</p>
    </div>

    <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb;">
        ${htmlBody}
    </div>

    <div style="margin-top: 20px; padding: 15px; background: #f3f4f6; border-radius: 8px; font-size: 12px; color: #6b7280;">
        <p>This email was sent regarding the property at ${property.address}.</p>
        <p>If you no longer wish to receive these emails, please reply with "UNSUBSCRIBE".</p>
    </div>
</body>
</html>`;
  }

  async handleWebhook(eventData: any) {
    try {
      const { event, leadId, propertyId } = eventData;

      if (leadId) {
        await storage.createEmailEvent({
          leadId: parseInt(leadId),
          event,
          timestamp: new Date(),
          data: eventData,
        });

        // Update lead based on event
        if (event === 'open') {
          await storage.updateLead(parseInt(leadId), {
            emailOpened: true,
            lastEmailOpenDate: new Date(),
          });
        } else if (event === 'click') {
          await storage.updateLead(parseInt(leadId), {
            emailClicked: true,
            lastEmailClickDate: new Date(),
            status: 'engaged',
          });
        }
      }
    } catch (error) {
      console.error('Webhook handling error:', error);
    }
  }

  async getEmailTemplates() {
    return aiService.getEmailTemplates();
  }
}

export const emailService = new EmailService();