import OpenAI from 'openai';
import { storage } from '../storage';
import type { Property, Contact, Lead } from '@shared/schema';

class AIService {
  private openai: OpenAI | null = null;

  constructor() {
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    }
  }

  private getFallbackResponse(type: string): string {
    switch (type) {
      case 'chat':
        return 'I apologize, but I need an OpenAI API key to provide AI assistance. Please ask your administrator to configure the OPENAI_API_KEY environment variable.';
      case 'email':
        return 'Subject: Regarding Your Property\n\nHi,\n\nI hope this message finds you well. I wanted to reach out about your property and discuss potential options that might be helpful.\n\nBest regards';
      case 'summary':
        return 'Property analysis unavailable - OpenAI API key required for detailed summaries.';
      default:
        return 'AI functionality requires OpenAI API key configuration.';
    }
  }

  async processChat(message: string, context?: { contextId?: string; contextType?: string }) {
    if (!this.openai) {
      return { 
        response: this.getFallbackResponse('chat'),
        suggestions: ['Please configure OpenAI API key', 'Contact administrator for setup']
      };
    }

    try {
      // Build context from the database if provided
      let contextData = '';
      if (context?.contextType === 'property' && context.contextId) {
        const property = await storage.getProperty(parseInt(context.contextId));
        if (property) {
          contextData = `\nProperty Context: ${property.address}, Status: ${property.status}, Priority: ${property.priority}`;
        }
      } else if (context?.contextType === 'lead' && context.contextId) {
        const lead = await storage.getLead(parseInt(context.contextId));
        if (lead) {
          contextData = `\nLead Context: Status: ${lead.status}, Priority: ${lead.priority}`;
        }
      }

      const systemPrompt = `You are an AI assistant for a Hawaii real estate investment CRM focused on distressed properties. You help with:
      - Property analysis and investment advice
      - Lead management and follow-up strategies
      - Market insights for Hawaii real estate
      - Contact outreach recommendations
      
      Keep responses concise and actionable.${contextData}`;

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message }
        ],
        max_tokens: 500,
        temperature: 0.7,
      });

      const response = completion.choices[0].message.content || 'Sorry, I could not generate a response.';

      // Store AI interaction
      await storage.createAIInteraction({
        userId: 'system', // Would be actual user ID in real implementation
        message,
        response,
        contextType: context?.contextType || null,
        contextId: context?.contextId || null,
      });

      return {
        response,
        suggestions: this.generateSuggestions(message, context),
      };
    } catch (error) {
      console.error('OpenAI API error:', error);
      return {
        response: 'I apologize, but I encountered an error processing your request. Please try again.',
        suggestions: ['Try rephrasing your question', 'Check if the OpenAI service is available']
      };
    }
  }

  async generateEmail(property: Property, contact: Contact, templateId: string, customMessage?: string): Promise<string> {
    if (!this.openai) {
      return this.getFallbackResponse('email');
    }

    try {
      const prompt = `Generate a professional, personalized email for real estate outreach:

Property: ${property.address}
Status: ${property.status}
Contact: ${contact.name || 'Property Owner'}
Template Type: ${templateId}
${customMessage ? `Custom Message: ${customMessage}` : ''}

Create an email that:
1. Is respectful and professional
2. Offers help with their property situation
3. Mentions specific property details
4. Includes a clear call to action
5. Keeps it under 200 words

Format: Include "Subject: [subject line]" at the top, then the email body.`;

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [{ role: "user", content: prompt }],
        max_tokens: 400,
        temperature: 0.7,
      });

      return completion.choices[0].message.content || this.getFallbackResponse('email');
    } catch (error) {
      console.error('Email generation error:', error);
      return this.getTemplateEmail(property, contact, templateId);
    }
  }

  async generatePropertySummary(property: Property): Promise<string> {
    if (!this.openai) {
      return this.getFallbackResponse('summary');
    }

    try {
      const prompt = `Analyze this Hawaii distressed property for investment potential:

Address: ${property.address}
Status: ${property.status}
Priority: ${property.priority}
Estimated Value: $${property.estimatedValue || 'Unknown'}
Amount Owed: $${property.amountOwed || 'Unknown'}
Auction Date: ${property.auctionDate || 'Unknown'}

Provide a concise investment analysis covering:
1. Investment opportunity score (1-10)
2. Key risks and considerations
3. Recommended next steps
4. Market context for Hawaii

Keep it under 150 words.`;

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [{ role: "user", content: prompt }],
        max_tokens: 300,
        temperature: 0.5,
      });

      return completion.choices[0].message.content || this.getFallbackResponse('summary');
    } catch (error) {
      console.error('Property summary error:', error);
      return this.getFallbackResponse('summary');
    }
  }

  async generateOutreachTemplate(lead: Lead, templateType: 'email' | 'sms' = 'email'): Promise<string> {
    if (!this.openai) {
      return templateType === 'email' 
        ? 'Subject: Your Property Options\n\nHi, I wanted to discuss potential options for your property. Please let me know if you\'d like to chat.'
        : 'Hi, I wanted to reach out about your property. Would you be open to discussing your options? Thanks!';
    }

    try {
      const prompt = `Create a ${templateType} outreach template for real estate lead:

Lead Status: ${lead.status}
Priority: ${lead.priority}
Template Type: ${templateType}

Requirements:
- Professional and respectful tone
- Offers genuine help
- Mentions property situation appropriately
- ${templateType === 'email' ? 'Include subject line' : 'Keep under 160 characters'}
- Clear call to action`;

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [{ role: "user", content: prompt }],
        max_tokens: templateType === 'email' ? 300 : 100,
        temperature: 0.7,
      });

      return completion.choices[0].message.content || '';
    } catch (error) {
      console.error('Template generation error:', error);
      return templateType === 'email'
        ? 'Subject: Your Property Options\n\nHi, I wanted to discuss potential options for your property.'
        : 'Hi, I wanted to reach out about your property. Would you be open to discussing your options?';
    }
  }

  async analyzeMarketTrends(): Promise<string> {
    if (!this.openai) {
      return 'Market analysis requires OpenAI API key configuration.';
    }

    try {
      const prompt = `Provide a brief market analysis for Hawaii distressed property investment in 2024-2025:

Consider:
- Hawaii real estate market trends
- Foreclosure and tax lien opportunities
- Investment recommendations
- Risk factors specific to Hawaii market

Keep it under 200 words and actionable.`;

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [{ role: "user", content: prompt }],
        max_tokens: 350,
        temperature: 0.6,
      });

      return completion.choices[0].message.content || 'Market analysis unavailable at this time.';
    } catch (error) {
      console.error('Market analysis error:', error);
      return 'Unable to generate market analysis. Please try again later.';
    }
  }

  private generateSuggestions(message: string, context?: any): string[] {
    const suggestions = [
      'Tell me about this property',
      'Generate an email template',
      'Analyze market trends',
      'What should I do next?',
    ];

    if (context?.contextType === 'property') {
      suggestions.unshift('Create outreach email for this property');
    }

    return suggestions.slice(0, 3);
  }

  private getTemplateEmail(property: Property, contact: Contact, templateId: string): string {
    const templates = {
      foreclosure: `Subject: Options for Your Property at ${property.address}

Hi ${contact.name || 'Property Owner'},

I noticed your property at ${property.address} may be facing foreclosure. I work with homeowners to explore all available options before any final decisions are made.

Would you be open to a brief conversation about potential solutions? I may be able to help you understand your choices.

Best regards`,

      tax_lien: `Subject: Tax Lien Notice - ${property.address}

Hi ${contact.name || 'Property Owner'},

I wanted to reach out regarding the tax situation on your property at ${property.address}. There may be options available to help resolve this matter.

I'd be happy to discuss potential solutions if you're interested.

Thank you`,

      default: `Subject: Regarding Your Property at ${property.address}

Hi ${contact.name || 'Property Owner'},

I hope this message finds you well. I wanted to reach out about your property at ${property.address} to see if there are any ways I might be able to help with your current situation.

Would you be open to a brief conversation?

Best regards`
    };

    return templates[templateId as keyof typeof templates] || templates.default;
  }

  async getEmailTemplates() {
    return [
      { id: 'foreclosure', name: 'Foreclosure Outreach', description: 'For properties facing foreclosure' },
      { id: 'tax_lien', name: 'Tax Lien Notice', description: 'For tax delinquent properties' },
      { id: 'general', name: 'General Inquiry', description: 'General property inquiry' },
      { id: 'follow_up', name: 'Follow Up', description: 'Follow up with previous contacts' },
    ];
  }
}

export const aiService = new AIService();