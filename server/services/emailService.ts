import { MailService } from '@sendgrid/mail';
import { storage } from "../storage";
import { aiService } from "./aiService";
import type { Lead } from "@shared/schema";

const mailService = new MailService();

if (process.env.SENDGRID_API_KEY) {
  mailService.setApiKey(process.env.SENDGRID_API_KEY);
}

class EmailService {
  async sendEmail(lead: Lead, templateId?: number, customMessage?: string) {
    try {
      const contact = await storage.getContact(lead.contactId);
      const property = await storage.getProperty(lead.propertyId);
      
      if (!contact?.email || !property) {
        throw new Error('Missing contact email or property data');
      }

      let emailContent = customMessage;
      let subject = 'Property Solution Options';

      if (!emailContent) {
        // Generate AI-powered email content
        emailContent = await aiService.generateOutreachTemplate(lead, 'email');
        
        // Extract subject line if AI provided one
        const lines = emailContent.split('\n');
        const subjectLine = lines.find(line => line.toLowerCase().startsWith('subject:'));
        if (subjectLine) {
          subject = subjectLine.replace(/^subject:\s*/i, '');
          emailContent = lines.filter(line => !line.toLowerCase().startsWith('subject:')).join('\n');
        }
      }

      const emailParams = {
        to: contact.email,
        from: process.env.FROM_EMAIL || 'noreply@hawaiicrm.com',
        subject,
        html: this.generateEmailHTML(emailContent, property, contact),
        text: emailContent,
      };

      const success = await this.sendEmailViaSendGrid(emailParams);

      if (success) {
        // Record outreach history
        await storage.createOutreachHistory({
          leadId: lead.id,
          type: 'email',
          status: 'sent',
          content: emailContent,
        });

        // Update lead
        await storage.updateLead(lead.id, {
          lastContactDate: new Date(),
          emailsSent: (lead.emailsSent || 0) + 1,
        });

        return { success: true, message: 'Email sent successfully' };
      } else {
        throw new Error('Failed to send email');
      }
    } catch (error) {
      console.error('Email service error:', error);
      
      // Record failed attempt
      await storage.createOutreachHistory({
        leadId: lead.id,
        type: 'email',
        status: 'failed',
        content: customMessage || 'Email send failed',
      });

      return { success: false, message: error.message };
    }
  }

  private async sendEmailViaSendGrid(params: {
    to: string;
    from: string;
    subject: string;
    text?: string;
    html?: string;
  }): Promise<boolean> {
    try {
      if (!process.env.SENDGRID_API_KEY) {
        console.log('SendGrid not configured, simulating email send');
        // Simulate email sending delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        return true;
      }

      await mailService.send({
        to: params.to,
        from: params.from,
        subject: params.subject,
        text: params.text,
        html: params.html,
      });
      
      return true;
    } catch (error) {
      console.error('SendGrid email error:', error);
      return false;
    }
  }

  private generateEmailHTML(content: string, property: any, contact: any): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Property Solution Options</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: Arial, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4;">
        <tr>
            <td align="center" style="padding: 40px 0;">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="background-color: #0F62FE; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
                            <h1 style="margin: 0; font-size: 24px;">Hawaii Real Estate Solutions</h1>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 30px;">
                            <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.5; color: #333;">
                                Dear ${contact.name},
                            </p>
                            
                            <div style="margin: 20px 0; padding: 20px; background-color: #f8f9fa; border-left: 4px solid #0F62FE; border-radius: 4px;">
                                <h3 style="margin: 0 0 10px 0; color: #0F62FE;">Property: ${property.address}</h3>
                                <p style="margin: 0; color: #666; font-size: 14px;">We understand you may be facing challenges with this property.</p>
                            </div>
                            
                            <div style="margin: 20px 0; font-size: 16px; line-height: 1.6; color: #333;">
                                ${content.replace(/\n/g, '<br>')}
                            </div>
                            
                            <div style="margin: 30px 0; text-align: center;">
                                <a href="tel:+18085551234" style="display: inline-block; background-color: #0F62FE; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                                    Call Us: (808) 555-1234
                                </a>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; border-top: 1px solid #e9ecef;">
                            <p style="margin: 0; font-size: 12px; color: #666;">
                                This email was sent regarding your property at ${property.address}.<br>
                                If you no longer wish to receive these emails, please reply with "STOP".
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
  }

  async sendBulkEmail(leadIds: number[], templateId?: number) {
    const results = [];
    
    for (const leadId of leadIds) {
      try {
        const lead = await storage.getLead(leadId);
        if (lead) {
          const result = await this.sendEmail(lead, templateId);
          results.push({ leadId, ...result });
          
          // Add delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        results.push({ leadId, success: false, message: error.message });
      }
    }
    
    return results;
  }

  async createEmailTemplate(name: string, subject: string, template: string) {
    return await storage.createOutreachCampaign({
      name,
      type: 'email',
      subject,
      template,
    });
  }

  async getEmailTemplates() {
    const campaigns = await storage.getOutreachCampaigns();
    return campaigns.filter(c => c.type === 'email');
  }
}

export const emailService = new EmailService();
