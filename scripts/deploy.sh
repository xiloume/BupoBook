#!/usr/bin/env bash
# Déploiement BupoBook sur VPS — à lancer dans le dossier du projet.
set -e
cd "$(dirname "$0")/.."

echo "==> BupoBook : déploiement"

# 1. Fichier .env
if [ ! -f .env ]; then
  cp .env.example .env
  echo "==> .env créé"
fi

# 2. SESSION_SECRET auto si laissé par défaut
if grep -q 'SESSION_SECRET="change-me"' .env; then
  SECRET=$(openssl rand -hex 32 2>/dev/null || head -c 32 /dev/urandom | od -A n -t x | tr -d ' \n')
  sed -i "s/SESSION_SECRET=\".*\"/SESSION_SECRET=\"$SECRET\"/" .env
  echo "==> SESSION_SECRET généré automatiquement"
fi

# 3. Dépendances + base + build
npm ci
npm run db:push
npm run build

# 4. (Re)démarrage PM2
if pm2 describe bupobook > /dev/null 2>&1; then
  pm2 restart bupobook
  echo "==> bupobook redémarré"
else
  pm2 start ecosystem.config.js
  pm2 save
  echo "==> bupobook démarré sur le port 8520"
fi

echo ""
echo "Terminé. Pense à :"
echo "  - créer un admin : npm run create-admin   (ou inscris le 1er compte)"
echo "  - ouvrir le port : ufw allow 8520/tcp"
