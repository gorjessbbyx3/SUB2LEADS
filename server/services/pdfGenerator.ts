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

  private generateBinderHTML(property: any, contacts: any[], mapData: any): Promise<string> {
    const equity = this.calculateEquity(property);
    const roi = this.calculateROI(property);
    const currentDate = new Date().toLocaleDateString();

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Property Investment Binder - ${property.address}</title>
      <style>
        @page { margin: 20mm; }
        body { 
          font-family: 'Arial', sans-serif; 
          margin: 0; 
          color: #333;
          line-height: 1.6;
        }
        .header { 
          text-align: center; 
          margin-bottom: 40px; 
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px;
          border-radius: 10px;
        }
        .logo { 
          font-size: 24px; 
          font-weight: bold; 
          margin-bottom: 10px;
        }
        .property-title { 
          font-size: 28px; 
          margin: 15px 0; 
          font-weight: bold;
        }
        .date { opacity: 0.9; }

        .summary-cards {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          margin: 30px 0;
        }
        .card {
          background: white;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          padding: 20px;
          text-align: center;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .card-value {
          font-size: 24px;
          font-weight: bold;
          color: #667eea;
          margin-bottom: 5px;
        }
        .card-label {
          color: #666;
          font-size: 14px;
        }

        .section { 
          margin-bottom: 40px; 
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 10px rgba(0,0,0,0.05);
        }
        .section-header {
          background: #f8f9fa;
          padding: 20px;
          border-bottom: 1px solid #e0e0e0;
        }
        .section-content {
          padding: 30px;
        }
        h2 { 
          color: #2c3e50; 
          margin: 0;
          font-size: 20px;
        }

        .property-details table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        .property-details td {
          padding: 12px;
          border-bottom: 1px solid #eee;
        }
        .property-details td:first-child {
          font-weight: bold;
          background: #f8f9fa;
          width: 200px;
        }

        .financial-highlight {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 25px;
          border-radius: 8px;
          margin: 20px 0;
        }
        .financial-highlight h3 {
          margin-top: 0;
          color: white;
        }
        .financial-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
          margin-top: 15px;
        }
        .financial-item {
          background: rgba(255,255,255,0.1);
          padding: 15px;
          border-radius: 5px;
        }

        .map-placeholder {
          width: 100%;
          height: 300px;
          background: #f0f0f0;
          border: 2px dashed #ccc;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #666;
          border-radius: 8px;
          margin: 20px 0;
        }

        .contact-summary {
          background: #e8f4fd;
          border: 1px solid #b3d9ff;
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
        }

        .action-items {
          background: #fff3cd;
          border: 1px solid #ffeaa7;
          padding: 20px;
          border-radius: 8px;
        }
        .action-items ul {
          margin: 10px 0;
          padding-left: 20px;
        }

        .footer {
          text-align: center;
          margin-top: 50px;
          padding: 20px;
          color: #666;
          border-top: 1px solid #eee;
        }

        @media print {
          .section { break-inside: avoid; }
          .summary-cards { break-inside: avoid; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">🏠 Sub2Leads Investment Report</div>
        <div class="property-title">${property.address}</div>
        <div class="date">Report Generated: ${currentDate}</div>
      </div>

      <div class="summary-cards">
        <div class="card">
          <div class="card-value">$${property.estimatedValue?.toLocaleString() || '---'}</div>
          <div class="card-label">Estimated Value</div>
        </div>
        <div class="card">
          <div class="card-value">$${equity.toLocaleString()}</div>
          <div class="card-label">Potential Equity</div>
        </div>
        <div class="card">
          <div class="card-value">${property.daysUntilAuction || '---'}</div>
          <div class="card-label">Days to Auction</div>
        </div>
      </div>

      <div class="section">
        <div class="section-header">
          <h2>📋 Property Information</h2>
        </div>
        <div class="section-content">
          <table class="property-details">
            <tr><td>Full Address</td><td>${property.address}, ${property.city || ''}, ${property.state || 'HI'} ${property.zipCode || ''}</td></tr>
            <tr><td>Property Type</td><td>${property.propertyType || 'Residential'}</td></tr>
            <tr><td>Bedrooms</td><td>${property.bedrooms || 'Unknown'}</td></tr>
            <tr><td>Bathrooms</td><td>${property.bathrooms || 'Unknown'}</td></tr>
            <tr><td>Square Feet</td><td>${property.squareFeet?.toLocaleString() || 'Unknown'}</td></tr>
            <tr><td>Year Built</td><td>${property.yearBuilt || 'Unknown'}</td></tr>
            <tr><td>Current Status</td><td><strong>${property.status}</strong></td></tr>
            <tr><td>Priority Level</td><td><strong>${property.priority?.toUpperCase() || 'MEDIUM'}</strong></td></tr>
          </table>

          <div class="map-placeholder">
            📍 Property Location Map
            <br><small>(Map image would be inserted here)</small>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-header">
          <h2>💰 Financial Analysis</h2>
        </div>
        <div class="section-content">
          <div class="financial-highlight">
            <h3>Investment Opportunity Summary</h3>
            <div class="financial-grid">
              <div class="financial-item">
                <strong>Market Value:</strong><br>
                $${property.estimatedValue?.toLocaleString() || 'TBD'}
              </div>
              <div class="financial-item">
                <strong>Total Debt:</strong><br>
                $${property.amountOwed?.toLocaleString() || 'TBD'}
              </div>
              <div class="financial-item">
                <strong>Gross Equity:</strong><br>
                $${equity.toLocaleString()}
              </div>
              <div class="financial-item">
                <strong>Potential ROI:</strong><br>
                ${roi}%
              </div>
            </div>
          </div>

          <div style="margin-top: 30px;">
            <h3>📊 Deal Analysis</h3>
            <p><strong>Estimated Repair Costs:</strong> $${this.estimateRepairs(property).toLocaleString()} (10-15% of value)</p>
            <p><strong>Net Equity After Repairs:</strong> $${(equity - this.estimateRepairs(property)).toLocaleString()}</p>
            <p><strong>Recommended Max Offer:</strong> $${this.calculateMaxOffer(property).toLocaleString()} (70% of ARV - Repairs)</p>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-header">
          <h2>📞 Contact Information</h2>
        </div>
        <div class="section-content">
          <div class="contact-summary">
            <h3>Property Owner Details</h3>
            <p><strong>Contact Status:</strong> ${property.contacts?.[0] ? 'Contact Found' : 'Contact Search Needed'}</p>
            <p><strong>Owner Name:</strong> ${property.contacts?.[0]?.name || 'To Be Determined'}</p>
            <p><strong>Phone:</strong> ${property.contacts?.[0]?.phone || 'Not Available'}</p>
            <p><strong>Email:</strong> ${property.contacts?.[0]?.email || 'Not Available'}</p>
            <p><strong>Last Contact:</strong> ${property.contacts?.[0]?.lastEnriched ? new Date(property.contacts[0].lastEnriched).toLocaleDateString() : 'Never'}</p>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-header">
          <h2>🤖 AI Investment Analysis</h2>
        </div>
        <div class="section-content">
          <p>${property.aiSummary || 'This property represents a potential investment opportunity in the Hawaii market. The current distressed status provides an opportunity for investor intervention. Key factors to consider include the timeline urgency, total debt obligations, and property condition. Recommended next steps include property inspection, title research, and direct owner contact to understand their situation and timeline.'}</p>
        </div>
      </div>

      <div class="section">
        <div class="section-header">
          <h2>✅ Next Action Items</h2>
        </div>
        <div class="section-content">
          <div class="action-items">
            <h3>Immediate Actions Required:</h3>
            <ul>
              <li>Contact property owner to discuss situation</li>
              <li>Schedule property inspection</li>
              <li>Verify debt amounts and legal status</li>
              <li>Research recent comparable sales</li>
              <li>Calculate repair estimates</li>
              <li>Prepare purchase agreement terms</li>
            </ul>

            <h3>Timeline Considerations:</h3>
            <ul>
              <li><strong>Auction Date:</strong> ${property.auctionDate ? new Date(property.auctionDate).toLocaleDateString() : 'TBD'}</li>
              <li><strong>Days Remaining:</strong> ${property.daysUntilAuction || 'Unknown'}</li>
              <li><strong>Urgency Level:</strong> ${property.priority?.toUpperCase() || 'MEDIUM'}</li>
            </ul>
          </div>
        </div>
      </div>

      <div class="footer">
        <p><strong>Sub2Leads Investment Platform</strong> | Professional Property Analysis</p>
        <p>This report is for investment analysis purposes only. Verify all information independently.</p>
      </div>
    </body>
    </html>`;
  }

  private estimateRepairs(property: any): number {
    // Estimate 10-15% of property value for repairs on distressed properties
    const baseEstimate = (property.estimatedValue || 0) * 0.125;
    return Math.round(baseEstimate);
  }

  private calculateMaxOffer(property: any): number {
    // 70% rule: 70% of ARV minus repairs
    const arv = property.estimatedValue || 0;
    const repairs = this.estimateRepairs(property);
    return Math.round((arv * 0.70) - repairs);
  }

  private calculateEquity(property: any): number {
    return (property.estimatedValue || 0) - (property.amountOwed || 0);
  }

  private calculateROI(property: any): string {
    const equity = this.calculateEquity(property);
    const investment = this.estimateRepairs(property) + this.calculateMaxOffer(property);
    const roi = (equity - investment) / investment * 100;
    return roi.toFixed(2);
  }

  async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

export const pdfGeneratorService = new PDFGeneratorService();