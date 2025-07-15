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
  private openaiApiKey = process.env.OPENAI_API_KEY;

  async processChat(message: string, context?: { contextId?: string; contextType?: string }) {
    try {
      // If no OpenAI API key, fall back to intelligent mock responses
      if (!this.openaiApiKey) {
        return this.generateIntelligentMockResponse(message, context);
      }

      // Real OpenAI integration
      const systemPrompt = this.getSystemPrompt(context);
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message }
          ],
          max_tokens: 500,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('AI Chat Error:', error);
      return this.generateIntelligentMockResponse(message, context);
    }
  }

  private getSystemPrompt(context?: { contextId?: string; contextType?: string }): string {
    const basePrompt = `You are an AI assistant for Sub2Leads, a real estate investment platform focused on distressed properties in Hawaii. You help investors analyze properties, manage leads, and create outreach strategies.

Your expertise includes:
- Foreclosure and tax delinquent property analysis
- Investment ROI calculations
- Lead management and CRM guidance
- Email outreach strategies for property owners
- Hawaii real estate market insights

Always be helpful, professional, and focused on practical real estate investment advice.`;

    if (context?.contextType === 'property') {
      return basePrompt + `\n\nYou are currently discussing a specific property (ID: ${context.contextId}). Focus on property-specific analysis, investment potential, and actionable next steps.`;
    }

    return basePrompt;
  }

  private generateIntelligentMockResponse(message: string, context?: { contextId?: string; contextType?: string }): string {
    const lowerMessage = message.toLowerCase();
    
    // Lead qualification responses
    if (lowerMessage.includes('lead') || lowerMessage.includes('qualify')) {
      return "For lead qualification, I recommend focusing on these key factors: 1) Property equity position (aim for 20%+ equity), 2) Owner motivation level (foreclosure timeline urgency), 3) Property condition and repair needs, 4) Local market conditions. Would you like me to help analyze a specific lead's qualification score?";
    }
    
    // Property analysis responses
    if (lowerMessage.includes('property') || lowerMessage.includes('analysis') || lowerMessage.includes('investment')) {
      return "I can help you analyze this property's investment potential. Key metrics to consider: estimated market value vs. outstanding liens, repair costs (typically 15-25% of value), holding costs, and exit strategy timeline. Would you like me to generate a detailed property summary or create an outreach email for the owner?";
    }
    
    // Email/outreach responses
    if (lowerMessage.includes('email') || lowerMessage.includes('outreach') || lowerMessage.includes('contact')) {
      return "For effective outreach to distressed property owners, I recommend a compassionate approach focusing on solutions rather than problems. Key elements: acknowledge their situation respectfully, offer multiple options (not just cash purchase), provide quick response timeline, and emphasize no-pressure consultation. Would you like me to generate a personalized email template?";
    }
    
    // Offer/pricing responses
    if (lowerMessage.includes('offer') || lowerMessage.includes('price') || lowerMessage.includes('value')) {
      return "When determining offer prices for distressed properties, consider: 1) ARV (After Repair Value) based on recent comps, 2) Repair costs (get contractor estimates), 3) Holding costs and timeline, 4) Your target profit margin (typically 20-30%). A good starting point is 70% of ARV minus repair costs. Need help calculating an offer for a specific property?";
    }
    
    // Market/Hawaii specific responses
    if (lowerMessage.includes('hawaii') || lowerMessage.includes('market') || lowerMessage.includes('honolulu')) {
      return "The Hawaii real estate market has unique characteristics: limited inventory drives higher values, but also higher repair costs due to island logistics. Focus on areas with good rental demand like Honolulu, Pearl City, and Kailua. Watch for properties in foreclosure through Star Advertiser legal notices and tax delinquent lists. The median home price requires careful analysis of deal viability.";
    }
    
    // CRM/follow-up responses
    if (lowerMessage.includes('follow') || lowerMessage.includes('crm') || lowerMessage.includes('timeline')) {
      return "Effective follow-up sequences for distressed property leads: 1) Initial contact within 24 hours, 2) Follow-up call/email after 3 days, 3) Check-in after 1 week with additional options, 4) Final offer after 2 weeks with deadline. Track all interactions in your CRM and set automated reminders. Most motivated sellers respond within the first week.";
    }
    
    // Default helpful response
    return "I'm here to help with your real estate investment questions! I can assist with property analysis, lead qualification, outreach strategies, offer calculations, and Hawaii market insights. What specific aspect of your investment process would you like to discuss?";
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