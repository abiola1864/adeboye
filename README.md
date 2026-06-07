# The Adeboye Review

Smart government. Real accountability. Better ideas for Nigeria's future.

## Tech Stack
- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js + Express
- **Database**: PostgreSQL
- **Hosting**: Render

## Local Development

```bash
# 1. Install dependencies
npm install

# 2. Create a .env file
cp .env.example .env
# Edit .env with your local PostgreSQL details

# 3. Run locally
npm run dev
# Site runs at http://localhost:3000
```

## Deploy to Render

### Step 1 — Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit: The Adeboye Review"
git branch -M main
git remote add origin https://github.com/abiola1864/adeboye.git
git push -u origin main
```

### Step 2 — Create on Render
1. Go to https://render.com
2. Click **New +** → **Web Service**
3. Connect your GitHub repo `abiola1864/adeboye`
4. Settings:
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

### Step 3 — Add PostgreSQL Database
1. On Render dashboard → **New +** → **PostgreSQL**
2. Name: `adeboye-db` → Create
3. Copy the **Internal Database URL**
4. Go back to your web service → **Environment**
5. Add environment variables:
   - `DATABASE_URL` = (paste your database URL)
   - `SESSION_SECRET` = (any random string)
   - `ADMIN_PASSWORD` = (your chosen password)
   - `NODE_ENV` = `production`

### Step 4 — Deploy
Click **Manual Deploy** → **Deploy latest commit**

## Admin Panel

Go to: `https://your-site.onrender.com/admin.html`

Login with your `ADMIN_PASSWORD` environment variable.

**Default password** (change in Render environment): `adeboye2026`

## Pages
- `/` — Homepage
- `/articles.html` — All articles
- `/article.html?slug=SLUG` — Single article
- `/categories.html` — Categories
- `/category-democracy.html` — Democracy essays
- `/category-leadership.html` — Leadership essays
- `/category-institutions.html` — Institutions essays
- `/category-policy.html` — Public Policy essays
- `/about.html` — About page
- `/contact.html` — Contact & Subscribe
- `/admin.html` — Admin dashboard (protected)
- `/login.html` — Admin login

## API Endpoints
- `GET /api/posts` — All published posts
- `GET /api/posts/:slug` — Single post
- `POST /api/subscribe` — Subscribe to newsletter
- `POST /api/contact` — Send contact message
