import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import axios from 'axios';

interface PropertyData {
  id: number;
  address: string;
  tmk?: string;
  island: string;
  city?: string;
  propertyType?: string;
  auctionDate?: string;
  status: string;
  estimatedValue?: number;
  amountOwed?: number;
  notes?: string;
  priority: string;
}

interface ContactData {
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
}

interface BuyerMatch {
  name: string;
  strategy: string;
  maxPrice?: number;
  email?: string;
}

interface CompData {
  address: string;
  soldPrice: number;
  soldDate: string;
  distance: string;
}

interface PDFOptions {
  includePhotos?: boolean;
  includeMap?: boolean;
  includeComps?: boolean;
  includeMatches?: boolean;
  companyName?: string;
  contactInfo?: string;
  logoPath?: string;
}

export class PropertyPDFGenerator {
  private doc: PDFDocument;
  private pageWidth: number = 612;
  private pageHeight: number = 792;
  private margin: number = 50;

  constructor() {
    this.doc = new PDFDocument({
      size: 'LETTER',
      margins: {
        top: this.margin,
        bottom: this.margin,
        left: this.margin,
        right: this.margin
      }
    });
  }

  async generatePropertyPDF(
    property: PropertyData,
    contact?: ContactData,
    matches: BuyerMatch[] = [],
    comps: CompData[] = [],
    options: PDFOptions = {}
  ): Promise<Buffer> {
    const buffers: Buffer[] = [];

    this.doc.on('data', buffers.push.bind(buffers));

    return new Promise((resolve) => {
      this.doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      // Generate PDF content
      this.createCoverPage(property, options);
      this.createDealOverview(property, contact);

      if (options.includePhotos) {
        this.createPhotosPage(property);
      }

      if (options.includeMap) {
        this.createLocationMap(property);
      }

      if (options.includeComps && comps.length > 0) {
        this.createCompsPage(comps);
      }

      this.createStrategyPage(property, matches);
      this.createContactPage(options);

      this.doc.end();
    });
  }

  private createCoverPage(property: PropertyData, options: PDFOptions) {
    // Header with logo space
    if (options.logoPath && fs.existsSync(options.logoPath)) {
      this.doc.image(options.logoPath, this.margin, this.margin, { width: 100 });
    }

    // Main title
    this.doc
      .fontSize(24)
      .font('Helvetica-Bold')
      .fillColor('#2563eb')
      .text('PROPERTY FORECLOSURE DEAL', this.margin, 150, {
        align: 'center',
        width: this.pageWidth - 2 * this.margin
      });

    // Property address
    this.doc
      .fontSize(18)
      .fillColor('#1f2937')
      .text(property.address, this.margin, 200, {
        align: 'center',
        width: this.pageWidth - 2 * this.margin
      });

    // TMK if available
    if (property.tmk) {
      this.doc
        .fontSize(14)
        .fillColor('#6b7280')
        .text(`TMK: ${property.tmk}`, this.margin, 230, {
          align: 'center',
          width: this.pageWidth - 2 * this.margin
        });
    }

    // Property photo placeholder
    this.createPhotoPlaceholder(this.margin + 100, 280, 300, 200);

    // Island and type info
    this.doc
      .fontSize(16)
      .fillColor('#374151')
      .text(`${property.island} • ${property.propertyType || 'Property'}`, this.margin, 520, {
        align: 'center',
        width: this.pageWidth - 2 * this.margin
      });

    // Company info
    this.doc
      .fontSize(14)
      .fillColor('#6b7280')
      .text(`Presented by: ${options.companyName || 'Sub2Leads | Hawaii Opportunities'}`, this.margin, 700, {
        align: 'center',
        width: this.pageWidth - 2 * this.margin
      });

    this.doc.addPage();
  }

