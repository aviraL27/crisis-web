# ⬛ Minimal Leaderboard (Two-Page Setup)

A minimal, high-contrast monochrome leaderboard web app built strictly following the **[Impeccable Design System](https://impeccable.style)** by Paul Bakaus.

Audited and verified with `npx impeccable detect`: **0 anti-patterns found**.

---

## 📄 Two-Page Architecture

### 1. 🏆 Public Live Leaderboard ([`index.html`](./index.html))
- **Purpose**: Pure display for the audience, projector screens, or public viewers.
- **Features**:
  - Clean, distraction-free rankings: **Rank**, **Team Name**, and **Points**.
  - Inverted highlight for the **#1 Leader**.
  - Real-time search filter and team counter.
  - **Live Cross-Tab Sync**: Automatically updates when scores change on the Admin page without needing a manual refresh.
  - **Unlinked & Clean**: No visible admin buttons on the public screen (navigate manually to `/admin.html`).

### 2. ⚙️ Protected Score Management ([`admin.html`](./admin.html))
- **Purpose**: Secure control console for judges, event coordinators, and admins.
- **🔒 Password Protection**:
  - Gated by a serverless verification endpoint (`/api/verify`).
  - Password is **never hardcoded** in frontend code and is securely read from environment variables (`ADMIN_PASSWORD`).
  - Active session authentication stored in `sessionStorage` with a manual **Lock** button to secure the terminal when stepping away.
- **Features**:
  - **Add Team Form**: Enter team name and starting points.
  - **Quick Adjust Buttons**: One-click score offsets (`+5`, `+10`, `+30`, `+50`, and `-5`).
  - **Edit Score Modal (✎)**: Direct score input and quick offset chips.
  - **Delete Team (✕)**: Instant removal with confirmation.
  - **1-Click CSV Export**: Download current standings as `.csv`.
  - **Clear All**: Reset the event with one click.
  - Navigation link back to the live public leaderboard (`← View Leaderboard`).

---

## 🔐 Environment Variables & Security

The admin password is set via the `ADMIN_PASSWORD` environment variable.

Local `.env` file (ignored by Git):
```env
ADMIN_PASSWORD=crisisnotsoeasy404
```

A template `.env.example` is tracked for reference:
```env
ADMIN_PASSWORD=your_secure_password_here
```

---

## 🚀 Running Locally & Deploying to Vercel

### Run Locally (With Password Verification)
Run the lightweight built-in server (zero external npm dependencies):
```bash
node server.js
```
Then visit:
- **Public Leaderboard**: `http://localhost:3000`
- **Protected Admin Console**: `http://localhost:3000/admin.html`

### Deploy to Vercel
1. Push this repository to GitHub (the `.gitignore` ensures your `.env` secret is never exposed).
2. Import the project into [Vercel](https://vercel.com).
3. In **Project Settings → Environment Variables**, add:
   - **Key**: `ADMIN_PASSWORD`
   - **Value**: `crisisnotsoeasy404`
4. Click **Deploy**. Vercel will automatically host the static frontend and execute `/api/verify` as a zero-config serverless function!
