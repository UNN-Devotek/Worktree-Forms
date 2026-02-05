import { PrismaClient } from '@prisma/client'; const db = new PrismaClient(); async function main() { const sheets = await db.sheet.findMany(); console.log(JSON.stringify(sheets, null, 2)); } main();
