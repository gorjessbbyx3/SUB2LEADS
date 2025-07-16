
import { storage } from '../storage';
import { grokService } from './grokService';

export interface NeighborhoodScore {
  zipCode: string;
  neighborhood: string;
  island: string;
  overallScore: number; // 0-100
  roiPotential: number;
  crimeScore: number;
  schoolScore: number;
  appreciationTrend: number;
  touristProximity: number;
  investmentGrade: 'A' | 'B' | 'C' | 'D';
  topReasons: string[];
  riskFactors: string[];
  lastUpdated: string;
}

export class NeighborhoodScorer {
  
  static async scoreNeighborhood(zipCode: string, address: string): Promise<NeighborhoodScore> {
    const island = this.getIslandFromZip(zipCode);
    const neighborhood = this.getNeighborhoodFromAddress(address);
    
    // Base scoring components
    let overallScore = 50;
    const topReasons: string[] = [];
    const riskFactors: string[] = [];
    
    // Crime scoring (simulated - in production would use FBI/HPD data)
    const crimeScore = await this.getCrimeScore(zipCode, island);
    overallScore += (crimeScore - 50) * 0.3;
    
    if (crimeScore > 70) {
      topReasons.push('Low crime area');
    } else if (crimeScore < 30) {
      riskFactors.push('Higher crime rates');
    }
    
    // School scoring (would integrate with GreatSchools API)
    const schoolScore = await this.getSchoolScore(zipCode, island);
    overallScore += (schoolScore - 50) * 0.25;
    
    if (schoolScore > 75) {
      topReasons.push('Excellent schools nearby');
    }
    
    // Tourist proximity scoring
    const touristProximity = this.getTouristProximityScore(neighborhood, island);
    overallScore += (touristProximity - 50) * 0.2;
    
    if (touristProximity > 80) {
      topReasons.push('Prime tourist area for STR');
    }
    
    // Appreciation trend (Hawaii specific)
    const appreciationTrend = await this.getAppreciationTrend(zipCode, island);
    overallScore += (appreciationTrend - 50) * 0.25;
    
    if (appreciationTrend > 70) {
      topReasons.push('Strong price appreciation');
    } else if (appreciationTrend < 30) {
      riskFactors.push('Declining property values');
    }
    
    // ROI potential calculation
    const roiPotential = this.calculateROIPotential(overallScore, island, neighborhood);
    
    // Use Grok for local insights
    const grokAnalysis = await this.getGrokNeighborhoodAnalysis(zipCode, neighborhood, island);
    if (grokAnalysis) {
      overallScore = Math.min(100, overallScore + grokAnalysis.scoreAdjustment);
      topReasons.push(grokAnalysis.insight);
    }
    
    const finalScore = Math.min(100, Math.max(0, overallScore));
    
    return {
      zipCode,
      neighborhood,
      island,
      overallScore: finalScore,
      roiPotential,
      crimeScore,
      schoolScore,
      appreciationTrend,
      touristProximity,
      investmentGrade: this.getInvestmentGrade(finalScore),
      topReasons,
      riskFactors,
      lastUpdated: new Date().toISOString()
    };
  }
  
  private static getIslandFromZip(zipCode: string): string {
    const zip = parseInt(zipCode);
    
    if (zip >= 96701 && zip <= 96898) return 'Oahu';
    if (zip >= 96708 && zip <= 96794) return 'Maui';
    if (zip >= 96704 && zip <= 96781) return 'Big Island';
    if (zip >= 96703 && zip <= 96769) return 'Kauai';
    
    return 'Oahu'; // Default
  }
  
  private static getNeighborhoodFromAddress(address: string): string {
    const addr = address.toLowerCase();
    
    // Oahu neighborhoods
    if (addr.includes('waikiki')) return 'Waikiki';
    if (addr.includes('honolulu')) return 'Honolulu';
    if (addr.includes('kapolei')) return 'Kapolei';
    if (addr.includes('kaneohe')) return 'Kaneohe';
    if (addr.includes('kailua')) return 'Kailua';
    
    // Maui neighborhoods
    if (addr.includes('lahaina')) return 'Lahaina';
    if (addr.includes('kihei')) return 'Kihei';
    if (addr.includes('wailea')) return 'Wailea';
    
    // Big Island neighborhoods
    if (addr.includes('kona')) return 'Kona';
    if (addr.includes('hilo')) return 'Hilo';
    
    // Kauai neighborhoods
    if (addr.includes('poipu')) return 'Poipu';
    if (addr.includes('lihue')) return 'Lihue';
    
    return 'Unknown';
  }
  
