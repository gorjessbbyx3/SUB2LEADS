
import { storage } from '../storage';
import { aiService } from './aiService';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface EmailResult {
  success: boolean;
  emailId?: string;
  mailtoLink?: string;
  error?: string;
}

interface EmailTemplate {
  id: string;
  name: string;
  description: string;
  subject: string;
  body: string;
  type: 'foreclosure' | 'tax_lien' | 'general' | 'follow_up';
}

class EmailService {
  private templates: EmailTemplate[] = [
    {
      id: 'foreclosure',
      name: 'Foreclosure Outreach',
      description: 'Professional outreach for foreclosure properties',
      type: 'foreclosure',
      subject: 'Regarding Your Property at {address}',
      body: `Dear {ownerName},

I hope this message finds you well. I understand you may be facing some challenges with your property at {address}.

I work with homeowners to explore all available options during difficult times. If you're interested in discussing potential solutions, I'd be happy to have a brief conversation.

There's no obligation, and I respect your privacy completely.

Best regards,
Hawaii Real Estate Team
Phone: (808) 555-0123
Email: info@hawaiirealestate.com`
    },
    {
      id: 'tax_lien',
      name: 'Tax Situation Assistance',
      description: 'Respectful outreach for tax delinquent properties',
      type: 'tax_lien',
      subject: 'Property Tax Assistance - {address}',
      body: `Hello {ownerName},

I wanted to reach out regarding your property at {address}. I understand dealing with tax situations can be stressful.

I work with property owners to help find solutions for various situations. If you'd like to discuss your options, I'm here to help.

Everything is kept confidential, and there's no pressure.

Sincerely,
Hawaii Real Estate Team
Phone: (808) 555-0123
Email: info@hawaiirealestate.com`
    },
    {
      id: 'general',
      name: 'General Property Inquiry',
      description: 'Professional general inquiry template',
      type: 'general',
      subject: 'Inquiry About Your Property - {address}',
      body: `Dear {ownerName},

I hope you're doing well. I wanted to reach out about your property at {address}.

I work with property owners throughout Hawaii and thought you might be interested in exploring your options, whether that's keeping the property or considering other alternatives.

If you'd like to have a conversation, I'd be happy to discuss how I might be able to help.

Best regards,
Hawaii Real Estate Team
Phone: (808) 555-0123
Email: info@hawaiirealestate.com`
    },
    {
      id: 'follow_up',
      name: 'Professional Follow Up',
      description: 'Follow up template for previous contacts',
      type: 'follow_up',
      subject: 'Following Up - {address}',
      body: `Hello {ownerName},

I wanted to follow up on our previous conversation about your property at {address}.

If you have any questions or would like to discuss your options further, please don't hesitate to reach out. I'm here to help in whatever way I can.

Thank you for your time.

Best regards,
Hawaii Real Estate Team
Phone: (808) 555-0123
Email: info@hawaiirealestate.com`
    }
  ];