  private createDealOverview(property: PropertyData, contact?: ContactData, leadDetails?: any) {
    this.addSectionHeader('DEAL OVERVIEW', '#dc2626');

    let yPos = 120;
    const leftCol = this.margin;
    const rightCol = this.pageWidth / 2 + 20;

    // Left column
    this.addKeyValuePair('Island:', property.island, leftCol, yPos);
    yPos += 30;

    if (property.tmk) {
      this.addKeyValuePair('TMK:', property.tmk, leftCol, yPos);
      yPos += 30;
    }

    if (property.auctionDate) {
      this.addKeyValuePair('Auction Date:', new Date(property.auctionDate).toLocaleDateString(), leftCol, yPos);
      yPos += 30;
    }

    this.addKeyValuePair('Property Type:', property.propertyType || 'SFR', leftCol, yPos);
    yPos += 30;

    this.addKeyValuePair('Status:', property.status, leftCol, yPos);
    yPos += 30;

    // Financing details
    if (leadDetails?.financingType) {
      this.addKeyValuePair('Financing:', leadDetails.financingType, leftCol, yPos);
      yPos += 30;
    }

    // Ownership details
    if (leadDetails?.ownershipType) {
      this.addKeyValuePair('Ownership:', leadDetails.ownershipType, leftCol, yPos);
      yPos += 30;
    }

    // Right column
    yPos = 120;

    if (property.estimatedValue) {
      this.addKeyValuePair('Estimated ARV:', `$${property.estimatedValue.toLocaleString()}`, rightCol, yPos);
      yPos += 30;
    }

    if (property.amountOwed) {
      this.addKeyValuePair('Amount Owed:', `$${property.amountOwed.toLocaleString()}`, rightCol, yPos);
      yPos += 30;
    }

    this.addKeyValuePair('Priority:', property.priority, rightCol, yPos);
    yPos += 30;

    // Contracting details
    if (leadDetails?.contractingType) {
      this.addKeyValuePair('Deal Type:', leadDetails.contractingType, rightCol, yPos);
      yPos += 30;
    }

    // Calculate potential spread
    if (property.estimatedValue && property.amountOwed) {
      const spread = property.estimatedValue - property.amountOwed;
      this.doc
        .fontSize(16)
        .font('Helvetica-Bold')
        .fillColor('#dc2626')
        .text(`🔥 Potential Spread: $${spread.toLocaleString()}`, rightCol, yPos + 20);
    }

    // Notes section
    if (property.notes) {
      yPos = 350;
      this.doc
        .fontSize(14)
        .font('Helvetica-Bold')
        .fillColor('#374151')
        .text('NOTES:', this.margin, yPos);

      this.doc
        .fontSize(12)
        .font('Helvetica')
        .fillColor('#6b7280')
        .text(property.notes, this.margin, yPos + 25, {
          width: this.pageWidth - 2 * this.margin,
          align: 'left'
        });
    }

    // Contact info if available
    if (contact && contact.name) {
      yPos = 450;
      this.doc
        .fontSize(14)
        .font('Helvetica-Bold')
        .fillColor('#374151')
        .text('OWNER CONTACT:', this.margin, yPos);

      this.doc
        .fontSize(12)
        .font('Helvetica')
        .fillColor('#6b7280')
        .text(`Name: ${contact.name}`, this.margin, yPos + 25);

      if (contact.email) {
        this.doc.text(`Email: ${contact.email}`, this.margin, yPos + 45);
      }

      if (contact.phone) {
        this.doc.text(`Phone: ${contact.phone}`, this.margin, yPos + 65);
      }
    }

    this.doc.addPage();
  }

  private createPhotosPage(property: PropertyData) {
    this.addSectionHeader('PROPERTY PHOTOS', '#059669');

    // Photo grid - 2x2 layout
    const photoWidth = 240;
    const photoHeight = 180;
    const spacing = 20;

    const positions = [
      { x: this.margin, y: 150 },
      { x: this.margin + photoWidth + spacing, y: 150 },
      { x: this.margin, y: 150 + photoHeight + spacing },
      { x: this.margin + photoWidth + spacing, y: 150 + photoHeight + spacing }
    ];

    positions.forEach((pos, index) => {
      this.createPhotoPlaceholder(pos.x, pos.y, photoWidth, photoHeight, `Photo ${index + 1}`);
    });

    this.doc
      .fontSize(10)
      .fillColor('#6b7280')
      .text('Photos show current property condition and potential value-add opportunities', 
            this.margin, 580, {
              width: this.pageWidth - 2 * this.margin,
              align: 'center'
            });

    this.doc.addPage();
  }

  private createLocationMap(property: PropertyData) {
    this.addSectionHeader('LOCATION & MAP', '#7c3aed');

    // Map placeholder
    this.createPhotoPlaceholder(this.margin + 50, 150, 400, 300, 'Location Map');

    // Location details
    this.doc
      .fontSize(12)
      .fillColor('#374151')
      .text('Location Benefits:', this.margin, 480);

    const benefits = [
      '• Close to schools and shopping',
      '• Easy access to major highways',
      '• Growing neighborhood',
      '• Strong rental demand in area'
    ];

    benefits.forEach((benefit, index) => {
      this.doc
        .fontSize(11)
        .fillColor('#6b7280')
        .text(benefit, this.margin + 20, 505 + (index * 20));
    });

    this.doc.addPage();
  }

