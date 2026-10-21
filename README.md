# BupoBook

Lecteur de webtoons / mangas auto-hébergé : lecture en défilement vertical, comptes lecteurs
(favoris, reprise de lecture, historique) et interface d'administration pour publier des séries,
chapitres et pages.

Stack : Next.js (App Router) · SQLite (Prisma) · Tailwind CSS · sessions JWT (cookie httpOnly).

## Fonctionnalités

- **Lecteurs** : inscription/connexion, défilement vertical style webtoon, barre de progression,
  reprise automatique à la dernière page lue, favoris, historique de lecture.
- **Admin** (`/admin`) : tableau de bord, CRUD séries (couverture, statut, genres),
  chapitres (numéro + titre), upload d'images en masse, réordonnancement et suppression de pages.
- **Rôles** : `USER` (lecteur) · `EDITEUR` (gère séries/chapitres/pages) ·
  `MODO` (éditeur + gestion des utilisateurs, sauf les comptes admin) · `ADMIN` (tout).
  Les rôles se changent dans `/admin/users`. Le premier compte inscrit est admin.
- Images stockées sur le disque dans `./data` (hors du bundle), servies via `/api/media/*`.

## Développement local

```bash
cp .env.example .env       # adapter SESSION_SECRET
npm install
npm run db:push            # crée la base SQLite dans ./data
npm run dev
```

Le **premier compte inscrit devient admin automatiquement**. Sinon :

```bash
npm run create-admin
```

## Déploiement sur un VPS (PM2)

Prérequis sur le serveur : **Node.js ≥ 20** et `pm2` (`npm i -g pm2`).

1. Transférer le dossier du projet sur le VPS (rsync/scp/git clone) :

   ```bash
   rsync -avz --exclude node_modules --exclude .next --exclude data ./ user@vps:/var/www/bupobook
   ```

2. Sur le VPS :

   ```bash
   cd /var/www/bupobook
   cp .env.example .env
   # éditer .env : générer SESSION_SECRET avec `openssl rand -hex 32`
   npm ci
   npm run db:push
   npm run build
   npm run create-admin        # créer le compte admin
   pm2 start ecosystem.config.js
   pm2 save                    # + `pm2 startup` pour relancer au boot
   ```

   L'app écoute sur le port **8520** (configuré dans `ecosystem.config.js`).
   Pour y accéder directement sans nginx : `ufw allow 8520/tcp`
   (ou ouvre le port dans le firewall/panneau de ton hébergeur).

3. Reverse proxy nginx (optionnel mais recommandé) :

   ```nginx
   server {
       listen 80;
       server_name manga.example.com;
       client_max_body_size 200m;   # important pour l'upload d'images

       location / {
           proxy_pass http://127.0.0.1:8520;
           proxy_set_header Host $host;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```

   Avec HTTPS (certbot), passer `SESSION_SECURE="true"` dans `.env` puis `pm2 restart bupobook`.

4. Mises à jour :

   ```bash
   git pull        # ou re-transférer les fichiers modifiés
   npm ci
   npm run db:push
   npm run build
   pm2 restart bupobook
   ```

## Données & sauvegarde

Tout ce qui compte est dans `./data` :

- `data/bupobook.db` — la base SQLite
- `data/covers/` — couvertures des séries
- `data/pages/<chapterId>/` — pages des chapitres

Sauvegarder = copier ce dossier (`cp -r data data.bak` quand l'app tourne, SQLite le tolère ;
idéalement `sqlite3 data/bupobook.db ".backup data.bak.db"`).

## Notes

- Uploads : jusqu'à ~30 Mo par image, formats jpg/png/webp/gif/avif.
  Les images sont envoyées une par une (barre de progression visible),
  ce qui marche aussi pour des chapitres de centaines de pages.
- L'inscription est ouverte à tous : seul le premier compte est admin,
  les suivants sont de simples lecteurs.
