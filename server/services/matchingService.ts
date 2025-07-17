import { storage } from '../storage';
import type { Property, Investor, Lead } from '@shared/schema';

interface MatchResult {
  leadId: number;
  investorId: number;
  property: Property;
  investor: Investor;
  matchScore: number;
  matchReasons: string[];
}

class MatchingService {
  async findMatchesForLead(leadId: number): Promise<MatchResult[]> {
    const lead = await storage.getLead(leadId);
    if (!lead) return [];

    const property = await storage.getProperty(lead.propertyId);
    if (!property) return [];

    const investors = await storage.getInvestors({ limit: 1000 });
    const matches: MatchResult[] = [];

    for (const investor of investors) {
      const matchResult = this.calculateMatch(property, investor);
      if (matchResult.matchScore > 0) {
        matches.push({
          leadId,
          investorId: investor.id,
          property,
          investor,
          matchScore: matchResult.matchScore,
          matchReasons: matchResult.reasons
        });
      }
    }

    // Sort by match score (highest first)
    return matches.sort((a, b) => b.matchScore - a.matchScore);
  }

  async findMatchesForAllLeads(): Promise<MatchResult[]> {
    const leads = await storage.getLeads({ limit: 1000 });
    const allMatches: MatchResult[] = [];

    for (const lead of leads) {
      const leadMatches = await this.findMatchesForLead(lead.id);
      allMatches.push(...leadMatches);
    }

    return allMatches.sort((a, b) => b.matchScore - a.matchScore);
  }

  async findMatchesForInvestor(investorId: number): Promise<MatchResult[]> {
    const investor = await storage.getInvestor(investorId);
    if (!investor) return [];

    // Include both distressed and wholesale properties
    const allProperties = await storage.getProperties({ limit: 1000 });
    const properties = allProperties.filter(p => 
      ['foreclosure', 'tax_delinquent', 'auction', 'wholesale'].includes(p.status)
    );
    const matches: MatchResult[] = [];

    for (const property of properties) {
      const matchResult = this.calculateMatch(property, investor);
      if (matchResult.matchScore > 0) {
        // Find lead for this property
        const leads = await storage.getLeads({ limit: 1000 });
        const lead = leads.find(l => l.propertyId === property.id);

        if (lead) {
          matches.push({
            leadId: lead.id,
            investorId,
            property,
            investor,
            matchScore: matchResult.matchScore,
            matchReasons: matchResult.reasons
          });
        }
      }
    }

    return matches.sort((a, b) => b.matchScore - a.matchScore);
  }

  private calculateMatch(property: Property, investor: Investor): { matchScore: number; reasons: string[] } {
    let score = 0;
    const reasons: string[] = [];

    // Island matching (required for any match)
    const propertyIsland = this.extractIsland(property.address);
    if (investor.preferredIslands && investor.preferredIslands.includes(propertyIsland)) {
      score += 30;
      reasons.push(`Location match: ${propertyIsland}`);
    } else {
      return { matchScore: 0, reasons: ['Location not in preferred islands'] };
    }

    // Property type matching
    if (investor.propertyTypes && property.propertyType) {
      const normalizedPropertyType = this.normalizePropertyType(property.propertyType);
      const matchesType = investor.propertyTypes.some(type => 
        this.normalizePropertyType(type) === normalizedPropertyType
      );

      if (matchesType) {
        score += 25;
        reasons.push(`Property type match: ${property.propertyType}`);
      }
    }

    // Price range matching
    if (property.estimatedValue) {
      if (investor.minBudget && property.estimatedValue < investor.minBudget) {
        score -= 20;
        reasons.push(`Below min budget ($${investor.minBudget.toLocaleString()})`);
      } else if (investor.maxBudget && property.estimatedValue > investor.maxBudget) {
        score -= 20;
        reasons.push(`Above max budget ($${investor.maxBudget.toLocaleString()})`);
      } else {
        score += 20;
        reasons.push(`Price in range: $${property.estimatedValue.toLocaleString()}`);
      }
    }

    // Auction urgency bonus
    if (property.daysUntilAuction) {
      if (property.daysUntilAuction <= 7) {
        score += 15;
        reasons.push(`Urgent: ${property.daysUntilAuction} days until auction`);
      } else if (property.daysUntilAuction <= 30) {
        score += 10;
        reasons.push(`Time-sensitive: ${property.daysUntilAuction} days until auction`);
      }
    }

    // Strategy matching bonus
    if (investor.strategies && investor.strategies.length > 0) {
      const propertyStrategy = this.suggestStrategy(property);
      if (investor.strategies.includes(propertyStrategy)) {
        score += 10;
        reasons.push(`Strategy match: ${propertyStrategy}`);
      }
    }

    // Priority bonus
    if (property.priority === 'high') {
      score += 5;
      reasons.push('High priority property');
    }

    return { matchScore: Math.max(0, score), reasons };
  }