  private static async getCrimeScore(zipCode: string, island: string): Promise<number> {
    // Simulated crime scoring - in production would integrate with FBI/HPD APIs
    const crimeFactor = {
      'Oahu': { base: 65, variance: 20 },
      'Maui': { base: 75, variance: 15 },
      'Big Island': { base: 70, variance: 18 },
      'Kauai': { base: 80, variance: 10 }
    };
    
    const factor = crimeFactor[island] || crimeFactor['Oahu'];
    const score = factor.base + (Math.random() - 0.5) * factor.variance;
    
    return Math.min(100, Math.max(0, score));
  }
  
  private static async getSchoolScore(zipCode: string, island: string): Promise<number> {
    // Simulated school scoring - in production would integrate with GreatSchools API
    const schoolFactor = {
      'Oahu': { base: 70, variance: 25 },
      'Maui': { base: 75, variance: 20 },
      'Big Island': { base: 65, variance: 20 },
      'Kauai': { base: 72, variance: 18 }
    };
    
    const factor = schoolFactor[island] || schoolFactor['Oahu'];
    const score = factor.base + (Math.random() - 0.5) * factor.variance;
    
    return Math.min(100, Math.max(0, score));
  }
  
  private static getTouristProximityScore(neighborhood: string, island: string): number {
    const touristAreas = {
      'Waikiki': 95,
      'Lahaina': 90,
      'Wailea': 85,
      'Poipu': 80,
      'Kailua': 85,
      'Kona': 75,
      'Hilo': 40,
      'Kapolei': 50,
      'Honolulu': 60,
      'Lihue': 65
    };
    
    return touristAreas[neighborhood] || 40;
  }
  
  private static async getAppreciationTrend(zipCode: string, island: string): Promise<number> {
    // Simulated appreciation trends - in production would use MLS/Zillow data
    const appreciationFactor = {
      'Oahu': { base: 75, variance: 20 },
      'Maui': { base: 80, variance: 15 },
      'Big Island': { base: 65, variance: 25 },
      'Kauai': { base: 70, variance: 20 }
    };
    
    const factor = appreciationFactor[island] || appreciationFactor['Oahu'];
    const score = factor.base + (Math.random() - 0.5) * factor.variance;
    
    return Math.min(100, Math.max(0, score));
  }
  
  private static calculateROIPotential(overallScore: number, island: string, neighborhood: string): number {
    let roiPotential = overallScore * 0.8; // Base from overall score
    
    // Island-specific adjustments
    const islandMultiplier = {
      'Oahu': 1.1,
      'Maui': 1.3,
      'Big Island': 0.9,
      'Kauai': 1.2
    };
    
    roiPotential *= islandMultiplier[island] || 1.0;
    
    // Tourist area premium
    const touristNeighborhoods = ['Waikiki', 'Lahaina', 'Wailea', 'Poipu', 'Kailua'];
    if (touristNeighborhoods.includes(neighborhood)) {
      roiPotential *= 1.2;
    }
    
    return Math.min(100, Math.max(0, roiPotential));
  }
  
  private static getInvestmentGrade(score: number): 'A' | 'B' | 'C' | 'D' {
    if (score >= 80) return 'A';
    if (score >= 65) return 'B';
    if (score >= 50) return 'C';
    return 'D';
  }
  
  private static async getGrokNeighborhoodAnalysis(zipCode: string, neighborhood: string, island: string): Promise<{scoreAdjustment: number, insight: string} | null> {
    try {
      const prompt = `Analyze this Hawaii neighborhood for real estate investment potential:

Location Details:
- Neighborhood: ${neighborhood}
- Island: ${island}
- Zip Code: ${zipCode}

Consider Hawaii-specific factors:
- Tourism impact and seasonality
- Local zoning and development plans
- Infrastructure and transportation
- Natural disaster risks (tsunami, volcanic, hurricane)
- Military presence and government stability
- Cultural and historical significance
- Future development potential

Provide a score adjustment (-25 to +25) and one key insight about investment potential.
Format: {"scoreAdjustment": number, "insight": "string"}`;

      const response = await grokService.analyzeWithGrok(prompt, 'neighborhood_analysis');
      return JSON.parse(response);
    } catch (error) {
      console.error('Grok neighborhood analysis failed:', error);
      return null;
    }
  }
}

export const neighborhoodScorer = {
  scoreNeighborhood: NeighborhoodScorer.scoreNeighborhood.bind(NeighborhoodScorer)
};
