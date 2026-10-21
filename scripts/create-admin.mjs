// Crée ou promeut un compte administrateur.
// Usage : npm run create-admin
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import fsp from "node:fs/promises";
import readline from "node:readline/promises";

// Charge .env si présent (le CLI Prisma le fait tout seul, pas un script standalone)
try {
  const env = await fsp.readFile(".env", "utf8");
  for (const line of env.split("\n")) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*"?([^"\n]*)"?\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
} catch {
  // pas de .env — on utilise les variables d'environnement existantes
}

const prisma = new PrismaClient();
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

const email = (await rl.question("Email : ")).trim();
const username = (await rl.question("Pseudo : ")).trim();
const password = await rl.question("Mot de passe (min. 6) : ");
rl.close();

if (!email || !username || password.length < 6) {
  console.error("Champs invalides.");
  process.exit(1);
}

const hash = await bcrypt.hash(password, 10);
const existing = await prisma.user.findFirst({
  where: { OR: [{ email }, { username }] },
});

if (existing) {
  await prisma.user.update({
    where: { id: existing.id },
    data: { role: "ADMIN", passwordHash: hash },
  });
  console.log(`✔ « ${existing.username} » est maintenant administrateur.`);
} else {
  await prisma.user.create({
    data: { email, username, passwordHash: hash, role: "ADMIN" },
  });
  console.log(`✔ Admin « ${username} » créé.`);
}

await prisma.$disconnect();
