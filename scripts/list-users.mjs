import { PrismaClient } from "@prisma/client";
import fsp from "node:fs/promises";

try {
  const env = await fsp.readFile(".env", "utf8");
  for (const line of env.split("\n")) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*"?([^"\n]*)"?\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
} catch {}

const prisma = new PrismaClient();
const users = await prisma.user.findMany({
  select: { id: true, username: true, role: true },
});
for (const u of users) console.log(`${u.username} ${u.role} ${u.id}`);
await prisma.$disconnect();