  private extractIsland(address: string): string {
    const lowerAddress = address.toLowerCase();
    if (lowerAddress.includes('honolulu') || lowerAddress.includes('waikiki') || 
        lowerAddress.includes('kapolei') || lowerAddress.includes('kailua') ||
        lowerAddress.includes('pearl city') || lowerAddress.includes('aiea')) {
      return 'Oahu';
    } else if (lowerAddress.includes('maui') || lowerAddress.includes('lahaina') ||
               lowerAddress.includes('kihei') || lowerAddress.includes('hana')) {
      return 'Maui';
    } else if (lowerAddress.includes('kona') || lowerAddress.includes('hilo') ||
               lowerAddress.includes('big island')) {
      return 'Big Island';
    } else if (lowerAddress.includes('kauai') || lowerAddress.includes('lihue') ||
               lowerAddress.includes('poipu')) {
      return 'Kauai';
    }
    return 'Oahu'; // Default to Oahu
  }

  private normalizePropertyType(type: string): string {
    const lower = type.toLowerCase();
    if (lower.includes('single') || lower.includes('sfr') || lower.includes('house')) {
      return 'Single Family';
    } else if (lower.includes('condo') || lower.includes('condominium')) {
      return 'Condo';
    } else if (lower.includes('multi') || lower.includes('duplex') || lower.includes('triplex')) {
      return 'Multifamily';
    } else if (lower.includes('land') || lower.includes('vacant')) {
      return 'Vacant Land';
    }
    return type;
  }

  private suggestStrategy(property: Property): string {
    if (property.estimatedValue && property.estimatedValue > 800000) {
      return 'Fix & Flip';
    } else if (property.propertyType === 'multifamily') {
      return 'Buy & Hold';
    } else if (property.amountOwed && property.estimatedValue && 
               property.amountOwed < property.estimatedValue * 0.7) {
      return 'BRRRR';
    }
    return 'Buy & Hold';
  }

  async getMatchingStats(): Promise<{
    totalMatches: number;
    matchesByInvestor: Record<string, number>;
    matchesByProperty: Record<string, number>;
    averageMatchScore: number;
  }> {
    const allMatches = await this.findMatchesForAllLeads();

    const matchesByInvestor: Record<string, number> = {};
    const matchesByProperty: Record<string, number> = {};
    let totalScore = 0;

    for (const match of allMatches) {
      const investorKey = `${match.investor.name} (${match.investor.id})`;
      const propertyKey = `${match.property.address} (${match.property.id})`;

      matchesByInvestor[investorKey] = (matchesByInvestor[investorKey] || 0) + 1;
      matchesByProperty[propertyKey] = (matchesByProperty[propertyKey] || 0) + 1;
      totalScore += match.matchScore;
    }

    return {
      totalMatches: allMatches.length,
      matchesByInvestor,
      matchesByProperty,
      averageMatchScore: allMatches.length > 0 ? totalScore / allMatches.length : 0
    };
  }

  findInvestorMatches(property: Property): InvestorMatch[] {
    // This is a simplified matching algorithm
    // In a real application, you'd want more sophisticated matching logic

    const matches: InvestorMatch[] = [];

    // Mock matching logic - replace with actual implementation
    return matches;
  }

