
import { inngest } from '../inngest';
import { storage } from '../storage';
import { grokService } from './grokService';

export interface MotivationFactors {
  taxDelinquent: boolean;
  timeOwned: number; // years
  absenteeOwner: boolean;
  foreclosureHistory: boolean;
  propertyCondition: 'excellent' | 'good' | 'fair' | 'poor';
  neighborhood: string;
  island: string;
  recentLifeEvents?: string[];
  marketActivity: 'hot' | 'warm' | 'cool';
  // Risk assessment factors
  zoningChangePotential?: boolean;
  developmentZoneRisk?: string;
  naturalDisasterRisk?: string;
  wildfireRiskZone?: string;
  floodZone?: string;
  lavaZone?: number;
  tsunamiEvacuationZone?: boolean;
}

export interface MotivationPrediction {
  score: number; // 0-100
  level: 'low' | 'medium' | 'high' | 'urgent';
  reason: string;
  factors: string[];
  confidence: number;
  nextAction: string;
}

class MotivationPredictor {
  
  static async predictMotivation(leadId: string, factors: MotivationFactors): Promise<MotivationPrediction> {
    let score = 30; // Base score
    const reasonFactors: string[] = [];
    
    // Tax delinquency - strong indicator
    if (factors.taxDelinquent) {
      score += 25;
      reasonFactors.push('Property tax delinquency indicates financial stress');
    }
    
    // Time owned - longer ownership = more equity = more likely to sell
    if (factors.timeOwned > 10) {
      score += 15;
      reasonFactors.push('Long-term ownership suggests significant equity');
    } else if (factors.timeOwned < 2) {
      score -= 10;
      reasonFactors.push('Recent purchase - unlikely to sell soon');
    }
    
    // Absentee ownership - Hawaii specific
    if (factors.absenteeOwner) {
      score += 20;
      reasonFactors.push('Absentee ownership in Hawaii often leads to maintenance issues');
    }
    
    // Foreclosure history
    if (factors.foreclosureHistory) {
      score += 30;
      reasonFactors.push('Previous foreclosure activity indicates distress');
    }
    
    // Property condition
    switch (factors.propertyCondition) {
      case 'poor':
        score += 20;
        reasonFactors.push('Poor condition may motivate quick sale');
        break;
      case 'fair':
        score += 10;
        reasonFactors.push('Fair condition suggests deferred maintenance');
        break;
    }
    
    // Hawaii market factors
    if (factors.island === 'Oahu' && factors.marketActivity === 'hot') {
      score += 10;
      reasonFactors.push('Hot Oahu market creates selling opportunity');
    }
    
    // Risk assessment factors
    if (factors.zoningChangePotential) {
      score += 15;
      reasonFactors.push('Future development/rezoning may impact property value');
    }
    
    // Natural disaster risk scoring
    if (factors.naturalDisasterRisk === 'High Wildfire Risk') {
      score += 20;
      reasonFactors.push('High wildfire risk increases urgency to sell');
    } else if (factors.naturalDisasterRisk === 'Moderate Wildfire Risk') {
      score += 10;
      reasonFactors.push('Moderate wildfire risk may motivate sale');
    }
    
    if (factors.floodZone && ['A', 'AE', 'VE'].includes(factors.floodZone)) {
      score += 15;
      reasonFactors.push('High-risk flood zone increases insurance costs');
    }
    
    if (factors.lavaZone && factors.lavaZone <= 2) {
      score += 25;
      reasonFactors.push('High lava flow risk zone creates urgency');
    } else if (factors.lavaZone && factors.lavaZone <= 4) {
      score += 10;
      reasonFactors.push('Moderate lava flow risk');
    }
    
    if (factors.tsunamiEvacuationZone) {
      score += 12;
      reasonFactors.push('Tsunami evacuation zone impacts desirability');
    }
    
    // Development zone risks
    if (factors.developmentZoneRisk === 'Transit-Oriented Development') {
      score += 8;
      reasonFactors.push('Transit development may change neighborhood character');
    } else if (factors.developmentZoneRisk === 'Commercial Rezoning') {
      score += 12;
      reasonFactors.push('Commercial rezoning affects residential value');
    }
    
    // Use Grok for advanced analysis
    const grokAnalysis = await this.getGrokAnalysis(factors);
    if (grokAnalysis) {
      score = Math.min(100, score + grokAnalysis.scoreAdjustment);
      reasonFactors.push(grokAnalysis.insight);
    }
    
    const level = this.getMotivationLevel(score);
    const confidence = this.calculateConfidence(factors);
    
    return {
      score: Math.min(100, Math.max(0, score)),
      level,
      reason: reasonFactors.join('. '),
      factors: reasonFactors,
      confidence,
      nextAction: this.getNextAction(level, factors)
    };
  }
  
