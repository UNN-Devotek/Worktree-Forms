
import { db } from "./lib/db";

async function main() {
  const policies = await db.$queryRaw`SELECT * FROM pg_policies WHERE tablename = 'ProjectMember'`;
  console.log(policies);
}

main();
