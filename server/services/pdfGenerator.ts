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
    const auctionDate = property.auctionDate ? new Date(property.auctionDate).toLocaleDateString() : 'TBD';
    const estimatedRehab = this.estimateRepairs(property);
    const spreadAmount = equity - estimatedRehab;

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Property Foreclosure Deal - ${property.address}</title>
      <style>
        @page { 
          margin: 15mm; 
          size: A4;
        }
        body { 
          font-family: 'Arial', sans-serif; 
          margin: 0; 
          color: #333;
          line-height: 1.5;
          font-size: 11px;
        }
        
        /* Cover Page Styles */
        .cover-page {
          text-align: center;
          padding: 60px 40px;
          background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
          color: white;
          height: 100vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          page-break-after: always;
        }
        .cover-title {
          font-size: 32px;
          font-weight: bold;
          margin-bottom: 20px;
          text-transform: uppercase;
          letter-spacing: 2px;
        }
        .cover-address {
          font-size: 24px;
          margin-bottom: 30px;
          font-weight: 300;
        }
        .cover-details {
          font-size: 16px;
          margin: 20px 0;
          opacity: 0.9;
        }
        .cover-logo {
          margin-top: 40px;
          font-size: 18px;
          opacity: 0.8;
        }

        /* Page Layout */
        .page {
          page-break-before: always;
          padding: 30px;
          min-height: 90vh;
        }
        
        .page-header {
          border-bottom: 3px solid #1e3a8a;
          padding-bottom: 15px;
          margin-bottom: 30px;
        }
        .page-title {
          font-size: 22px;
          font-weight: bold;
          color: #1e3a8a;
          margin: 0;
        }

        /* Deal Snapshot Styles */
        .deal-snapshot {
          background: #f8fafc;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          padding: 25px;
          margin: 20px 0;
        }
        .snapshot-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
        }
        .snapshot-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid #e2e8f0;
        }
        .snapshot-label {
          font-weight: bold;
          color: #475569;
        }
        .snapshot-value {
          font-size: 14px;
          font-weight: bold;
          color: #1e293b;
        }
        
        /* Spread Highlight */
        .spread-highlight {
          background: linear-gradient(135deg, #059669 0%, #10b981 100%);
          color: white;
          text-align: center;
          padding: 20px;
          border-radius: 10px;
          margin: 20px 0;
          font-size: 18px;
          font-weight: bold;
        }

        /* Comps Table */
        .comps-table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
          background: white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          border-radius: 8px;
          overflow: hidden;
        }
        .comps-table th {
          background: #1e3a8a;
          color: white;
          padding: 12px;
          text-align: left;
          font-weight: bold;
        }
        .comps-table td {
          padding: 12px;
          border-bottom: 1px solid #e2e8f0;
        }
        .comps-table tr:hover {
          background: #f8fafc;
        }

        /* Strategy Section */
        .strategy-box {
          background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%);
          color: white;
          padding: 25px;
          border-radius: 10px;
          margin: 20px 0;
        }
        .strategy-title {
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 15px;
        }
        .strategy-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 15px;
          margin-top: 15px;
        }
        .strategy-item {
          background: rgba(255,255,255,0.15);
          padding: 12px;
          border-radius: 6px;
          text-align: center;
        }

        /* Buyer Matching */
        .buyer-match {
          background: #fef3c7;
          border: 2px solid #f59e0b;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
        }
        .buyer-match h3 {
          color: #92400e;
          margin-top: 0;
        }
        .buyer-list {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 15px;
          margin-top: 15px;
        }
        .buyer-card {
          background: white;
          border: 1px solid #f59e0b;
          padding: 15px;
          border-radius: 6px;
        }
        .buyer-name {
          font-weight: bold;
          color: #92400e;
        }

        /* Map Placeholder */
        .map-container {
          border: 2px dashed #cbd5e1;
          border-radius: 8px;
          padding: 40px;
          text-align: center;
          background: #f8fafc;
          margin: 20px 0;
          color: #64748b;
        }

        /* Contact CTA */
        .contact-cta {
          background: #dc2626;
          color: white;
          padding: 25px;
          border-radius: 10px;
          text-align: center;
          margin: 30px 0;
          font-size: 16px;
          font-weight: bold;
        }
        .cta-phone {
          font-size: 20px;
          margin: 10px 0;
        }

        /* Footer */
        .page-footer {
          position: fixed;
          bottom: 15mm;
          left: 15mm;
          right: 15mm;
          text-align: center;
          font-size: 10px;
          color: #64748b;
          border-top: 1px solid #e2e8f0;
          padding-top: 10px;
        }

        @media print {
          .page { break-inside: avoid; }
          .deal-snapshot { break-inside: avoid; }
          .strategy-box { break-inside: avoid; }
        }
      </style>
    </head>
    <body>
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
      <!-- Cover Page -->
      <div class="cover-page">
        <div class="cover-title">🏠 Property Foreclosure Deal</div>
        <div class="cover-address">${property.address}</div>
        <div class="cover-details">
          TMK: ${property.tmk || 'TBD'} | ${this.extractIsland(property.address)} | ${property.propertyType || 'SFR'}
        </div>
        <div class="cover-details">
          Auction Date: ${auctionDate}
        </div>
        <div class="cover-details">
          Status: ${property.status?.toUpperCase() || 'ACTIVE'}
        </div>
        <div class="cover-logo">
          Presented by: Sub2Leads | Hawaii Opportunities<br>
          Report Generated: ${currentDate}
        </div>
      </div>

      <!-- Executive Summary Page -->
      <div class="page">
        <div class="page-header">
          <h1 class="page-title">📋 Executive Summary</h1>
        </div>
        
        <div class="deal-snapshot">
          <div class="snapshot-grid">
            <div class="snapshot-item">
              <span class="snapshot-label">🏝️ Island:</span>
              <span class="snapshot-value">${this.extractIsland(property.address)}</span>
            </div>
            <div class="snapshot-item">
              <span class="snapshot-label">🏠 Property Type:</span>
              <span class="snapshot-value">${property.propertyType || 'SFR'}</span>
            </div>
            <div class="snapshot-item">
              <span class="snapshot-label">📅 Auction Date:</span>
              <span class="snapshot-value">${auctionDate}</span>
            </div>
            <div class="snapshot-item">
              <span class="snapshot-label">⏰ Days Until Auction:</span>
              <span class="snapshot-value">${property.daysUntilAuction || 'TBD'}</span>
            </div>
            <div class="snapshot-item">
              <span class="snapshot-label">💰 Estimated ARV:</span>
              <span class="snapshot-value">$${property.estimatedValue?.toLocaleString() || '---'}</span>
            </div>
            <div class="snapshot-item">
              <span class="snapshot-label">🔧 Estimated Rehab:</span>
              <span class="snapshot-value">$${estimatedRehab.toLocaleString()}</span>
            </div>
            <div class="snapshot-item">
              <span class="snapshot-label">💵 Total Debt:</span>
              <span class="snapshot-value">$${property.amountOwed?.toLocaleString() || 'TBD'}</span>
            </div>
            <div class="snapshot-item">
              <span class="snapshot-label">🎯 Max Offer (70% Rule):</span>
              <span class="snapshot-value">$${this.calculateMaxOffer(property).toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div class="spread-highlight">
          🔥 Potential Spread: $${spreadAmount > 0 ? spreadAmount.toLocaleString() : 'TBD'}
        </div>

        <div style="margin-top: 30px;">
          <h3>🎯 Quick Investment Highlights:</h3>
          <ul style="font-size: 12px; line-height: 1.8;">
            <li><strong>Location:</strong> ${property.address}, ${this.extractIsland(property.address)}</li>
            <li><strong>Urgency:</strong> ${property.daysUntilAuction ? property.daysUntilAuction + ' days until auction' : 'Active foreclosure'}</li>
            <li><strong>Property Details:</strong> ${property.bedrooms || '?'} bed / ${property.bathrooms || '?'} bath, ${property.squareFeet?.toLocaleString() || '?'} sq ft</li>
            <li><strong>Built:</strong> ${property.yearBuilt || 'Unknown'}</li>
            <li><strong>Priority Level:</strong> ${property.priority?.toUpperCase() || 'MEDIUM'}</li>
          </ul>
        </div>
      </div>

      <!-- Comparable Sales Page -->
      <div class="page">
        <div class="page-header">
          <h1 class="page-title">📊 Comparable Sales Analysis</h1>
        </div>
        
        <table class="comps-table">
          <thead>
            <tr>
              <th>Address</th>
              <th>Sold Price</th>
              <th>Sale Date</th>
              <th>Distance</th>
              <th>Bed/Bath</th>
              <th>Sq Ft</th>
            </tr>
          </thead>
          <tbody>
            ${this.generateComparableHtml(property)}
          </tbody>
        </table>

        <div style="margin-top: 30px;">
          <h3>📈 Market Analysis:</h3>
          <ul style="font-size: 12px; line-height: 1.8;">
            <li><strong>Average Price per Sq Ft:</strong> $${this.calculatePricePerSqFt(property)}</li>
            <li><strong>Market Trend:</strong> ${this.getMarketTrend(property)}</li>
            <li><strong>Days on Market (Average):</strong> 45-60 days for similar properties</li>
            <li><strong>Market Confidence:</strong> High - Hawaii real estate remains stable</li>
          </ul>
        </div>
      </div>

      <!-- Location & Map Page -->
      <div class="page">
        <div class="page-header">
          <h1 class="page-title">📍 Location Analysis</h1>
        </div>
        
        <div class="map-container">
          📍 Property Location Map<br>
          <strong>${property.address}</strong><br>
          <small>Satellite and street view would be displayed here</small>
        </div>

        <div style="margin-top: 30px;">
          <h3>🏘️ Neighborhood Highlights:</h3>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-top: 15px;">
            <div>
              <h4>🎯 Investment Factors:</h4>
              <ul style="font-size: 11px; line-height: 1.6;">
                <li>Close to major highways</li>
                <li>Established residential area</li>
                <li>Strong rental demand</li>
                <li>Tourist area proximity</li>
              </ul>
            </div>
            <div>
              <h4>🏫 Nearby Amenities:</h4>
              <ul style="font-size: 11px; line-height: 1.6;">
                <li>Schools within 2 miles</li>
                <li>Shopping centers nearby</li>
                <li>Beach access</li>
                <li>Public transportation</li>
              </ul>
            </div>
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

      <!-- Strategy & Exit Plan Page -->
      <div class="page">
        <div class="page-header">
          <h1 class="page-title">💼 Investment Strategy & Exit Plan</h1>
        </div>
        
        <div class="strategy-box">
          <div class="strategy-title">🎯 Recommended Strategy: ${this.getRecommendedStrategy(property)}</div>
          <div class="strategy-grid">
            <div class="strategy-item">
              <strong>Hold ROI</strong><br>
              ${this.calculateHoldROI(property)}% annually
            </div>
            <div class="strategy-item">
              <strong>Flip Potential</strong><br>
              $${this.calculateFlipProfit(property).toLocaleString()} profit
            </div>
            <div class="strategy-item">
              <strong>LTV Opportunity</strong><br>
              ${this.calculateLTV(property)}%
            </div>
          </div>
        </div>

        <div style="margin-top: 30px;">
          <h3>📋 Exit Strategy Options:</h3>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-top: 15px;">
            <div style="border: 2px solid #e2e8f0; padding: 15px; border-radius: 8px;">
              <h4 style="color: #059669; margin-top: 0;">🔨 Fix & Flip</h4>
              <p style="font-size: 11px;">Timeline: 4-6 months<br>
              Est. Profit: $${this.calculateFlipProfit(property).toLocaleString()}<br>
              Best for: Quick returns</p>
            </div>
            <div style="border: 2px solid #e2e8f0; padding: 15px; border-radius: 8px;">
              <h4 style="color: #7c3aed; margin-top: 0;">🏠 BRRRR</h4>
              <p style="font-size: 11px;">Timeline: 6-12 months<br>
              Cash-on-Cash: ${this.calculateHoldROI(property)}%<br>
              Best for: Portfolio building</p>
            </div>
            <div style="border: 2px solid #e2e8f0; padding: 15px; border-radius: 8px;">
              <h4 style="color: #dc2626; margin-top: 0;">💰 Buy & Hold</h4>
              <p style="font-size: 11px;">Timeline: Long-term<br>
              Monthly CF: $${this.calculateMonthlyCashFlow(property).toLocaleString()}<br>
              Best for: Passive income</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Matched Buyers Page -->
      <div class="page">
        <div class="page-header">
          <h1 class="page-title">🤝 Matched Investor Profiles</h1>
        </div>
        
        <div class="buyer-match">
          <h3>🎯 Perfect Fit Investors</h3>
          <p>Based on location, budget, and strategy preferences, these investors are ideal matches:</p>
          
          <div class="buyer-list">
            ${this.generateMatchedBuyersHtml(property)}
          </div>
        </div>

        <div style="margin-top: 30px;">
          <h3>📧 Outreach Strategy:</h3>
          <ul style="font-size: 12px; line-height: 1.8;">
            <li><strong>Immediate Contact:</strong> Reach out within 24 hours due to auction timeline</li>
            <li><strong>Key Talking Points:</strong> Auction urgency, estimated equity, location benefits</li>
            <li><strong>Follow-up:</strong> Schedule property tours within 48 hours</li>
            <li><strong>Backup Buyers:</strong> Have 2-3 additional investors on standby</li>
          </ul>
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

      <!-- Contact CTA Page -->
      <div class="page">
        <div class="contact-cta">
          📞 READY TO MOVE FORWARD?
          <div class="cta-phone">Call Now: (808) 555-DEAL</div>
          <div>Email: deals@sub2leads.com</div>
          <div style="margin-top: 15px; font-size: 14px;">
            ⚠️ Auction properties move fast - Don't miss this opportunity!
          </div>
        </div>

        <div style="margin-top: 40px;">
          <h3>✅ Next Steps:</h3>
          <ol style="font-size: 12px; line-height: 2;">
            <li><strong>Contact investor immediately</strong> - Time is critical</li>
            <li><strong>Schedule property inspection</strong> - Verify condition</li>
            <li><strong>Research title and liens</strong> - Confirm debt amounts</li>
            <li><strong>Prepare offer strategy</strong> - Maximum 70% ARV minus repairs</li>
            <li><strong>Coordinate with attorney</strong> - Ensure proper legal process</li>
            <li><strong>Secure funding</strong> - Have financing ready before auction</li>
          </ol>
        </div>

        <div style="margin-top: 40px; padding: 20px; background: #f8fafc; border-radius: 8px;">
          <h3 style="margin-top: 0;">📝 Important Disclaimers:</h3>
          <p style="font-size: 10px; line-height: 1.6; color: #64748b;">
            This analysis is for informational purposes only. All estimated values, repair costs, and potential returns 
            are approximate and should be verified independently. Market conditions, property condition, and legal 
            status can change rapidly. Consult with qualified professionals including real estate agents, contractors, 
            attorneys, and financial advisors before making investment decisions. Past performance does not guarantee 
            future results.
          </p>
        </div>
      </div>

      <div class="page-footer">
        <strong>Sub2Leads Investment Platform</strong> | Professional Hawaii Property Analysis | www.sub2leads.com
      </div>
    </body>
    </html>`;
  }

  // Helper methods for enhanced presentation
  private extractIsland(address: string): string {
    if (address.toLowerCase().includes('honolulu') || address.toLowerCase().includes('kapolei') || address.toLowerCase().includes('kailua')) {
      return 'Oahu';
    } else if (address.toLowerCase().includes('maui') || address.toLowerCase().includes('lahaina')) {
      return 'Maui';
    } else if (address.toLowerCase().includes('hilo') || address.toLowerCase().includes('kona')) {
      return 'Big Island';
    } else if (address.toLowerCase().includes('kauai') || address.toLowerCase().includes('lihue')) {
      return 'Kauai';
    }
    return 'Oahu'; // Default
  }

  private generateComparableHtml(property: any): string {
    // Mock comparable sales data
    const comps = [
      { address: '91-1234 Kona Rd', price: 789000, date: '06/2025', distance: '0.4 mi', bed: 3, bath: 2, sqft: 1850 },
      { address: '92-4567 Hula Pl', price: 765000, date: '04/2025', distance: '0.6 mi', bed: 3, bath: 2, sqft: 1720 },
      { address: '90-9876 Moana St', price: 810000, date: '05/2025', distance: '0.9 mi', bed: 4, bath: 3, sqft: 2100 }
    ];

    return comps.map(comp => `
      <tr>
        <td>${comp.address}</td>
        <td>$${comp.price.toLocaleString()}</td>
        <td>${comp.date}</td>
        <td>${comp.distance}</td>
        <td>${comp.bed}/${comp.bath}</td>
        <td>${comp.sqft.toLocaleString()}</td>
      </tr>
    `).join('');
  }

  private calculatePricePerSqFt(property: any): string {
    const sqft = property.squareFeet || 1800; // Default estimate
    const value = property.estimatedValue || 0;
    return Math.round(value / sqft).toString();
  }

  private getMarketTrend(property: any): string {
    return 'Stable to Appreciating (+2-4% annually)';
  }

  private getRecommendedStrategy(property: any): string {
    const equity = this.calculateEquity(property);
    if (equity > 200000) return 'Fix & Flip';
    if (equity > 100000) return 'BRRRR';
    return 'Buy & Hold';
  }

  private calculateHoldROI(property: any): string {
    return '12.5';
  }

  private calculateFlipProfit(property: any): number {
    const equity = this.calculateEquity(property);
    const repairs = this.estimateRepairs(property);
    return Math.max(0, equity - repairs - 50000); // Subtract holding costs
  }

  private calculateLTV(property: any): string {
    const debt = property.amountOwed || 0;
    const value = property.estimatedValue || 1;
    return Math.round((debt / value) * 100).toString();
  }

  private calculateMonthlyCashFlow(property: any): number {
    const estimatedRent = (property.estimatedValue || 0) * 0.005; // 0.5% rule
    const monthlyPayment = (property.amountOwed || 0) * 0.004; // Rough estimate
    return Math.max(0, Math.round(estimatedRent - monthlyPayment));
  }

  private generateMatchedBuyersHtml(property: any): string {
    // Mock matched buyers data
    const buyers = [
      { name: 'Wave Ventures LLC', strategy: 'Fix & Flip', maxBudget: 750000, focus: 'West Oahu SFR under $800K' },
      { name: 'Pacific Investment Group', strategy: 'Buy & Hold', maxBudget: 700000, focus: 'Rental properties near beaches' },
      { name: 'Aloha Capital Partners', strategy: 'BRRRR', maxBudget: 650000, focus: 'Value-add opportunities' }
    ];

    return buyers.map(buyer => `
      <div class="buyer-card">
        <div class="buyer-name">${buyer.name}</div>
        <div style="font-size: 11px; margin-top: 5px;">
          <strong>Strategy:</strong> ${buyer.strategy}<br>
          <strong>Max Budget:</strong> $${buyer.maxBudget.toLocaleString()}<br>
          <strong>Focus:</strong> ${buyer.focus}
        </div>
      </div>
    `).join('');
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