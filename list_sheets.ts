import { db } from './apps/frontend/lib/db'; async function main() { const sheets = await db.sheet.findMany(); console.log(sheets); } main();