  private static async getGrokAnalysis(factors: MotivationFactors): Promise<{scoreAdjustment: number, insight: string} | null> {
    try {
      const prompt = `Analyze this Hawaii property seller situation and provide motivation insights:
      
Property Details:
- Island: ${factors.island}
- Time Owned: ${factors.timeOwned} years
- Tax Delinquent: ${factors.taxDelinquent}
- Absentee Owner: ${factors.absenteeOwner}
- Condition: ${factors.propertyCondition}
- Neighborhood: ${factors.neighborhood}
- Market: ${factors.marketActivity}

Risk Assessment:
- Natural Disaster Risk: ${factors.naturalDisasterRisk || 'Unknown'}
- Wildfire Zone: ${factors.wildfireRiskZone || 'Unknown'}
- Flood Zone: ${factors.floodZone || 'Unknown'}
- Lava Zone: ${factors.lavaZone || 'Unknown'}
- Development Zone Risk: ${factors.developmentZoneRisk || 'None'}
- Zoning Change Potential: ${factors.zoningChangePotential || false}
- Tsunami Evacuation Zone: ${factors.tsunamiEvacuationZone || false}

Consider Hawaii-specific factors like:
- Cultural significance of land
- Tourist rental potential
- Distance from mainland (absentee challenges)
- Natural disaster risks (wildfire, lava, tsunami, flood)
- Development pressure and rezoning impacts
- Local economic conditions

Provide a score adjustment (-20 to +20) and one key insight about seller motivation.
Format: {"scoreAdjustment": number, "insight": "string"}`;

      const response = await grokService.analyzeWithGrok(prompt, 'motivation_analysis');
      return JSON.parse(response);
    } catch (error) {
      console.error('Grok analysis failed:', error);
      return null;
    }
  }
  
  private static getMotivationLevel(score: number): 'low' | 'medium' | 'high' | 'urgent' {
    if (score >= 85) return 'urgent';
    if (score >= 70) return 'high';
    if (score >= 50) return 'medium';
    return 'low';
  }
  
  private static calculateConfidence(factors: MotivationFactors): number {
    let confidence = 50;
    
    // More data points = higher confidence
    if (factors.taxDelinquent !== undefined) confidence += 10;
    if (factors.timeOwned > 0) confidence += 10;
    if (factors.absenteeOwner !== undefined) confidence += 10;
    if (factors.propertyCondition) confidence += 10;
    if (factors.neighborhood) confidence += 5;
    if (factors.recentLifeEvents?.length) confidence += 10;
    
    return Math.min(95, confidence);
  }
  
  private static getNextAction(level: 'low' | 'medium' | 'high' | 'urgent', factors: MotivationFactors): string {
    switch (level) {
      case 'urgent':
        return 'Contact immediately with cash offer';
      case 'high':
        return 'Schedule showing within 48 hours';
      case 'medium':
        return 'Send personalized letter with recent comps';
      case 'low':
        return 'Add to nurture sequence for quarterly follow-up';
      default:
        return 'Continue monitoring';
    }
  }
}

