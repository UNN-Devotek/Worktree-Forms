import { db } from './lib/database';
import * as fs from 'fs';

async function main() {
  console.log('[Debug] Fetching sheet data...\\n');
  
  const sheet = await db.sheet.findFirst({
    where: { id: 'cmkomv6t50008i64d1e46fgh9' }
  });
  
  if (!sheet || !sheet.content) {
    console.log('No sheet or content found');
    return;
  }
  
  console.log(`Content size: ${sheet.content.length} bytes`);
  
  const jsonString = sheet.content.toString('utf-8');
  const savedData = JSON.parse(jsonString);
  
  console.log(`\\nNumber of sheets: ${savedData.length}`);
  console.log('\\nFirst sheet structure:', JSON.stringify(savedData[0], null, 2).substring(0, 500));
  
  // Check cell data
  if (savedData[0].celldata) {
    console.log(`\\nCell data entries: ${savedData[0].celldata.length}`);
    console.log('First 5 cells:', JSON.stringify(savedData[0].celldata.slice(0, 5), null, 2));
  } else {
    console.log('\\nNo celldata property found');
  }
  
  // Save to file for inspection
  fs.writeFileSync('sheet_debug.json', JSON.stringify(savedData, null, 2));
  console.log('\\nFull data saved to sheet_debug.json');
}

main().catch(console.error);
