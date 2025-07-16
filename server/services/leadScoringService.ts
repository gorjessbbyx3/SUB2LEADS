
import { Property, Lead, Contact } from '@shared/schema';

export interface LeadScore {
  totalScore: number;
  equityScore: number;
  urgencyScore: number;
  contactScore: number;
  marketScore: number;
  breakdown: {
    equity: string;
    urgency: string;
    contact: string;
    market: string;
  };
}

export class LeadScoringService {
  calculateLeadScore(property: Property, contact: Contact, lead: Lead): LeadScore {
    const equityScore = this.calculateEquityScore(property);
    const urgencyScore = this.calculateUrgencyScore(property);
    const contactScore = this.calculateContactScore(contact);
    const marketScore = this.calculateMarketScore(property);

    const totalScore = Math.round((equityScore + urgencyScore + contactScore + marketScore) / 4);

    return {
      totalScore,
      equityScore: Math.round(equityScore),
      urgencyScore: Math.round(urgencyScore),
      contactScore: Math.round(contactScore),
      marketScore: Math.round(marketScore),
      breakdown: {
        equity: this.getEquityBreakdown(property),
        urgency: this.getUrgencyBreakdown(property),
        contact: this.getContactBreakdown(contact),
        market: this.getMarketBreakdown(property)
      }
    };
  }

  private calculateEquityScore(property: Property): number {
    if (!property.estimatedValue || !property.amountOwed) return 30;

    const equityRatio = (property.estimatedValue - property.amountOwed) / property.estimatedValue;
    
    if (equityRatio >= 0.5) return 100;
    if (equityRatio >= 0.3) return 80;
    if (equityRatio >= 0.15) return 60;
    if (equityRatio >= 0.05) return 40;
    return 20;
  }

  private calculateUrgencyScore(property: Property): number {
    if (!property.daysUntilAuction) return 50;

    if (property.daysUntilAuction <= 7) return 100;
    if (property.daysUntilAuction <= 14) return 80;
    if (property.daysUntilAuction <= 30) return 60;
    if (property.daysUntilAuction <= 60) return 40;
    return 20;
  }

  private calculateContactScore(contact: Contact): number {
    let score = 0;
    
    if (contact.name) score += 20;
    if (contact.email) score += 25;
    if (contact.phone) score += 25;
    if (contact.address) score += 15;
    if (contact.linkedinUrl) score += 10;
    if (contact.facebookUrl) score += 5;

    return Math.min(score, 100);
  }

  private calculateMarketScore(property: Property): number {
    let score = 50; // Base score

    // Property type scoring
    if (property.propertyType === 'Single Family') score += 15;
    else if (property.propertyType === 'Condo') score += 10;
    else if (property.propertyType === 'Multifamily') score += 20;

    // Location scoring (simplified - in real app would use market data)
    if (property.city?.toLowerCase().includes('honolulu')) score += 20;
    else if (property.city?.toLowerCase().includes('kailua')) score += 15;
    else score += 10;

    // Size scoring
    if (property.squareFeet && property.squareFeet > 2000) score += 10;
    else if (property.squareFeet && property.squareFeet > 1200) score += 5;

    return Math.min(score, 100);
  }

  private getEquityBreakdown(property: Property): string {
    if (!property.estimatedValue || !property.amountOwed) return 'Unknown equity position';
    
    const equity = property.estimatedValue - property.amountOwed;
    const equityRatio = equity / property.estimatedValue;
    
    return `$${equity.toLocaleString()} equity (${Math.round(equityRatio * 100)}%)`;
  }

  private getUrgencyBreakdown(property: Property): string {
    if (!property.daysUntilAuction) return 'No auction date set';
    
    if (property.daysUntilAuction <= 7) return 'URGENT: Auction in 1 week';
    if (property.daysUntilAuction <= 14) return 'HIGH: Auction in 2 weeks';
    if (property.daysUntilAuction <= 30) return 'MEDIUM: Auction in 1 month';
    
    return `LOW: ${property.daysUntilAuction} days until auction`;
  }

  private getContactBreakdown(contact: Contact): string {
    const completeness = contact.contactScore || 0;
    if (completeness >= 80) return 'Complete contact info';
    if (completeness >= 60) return 'Good contact info';
    if (completeness >= 40) return 'Partial contact info';
    return 'Limited contact info';
  }

  private getMarketBreakdown(property: Property): string {
    return `${property.propertyType || 'Unknown'} in ${property.city || 'Unknown location'}`;
  }
}

export const leadScoringService = new LeadScoringService();
