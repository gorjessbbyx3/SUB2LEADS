import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs/promises';
import { storage } from '../storage';
import { mapService } from './mapService';
import PDFDocument from 'pdfkit';

class PDFGeneratorService {
  private browser: any = null;

  async initBrowser() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
    }
    return this.browser;
  }

  async generatePropertyBinder(property: any, userId: string): Promise<string> {
    const browser = await this.initBrowser();
    const page = await browser.newPage();

    try {
      // Get additional data
      const contacts = await storage.getContactsByProperty(property.id);
      const mapData = await mapService.getPropertyMap(property);

      // Generate HTML content
      const htmlContent = await this.generateBinderHTML(property, contacts, mapData);

      // Set page content
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

      // Generate PDF
      const pdfPath = path.join(process.cwd(), 'pdfs', `property-${property.id}-${Date.now()}.pdf`);

      // Ensure directory exists
      await fs.mkdir(path.dirname(pdfPath), { recursive: true });

      await page.pdf({
        path: pdfPath,
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20px',
          right: '20px',
          bottom: '20px',
          left: '20px',
        },
      });

      return `/pdfs/${path.basename(pdfPath)}`;
    } catch (error) {
      console.error('PDF generation error:', error);
      throw error;
    } finally {
      await page.close();
    }
  }

  private async generateBinderHTML(property: any, contacts: any[], mapData: any): Promise<string> {
    const contact = contacts[0] || {};
    const currentDate = new Date().toLocaleDateString();

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Property Investment Binder - ${property.address}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 20px;
        }
        .header {
            text-align: center;
            border-bottom: 3px solid #2563eb;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #2563eb;
            margin: 0;
            font-size: 2.5em;
        }
        .header p {
            color: #6b7280;
            margin: 10px 0 0 0;
            font-size: 1.2em;
        }
        .section {
            margin-bottom: 30px;
            page-break-inside: avoid;
        }
        .section h2 {
            color: #1f2937;
            border-left: 4px solid #2563eb;
            padding-left: 15px;
            margin-bottom: 15px;
        }
        .property-details {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            border: 1px solid #e5e7eb;
        }
        .detail-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-bottom: 15px;
        }
        .detail-item {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #e5e7eb;
        }
        .detail-label {
            font-weight: bold;
            color: #374151;
        }
        .detail-value {
            color: #6b7280;
        }
        .financial-summary {
            background: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        .financial-summary h3 {
            color: #92400e;
            margin-top: 0;
        }
        .opportunity-highlights {
            background: #ecfdf5;
            border: 1px solid #10b981;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        .opportunity-highlights h3 {
            color: #047857;
            margin-top: 0;
        }
        .map-container {
            text-align: center;
            margin: 20px 0;
        }
        .map-image {
            max-width: 100%;
            border: 1px solid #d1d5db;
            border-radius: 8px;
        }
        .contact-info {
            background: #eff6ff;
            border: 1px solid #3b82f6;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        .contact-info h3 {
            color: #1e40af;
            margin-top: 0;
        }
        .footer {
            text-align: center;
            margin-top: 50px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 0.9em;
        }
        @media print {
            body { margin: 0; }
            .section { page-break-inside: avoid; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Property Investment Binder</h1>
        <p>Confidential Investment Analysis</p>
        <p>Generated on ${currentDate}</p>
    </div>

    <div class="section">
        <h2>Property Overview</h2>
        <div class="property-details">
            <div class="detail-grid">
                <div class="detail-item">
                    <span class="detail-label">Address:</span>
                    <span class="detail-value">${property.address}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Property Type:</span>
                    <span class="detail-value">${property.propertyType || 'Residential'}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Current Owner:</span>
                    <span class="detail-value">${property.ownerName || 'Unknown'}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Status:</span>
                    <span class="detail-value">${property.taxStatus || property.status}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Source:</span>
                    <span class="detail-value">${property.source || 'Manual Entry'}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Discovery Date:</span>
                    <span class="detail-value">${new Date(property.createdAt).toLocaleDateString()}</span>
                </div>
            </div>
        </div>
    </div>

    ${property.lienAmount ? `
    <div class="section">
        <h2>Financial Information</h2>
        <div class="financial-summary">
            <h3>Outstanding Liens & Debts</h3>
            <div class="detail-item">
                <span class="detail-label">Primary Lien Amount:</span>
                <span class="detail-value">$${property.lienAmount.toLocaleString()}</span>
            </div>
            ${property.auctionDate ? `
            <div class="detail-item">
                <span class="detail-label">Auction Date:</span>
                <span class="detail-value">${new Date(property.auctionDate).toLocaleDateString()}</span>
            </div>
            ` : ''}
        </div>
    </div>
    ` : ''}

    ${property.aiSummary ? `
    <div class="section">
        <h2>AI Investment Analysis</h2>
        <div class="opportunity-highlights">
            <h3>Investment Opportunity Summary</h3>
            <p>${property.aiSummary}</p>
        </div>
    </div>
    ` : ''}

    ${mapData?.imageUrl ? `
    <div class="section">
        <h2>Property Location</h2>
        <div class="map-container">
            <img src="${mapData.imageUrl}" alt="Property Location Map" class="map-image" />
            <p>Coordinates: ${mapData.latitude}, ${mapData.longitude}</p>
        </div>
    </div>
    ` : ''}

    ${contact.name || contact.email ? `
    <div class="section">
        <h2>Owner Contact Information</h2>
        <div class="contact-info">
            <h3>Primary Contact</h3>
            ${contact.name ? `<p><strong>Name:</strong> ${contact.name}</p>` : ''}
            ${contact.email ? `<p><strong>Email:</strong> ${contact.email}</p>` : ''}
            ${contact.phone ? `<p><strong>Phone:</strong> ${contact.phone}</p>` : ''}
            ${contact.socialProfiles ? `<p><strong>Social Profiles:</strong> Found</p>` : ''}
        </div>
    </div>
    ` : ''}

    <div class="section">
        <h2>Investment Strategy Recommendations</h2>
        <div class="opportunity-highlights">
            <h3>Recommended Approach</h3>
            <ul>
                <li>Initial outreach within 48 hours</li>
                <li>Schedule property inspection if owner is interested</li>
                <li>Prepare cash offer based on property condition</li>
                <li>Negotiate flexible closing terms</li>
                <li>Consider alternative solutions (loan modification, short sale)</li>
            </ul>
        </div>
    </div>

    <div class="section">
        <h2>Next Steps</h2>
        <div class="property-details">
            <h3>Immediate Actions Required:</h3>
            <ol>
                <li>Contact property owner via personalized email/letter</li>
                <li>Research comparable sales in the area</li>
                <li>Verify property condition and title status</li>
                <li>Prepare initial offer parameters</li>
                <li>Schedule follow-up contact in 1 week</li>
            </ol>
        </div>
    </div>

    <div class="footer">
        <p>This document contains confidential information for investment analysis purposes only.</p>
        <p>Hawaii Investment Team • (808) 555-0123 • info@hawaiiinvestments.com</p>
    </div>
</body>
</html>`;
  }

  async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

export const pdfGeneratorService = new PDFGeneratorService();