  async sendEmail(lead: any, templateId: string, customMessage?: string): Promise<EmailResult> {
    try {
      const property = await storage.getProperty(lead.propertyId);
      const contacts = await storage.getContactsByProperty(lead.propertyId);
      const contact = contacts[0];

      if (!property || !contact || !contact.email) {
        throw new Error('Missing property or contact information');
      }

      const template = this.templates.find(t => t.id === templateId);
      if (!template) {
        throw new Error('Template not found');
      }

      const address = property.address || 'your property';
      const ownerName = contact.name || 'Property Owner';

      const subject = template.subject
        .replace('{address}', address)
        .replace('{ownerName}', ownerName);

      const body = customMessage || template.body
        .replace(/{address}/g, address)
        .replace(/{ownerName}/g, ownerName);

      const mailtoLink = this.createMailtoLink(contact.email, subject, body);

      // Try to send via Resend if API key is configured
      if (process.env.RESEND_API_KEY) {
        const emailResult = await resend.emails.send({
          from: process.env.FROM_EMAIL || 'onboarding@resend.dev',
          to: contact.email,
          subject,
          html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            ${body.replace(/\n/g, '<br>')}
            <br><br>
            <hr style="border: 1px solid #e5e7eb; margin: 20px 0;">
            <p style="color: #6b7280; font-size: 12px;">
              Hawaii Real Estate Investment Team
            </p>
          </div>`,
        });

        await storage.createEmailLog({
          leadId: lead.id,
          propertyId: property.id,
          contactId: contact.id,
          subject,
          content: body,
          status: 'sent',
          templateId,
          mailtoLink,
          emailId: emailResult.data?.id,
        });

        return {
          success: true,
          emailId: emailResult.data?.id,
          mailtoLink,
        };
      }

      // Fallback to mailto link
      await storage.createEmailLog({
        leadId: lead.id,
        propertyId: property.id,
        contactId: contact.id,
        subject,
        content: body,
        status: 'mailto_generated',
        templateId,
        mailtoLink,
      });

      return {
        success: true,
        mailtoLink,
      };

    } catch (error) {
      console.error('Email service error:', error);

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

  private createMailtoLink(email: string, subject: string, body: string): string {
    const encodedSubject = encodeURIComponent(subject);
    const encodedBody = encodeURIComponent(body.replace(/\n/g, '\r\n'));
    return `mailto:${email}?subject=${encodedSubject}&body=${encodedBody}`;
  }

  async getEmailTemplates(): Promise<EmailTemplate[]> {
    return this.templates;
  }

  async markEmailSent(leadId: number, emailLogId?: string): Promise<{ success: boolean }> {
    try {
      await storage.updateLead(leadId, {
        lastContactDate: new Date().toISOString(),
      });

      await storage.createActivity({
        leadId,
        userId: 'system',
        type: 'email_sent',
        title: 'Email sent to contact',
        description: 'Email outreach completed',
      });

      return { success: true };
    } catch (error) {
      console.error('Error marking email as sent:', error);
      return { success: false };
    }
  }

  async notifyInvestorOfMatch(investorId: number, propertyId: number, matchScore: number, matchReasons: string[]) {
    try {
      const investor = await storage.getInvestor(investorId);
      const property = await storage.getProperty(propertyId);

      if (!investor || !property || !investor.email) {
        throw new Error('Investor or property not found, or investor has no email');
      }

      if (!process.env.RESEND_API_KEY) {
        console.log('Resend API key not configured, skipping email notification');
        return;
      }

      const subject = `🎯 New Property Match (${matchScore}% Match) - ${property.address}`;

      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">New Property Match Found!</h2>

          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1e40af; margin-top: 0;">Match Score: ${matchScore}%</h3>
            <p><strong>Property:</strong> ${property.address}</p>
            ${property.estimatedValue ? `<p><strong>Estimated Value:</strong> $${property.estimatedValue.toLocaleString()}</p>` : ''}
            ${property.daysUntilAuction ? `<p><strong>Days Until Auction:</strong> ${property.daysUntilAuction}</p>` : ''}
            <p><strong>Property Type:</strong> ${property.propertyType || 'Unknown'}</p>
            <p><strong>Status:</strong> ${property.status}</p>
          </div>

          <div style="background: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #059669; margin-top: 0;">Why This Matches Your Criteria:</h3>
            <ul>
              ${matchReasons.map(reason => `<li>${reason}</li>`).join('')}
            </ul>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/properties/${property.id}" 
               style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              View Property Details
            </a>
          </div>

          <hr style="border: 1px solid #e5e7eb; margin: 30px 0;">

          <p style="color: #6b7280; font-size: 14px;">
            This property matched your investment criteria. If you're interested, contact us immediately as foreclosure properties move quickly.
          </p>

          <p style="color: #6b7280; font-size: 12px;">
            Hawaii Real Estate CRM - Connecting Investors with Opportunities
          </p>
        </div>
      `;

      await resend.emails.send({
        from: process.env.FROM_EMAIL || 'onboarding@resend.dev',
        to: investor.email,
        subject,
        html: htmlContent,
      });

      console.log(`Match notification sent to ${investor.name} (${investor.email}) for property ${property.address}`);

    } catch (error) {
      console.error('Error sending match notification:', error);
      throw error;
    }
  }
}

export const emailService = new EmailService();
