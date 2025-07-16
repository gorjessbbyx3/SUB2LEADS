
export interface RiskAssessment {
  naturalDisasterRisk: string;
  wildfireRiskZone: string;
  floodZone: string;
  lavaZone: number | null;
  tsunamiEvacuationZone: boolean;
  zoningChangePotential: boolean;
  developmentZoneRisk: string;
}

class RiskAssessmentService {
  
  async assessPropertyRisk(address: string, latitude?: number, longitude?: number): Promise<RiskAssessment> {
    const assessment: RiskAssessment = {
      naturalDisasterRisk: 'Unknown',
      wildfireRiskZone: 'Unknown',
      floodZone: 'Unknown',
      lavaZone: null,
      tsunamiEvacuationZone: false,
      zoningChangePotential: false,
      developmentZoneRisk: 'None'
    };

    try {
      // Assess wildfire risk based on location patterns
      const wildfireRisk = this.assessWildfireRisk(address, latitude, longitude);
      assessment.wildfireRiskZone = wildfireRisk.zone;
      
      // Assess lava zone (Big Island specific)
      if (address.toLowerCase().includes('big island') || address.toLowerCase().includes('hilo') || address.toLowerCase().includes('kona')) {
        assessment.lavaZone = this.assessLavaZone(address, latitude, longitude);
      }
      
      // Assess flood zone
      assessment.floodZone = await this.assessFloodZone(address, latitude, longitude);
      
      // Assess tsunami risk (coastal areas)
      assessment.tsunamiEvacuationZone = this.assessTsunamiRisk(address, latitude, longitude);
      
      // Assess development risks
      const developmentRisk = await this.assessDevelopmentRisk(address);
      assessment.zoningChangePotential = developmentRisk.zoningChangePotential;
      assessment.developmentZoneRisk = developmentRisk.riskLevel;
      
      // Calculate overall natural disaster risk
      assessment.naturalDisasterRisk = this.calculateOverallNaturalRisk(assessment);
      
    } catch (error) {
      console.error('Risk assessment error:', error);
    }

    return assessment;
  }
  
  private assessWildfireRisk(address: string, lat?: number, lng?: number): { zone: string } {
    // Hawaii wildfire risk patterns
    const highRiskAreas = ['lahaina', 'kula', 'waikoloa', 'saddle road', 'waimea'];
    const moderateRiskAreas = ['upcountry', 'leeward', 'kihei', 'waianae'];
    
    const addressLower = address.toLowerCase();
    
    if (highRiskAreas.some(area => addressLower.includes(area))) {
      return { zone: 'High' };
    } else if (moderateRiskAreas.some(area => addressLower.includes(area))) {
      return { zone: 'Moderate' };
    } else if (addressLower.includes('windward') || addressLower.includes('hilo')) {
      return { zone: 'Low' };
    }
    
    return { zone: 'Unknown' };
  }
  
  private assessLavaZone(address: string, lat?: number, lng?: number): number | null {
    // Big Island lava zone assessment
    const addressLower = address.toLowerCase();
    
    // Zone 1 (highest risk) - active volcanic areas
    if (addressLower.includes('puna') || addressLower.includes('leilani') || addressLower.includes('kalapana')) {
      return 1;
    }
    
    // Zone 2 - Kilauea east rift
    if (addressLower.includes('pahoa') || addressLower.includes('mountain view')) {
      return 2;
    }
    
    // Zone 3 - Mauna Loa areas
    if (addressLower.includes('kau') || addressLower.includes('ocean view')) {
      return 3;
    }
    
    // Zone 4-6 - Lower risk areas
    if (addressLower.includes('hilo') || addressLower.includes('kona')) {
      return 5;
    }
    
    return null;
  }
  
  private async assessFloodZone(address: string, lat?: number, lng?: number): Promise<string> {
    // Simplified flood zone assessment
    const addressLower = address.toLowerCase();
    
    // High-risk coastal areas
    if (addressLower.includes('beachfront') || addressLower.includes('oceanfront')) {
      return 'AE';
    }
    
    // Areas near streams or in valleys
    if (addressLower.includes('valley') || addressLower.includes('stream') || addressLower.includes('gulch')) {
      return 'A';
    }
    
    return 'X';
  }
  
  private assessTsunamiRisk(address: string, lat?: number, lng?: number): boolean {
    // Coastal areas within evacuation zones
    const addressLower = address.toLowerCase();
    const coastalIndicators = ['beach', 'ocean', 'shore', 'bay', 'harbor', 'marina', 'waterfront'];
    
    return coastalIndicators.some(indicator => addressLower.includes(indicator));
  }
  
  private async assessDevelopmentRisk(address: string): Promise<{ zoningChangePotential: boolean; riskLevel: string }> {
    const addressLower = address.toLowerCase();
    
    // Transit-oriented development areas
    if (addressLower.includes('honolulu') || addressLower.includes('kakaako') || addressLower.includes('rail')) {
      return { zoningChangePotential: true, riskLevel: 'Transit-Oriented Development' };
    }
    
    // Commercial expansion areas
    if (addressLower.includes('waikiki') || addressLower.includes('ala moana') || addressLower.includes('downtown')) {
      return { zoningChangePotential: true, riskLevel: 'Commercial Expansion' };
    }
    
    return { zoningChangePotential: false, riskLevel: 'None' };
  }
  
  private calculateOverallNaturalRisk(assessment: RiskAssessment): string {
    let riskScore = 0;
    
    // Wildfire scoring
    if (assessment.wildfireRiskZone === 'High') riskScore += 3;
    else if (assessment.wildfireRiskZone === 'Moderate') riskScore += 2;
    else if (assessment.wildfireRiskZone === 'Low') riskScore += 1;
    
    // Lava zone scoring
    if (assessment.lavaZone && assessment.lavaZone <= 2) riskScore += 3;
    else if (assessment.lavaZone && assessment.lavaZone <= 4) riskScore += 2;
    else if (assessment.lavaZone) riskScore += 1;
    
    // Flood zone scoring
    if (['A', 'AE', 'VE'].includes(assessment.floodZone)) riskScore += 2;
    else if (assessment.floodZone === 'X') riskScore += 0;
    
    // Tsunami scoring
    if (assessment.tsunamiEvacuationZone) riskScore += 2;
    
    if (riskScore >= 6) return 'High Wildfire Risk';
    if (riskScore >= 3) return 'Moderate Wildfire Risk';
    if (riskScore >= 1) return 'Low Risk';
    return 'Minimal Risk';
  }
}

export const riskAssessmentService = new RiskAssessmentService();
