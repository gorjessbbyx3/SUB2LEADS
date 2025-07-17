
const { importHawaiiInvestors } = require('./hawaii-investors-importer.js');

async function importPaceBuyers() {
  try {
    console.log('Starting Pace buyers list import...');
    const csvPath = './attached_assets/pace_buyers_list_HI_only_1752734900280.csv';
    const results = await importHawaiiInvestors(csvPath);
    
    console.log('Import Results:');
    console.log(`✅ Imported: ${results.imported}`);
    console.log(`⚠️  Duplicates: ${results.duplicates}`);
    console.log(`❌ Errors: ${results.errors}`);
    
    if (results.details && results.details.length > 0) {
      console.log('\nDetailed Results:');
      results.details.forEach(detail => {
        const status = detail.status === 'imported' ? '✅' : 
                      detail.status === 'duplicate' ? '⚠️' : '❌';
        console.log(`${status} ${detail.name} - ${detail.status}${detail.reason ? ': ' + detail.reason : ''}`);
      });
    }
    
  } catch (error) {
    console.error('Import failed:', error);
  }
}

importPaceBuyers();
