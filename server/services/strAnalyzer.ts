
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
