import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { storage } from "../storage";
import { mapService } from "./mapService";
import type { Property } from "@shared/schema";

class PDFGeneratorService {
  async generatePropertyBinder(property: Property, userId: string): Promise<string> {
    try {
      // Create PDF directory if it doesn't exist
      const pdfDir = path.join(process.cwd(), 'generated_pdfs');
      if (!fs.existsSync(pdfDir)) {
        fs.mkdirSync(pdfDir, { recursive: true });
      }

      const fileName = `property_binder_${property.id}_${Date.now()}.pdf`;
      const filePath = path.join(pdfDir, fileName);

      // Get additional data
      const contacts = await storage.getContactsByProperty(property.id);
      const mapData = await mapService.getPropertyMap(property);

      // Create PDF
      const doc = new PDFDocument({ margin: 50 });
      doc.pipe(fs.createWriteStream(filePath));

      // Cover Page
      this.addCoverPage(doc, property);
      
      // Property Details Page
      doc.addPage();
      this.addPropertyDetailsPage(doc, property, contacts[0]);
      
      // Market Analysis Page
      doc.addPage();
      this.addMarketAnalysisPage(doc, property);
      
      // Contact Information Page
      if (contacts.length > 0) {
        doc.addPage();
        this.addContactPage(doc, contacts[0], property);
      }
      
      // Strategy & Notes Page
      doc.addPage();
      this.addStrategyPage(doc, property);

      // Finalize PDF
      doc.end();

      // Save to database
      await storage.createPDFBinder({
        propertyId: property.id,
        userId,
        fileName,
        filePath: `/api/pdf/download/${fileName}`,
        fileSize: 0, // Will be updated after file is written
      });

      return `/api/pdf/download/${fileName}`;
    } catch (error) {
      console.error('Error generating PDF binder:', error);
      throw error;
    }
  }

  private addCoverPage(doc: PDFKit.PDFDocument, property: Property) {
    // Header
    doc.fontSize(28)
       .font('Helvetica-Bold')
       .fillColor('#0F62FE')
       .text('PROPERTY INVESTMENT BINDER', 50, 100, { align: 'center' });

    // Property Address
    doc.fontSize(20)
       .fillColor('#393939')
       .text(property.address, 50, 160, { align: 'center' });

    // Status Badge
    const statusColor = this.getStatusColor(property.status);
    doc.fontSize(14)
       .fillColor(statusColor)
       .text(property.status.toUpperCase().replace('_', ' '), 50, 200, { align: 'center' });

    // Priority Badge
    const priorityColor = this.getPriorityColor(property.priority);
    doc.fontSize(12)
       .fillColor(priorityColor)
       .text(`${property.priority.toUpperCase()} PRIORITY`, 50, 220, { align: 'center' });

    // Key Stats Box
    const boxY = 280;
    doc.rect(100, boxY, 400, 200)
       .strokeColor('#E0E0E0')
       .stroke();

    doc.fontSize(16)
       .fillColor('#393939')
       .text('KEY INFORMATION', 120, boxY + 20);

    doc.fontSize(12)
       .text(`Estimated Value: $${property.estimatedValue?.toLocaleString() || 'N/A'}`, 120, boxY + 50)
       .text(`Status: ${property.status.replace('_', ' ')}`, 120, boxY + 70)
       .text(`Days Until Auction: ${property.daysUntilAuction || 'N/A'}`, 120, boxY + 90)
       .text(`Amount Owed: $${property.amountOwed?.toLocaleString() || 'N/A'}`, 120, boxY + 110);

    // Generated Date
    doc.fontSize(10)
       .fillColor('#8D8D8D')
       .text(`Generated on ${new Date().toLocaleDateString()}`, 50, 750, { align: 'center' });
  }

