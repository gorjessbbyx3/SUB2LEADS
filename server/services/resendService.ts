
import { Resend } from 'resend';
import { storage } from '../storage';

const resend = new Resend(process.env.RESEND_API_KEY);

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  template: string;
  triggerEvent: string;
}

export class ResendService {
  
  static async sendMotivationAlert(leadId: number, motivationScore: number, reason: string) {
    try {
      const lead = await storage.getLead(leadId);
      const property = await storage.getProperty(lead.propertyId);
      const contacts = await storage.getContactsByProperty(lead.propertyId);
      
      if (!lead || !property) return;
      
      // Send to yourself/team
      const teamEmail = process.env.TEAM_EMAIL || process.env.FROM_EMAIL || 'onboarding@resend.dev';
      
      const subject = `🚨 HIGH MOTIVATION ALERT: ${property.address} (Score: ${motivationScore})`;
      
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #ef4444, #dc2626); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">🚨 High Motivation Alert</h1>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">Immediate action recommended</p>
          </div>
          
          <div style="background: #f8fafc; padding: 20px; border-radius: 0 0 8px 8px;">
            <h2 style="color: #1e40af; margin-top: 0;">Property Details</h2>
            <p><strong>Address:</strong> ${property.address}</p>
            <p><strong>Motivation Score:</strong> ${motivationScore}/100</p>
            <p><strong>Status:</strong> ${property.status}</p>
            <p><strong>Priority:</strong> ${property.priority}</p>
            ${property.estimatedValue ? `<p><strong>Estimated Value:</strong> $${property.estimatedValue.toLocaleString()}</p>` : ''}
            
            <h3 style="color: #059669; margin-top: 20px;">Why This Lead is Hot:</h3>
            <p style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #059669;">
              ${reason}
            </p>
            
            ${contacts.length > 0 ? `
              <h3 style="color: #1e40af;">Contact Information:</h3>
              <p><strong>Name:</strong> ${contacts[0].name}</p>
              ${contacts[0].phone ? `<p><strong>Phone:</strong> ${contacts[0].phone}</p>` : ''}
              ${contacts[0].email ? `<p><strong>Email:</strong> ${contacts[0].email}</p>` : ''}
            ` : ''}
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL}/leads/${leadId}" 
                 style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                View Lead Details
              </a>
            </div>
          </div>
        </div>
      `;
      
      await resend.emails.send({
        from: process.env.FROM_EMAIL || 'onboarding@resend.dev',
        to: teamEmail,
        subject,
        html: htmlContent,
      });
      
      console.log(`High motivation alert sent for lead ${leadId}`);
      
    } catch (error) {
      console.error('Error sending motivation alert:', error);
    }
  }
  
  static async sendSTRAlert(propertyId: number, strScore: number, projectedIncome: number) {
    try {
      const property = await storage.getProperty(propertyId);
      if (!property || strScore < 85) return; // Only alert on high STR scores
      
      const teamEmail = process.env.TEAM_EMAIL || process.env.FROM_EMAIL || 'onboarding@resend.dev';
      
      const subject = `🏝️ HIGH STR POTENTIAL: ${property.address} (Score: ${strScore})`;
      
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #059669, #047857); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">🏝️ High STR Potential Property</h1>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">Excellent short-term rental opportunity</p>
          </div>
          
          <div style="background: #f0fdf4; padding: 20px; border-radius: 0 0 8px 8px;">
            <h2 style="color: #1e40af; margin-top: 0;">STR Analysis Results</h2>
            <p><strong>Property:</strong> ${property.address}</p>
            <p><strong>STR Score:</strong> ${strScore}/100</p>
            <p><strong>Projected Annual Income:</strong> $${projectedIncome.toLocaleString()}</p>
            ${property.estimatedValue ? `<p><strong>Estimated ROI:</strong> ${Math.round((projectedIncome / property.estimatedValue) * 100)}%</p>` : ''}
            
            <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #059669; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #059669;">Investment Highlights:</h3>
              <ul style="margin: 0; padding-left: 20px;">
                <li>High tourism demand area</li>
                <li>Strong rental income potential</li>
                <li>Premium location for short-term rentals</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL}/properties/${propertyId}" 
                 style="background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                View Property Analysis
              </a>
            </div>
          </div>
        </div>
      `;
      
      await resend.emails.send({
        from: process.env.FROM_EMAIL || 'onboarding@resend.dev',
        to: teamEmail,
        subject,
        html: htmlContent,
      });
      
      console.log(`STR alert sent for property ${propertyId}`);
      
    } catch (error) {
      console.error('Error sending STR alert:', error);
    }
  }
  
  static async sendBuyerNotification(investorId: number, propertyId: number, matchScore: number, matchReasons: string[]) {
    try {
      const investor = await storage.getInvestor(investorId);
      const property = await storage.getProperty(propertyId);
      
      if (!investor || !property || !investor.email) return;
      
      const subject = `🎯 New Property Match (${matchScore}% Match) - ${property.address}`;
      
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #2563eb, #1d4ed8); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">🎯 New Property Match</h1>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">${matchScore}% match for your criteria</p>
          </div>
          
          <div style="background: #f1f5f9; padding: 20px; border-radius: 0 0 8px 8px;">
            <h2 style="color: #1e40af; margin-top: 0;">Property Details</h2>
            <p><strong>Address:</strong> ${property.address}</p>
            ${property.estimatedValue ? `<p><strong>Estimated Value:</strong> $${property.estimatedValue.toLocaleString()}</p>` : ''}
            <p><strong>Property Type:</strong> ${property.propertyType || 'Unknown'}</p>
            <p><strong>Status:</strong> ${property.status}</p>
            
            <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #2563eb; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #2563eb;">Why This Matches Your Criteria:</h3>
              <ul style="margin: 0; padding-left: 20px;">
                ${matchReasons.map(reason => `<li>${reason}</li>`).join('')}
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL}/properties/${propertyId}" 
                 style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                View Property Details
              </a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
              This property matched your investment criteria. Contact us immediately if interested as foreclosure properties move quickly.
            </p>
          </div>
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
    }
  }
  
  static async sendFollowUpEmail(leadId: number, sequence: string) {
    try {
      const lead = await storage.getLead(leadId);
      const property = await storage.getProperty(lead.propertyId);
      const contacts = await storage.getContactsByProperty(lead.propertyId);
      
      if (!lead || !property || !contacts.length || !contacts[0].email) return;
      
      const contact = contacts[0];
      const templates = this.getFollowUpTemplates();
      const template = templates[sequence] || templates.default;
      
      const personalizedContent = template.content
        .replace('{ownerName}', contact.name || 'Property Owner')
        .replace('{address}', property.address)
        .replace('{estimatedValue}', property.estimatedValue ? `$${property.estimatedValue.toLocaleString()}` : 'market value');
      
      await resend.emails.send({
        from: process.env.FROM_EMAIL || 'onboarding@resend.dev',
        to: contact.email,
        subject: template.subject.replace('{address}', property.address),
        html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          ${personalizedContent.replace(/\n/g, '<br>')}
          <br><br>
          <hr style="border: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="color: #6b7280; font-size: 12px;">
            Hawaii Real Estate Investment Team
          </p>
        </div>`,
      });
      
      // Log the interaction
      await storage.createLeadInteraction({
        leadId,
        channel: 'email',
        direction: 'outbound',
        message: personalizedContent,
        created_at: new Date()
      } as any);
      
      console.log(`Follow-up email sent for lead ${leadId}, sequence: ${sequence}`);
      
    } catch (error) {
      console.error('Error sending follow-up email:', error);
    }
  }
  
  private static getFollowUpTemplates() {
    return {
      day3: {
        subject: 'Quick follow-up about {address}',
        content: `Hi {ownerName},

I wanted to follow up on my previous message about your property at {address}.

I understand you may be busy, but I wanted to make sure you received my message about potential options for your property.

If you're interested in discussing this further, I'm available for a quick 10-minute call at your convenience.

Best regards,
Hawaii Investment Team
(808) 555-0123`
      },
      week1: {
        subject: 'Still interested in helping with {address}',
        content: `Hello {ownerName},

I hope this message finds you well. I'm still very interested in helping you with your property at {address}.

Sometimes timing isn't right immediately, but situations can change. If you'd like to explore your options now or in the future, I'm here to help.

No pressure - just wanted you to know the offer stands.

Sincerely,
Hawaii Investment Team
(808) 555-0123`
      },
      default: {
        subject: 'Following up about {address}',
        content: `Hi {ownerName},

I hope you're doing well. I wanted to reach out one more time about your property at {address}.

If you're ready to discuss your options, I'm here to help. If not, I completely understand.

Feel free to reach out if circumstances change.

Best,
Hawaii Investment Team
(808) 555-0123`
      }
    };
  }
}

export const resendService = ResendService;