  private createCompsPage(comps: CompData[]) {
    this.addSectionHeader('COMPARABLE SALES', '#ea580c');

    // Table header
    const tableTop = 150;
    const tableLeft = this.margin;
    const colWidths = [200, 100, 80, 80];
    const rowHeight = 25;

    this.doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .fillColor('#374151');

    // Headers
    this.doc.text('Address', tableLeft, tableTop);
    this.doc.text('Sold Price', tableLeft + colWidths[0], tableTop);
    this.doc.text('Date', tableLeft + colWidths[0] + colWidths[1], tableTop);
    this.doc.text('Distance', tableLeft + colWidths[0] + colWidths[1] + colWidths[2], tableTop);

    // Header line
    this.doc
      .strokeColor('#d1d5db')
      .lineWidth(1)
      .moveTo(tableLeft, tableTop + 20)
      .lineTo(tableLeft + colWidths.reduce((a, b) => a + b), tableTop + 20)
      .stroke();

    // Data rows
    comps.forEach((comp, index) => {
      const rowY = tableTop + 35 + (index * rowHeight);

      this.doc
        .fontSize(11)
        .font('Helvetica')
        .fillColor('#6b7280');

      this.doc.text(comp.address, tableLeft, rowY, { width: colWidths[0] - 10 });
      this.doc.text(`$${comp.soldPrice.toLocaleString()}`, tableLeft + colWidths[0], rowY);
      this.doc.text(comp.soldDate, tableLeft + colWidths[0] + colWidths[1], rowY);
      this.doc.text(comp.distance, tableLeft + colWidths[0] + colWidths[1] + colWidths[2], rowY);
    });

    // Summary
    if (comps.length > 0) {
      const avgPrice = comps.reduce((sum, comp) => sum + comp.soldPrice, 0) / comps.length;
      this.doc
        .fontSize(14)
        .font('Helvetica-Bold')
        .fillColor('#ea580c')
        .text(`Average Comp Price: $${Math.round(avgPrice).toLocaleString()}`, 
              this.margin, tableTop + 35 + (comps.length * rowHeight) + 30);
    }

    this.doc.addPage();
  }

  private createStrategyPage(property: PropertyData, matches: BuyerMatch[]) {
    this.addSectionHeader('INVESTMENT STRATEGY & MATCHES', '#0891b2');

    let yPos = 150;

    // Recommended strategy
    this.doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .fillColor('#374151')
      .text('RECOMMENDED EXIT STRATEGY:', this.margin, yPos);

    yPos += 30;
    this.doc
      .fontSize(12)
      .font('Helvetica')
      .fillColor('#6b7280')
      .text('• Fix & Flip: High potential for value-add renovation', this.margin + 20, yPos);

    yPos += 20;
    this.doc.text('• BRRRR: Strong rental market supports buy-rehab-rent strategy', this.margin + 20, yPos);

    yPos += 20;
    this.doc.text('• Wholesale: Quick exit opportunity for cash buyers', this.margin + 20, yPos);

    // Matched buyers section
    if (matches.length > 0) {
      yPos += 60;
      this.doc
        .fontSize(14)
        .font('Helvetica-Bold')
        .fillColor('#374151')
        .text('MATCHED INVESTORS:', this.margin, yPos);

      matches.forEach((match, index) => {
        yPos += 35;
        this.doc
          .fontSize(12)
          .font('Helvetica-Bold')
          .fillColor('#0891b2')
          .text(`${match.name}`, this.margin + 20, yPos);

        yPos += 18;
        this.doc
          .fontSize(11)
          .font('Helvetica')
          .fillColor('#6b7280')
          .text(`Strategy: ${match.strategy}`, this.margin + 40, yPos);

        if (match.maxPrice) {
          yPos += 15;
          this.doc.text(`Max Budget: $${match.maxPrice.toLocaleString()}`, this.margin + 40, yPos);
        }

        if (match.email) {
          yPos += 15;
          this.doc.text(`Contact: ${match.email}`, this.margin + 40, yPos);
        }
      });
    }

    // ROI projections
    yPos += 80;
    this.doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .fillColor('#374151')
      .text('PROJECTED RETURNS:', this.margin, yPos);

    if (property.estimatedValue && property.amountOwed) {
      const spread = property.estimatedValue - property.amountOwed;
      const roiPercent = Math.round((spread / property.amountOwed) * 100);

      yPos += 25;
      this.doc
        .fontSize(12)
        .font('Helvetica')
        .fillColor('#16a34a')
        .text(`Potential ROI: ${roiPercent}%`, this.margin + 20, yPos);

      yPos += 20;
      this.doc
        .fillColor('#6b7280')
        .text(`Cash-on-Cash Return: 12-15% (estimated)`, this.margin + 20, yPos);
    }

    this.doc.addPage();
  }

