import OpenAI from "openai";
import { storage } from "../storage";
import type { Property } from "@shared/schema";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_KEY || "sk-placeholder"
});

class AIService {
  async processChat(message: string, context?: { contextId?: string; contextType?: string }) {
    try {
      let systemPrompt = `You are an AI assistant specialized in Hawaii real estate lead generation and CRM management. 
      You help real estate professionals with property analysis, lead management, outreach strategies, and market insights.
      Be helpful, professional, and provide actionable advice.`;

      if (context?.contextType === 'property' && context.contextId) {
        const property = await storage.getProperty(parseInt(context.contextId));
        if (property) {
          systemPrompt += `\n\nContext: You are discussing property at ${property.address}. 
          Status: ${property.status}, Priority: ${property.priority}, 
          Estimated Value: $${property.estimatedValue?.toLocaleString()}.`;
        }
      }

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message }
        ],
        max_tokens: 500,
        temperature: 0.7,
      });

      return response.choices[0].message.content || "I apologize, but I couldn't generate a response.";
    } catch (error) {
      console.error('AI chat error:', error);
      return "I'm sorry, I'm having trouble processing your request right now. Please try again later.";
    }
  }

  async generatePropertySummary(property: Property): Promise<string> {
    try {
      const prompt = `Analyze this Hawaii property for real estate investment potential:

Address: ${property.address}
Status: ${property.status}
Priority: ${property.priority}
Estimated Value: $${property.estimatedValue?.toLocaleString() || 'Unknown'}
${property.auctionDate ? `Auction Date: ${property.auctionDate}` : ''}
${property.amountOwed ? `Amount Owed: $${property.amountOwed.toLocaleString()}` : ''}
${property.daysUntilAuction ? `Days Until Auction: ${property.daysUntilAuction}` : ''}

Provide a concise analysis including:
1. Investment opportunity assessment
2. Urgency level and recommended actions
3. Potential risks and considerations
4. Suggested outreach strategy

Keep it under 200 words and focus on actionable insights.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: "You are a Hawaii real estate investment analyst. Provide clear, actionable property assessments." },
          { role: "user", content: prompt }
        ],
        max_tokens: 300,
        temperature: 0.3,
      });

      return response.choices[0].message.content || "Unable to generate property summary.";
    } catch (error) {
      console.error('AI property summary error:', error);
      return `Property at ${property.address} requires analysis. Status: ${property.status}. Consider immediate review for investment potential.`;
    }
  }

  async generateOutreachTemplate(lead: any, templateType: 'email' | 'sms' = 'email'): Promise<string> {
    try {
      const property = await storage.getProperty(lead.propertyId);
      const contact = await storage.getContact(lead.contactId);

      if (!property || !contact) {
        throw new Error('Missing property or contact data');
      }

      const prompt = `Generate a ${templateType === 'email' ? 'professional email' : 'brief SMS message'} for a distressed homeowner outreach:

Property: ${property.address}
Owner: ${contact.name}
Status: ${property.status}
${property.auctionDate ? `Auction Date: ${property.auctionDate}` : ''}
${property.amountOwed ? `Amount Owed: $${property.amountOwed.toLocaleString()}` : ''}

${templateType === 'email' ? 'Email should include:' : 'SMS should include:'}
- Empathetic approach
- Quick solution offer
- Clear next steps
- Professional tone
${templateType === 'email' ? '- Subject line' : ''}

${templateType === 'email' ? 'Keep under 150 words.' : 'Keep under 160 characters.'}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { 
            role: "system", 
            content: `You are a professional real estate outreach specialist. Create compelling, empathetic ${templateType} messages for homeowners facing foreclosure or tax issues.` 
          },
          { role: "user", content: prompt }
        ],
        max_tokens: templateType === 'email' ? 200 : 50,
        temperature: 0.5,
      });

      return response.choices[0].message.content || `Hello ${contact.name}, I'd like to help with your property situation at ${property.address}. Please call me to discuss options.`;
    } catch (error) {
      console.error('AI outreach template error:', error);
      return templateType === 'email' 
        ? "I understand you may be facing challenges with your property. I'd like to help you explore your options. Please feel free to reach out."
        : "Hi, I can help with your property situation. Call me to discuss options.";
    }
  }

  async analyzeMarketTrends(): Promise<string> {
    try {
      const properties = await storage.getProperties({ limit: 100 });
      
      // Analyze property data
      const statusCounts = properties.reduce((acc: any, prop) => {
        acc[prop.status] = (acc[prop.status] || 0) + 1;
        return acc;
      }, {});

      const avgValue = properties
        .filter(p => p.estimatedValue)
        .reduce((sum, p) => sum + (p.estimatedValue || 0), 0) / properties.length;

      const prompt = `Analyze these Hawaii real estate market trends:

Total Properties Tracked: ${properties.length}
Property Status Distribution: ${JSON.stringify(statusCounts)}
Average Estimated Value: $${Math.round(avgValue).toLocaleString()}

Provide insights on:
1. Market opportunity trends
2. Best property types to target
3. Timing recommendations
4. Risk assessment

Keep analysis under 250 words.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: "You are a Hawaii real estate market analyst providing strategic insights for investors and agents." },
          { role: "user", content: prompt }
        ],
        max_tokens: 350,
        temperature: 0.4,
      });

      return response.choices[0].message.content || "Market analysis unavailable. Consider reviewing recent property data for trends.";
    } catch (error) {
      console.error('AI market analysis error:', error);
      return "Market analysis is currently unavailable. Please check property data manually for trends and opportunities.";
    }
  }
}

export const aiService = new AIService();