  private addPropertyDetailsPage(doc: PDFKit.PDFDocument, property: Property, contact?: any) {
    doc.fontSize(20)
       .fillColor('#393939')
       .text('Property Details', 50, 50);

    let yPos = 100;

    // Property Information Table
    this.addTableRow(doc, 'Address:', property.address, yPos);
    yPos += 30;
    
    this.addTableRow(doc, 'City:', `${property.city}, ${property.state} ${property.zipCode}`, yPos);
    yPos += 30;
    
    this.addTableRow(doc, 'Property Type:', property.propertyType || 'N/A', yPos);
    yPos += 30;
    
    if (property.bedrooms || property.bathrooms) {
      this.addTableRow(doc, 'Bed/Bath:', `${property.bedrooms || 'N/A'}BR / ${property.bathrooms || 'N/A'}BA`, yPos);
      yPos += 30;
    }
    
    if (property.squareFeet) {
      this.addTableRow(doc, 'Square Feet:', property.squareFeet.toLocaleString(), yPos);
      yPos += 30;
    }
    
    if (property.yearBuilt) {
      this.addTableRow(doc, 'Year Built:', property.yearBuilt.toString(), yPos);
      yPos += 30;
    }

    yPos += 40;

    // Financial Information
    doc.fontSize(16)
       .fillColor('#393939')
       .text('Financial Information', 50, yPos);
    yPos += 40;

    this.addTableRow(doc, 'Estimated Value:', `$${property.estimatedValue?.toLocaleString() || 'N/A'}`, yPos);
    yPos += 30;
    
    if (property.amountOwed) {
      this.addTableRow(doc, 'Amount Owed:', `$${property.amountOwed.toLocaleString()}`, yPos);
      yPos += 30;
    }
    
    if (property.auctionDate) {
      this.addTableRow(doc, 'Auction Date:', property.auctionDate, yPos);
      yPos += 30;
    }

    // AI Summary
    if (property.aiSummary && yPos < 600) {
      yPos += 40;
      doc.fontSize(16)
         .fillColor('#393939')
         .text('AI Analysis', 50, yPos);
      
      yPos += 30;
      doc.fontSize(11)
         .fillColor('#393939')
         .text(property.aiSummary, 50, yPos, { width: 500, align: 'justify' });
    }
  }

  private addMarketAnalysisPage(doc: PDFKit.PDFDocument, property: Property) {
    doc.fontSize(20)
       .fillColor('#393939')
       .text('Market Analysis', 50, 50);

    let yPos = 100;

    // Opportunity Assessment
    doc.fontSize(16)
       .text('Investment Opportunity', 50, yPos);
    yPos += 30;

    const opportunityText = this.generateOpportunityAssessment(property);
    doc.fontSize(11)
       .text(opportunityText, 50, yPos, { width: 500, align: 'justify' });
    yPos += 100;

    // Risk Assessment
    doc.fontSize(16)
       .fillColor('#393939')
       .text('Risk Assessment', 50, yPos);
    yPos += 30;

    const riskText = this.generateRiskAssessment(property);
    doc.fontSize(11)
       .text(riskText, 50, yPos, { width: 500, align: 'justify' });
    yPos += 100;

    // Recommended Action
    doc.fontSize(16)
       .fillColor('#393939')
       .text('Recommended Action', 50, yPos);
    yPos += 30;

    const actionText = this.generateActionRecommendation(property);
    doc.fontSize(11)
       .fillColor('#0F62FE')
       .text(actionText, 50, yPos, { width: 500, align: 'justify' });
  }

  private addContactPage(doc: PDFKit.PDFDocument, contact: any, property: Property) {
    doc.fontSize(20)
       .fillColor('#393939')
       .text('Owner Information', 50, 50);

    let yPos = 100;

    if (contact.name) {
      this.addTableRow(doc, 'Owner Name:', contact.name, yPos);
      yPos += 30;
    }

    if (contact.email) {
      this.addTableRow(doc, 'Email:', contact.email, yPos);
      yPos += 30;
    }

    if (contact.phone) {
      this.addTableRow(doc, 'Phone:', contact.phone, yPos);
      yPos += 30;
    }

    if (contact.isLLC) {
      this.addTableRow(doc, 'Entity Type:', 'LLC/Corporation', yPos);
      yPos += 30;
    }

    this.addTableRow(doc, 'Contact Score:', `${contact.contactScore || 0}% Complete`, yPos);
    yPos += 30;

    if (contact.linkedinUrl) {
      this.addTableRow(doc, 'LinkedIn:', contact.linkedinUrl, yPos);
      yPos += 30;
    }

    // Outreach Strategy
    yPos += 40;
    doc.fontSize(16)
       .fillColor('#393939')
       .text('Outreach Strategy', 50, yPos);
    yPos += 30;

    const strategyText = this.generateOutreachStrategy(contact, property);
    doc.fontSize(11)
       .text(strategyText, 50, yPos, { width: 500, align: 'justify' });
  }

