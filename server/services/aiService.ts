
class AIService {
  private baseUrl = 'https://replit.com/data/repls/signed_url';
  private apiKey = process.env.REPLIT_AI_API_KEY;

  async generateEmail(property: any, contact: any, templateId: string, customMessage?: string): Promise<string> {
    try {
      const prompt = this.buildEmailPrompt(property, contact, templateId, customMessage);
      
      // Use Replit Agent AI for email generation
      const response = await fetch('https://replit.com/data/repls/signed_url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'replit-agent',
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 500,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`Replit AI API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('Replit AI error:', error);
      // Fallback to template-based email
      return this.getFallbackEmail(property, contact, templateId, customMessage);
    }
  }

  async generatePropertySummary(property: any): Promise<string> {
    try {
      const prompt = `Generate a professional property investment summary for:
      
Address: ${property.address}
Property Type: ${property.propertyType || 'Unknown'}
Estimated Value: $${property.estimatedValue || 'Unknown'}
Lien Amount: $${property.lienAmount || 'Unknown'}
Status: ${property.status}
Days Until Auction: ${property.daysUntilAuction || 'Unknown'}

Please provide a concise analysis of the investment opportunity, potential risks, and recommended next steps.`;

      const response = await fetch('https://replit.com/data/repls/signed_url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'replit-agent',
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 300,
          temperature: 0.5
        })
      });

      if (!response.ok) {
        throw new Error(`Replit AI API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('Replit AI error:', error);
      return this.getFallbackSummary(property);
    }
  }

  async chatWithLead(question: string, leadContext: any): Promise<string> {
    try {
      const contextPrompt = `You are a real estate investment assistant. Here's the context:
      
Lead Information:
- Property: ${leadContext.property?.address || 'Unknown'}
- Contact: ${leadContext.contact?.name || 'Unknown'}
- Status: ${leadContext.status || 'Unknown'}
- Priority: ${leadContext.priority || 'Unknown'}
- Last Contact: ${leadContext.lastContactDate || 'Never'}

Question: ${question}

Please provide a helpful response based on this lead information.`;

      const response = await fetch('https://replit.com/data/repls/signed_url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'replit-agent',
          messages: [
            {
              role: 'user',
              content: contextPrompt
            }
          ],
          max_tokens: 400,
          temperature: 0.6
        })
      });

      if (!response.ok) {
        throw new Error(`Replit AI API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('Replit AI chat error:', error);
      return "I'm sorry, I'm having trouble processing your question right now. Please try again later.";
    }
  }

  private buildEmailPrompt(property: any, contact: any, templateId: string, customMessage?: string): string {
    const basePrompt = `Generate a professional email for a real estate investment opportunity:

Property Details:
- Address: ${property.address}
- Status: ${property.status}
- Estimated Value: $${property.estimatedValue || 'Unknown'}
- Lien Amount: $${property.lienAmount || 'Unknown'}

Contact Information:
- Name: ${contact.name || 'Property Owner'}
- Email: ${contact.email}

Template Type: ${templateId}

${customMessage ? `Custom Message: ${customMessage}` : ''}

Please generate a professional, empathetic email that offers help with their property situation. Include:
- A clear subject line
- Professional greeting
- Brief explanation of the situation
- Offer to help
- Clear call to action
- Professional closing

Format the response with "Subject: [subject line]" on the first line, followed by the email body.`;

    return basePrompt;
  }

  private getFallbackEmail(property: any, contact: any, templateId: string, customMessage?: string): string {
    const templates = {
      foreclosure: `Subject: Regarding Your Property at ${property.address}

Hi ${contact.name || 'Property Owner'},

I hope this message finds you well. I'm reaching out because I noticed your property at ${property.address} may be facing foreclosure proceedings.

I work with investors who specialize in helping homeowners navigate difficult situations like this. We may be able to provide options that could help you avoid foreclosure while getting you out of a stressful situation.

Would you be open to a brief conversation about your options? I'm here to help, not pressure you.

Best regards,
Hawaii Investment Team
(808) 555-0123`,

      tax_lien: `Subject: Tax Lien Notice - ${property.address}

Dear ${contact.name || 'Property Owner'},

I'm writing regarding the tax lien on your property at ${property.address}. I understand this can be a stressful situation, and I wanted to reach out to see if I could help.

I work with a team that specializes in resolving tax lien situations quickly and fairly. We may be able to help you resolve this matter while providing you with a fair solution.

Would you be interested in discussing your options? I'm happy to explain how we might be able to help.

Sincerely,
Hawaii Investment Team
(808) 555-0123`,

      auction: `Subject: Auction Notice - ${property.address}

Hello ${contact.name || 'Property Owner'},

I noticed your property at ${property.address} is scheduled for auction soon. I wanted to reach out before the auction to see if there might be another solution that works better for you.

We work with homeowners to provide fair, fast solutions that can help avoid the auction process entirely.

If you're interested in exploring your options, I'd be happy to discuss how we might be able to help.

Best,
Hawaii Investment Team
(808) 555-0123`
    };

    return templates[templateId] || templates.foreclosure;
  }

  private getFallbackSummary(property: any): string {
    return `Property Investment Summary for ${property.address}:

This ${property.propertyType || 'residential'} property is currently ${property.status}. With an estimated value of $${property.estimatedValue?.toLocaleString() || 'Unknown'} and a lien amount of $${property.lienAmount?.toLocaleString() || 'Unknown'}, this represents a potential investment opportunity.

Key considerations:
- Property status requires immediate attention
- Due diligence recommended before proceeding
- Contact property owner to discuss options
- Verify all financial information independently

Recommended next steps:
1. Contact property owner
2. Conduct property inspection
3. Verify lien amounts and legal status
4. Assess market conditions in the area`;
  }

  getEmailTemplates() {
    return [
      { id: 'foreclosure', name: 'Foreclosure Notice', description: 'For properties facing foreclosure' },
      { id: 'tax_lien', name: 'Tax Lien', description: 'For properties with tax liens' },
      { id: 'auction', name: 'Auction Notice', description: 'For properties going to auction' }
    ];
  }
}

export const aiService = new AIService();
