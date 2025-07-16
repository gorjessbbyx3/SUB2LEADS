
import { storage } from '../storage';
import { grokService } from './grokService';

export interface STRAnalysis {
  score: number; // 0-100
  projectedAnnualIncome: number;
  occupancyRate: number;
  avgNightlyRate: number;
  seasonalFactors: string[];
  riskFactors: string[];
  recommendations: string[];
  confidence: number;
}

export class STRAnalyzer {
  
  static async analyzeProperty(propertyId: number): Promise<STRAnalysis> {
    const property = await storage.getProperty(propertyId);
    if (!property) throw new Error('Property not found');
    
    let score = 50; // Base score
    const seasonalFactors: string[] = [];
    const riskFactors: string[] = [];
    const recommendations: string[] = [];
    
    // Determine island and location factors
    const island = this.getIslandFromAddress(property.address);
    const isBeachfront = property.address.toLowerCase().includes('beach') || 
                        property.address.toLowerCase().includes('ocean');
    const isWaikiki = property.address.toLowerCase().includes('waikiki');
    
    // Island-specific scoring
    switch (island) {
      case 'Oahu':
        score += 15;
        if (isWaikiki) {
          score += 20;
          seasonalFactors.push('Waikiki premium location');
        }
        break;
      case 'Maui':
        score += 25;
        seasonalFactors.push('High tourism demand');
        break;
      case 'Big Island':
        score += 10;
        riskFactors.push('Volcanic activity concerns');
        break;
      case 'Kauai':
        score += 20;
        riskFactors.push('Limited tourism infrastructure');
        break;
    }
    
    // Property type scoring
    if (property.propertyType === 'Condo') {
      score += 15;
      recommendations.push('Condo associations may have STR restrictions');
    } else if (property.propertyType === 'Single Family') {
      score += 10;
      recommendations.push('More privacy appeals to families');
    }
    
    // Beachfront premium
    if (isBeachfront) {
      score += 25;
      seasonalFactors.push('Beachfront premium pricing');
    }
    
    // Property condition impact
    if ((property as any).propertyCondition) {
      switch ((property as any).propertyCondition) {
        case 'excellent':
          score += 15;
          break;
        case 'good':
          score += 10;
          break;
        case 'fair':
          score -= 5;
          riskFactors.push('Renovation needed for STR standards');
          break;
        case 'poor':
          score -= 20;
          riskFactors.push('Significant renovation required');
          break;
      }
    }
    
    // Calculate projected income
    const avgNightlyRate = this.calculateNightlyRate(island, isBeachfront, isWaikiki);
    const occupancyRate = this.calculateOccupancyRate(island, property.propertyType);
    const projectedAnnualIncome = Math.round(avgNightlyRate * (365 * occupancyRate / 100) * 0.85); // 85% for fees/expenses
    
    // Use Grok for advanced market analysis
    const grokAnalysis = await this.getGrokSTRAnalysis(property, island);
    if (grokAnalysis) {
      score = Math.min(100, score + grokAnalysis.scoreAdjustment);
      recommendations.push(grokAnalysis.insight);
    }
    
    // Update property with STR data
    await storage.updateProperty(propertyId, {
      strScore: Math.min(100, Math.max(0, score)),
      projectedStrIncome: projectedAnnualIncome,
      strLastAnalyzed: new Date().toISOString()
    } as any);
    
    return {
      score: Math.min(100, Math.max(0, score)),
      projectedAnnualIncome,
      occupancyRate,
      avgNightlyRate,
      seasonalFactors,
      riskFactors,
      recommendations,
      confidence: this.calculateConfidence(property)
    };
  }
  
  private static getIslandFromAddress(address: string): string {
    const addr = address.toLowerCase();
    if (addr.includes('honolulu') || addr.includes('kapolei') || addr.includes('kaneohe') || addr.includes('waikiki')) {
      return 'Oahu';
    } else if (addr.includes('lahaina') || addr.includes('kihei') || addr.includes('maui')) {
      return 'Maui';
    } else if (addr.includes('hilo') || addr.includes('kona') || addr.includes('waimea')) {
      return 'Big Island';
    } else if (addr.includes('lihue') || addr.includes('poipu') || addr.includes('kauai')) {
      return 'Kauai';
    }
    return 'Oahu'; // Default
  }
  
  private static calculateNightlyRate(island: string, isBeachfront: boolean, isWaikiki: boolean): number {
    let baseRate = 150; // Default rate
    
    switch (island) {
      case 'Oahu':
        baseRate = isWaikiki ? 250 : 180;
        break;
      case 'Maui':
        baseRate = 300;
        break;
      case 'Big Island':
        baseRate = 200;
        break;
      case 'Kauai':
        baseRate = 280;
        break;
    }
    
    if (isBeachfront) {
      baseRate *= 1.5;
    }
    
    return Math.round(baseRate);
  }
  
  private static calculateOccupancyRate(island: string, propertyType?: string): number {
    let baseRate = 65; // Default occupancy rate
    
    switch (island) {
      case 'Oahu':
        baseRate = 75;
        break;
      case 'Maui':
        baseRate = 80;
        break;
      case 'Big Island':
        baseRate = 60;
        break;
      case 'Kauai':
        baseRate = 70;
        break;
    }
    
    // Property type adjustments
    if (propertyType === 'Condo') {
      baseRate += 5;
    }
    
    return Math.min(95, baseRate);
  }
  