// Export the service
export const motivationPredictor = {
  predictSellerMotivation: async (leadId: number) => {
    const lead = await storage.getLead(leadId);
    if (!lead) throw new Error('Lead not found');
    
    // Extract factors from lead data
    const factors: MotivationFactors = {
      taxDelinquent: (lead as any).taxDelinquent || false,
      timeOwned: (lead as any).timeOwned || 0,
      absenteeOwner: (lead as any).absenteeOwner || false,
      foreclosureHistory: lead.status === 'foreclosure',
      propertyCondition: (lead as any).propertyCondition || 'fair',
      neighborhood: (lead as any).neighborhood || 'Unknown',
      island: (lead as any).island || 'Oahu',
      marketActivity: 'warm' as const,
      zoningChangePotential: (lead as any).zoningChangePotential || false,
      developmentZoneRisk: (lead as any).developmentZoneRisk || 'None',
      naturalDisasterRisk: (lead as any).naturalDisasterRisk || 'Unknown',
      wildfireRiskZone: (lead as any).wildfireRiskZone || 'Unknown',
      floodZone: (lead as any).floodZone || 'Unknown',
      lavaZone: (lead as any).lavaZone || null,
      tsunamiEvacuationZone: (lead as any).tsunamiEvacuationZone || false
    };
    
    const prediction = await MotivationPredictor.predictMotivation(leadId.toString(), factors);
    
    // Update lead with motivation data
    await storage.updateLead(leadId, {
      motivationScore: prediction.score,
      motivationReason: prediction.reason,
      motivationLevel: prediction.level,
      lastMotivationAnalysis: new Date().toISOString()
    } as any);
    
    return prediction;
  }
};

// Inngest function for automated motivation scoring
export const motivationScoring = inngest.createFunction(
  { id: "motivation-scoring" },
  { event: "lead/analyze.motivation" },
  async ({ event, step }) => {
    const { leadId } = event.data;
    
    const prediction = await step.run("predict-motivation", async () => {
      const lead = await storage.getLead(leadId);
      
      // Extract factors from lead data
      const factors: MotivationFactors = {
        taxDelinquent: lead.taxDelinquent || false,
        timeOwned: lead.timeOwned || 0,
        absenteeOwner: lead.absenteeOwner || false,
        foreclosureHistory: lead.status === 'foreclosure',
        propertyCondition: lead.propertyCondition || 'fair',
        neighborhood: lead.neighborhood || 'Unknown',
        island: lead.island || 'Oahu',
        marketActivity: 'warm' // Could be derived from market data
      };
      
      return await MotivationPredictor.predictMotivation(leadId, factors);
    });
    
    // Update lead with motivation data
    await step.run("update-lead-motivation", async () => {
      await storage.updateLead(leadId, {
        motivationScore: prediction.score,
        motivationReason: prediction.reason,
        motivationLevel: prediction.level,
        lastMotivationAnalysis: new Date().toISOString()
      });
    });
    
    // Trigger alert if high motivation
    if (prediction.level === 'high' || prediction.level === 'urgent') {
      await step.run("send-motivation-alert", async () => {
        await inngest.send({
          name: "lead/motivation.alert",
          data: { leadId, prediction }
        });
      });
    }
    
    return { leadId, prediction };
  }
);

// Weekly re-analysis of stale leads
export const weeklyMotivationRefresh = inngest.createFunction(
  { id: "weekly-motivation-refresh" },
  { cron: "0 9 * * 1" }, // Every Monday at 9 AM
  async ({ step }) => {
    const staleLeads = await step.run("get-stale-leads", async () => {
      // Get leads that haven't been analyzed in the last week
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      return await storage.getLeads({
        where: {
          lastMotivationAnalysis: { lt: oneWeekAgo.toISOString() }
        },
        limit: 100
      });
    });
    
    for (const lead of staleLeads) {
      await step.run(`refresh-motivation-${lead.id}`, async () => {
        await inngest.send({
          name: "lead/analyze.motivation",
          data: { leadId: lead.id }
        });
      });
    }
    
    return { processedLeads: staleLeads.length };
  }
);
