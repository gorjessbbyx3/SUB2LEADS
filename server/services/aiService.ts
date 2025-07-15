interface Property {
  id: number;
  address: string;
  ownerName?: string;
  propertyType?: string;
  lienAmount?: number;
  estimatedValue?: number;
  status: string;
  priority: string;
  source: string;
}

interface Contact {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  role?: string;
}

class AIService {
  async processChat(message: string, context?: { contextId?: string; contextType?: string }) {
    // Mock AI response - in real implementation, integrate with OpenAI API
    const responses = [
      "I understand you're looking for information about this property. Based on the data available, I can help you analyze the investment potential.",
      "This property appears to be in the foreclosure process. Would you like me to generate a personalized outreach email for the property owner?",
      "The property shows good potential for investment. The estimated value suggests a reasonable equity position even after liens.",
      "I can help you create a comprehensive property analysis report. Would you like me to generate that for you?",
    ];

    return responses[Math.floor(Math.random() * responses.length)];
  }

  async generatePropertySummary(property: Property): Promise<string> {
    // Mock AI-generated property summary
    const summaryParts = [
      `Property Summary for ${property.address}:`,
      '',
      `This ${property.propertyType || 'property'} is currently in ${property.status} status with ${property.priority} priority.`,
    ];

    if (property.estimatedValue && property.lienAmount) {
      const equity = property.estimatedValue - property.lienAmount;
      const equityPercentage = ((equity / property.estimatedValue) * 100).toFixed(1);
      summaryParts.push(``, `Financial Analysis:`);
      summaryParts.push(`• Estimated Value: $${property.estimatedValue.toLocaleString()}`);
      summaryParts.push(`• Lien Amount: $${property.lienAmount.toLocaleString()}`);
      summaryParts.push(`• Potential Equity: $${equity.toLocaleString()} (${equityPercentage}%)`);
    }

    summaryParts.push(``, `Investment Recommendation:`);
    if (property.priority === 'high') {
      summaryParts.push(`This property shows strong investment potential with favorable equity position. Recommended for immediate outreach.`);
    } else if (property.priority === 'medium') {
      summaryParts.push(`Moderate investment opportunity. Consider reaching out after higher priority properties.`);
    } else {
      summaryParts.push(`Lower priority investment. May be suitable for long-term portfolio building.`);
    }

    summaryParts.push(``, `Next Steps:`);
    summaryParts.push(`• Contact property owner for initial discussion`);
    summaryParts.push(`• Conduct property inspection if possible`);
    summaryParts.push(`• Research comparable sales in the area`);
    summaryParts.push(`• Calculate repair and renovation costs`);

    return summaryParts.join('\n');
  }

  async generateEmail(property: Property, contact: Contact, campaignType: string): Promise<string> {
    const templates = {
      initial_contact: this.generateInitialContactEmail(property, contact),
      follow_up: this.generateFollowUpEmail(property, contact),
      final_offer: this.generateFinalOfferEmail(property, contact),
    };

    return templates[campaignType as keyof typeof templates] || templates.initial_contact;
  }

  private generateInitialContactEmail(property: Property, contact: Contact): string {
    return `Subject: Regarding Your Property at ${property.address}

Dear ${contact.name || 'Property Owner'},

I hope this message finds you well. My name is [Your Name], and I'm a real estate investor here in Hawaii. I noticed your property at ${property.address} and wanted to reach out with a potential opportunity.

I understand that you may be facing some challenges with your property, and I want you to know that I'm here to help. I specialize in working with homeowners in difficult situations and can offer several solutions that might benefit you:

• Quick cash purchase (no financing contingencies)
• Flexible closing timeline that works for your schedule
• We handle all paperwork and closing costs
• No real estate agent commissions
• As-is purchase (no need for repairs or cleaning)

I've been investing in Hawaii real estate for several years and have helped many families transition out of difficult property situations while maintaining their dignity and getting a fair deal.

Would you be open to a brief, no-obligation conversation about your property? I can usually provide a preliminary offer within 24 hours of speaking with you.

You can reach me at:
• Phone: [Your Phone Number]
• Email: [Your Email]

I understand this might be a difficult time, and I want to assure you that any conversation we have will be completely confidential and without pressure.

Thank you for your time, and I hope to hear from you soon.

Best regards,
[Your Name]
[Your Company]
[Your License Number]

P.S. Even if you're not ready to sell now, I'm happy to answer any questions you might have about your options. Sometimes just talking through the situation can help clarify the best path forward.`;
  }

  private generateFollowUpEmail(property: Property, contact: Contact): string {
    return `Subject: Following Up - ${property.address} Property Options

Hi ${contact.name || 'Property Owner'},

I wanted to follow up on my previous message regarding your property at ${property.address}. I know you're probably busy and receiving various communications, but I wanted to make sure you saw my offer to help.

Sometimes property situations can feel overwhelming, but there are usually more options available than people realize. I've worked with homeowners in all kinds of circumstances, and there's often a solution that works for everyone involved.

Here's what makes my approach different:

✓ No pressure - I believe in giving you all the information you need to make the best decision for your family
✓ Multiple options - Cash purchase isn't the only solution; sometimes we can work out payment plans or other creative arrangements
✓ Local expertise - I know the Hawaii market and can give you an honest assessment of your property's value
✓ Quick response - I can usually get back to you within hours, not days

If you'd like to explore your options, I'm available for a quick phone call at your convenience. Even if you decide not to work with me, I'm happy to share some insights about the local market that might be helpful.

You can reach me at [Your Phone Number] or simply reply to this email.

Best regards,
[Your Name]

P.S. If now isn't a good time, please let me know when might work better for you. I respect your schedule and situation.`;
  }

  private generateFinalOfferEmail(property: Property, contact: Contact): string {
    const estimatedOffer = property.estimatedValue && property.lienAmount 
      ? Math.round((property.estimatedValue - property.lienAmount) * 0.7)
      : 'competitive market value';

    return `Subject: Final Offer - ${property.address} - Time Sensitive

Dear ${contact.name || 'Property Owner'},

I've been trying to reach you regarding your property at ${property.address}, and I wanted to make one final offer before moving on to other opportunities.

After analyzing your property and the local market, I'm prepared to make the following offer:

${typeof estimatedOffer === 'number' 
  ? `Cash Offer: $${estimatedOffer.toLocaleString()}`
  : `Competitive cash offer based on current market conditions`
}

This offer includes:
• All cash - no financing contingencies
• Close in 14 days or less
• We pay all closing costs
• No repairs needed - we buy as-is
• No real estate commissions

I understand this situation may be stressful, and I want to help you move forward quickly and fairly. This offer is good for the next 7 days, after which I'll need to focus on other properties.

If you're interested in discussing this offer or have any questions, please call me at [Your Phone Number] or reply to this email by [Date - 7 days from now].

I sincerely hope we can work together to find a solution that benefits everyone involved.

Best regards,
[Your Name]
[Your Company]
[Your License Number]

Important: This is a time-sensitive offer. Please respond by [Date] to secure these terms.`;
  }
}

export const aiService = new AIService();