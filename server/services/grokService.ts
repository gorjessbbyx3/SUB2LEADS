
import { xai } from '@ai-sdk/xai';
import { generateText } from 'ai';
import { storage } from '../storage';
import type { Property, Contact, Lead } from '@shared/schema';

class GrokService {
  private isConfigured: boolean = false;

  constructor() {
    this.isConfigured = !!process.env.XAI_API_KEY;
  }

  private getFallbackResponse(type: string): string {
    switch (type) {
      case 'analysis':
        return 'Grok AI analysis unavailable - XAI_API_KEY required for detailed market insights.';
      case 'prediction':
        return 'Market prediction requires Grok AI configuration.';
      case 'summary':
        return 'Advanced property analysis unavailable - XAI_API_KEY required.';
      default:
        return 'Grok AI functionality requires XAI_API_KEY configuration.';
    }
  }

  async analyzePropertyMarket(property: Property): Promise<string> {
    if (!this.isConfigured) {
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

      const { text } = await generateText({
        model: xai('grok-2-1212'),
        prompt,
        maxTokens: 500,
        temperature: 0.3,
      });

      return text || this.getFallbackResponse('analysis');
    } catch (error) {
      console.error('Grok property analysis error:', error);
      return this.getFallbackResponse('analysis');
    }
  }

  async predictMarketTrends(): Promise<string> {
    if (!this.isConfigured) {
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

      const { text } = await generateText({
        model: xai('grok-2-1212'),
        prompt,
        maxTokens: 600,
        temperature: 0.4,
      });

      return text || this.getFallbackResponse('prediction');
    } catch (error) {
      console.error('Grok market prediction error:', error);
      return this.getFallbackResponse('prediction');
    }
  }

  async analyzeInvestorMatch(property: Property, investors: any[]): Promise<string> {
    if (!this.isConfigured) {
      return 'Investor matching analysis requires XAI_API_KEY configuration.';
    }

    try {
      const investorSummary = investors.map(inv => 
        `${inv.name}: Budget ${inv.budget || 'Unknown'}, Strategy: ${inv.strategy || 'Unknown'}, Location: ${inv.preferredLocation || 'Any'}`
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

      const { text } = await generateText({
        model: xai('grok-2-1212'),
        prompt,
        maxTokens: 400,
        temperature: 0.3,
      });

      return text || 'Unable to analyze investor matches.';
    } catch (error) {
      console.error('Grok investor matching error:', error);
      return 'Error analyzing investor matches.';
    }
  }

  async analyzeDealFlow(properties: Property[], leads: Lead[]): Promise<string> {
    if (!this.isConfigured) {
      return 'Deal flow analysis requires XAI_API_KEY configuration.';
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

      const { text } = await generateText({
        model: xai('grok-2-1212'),
        prompt,
        maxTokens: 500,
        temperature: 0.4,
      });

      return text || 'Unable to analyze deal flow.';
    } catch (error) {
      console.error('Grok deal flow analysis error:', error);
      return 'Error analyzing deal flow.';
    }
  }
}

export const grokService = new GrokService();
