
import { Grok } from '@xai/grok-sdk';
import { storage } from '../storage';
import type { Property, Contact, Lead } from '@shared/schema';

class GrokService {
  private grok: Grok | null = null;

  constructor() {
    if (process.env.GROK_API_KEY) {
      this.grok = new Grok({
        apiKey: process.env.GROK_API_KEY,
      });
    }
  }

  private getFallbackResponse(type: string): string {
    switch (type) {
      case 'analysis':
        return 'Grok AI analysis unavailable - API key required for detailed market insights.';
      case 'prediction':
        return 'Market prediction requires Grok AI configuration.';
      case 'summary':
        return 'Advanced property analysis unavailable - Grok API key required.';
      default:
        return 'Grok AI functionality requires API key configuration.';
    }
  }

  async analyzePropertyMarket(property: Property): Promise<string> {
    if (!this.grok) {
      return this.getFallbackResponse('analysis');
    }

    try {
      const prompt = `Analyze this Hawaii property for investment potential using current market data:

Property Details:
- Address: ${property.address}
- Status: ${property.status}
- Priority: ${property.priority}
- Estimated Value: $${property.estimatedValue || 'Unknown'}
- Amount Owed: $${property.amountOwed || 'Unknown'}
- Auction Date: ${property.auctionDate || 'Unknown'}

Provide a comprehensive analysis including:
1. Market value assessment for Hawaii real estate
2. Investment risk score (1-10)
3. Profit potential analysis
4. Local market trends impact
5. Recommended investment strategy
6. Timeline considerations

Keep analysis under 300 words but detailed.`;

      const completion = await this.grok.chat.completions.create({
        model: "grok-beta",
        messages: [
          { role: "system", content: "You are a Hawaii real estate investment expert with access to current market data. Provide detailed, actionable analysis." },
          { role: "user", content: prompt }
        ],
        max_tokens: 500,
        temperature: 0.3,
      });

      return completion.choices[0].message.content || this.getFallbackResponse('analysis');
    } catch (error) {
      console.error('Grok property analysis error:', error);
      return this.getFallbackResponse('analysis');
    }
  }

  async predictMarketTrends(): Promise<string> {
    if (!this.grok) {
      return this.getFallbackResponse('prediction');
    }

    try {
      const prompt = `Analyze current Hawaii real estate market trends and provide predictions for the next 6-12 months:

Focus on:
1. Distressed property opportunities (foreclosures, tax liens)
2. Interest rate impact on Hawaii market
3. Tourism recovery effects on real estate
4. Military housing demand trends
5. Inventory levels and pricing predictions
6. Best investment strategies for current market

Provide actionable insights for real estate investors in Hawaii.`;

      const completion = await this.grok.chat.completions.create({
        model: "grok-beta",
        messages: [
          { role: "system", content: "You are a Hawaii real estate market analyst with access to real-time data. Provide evidence-based predictions." },
          { role: "user", content: prompt }
        ],
        max_tokens: 600,
        temperature: 0.4,
      });

      return completion.choices[0].message.content || this.getFallbackResponse('prediction');
    } catch (error) {
      console.error('Grok market prediction error:', error);
      return this.getFallbackResponse('prediction');
    }
  }

  async analyzeInvestorMatch(property: Property, investors: any[]): Promise<string> {
    if (!this.grok) {
      return 'Investor matching analysis requires Grok AI configuration.';
    }

    try {
      const investorSummary = investors.map(inv => 
        `${inv.name}: Budget ${inv.budget}, Strategy: ${inv.strategy}, Location: ${inv.preferredLocation || 'Any'}`
      ).join('\n');

      const prompt = `Analyze the best investor matches for this Hawaii property:

Property:
- Address: ${property.address}
- Status: ${property.status}
- Estimated Value: $${property.estimatedValue || 'Unknown'}
- Priority: ${property.priority}

Available Investors:
${investorSummary}

Provide:
1. Top 3 best investor matches with reasoning
2. Estimated profit potential for each match
3. Risk assessment for each pairing
4. Recommended approach strategy
5. Timeline considerations

Keep analysis concise but detailed.`;

      const completion = await this.grok.chat.completions.create({
        model: "grok-beta",
        messages: [
          { role: "system", content: "You are a real estate investment matching expert. Analyze compatibility between properties and investors." },
          { role: "user", content: prompt }
        ],
        max_tokens: 400,
        temperature: 0.3,
      });

      return completion.choices[0].message.content || 'Unable to analyze investor matches.';
    } catch (error) {
      console.error('Grok investor matching error:', error);
      return 'Error analyzing investor matches.';
    }
  }

  async analyzeDealFlow(properties: Property[], leads: Lead[]): Promise<string> {
    if (!this.grok) {
      return 'Deal flow analysis requires Grok AI configuration.';
    }

    try {
      const propertySummary = `${properties.length} properties (${properties.filter(p => p.priority === 'high').length} high priority)`;
      const leadSummary = `${leads.length} leads (${leads.filter(l => l.status === 'hot').length} hot leads)`;

      const prompt = `Analyze the current deal flow for this Hawaii real estate investment pipeline:

Current Pipeline:
- Properties: ${propertySummary}
- Leads: ${leadSummary}
- High Priority Properties: ${properties.filter(p => p.priority === 'high').length}
- Active Leads: ${leads.filter(l => l.status !== 'closed').length}

Provide analysis on:
1. Pipeline health assessment
2. Conversion rate predictions
3. Recommended action priorities
4. Resource allocation suggestions
5. Potential bottlenecks identification
6. Growth opportunities

Focus on actionable insights for improving deal flow.`;

      const completion = await this.grok.chat.completions.create({
        model: "grok-beta",
        messages: [
          { role: "system", content: "You are a real estate deal flow analyst. Provide strategic insights for optimizing investment pipelines." },
          { role: "user", content: prompt }
        ],
        max_tokens: 500,
        temperature: 0.4,
      });

      return completion.choices[0].message.content || 'Unable to analyze deal flow.';
    } catch (error) {
      console.error('Grok deal flow analysis error:', error);
      return 'Error analyzing deal flow.';
    }
  }
}

export const grokService = new GrokService();
