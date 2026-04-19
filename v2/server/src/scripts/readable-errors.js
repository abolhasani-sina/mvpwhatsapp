import { getReadableErrorLogs } from '../log-insights.js';

const limitArg = Number(process.argv[2] || 20);
const result = getReadableErrorLogs(limitArg);

if (!result.exists) {
  console.log('No error log file found yet.');
  console.log(result.note || 'Run the app and trigger an error first.');
  process.exit(0);
}

console.log('\n=== Readable Error Summary ===');
console.log(`File: ${result.path}`);
console.log(`Showing last ${result.items.length} items\n`);

for (const item of result.items) {
  console.log(`- Time: ${item.time}`);
  console.log(`  Module: ${item.module}`);
  console.log(`  Message: ${item.message}`);
  if (item.errorId) console.log(`  Error ID: ${item.errorId}`);
  if (item.requestPath) console.log(`  Path: ${item.method || ''} ${item.requestPath}`.trim());
  console.log(`  What to do: ${item.help}`);
  if (item.technicalMessage && item.technicalMessage !== item.message) {
    console.log(`  Technical: ${item.technicalMessage}`);
  }
  console.log('');
}
