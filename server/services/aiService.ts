import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'your-openai-key-here',
});

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  template: string;
}

const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: 'initial_contact',
    name: 'Initial Contact',
    subject: 'Opportunity for Your Property at {address}',
    template: `Dear {ownerName},

I hope this message finds you well. I'm reaching out regarding your property at {address}.

I understand you may be facing some challenges with this property, and I'd like to discuss how I might be able to help. As a local real estate investor, I specialize in working with homeowners to find mutually beneficial solutions.

I can offer:
- Quick, cash transactions
- No realtor fees or commissions
- Flexible closing timeline
- As-is purchase (no repairs needed)

Would you be open to a brief conversation about your options? I'm here to help, not pressure you.

Best regards,
{agentName}
{agentPhone}
{agentEmail}`
  },
  {
    id: 'follow_up',
    name: 'Follow Up',
    subject: 'Following Up on {address}',
    template: `Hi {ownerName},

I wanted to follow up on my previous message about your property at {address}.

I know dealing with property challenges can be stressful, and I'm here to provide a solution that works for you. Many homeowners in similar situations have found our approach helpful.

If you'd like to discuss your options with no obligation, I'm happy to chat. Sometimes a quick conversation can provide clarity on the best path forward.

Feel free to call or text me anytime.

Best,
{agentName}`
  }
];

class AIService {
  async generateEmail(property: any, contact: any, templateId: string, customMessage?: string): Promise<string> {
    const template = EMAIL_TEMPLATES.find(t => t.id === templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    const prompt = `
Generate a personalized email for a real estate investor reaching out to a distressed property owner.

Property Details:
- Address: ${property.address}
- Owner: ${contact.name || contact.email}
- Property Type: ${property.propertyType}
- Situation: ${property.taxStatus || property.status}
- Lien Amount: ${property.lienAmount ? '$' + property.lienAmount.toLocaleString() : 'Unknown'}

Template to use as base: ${template.template}

Custom message to incorporate: ${customMessage || 'None'}

Rules:
1. Be empathetic and respectful
2. Focus on helping, not taking advantage
3. Keep it professional but warm
4. Make it specific to their situation
5. Include a clear call to action
6. Don't be pushy or aggressive

Generate the email content (subject and body):
`;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that writes professional, empathetic emails for real estate investors reaching out to property owners who may be in distressing situations.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 800,
        temperature: 0.7,
      });

      return response.choices[0]?.message?.content || template.template;
    } catch (error) {
      console.error('AI email generation error:', error);
      // Fallback to template
      return template.template
        .replace('{address}', property.address)
        .replace('{ownerName}', contact.name || 'Property Owner')
        .replace('{agentName}', 'Your Investment Team')
        .replace('{agentPhone}', '(808) 555-0123')
        .replace('{agentEmail}', 'info@hawaiiinvestments.com');
    }
  }

  async generatePropertySummary(property: any): Promise<string> {
    const prompt = `
Analyze this property and create a comprehensive investment summary:

Property Details:
- Address: ${property.address}
- Owner: ${property.ownerName}
- Type: ${property.propertyType}
- Status: ${property.status}
- Tax Status: ${property.taxStatus}
- Lien Amount: ${property.lienAmount ? '$' + property.lienAmount.toLocaleString() : 'Unknown'}
- Auction Date: ${property.auctionDate || 'Not specified'}

Create a summary including:
1. Investment opportunity overview
2. Potential risks and considerations
3. Estimated market value insights
4. Recommended approach strategy
5. Key talking points for owner outreach

Keep it professional and factual.
`;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a real estate investment analyst providing detailed property assessments.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.3,
      });

      return response.choices[0]?.message?.content || 'Summary generation failed';
    } catch (error) {
      console.error('AI summary generation error:', error);
      return `Property Summary for ${property.address}:\n\nThis property represents a potential investment opportunity. Further analysis recommended.`;
    }
  }

  async processChat(message: string, context?: any): Promise<string> {
    const prompt = `
User message: ${message}

Context: ${context ? JSON.stringify(context, null, 2) : 'None'}

You are an AI assistant for a real estate investment CRM. Help the user with:
- Property analysis
- Lead management advice
- Email outreach strategies
- Market insights for Hawaii real estate
- Investment calculations

Provide helpful, actionable advice.
`;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a knowledgeable real estate investment assistant focused on Hawaii markets and distressed property acquisition.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 500,
        temperature: 0.7,
      });

      return response.choices[0]?.message?.content || "I'm having trouble processing that request right now.";
    } catch (error) {
      console.error('AI chat error:', error);
      return "I'm currently experiencing technical difficulties. Please try again later.";
    }
  }

  getEmailTemplates(): EmailTemplate[] {
    return EMAIL_TEMPLATES;
  }
}

export const aiService = new AIService();