  async getAllMatches(): Promise<MatchResult[]> {
    try {
      // Get properties from database
      const properties = await storage.getProperties({ limit: 100 });

      // Get investors from database  
      const investors = await storage.getInvestors(undefined, { limit: 100 });

      if (!properties.length || !investors.length) {
        console.log('No properties or investors found in database');
        return [];
      }

      const matches: MatchResult[] = [];

      // Generate matches between properties and investors
      for (const property of properties) {
        for (const investor of investors) {
          const matchScore = this.calculateMatchScore(property, investor);

          if (matchScore >= 40) { // Only include matches with 40%+ score
            const matchReasons = this.getMatchReasons(property, investor);

            matches.push({
              leadId: property.id,
              investorId: investor.id,
              property: {
                id: property.id,
                address: property.address,
                estimatedValue: property.estimatedValue,
                daysUntilAuction: property.daysUntilAuction,
                priority: property.priority,
                propertyType: property.propertyType,
                status: property.status
              },
              investor: {
                id: investor.id,
                name: investor.name,
                email: investor.email,
                phone: investor.phone,
                company: investor.company,
                strategies: investor.strategies || [],
                preferredIslands: investor.preferredIslands || [],
                minBudget: investor.minBudget,
                maxBudget: investor.maxBudget
              },
              matchScore,
              matchReasons
            });
          }
        }
      }

      // Sort by match score descending
      return matches.sort((a, b) => b.matchScore - a.matchScore);

    } catch (error) {
      console.error('Error getting matches:', error);
      return [];
    }
  }

  async getMatchingStats(): Promise<{
    totalMatches: number;
    matchesByInvestor: Record<string, number>;
    matchesByProperty: Record<string, number>;
    averageMatchScore: number;
  }> {
    const allMatches = await this.getAllMatches();

    const matchesByInvestor: Record<string, number> = {};
    const matchesByProperty: Record<string, number> = {};
    let totalScore = 0;

    for (const match of allMatches) {
      const investorKey = `${match.investor.name} (${match.investor.id})`;
      const propertyKey = `${match.property.address} (${match.property.id})`;

      matchesByInvestor[investorKey] = (matchesByInvestor[investorKey] || 0) + 1;
      matchesByProperty[propertyKey] = (matchesByProperty[propertyKey] || 0) + 1;
      totalScore += match.matchScore;
    }

    return {
      totalMatches: allMatches.length,
      matchesByInvestor,
      matchesByProperty,
      averageMatchScore: allMatches.length > 0 ? totalScore / allMatches.length : 0
    };
  }

  private calculateMatchScore(property: Property, investor: Investor): number {
    let score = 0;

    if (investor.preferredIslands && investor.preferredIslands.includes(this.extractIsland(property.address))) {
      score += 30;
    }

    if (investor.propertyTypes && investor.propertyTypes.includes(property.propertyType || '')) {
      score += 25;
    }

    if (property.estimatedValue && investor.minBudget && property.estimatedValue >= investor.minBudget) {
      score += 20;
    }

    if (property.estimatedValue && investor.maxBudget && property.estimatedValue <= investor.maxBudget) {
      score += 20;
    }

    if (property.daysUntilAuction && property.daysUntilAuction <= 30) {
      score += 15;
    }

    return score;
  }

  private getMatchReasons(property: Property, investor: Investor): string[] {
    const reasons: string[] = [];

    if (investor.preferredIslands && investor.preferredIslands.includes(this.extractIsland(property.address))) {
      reasons.push("Location preference");
    }

    if (investor.propertyTypes && investor.propertyTypes.includes(property.propertyType || '')) {
      reasons.push("Property type alignment");
    }

    if (property.estimatedValue && investor.minBudget && property.estimatedValue >= investor.minBudget) {
      reasons.push("Minimum budget match");
    }

    if (property.estimatedValue && investor.maxBudget && property.estimatedValue <= investor.maxBudget) {
      reasons.push("Maximum budget match");
    }

    if (property.daysUntilAuction && property.daysUntilAuction <= 30) {
      reasons.push("Auction urgency");
    }

    return reasons;
  }
}

export const matchingService = new MatchingService();