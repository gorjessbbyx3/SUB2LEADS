
const fs = require('fs');
const path = require('path');
const { Storage } = require('./server/storage');

async function importInvestors() {
  try {
    const storage = new Storage();
    const csvPath = path.join(__dirname, 'attached_assets', 'pace_buyers_list_HI_only_1752734900280.csv');
    
    if (!fs.existsSync(csvPath)) {
      console.error('CSV file not found:', csvPath);
      return;
    }

    const csvData = fs.readFileSync(csvPath, 'utf8');
    const lines = csvData.split('\n');
    const headers = lines[0].split(',');
    
    let imported = 0;
    let errors = 0;

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      try {
        const values = line.split(',');
        const investorData = {};
        
        // Map CSV columns to our database fields
        headers.forEach((header, index) => {
          investorData[header.trim()] = values[index] ? values[index].trim() : null;
        });

        // Create investor record
        const investor = {
          name: investorData.FullName || 'Unknown',
          email: investorData.Contact1Email_1 || investorData.Contact2Email_1 || investorData.Contact3Email_1 || null,
          phone: investorData.Contact1Phone_1 || investorData.Contact2Phone_1 || investorData.Contact3Phone_1 || null,
          address: `${investorData.MailingAddress || ''}, ${investorData.MailingAddressCity || ''}, ${investorData.MailingAddressState || ''} ${investorData.MailingAddressZip || ''}`.trim(),
          investorType: getInvestorType(investorData),
          portfolioSize: parseInt(investorData.PortfolioOwnedCount) || 0,
          averagePurchasePrice: parseFloat(investorData.PortfolioPurchaseAverage) || 0,
          portfolioValue: parseFloat(investorData.PortfolioValue) || 0,
          preferences: {
            isLandlord: investorData.IsLandlord === '1',
            isLender: investorData.IsLender === '1', 
            isNoteHolder: investorData.IsNoteHolder === '1',
            isFlipper: investorData.IsFlipper === '1',
            isResidential: investorData.IsResidential === '1'
          },
          contactInfo: {
            contact1Name: investorData.Contact1Name,
            contact1Phone: investorData.Contact1Phone_1,
            contact1Email: investorData.Contact1Email_1,
            contact2Name: investorData.Contact2Name,
            contact2Phone: investorData.Contact2Phone_1,
            contact2Email: investorData.Contact2Email_1,
            contact3Name: investorData.Contact3Name,
            contact3Phone: investorData.Contact3Phone_1,
            contact3Email: investorData.Contact3Email_1
          },
          dealsFunded: {
            count: parseInt(investorData.DealsFundedCount) || 0,
            average: parseFloat(investorData.DealsFundedAverage) || 0,
            totalValue: parseFloat(investorData.DealsFundedValue) || 0
          },
          flippingData: {
            count: parseInt(investorData.FlippedPropertiesCount) || 0,
            averageProfit: parseFloat(investorData.FlippedAverageGrossProfit) || 0,
            totalProfit: parseFloat(investorData.FlippedPropertiesProfit) || 0,
            averagePurchase: parseFloat(investorData.FlippedPurchaseAverage) || 0
          },
          notes: `Imported from Pace Buyers List - ${investorData.DetailsLink || ''}`,
          tags: ['pace-import', 'hawaii-focused'],
          source: 'Pace Buyers List'
        };

        await storage.createInvestor(investor);
        imported++;
        console.log(`Imported investor ${imported}: ${investor.name}`);

      } catch (error) {
        errors++;
        console.error(`Error importing line ${i}:`, error.message);
      }
    }

    console.log(`\nImport complete:`);
    console.log(`- Imported: ${imported} investors`);
    console.log(`- Errors: ${errors} investors`);

  } catch (error) {
    console.error('Import failed:', error);
  }
}

function getInvestorType(data) {
  if (data.IsFlipper === '1') return 'Flipper';
  if (data.IsLender === '1') return 'Lender';
  if (data.IsNoteHolder === '1') return 'Note Buyer';
  if (data.IsLandlord === '1') return 'Buy & Hold';
  return 'Other';
}

// Run the import
importInvestors().then(() => {
  console.log('Import script completed');
  process.exit(0);
}).catch(error => {
  console.error('Import script failed:', error);
  process.exit(1);
});
