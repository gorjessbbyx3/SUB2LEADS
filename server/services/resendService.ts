
import { Resend } from 'resend';
import { storage } from '../storage';

const resend = new Resend(process.env.RESEND_API_KEY);

class ResendService {
  async sendMotivationAlert(lead: any, score?: number, message?: string): Promise<void> {
    try {
      const subject = `High Motivation Lead Alert - Score: ${score || 'N/A'}`;
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">High Motivation Lead Alert</h2>
          <p><strong>Lead ID:</strong> ${lead.id}</p>
          <p><strong>Contact:</strong> ${lead.name || 'Unknown'}</p>
          <p><strong>Phone:</strong> ${lead.phone || 'N/A'}</p>
          <p><strong>Email:</strong> ${lead.email || 'N/A'}</p>
          <p><strong>Motivation Score:</strong> ${score || 'N/A'}/100</p>
          ${message ? `<p><strong>Message:</strong> ${message}</p>` : ''}
          <hr style="border: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="color: #6b7280; font-size: 12px;">
            Hawaii Real Estate Investment Team
          </p>
        </div>
      `;

      await resend.emails.send({
        from: process.env.FROM_EMAIL || 'onboarding@resend.dev',
        to: process.env.ALERT_EMAIL || 'admin@example.com',
        subject,
        html: htmlContent,
      });

      console.log(`Motivation alert sent for lead ${lead.id}`);
    } catch (error) {
      console.error('Error sending motivation alert:', error);
      throw error;
    }
  }

  async sendHotLeadAlert(lead: any, buyers: any[]): Promise<void> {
    try {
      for (const buyer of buyers) {
        const subject = `Hot Lead Alert - Motivated Seller`;
        const htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #dc2626;">Hot Lead Alert</h2>
            <p>Hi ${buyer.name},</p>
            <p>We have a highly motivated seller that matches your investment criteria:</p>
            <p><strong>Lead ID:</strong> ${lead.id}</p>
            <p><strong>Contact:</strong> ${lead.name || 'Unknown'}</p>
            <p><strong>Phone:</strong> ${lead.phone || 'N/A'}</p>
            <p><strong>Property:</strong> ${lead.propertyAddress || 'Address pending'}</p>
            <p>This lead has been scored as high motivation. Contact them immediately for the best chance of securing this deal.</p>
            <hr style="border: 1px solid #e5e7eb; margin: 20px 0;">
            <p style="color: #6b7280; font-size: 12px;">
              Hawaii Real Estate Investment Team
            </p>
          </div>
        `;

        await resend.emails.send({
          from: process.env.FROM_EMAIL || 'onboarding@resend.dev',
          to: buyer.email,
          subject,
          html: htmlContent,
        });
      }

      console.log(`Hot lead alerts sent to ${buyers.length} buyers for lead ${lead.id}`);
    } catch (error) {
      console.error('Error sending hot lead alerts:', error);
      throw error;
    }
  }

  async sendFollowUpEmail(leadId: number, sequence: string): Promise<void> {
    try {
      const lead = await storage.getLead(leadId);
      if (!lead) {
        throw new Error(`Lead ${leadId} not found`);
      }

      const templates = {
        day3: {
          subject: 'Following up on your property inquiry',
          body: `Hi ${lead.name || 'there'},\n\nI wanted to follow up on your recent inquiry about your property. We're here to help you explore your options.\n\nWould you like to schedule a brief call to discuss how we can assist you?\n\nBest regards,\nHawaii Real Estate Team`
        },
        week1: {
          subject: 'Still interested in selling your property?',
          body: `Hi ${lead.name || 'there'},\n\nI hope this message finds you well. I wanted to check in to see if you're still considering selling your property.\n\nWe have investors ready to make competitive offers. Would you like to learn more about your options?\n\nBest regards,\nHawaii Real Estate Team`
        }
      };

      const template = templates[sequence as keyof typeof templates] || templates.day3;

      await resend.emails.send({
        from: process.env.FROM_EMAIL || 'onboarding@resend.dev',
        to: lead.email,
        subject: template.subject,
        html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          ${template.body.replace(/\n/g, '<br>')}
          <br><br>
          <hr style="border: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="color: #6b7280; font-size: 12px;">
            Hawaii Real Estate Investment Team
          </p>
        </div>`,
      });

      console.log(`Follow-up email sent to lead ${leadId} (${sequence})`);
    } catch (error) {
      console.error('Error sending follow-up email:', error);
      throw error;
    }
  }

  async sendSTRAlert(propertyId: number, strScore: number, projectedIncome: number): Promise<void> {
    try {
      const property = await storage.getProperty(propertyId);
      if (!property) {
        throw new Error(`Property ${propertyId} not found`);
      }

      const subject = `High STR Potential Property Alert - Score: ${strScore}`;
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #16a34a;">High STR Potential Alert</h2>
          <p><strong>Property:</strong> ${property.address}</p>
          <p><strong>STR Score:</strong> ${strScore}/100</p>
          <p><strong>Projected Annual Income:</strong> $${projectedIncome.toLocaleString()}</p>
          <p>This property shows excellent potential for short-term rental investment.</p>
          <hr style="border: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="color: #6b7280; font-size: 12px;">
            Hawaii Real Estate Investment Team
          </p>
        </div>
      `;

      await resend.emails.send({
        from: process.env.FROM_EMAIL || 'onboarding@resend.dev',
        to: process.env.ALERT_EMAIL || 'admin@example.com',
        subject,
        html: htmlContent,
      });

      console.log(`STR alert sent for property ${propertyId}`);
    } catch (error) {
      console.error('Error sending STR alert:', error);
      throw error;
    }
  }

  async sendBuyerNotification(investorId: number, propertyId: number, score: number, reasons: string[]): Promise<void> {
    try {
      const investor = await storage.getInvestor(investorId);
      const property = await storage.getProperty(propertyId);

      if (!investor || !property) {
        throw new Error(`Investor ${investorId} or property ${propertyId} not found`);
      }

      const subject = `New Investment Opportunity - ${property.address}`;
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">New Investment Opportunity</h2>
          <p>Hi ${investor.name},</p>
          <p><strong>Property:</strong> ${property.address}</p>
          <p><strong>Match Score:</strong> ${score}/100</p>
          <p><strong>Why this matches your criteria:</strong></p>
          <ul>
            ${reasons.map(reason => `<li>${reason}</li>`).join('')}
          </ul>
          <p>This property matches your investment strategy. Contact us for more details!</p>
          <hr style="border: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="color: #6b7280; font-size: 12px;">
            Hawaii Real Estate Investment Team
          </p>
        </div>
      `;

      await resend.emails.send({
        from: process.env.FROM_EMAIL || 'onboarding@resend.dev',
        to: investor.email,
        subject,
        html: htmlContent,
      });

      console.log(`Buyer notification sent to ${investor.name} for property ${propertyId}`);
    } catch (error) {
      console.error('Error sending buyer notification:', error);
      throw error;
    }
  }
}

export const resendService = new ResendService();