  private createContactPage(options: PDFOptions) {
    this.addSectionHeader('CONTACT INFORMATION', '#dc2626');

    const yPos = 200;

    this.doc
      .fontSize(18)
      .font('Helvetica-Bold')
      .fillColor('#374151')
      .text('Ready to Move Forward?', this.margin, yPos, {
        align: 'center',
        width: this.pageWidth - 2 * this.margin
      });

    this.doc
      .fontSize(14)
      .font('Helvetica')
      .fillColor('#6b7280')
      .text('Contact us today to discuss this opportunity', this.margin, yPos + 40, {
        align: 'center',
        width: this.pageWidth - 2 * this.margin
      });

    // Contact box
    const boxY = yPos + 100;
    this.doc
      .rect(this.margin + 100, boxY, this.pageWidth - 2 * this.margin - 200, 150)
      .fillAndStroke('#f3f4f6', '#d1d5db');

    this.doc
      .fontSize(16)
      .font('Helvetica-Bold')
      .fillColor('#374151')
      .text(options.companyName || 'Sub2Leads', this.margin + 120, boxY + 30);

    const contactInfo = options.contactInfo || 'leads@sub2leads.com\n(808) 555-0123\nwww.sub2leads.com';
    this.doc
      .fontSize(12)
      .font('Helvetica')
      .fillColor('#6b7280')
      .text(contactInfo, this.margin + 120, boxY + 60, {
        width: this.pageWidth - 2 * this.margin - 240
      });

    // Disclaimer
    this.doc
      .fontSize(10)
      .fillColor('#9ca3af')
      .text('This presentation is for informational purposes only. All figures are estimates and should be verified independently.', 
            this.margin, 650, {
              width: this.pageWidth - 2 * this.margin,
              align: 'center'
            });
  }

  private addSectionHeader(title: string, color: string) {
    this.doc
      .fontSize(20)
      .font('Helvetica-Bold')
      .fillColor(color)
      .text(title, this.margin, 80, {
        align: 'center',
        width: this.pageWidth - 2 * this.margin
      });

    // Underline
    this.doc
      .strokeColor(color)
      .lineWidth(3)
      .moveTo(this.margin + 150, 110)
      .lineTo(this.pageWidth - this.margin - 150, 110)
      .stroke();
  }

  private addKeyValuePair(key: string, value: string, x: number, y: number) {
    this.doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .fillColor('#374151')
      .text(key, x, y);

    this.doc
      .fontSize(12)
      .font('Helvetica')
      .fillColor('#6b7280')
      .text(value, x + 100, y);
  }

  private createPhotoPlaceholder(x: number, y: number, width: number, height: number, label: string = 'Photo') {
    // Draw placeholder rectangle
    this.doc
      .rect(x, y, width, height)
      .fillAndStroke('#f3f4f6', '#d1d5db');

    // Add placeholder text
    this.doc
      .fontSize(14)
      .fillColor('#9ca3af')
      .text(label, x + width/2 - 30, y + height/2, {
        align: 'center'
      });

    // Add camera icon (simple representation)
    this.doc
      .rect(x + width/2 - 15, y + height/2 - 30, 30, 20)
      .stroke('#9ca3af');
  }

  async generatePropertyPresentation(property: any, options: any = {}): Promise<Buffer> {
    try {
      if (!property || !property.address) {
        throw new Error('Invalid property data provided');
      }

      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', chunk => chunks.push(chunk));

      // Add comprehensive property information
      doc.fontSize(20).text('Property Investment Analysis', { align: 'center' });
      doc.moveDown();

      doc.fontSize(14).text(`Address: ${property.address || 'N/A'}`);
      doc.text(`Estimated Value: $${property.estimatedValue?.toLocaleString() || 'Not Available'}`);
      doc.text(`Status: ${property.status || 'Unknown'}`);
      doc.text(`Priority: ${property.priority || 'Medium'}`);

      if (property.amountOwed) {
        doc.text(`Amount Owed: $${property.amountOwed.toLocaleString()}`);
      }

      if (property.auctionDate) {
        doc.text(`Auction Date: ${new Date(property.auctionDate).toLocaleDateString()}`);
      }

      doc.moveDown();
      doc.text('Investment Analysis:', { underline: true });
      doc.text('This property represents a potential investment opportunity in the Hawaii real estate market.');

      if (options.includeMatches && options.matches && options.matches.length > 0) {
        doc.moveDown();
        doc.text('Potential Investor Matches:', { underline: true });
        options.matches.forEach((match: any, index: number) => {
          doc.text(`${index + 1}. ${match.name} - ${match.strategy}`);
        });
      }

      doc.end();

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('PDF generation timeout'));
        }, 30000); // 30 second timeout

        doc.on('end', () => {
          clearTimeout(timeout);
          resolve(Buffer.concat(chunks));
        });

        doc.on('error', (error) => {
          clearTimeout(timeout);
          reject(error);
        });
      });
    } catch (error) {
      console.error('PDF generation error:', error);
      throw new Error(`Failed to generate PDF presentation: ${error.message}`);
    }
  }
}

export const pdfGenerator = new PropertyPDFGenerator();