  private static async getGrokSTRAnalysis(property: any, island: string): Promise<{scoreAdjustment: number, insight: string} | null> {
    try {
      const prompt = `Analyze this Hawaii property for short-term rental (STR/Airbnb) potential:

Property Details:
- Address: ${property.address}
- Island: ${island}
- Type: ${property.propertyType || 'Unknown'}
- Estimated Value: $${property.estimatedValue || 'Unknown'}
- Condition: ${property.propertyCondition || 'Unknown'}

Consider Hawaii-specific STR factors:
- Local STR regulations and permits
- Tourism seasonality patterns
- Competition density
- Neighborhood suitability for tourists
- Proximity to attractions/beaches
- Parking availability
- Property management complexity

Provide a score adjustment (-30 to +30) and one key insight about STR viability.
Format: {"scoreAdjustment": number, "insight": "string"}`;

      const response = await grokService.analyzeWithGrok(prompt, 'str_analysis');
      return JSON.parse(response);
    } catch (error) {
      console.error('Grok STR analysis failed:', error);
      return null;
    }
  }
  
  private static calculateConfidence(property: any): number {
    let confidence = 60;
    
    if (property.address) confidence += 10;
    if (property.propertyType) confidence += 10;
    if (property.estimatedValue) confidence += 10;
    if ((property as any).propertyCondition) confidence += 10;
    
    return Math.min(95, confidence);
  }
}

export const strAnalyzer = {
  analyzeProperty: STRAnalyzer.analyzeProperty.bind(STRAnalyzer)
};
import { grokService } from './grokService';
import { storage } from '../storage';

export interface STRAnalysis {
  score: number;
  projectedAnnualIncome: number;
  occupancyRate: number;
  averageDailyRate: number;
  confidence: number;
  risks: string[];
  opportunities: string[];
  recommendation: string;
}

class STRAnalyzer {
  async analyzeProperty(propertyId: number): Promise<STRAnalysis> {
    const property = await storage.getProperty(propertyId);
    if (!property) throw new Error('Property not found');

    // Get Grok analysis
    const grokAnalysis = await grokService.analyzeSTRPotential(property);

    // Hawaii STR market data (simplified - in real implementation would pull from APIs)
    const islandMultipliers = {
      'Oahu': 1.2,
      'Maui': 1.5,
      'Big Island': 0.9,
      'Kauai': 1.1,
      'Molokai': 0.6,
      'Lanai': 0.7
    };

    const island = this.extractIsland(property.address);
    const multiplier = islandMultipliers[island as keyof typeof islandMultipliers] || 1.0;

    // Base calculations
    const baseADR = 200; // Base Average Daily Rate
    const averageDailyRate = Math.round(baseADR * multiplier);
    const occupancyRate = Math.min(85, grokAnalysis.score * 0.8); // Max 85% occupancy
    const projectedAnnualIncome = Math.round(averageDailyRate * (occupancyRate / 100) * 365);

    const risks = this.identifyRisks(property, island);
    const opportunities = this.identifyOpportunities(property, island);

    return {
      score: grokAnalysis.score,
      projectedAnnualIncome,
      occupancyRate: Math.round(occupancyRate),
      averageDailyRate,
      confidence: grokAnalysis.confidence,
      risks,
      opportunities,
      recommendation: this.getRecommendation(grokAnalysis.score, risks.length)
    };
  }

  private extractIsland(address: string): string {
    const lowerAddress = address.toLowerCase();
    if (lowerAddress.includes('honolulu') || lowerAddress.includes('waikiki')) return 'Oahu';
    if (lowerAddress.includes('maui') || lowerAddress.includes('lahaina')) return 'Maui';
    if (lowerAddress.includes('kona') || lowerAddress.includes('hilo')) return 'Big Island';
    if (lowerAddress.includes('kauai') || lowerAddress.includes('lihue')) return 'Kauai';
    if (lowerAddress.includes('molokai')) return 'Molokai';
    if (lowerAddress.includes('lanai')) return 'Lanai';
    return 'Oahu'; // Default
  }

  private identifyRisks(property: any, island: string): string[] {
    const risks = [];

    if (island === 'Big Island') {
      risks.push('Volcanic activity risks');
    }

    if (property.address.toLowerCase().includes('rural')) {
      risks.push('Remote location may limit guest appeal');
    }

    risks.push('Hawaii STR regulations changing frequently');
    risks.push('High property management costs due to island location');

    return risks;
  }

  private identifyOpportunities(property: any, island: string): string[] {
    const opportunities = [];

    if (island === 'Oahu') {
      opportunities.push('High tourist volume year-round');
    }

    if (island === 'Maui') {
      opportunities.push('Premium pricing potential');
    }

    if (property.address.toLowerCase().includes('beach')) {
      opportunities.push('Beachfront premium pricing');
    }

    opportunities.push('Year-round tourist season');
    opportunities.push('Limited supply due to regulations');

    return opportunities;
  }

  private getRecommendation(score: number, riskCount: number): string {
    if (score >= 80 && riskCount <= 2) {
      return 'Highly recommended for STR investment';
    } else if (score >= 60) {
      return 'Good STR potential with proper management';
    } else if (score >= 40) {
      return 'Moderate STR potential - consider long-term rental instead';
    } else {
      return 'Not recommended for STR - focus on other investment strategies';
    }
  }
}

export const strAnalyzer = new STRAnalyzer();