  private addStrategyPage(doc: PDFKit.PDFDocument, property: Property) {
    doc.fontSize(20)
       .fillColor('#393939')
       .text('Strategy & Notes', 50, 50);

    let yPos = 100;

    // Timeline
    doc.fontSize(16)
       .text('Timeline & Deadlines', 50, yPos);
    yPos += 30;

    if (property.auctionDate) {
      const daysUntil = property.daysUntilAuction || 0;
      doc.fontSize(12)
         .fillColor(daysUntil <= 7 ? '#DA1E28' : '#F1C21B')
         .text(`⚠ Auction in ${daysUntil} days (${property.auctionDate})`, 50, yPos);
      yPos += 25;
    }

    doc.fontSize(11)
       .fillColor('#393939')
       .text('• Initial contact: Within 24-48 hours', 50, yPos);
    yPos += 20;
    doc.text('• Follow-up: 3-5 days if no response', 50, yPos);
    yPos += 20;
    doc.text('• Property evaluation: Schedule within 1 week', 50, yPos);
    yPos += 40;

    // Notes Section
    doc.fontSize(16)
       .text('Notes & Comments', 50, yPos);
    yPos += 30;

    // Empty lines for manual notes
    for (let i = 0; i < 15; i++) {
      doc.moveTo(50, yPos)
         .lineTo(550, yPos)
         .strokeColor('#E0E0E0')
         .stroke();
      yPos += 25;
    }
  }

  private addTableRow(doc: PDFKit.PDFDocument, label: string, value: string, yPos: number) {
    doc.fontSize(12)
       .fillColor('#8D8D8D')
       .text(label, 50, yPos, { width: 150 });
    
    doc.fontSize(12)
       .fillColor('#393939')
       .text(value, 200, yPos, { width: 350 });
  }

  private getStatusColor(status: string): string {
    switch (status) {
      case 'foreclosure': return '#DA1E28';
      case 'tax_delinquent': return '#F1C21B';
      case 'auction': return '#DA1E28';
      default: return '#393939';
    }
  }

  private getPriorityColor(priority: string): string {
    switch (priority) {
      case 'high': return '#DA1E28';
      case 'medium': return '#F1C21B';
      case 'low': return '#24A148';
      default: return '#393939';
    }
  }

  private generateOpportunityAssessment(property: Property): string {
    const value = property.estimatedValue || 0;
    const owed = property.amountOwed || 0;
    const equity = value - owed;
    
    return `This property presents a ${property.priority} priority investment opportunity. With an estimated value of $${value.toLocaleString()} and approximately $${owed.toLocaleString()} owed, the potential equity position is $${equity.toLocaleString()}. The ${property.status.replace('_', ' ')} status indicates motivated seller circumstances, potentially allowing for favorable negotiation terms.`;
  }

  private generateRiskAssessment(property: Property): string {
    let risks = [];
    
    if (property.daysUntilAuction && property.daysUntilAuction <= 7) {
      risks.push('Extremely tight timeline for negotiation');
    }
    
    if (property.status === 'foreclosure') {
      risks.push('Legal proceedings in progress');
    }
    
    if (!property.estimatedValue) {
      risks.push('Property valuation needs verification');
    }
    
    return risks.length > 0 
      ? `Key risks include: ${risks.join(', ')}. Proper due diligence and quick action are essential.`
      : 'Standard investment risks apply. Recommend property inspection and title review.';
  }

  private generateActionRecommendation(property: Property): string {
    if (property.daysUntilAuction && property.daysUntilAuction <= 7) {
      return 'URGENT: Contact owner immediately. This is a time-sensitive opportunity requiring immediate action.';
    } else if (property.priority === 'high') {
      return 'High priority contact. Reach out within 24-48 hours with cash offer proposal.';
    } else {
      return 'Standard follow-up recommended. Contact within one week to assess interest level.';
    }
  }

  private generateOutreachStrategy(contact: any, property: Property): string {
    let strategy = [];
    
    if (contact.email && contact.phone) {
      strategy.push('Multi-channel approach: Initial email followed by phone call');
    } else if (contact.email) {
      strategy.push('Email outreach with follow-up sequence');
    } else if (contact.phone) {
      strategy.push('Direct phone contact approach');
    } else {
      strategy.push('Door-to-door contact may be necessary');
    }
    
    if (contact.isLLC) {
      strategy.push('Business entity requires professional business proposal');
    } else {
      strategy.push('Personal approach emphasizing help and solutions');
    }
    
    return strategy.join('. ') + '.';
  }
}

export const pdfGeneratorService = new PDFGeneratorService();
