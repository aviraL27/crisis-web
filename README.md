# ⬛ Minimal Leaderboard (Multi-Device Sync)

A minimal, high-contrast monochrome leaderboard web app built strictly following the **[Impeccable Design System](https://impeccable.style)** by Paul Bakaus.

Audited and verified with `npx impeccable detect`: **0 anti-patterns found**.

---

## 🌐 Multi-Device Shared Synchronization

The leaderboard is synchronized across **all machines, devices, and projector screens** via the serverless API `/api/leaderboard`:

1. **Admin Edits on Device A**: Adding teams, adjusting scores (`+5`, `+10`, `+30`, `+50`, `-5`), or deleting teams broadcasts changes to the shared store.
2. **Audience / Projector on Device B**: The public landing page polls `/api/leaderboard` in the background and updates the display live within 2 seconds without requiring any manual reload.

---

## ⚡ Enabling Global Multi-Device Sync on Vercel

On Vercel, connect **Vercel KV** (powered by Upstash Redis) in 1 click:

1. Open your project dashboard on [Vercel](https://vercel.com).
2. Go to the **Storage** tab &rarr; Click **Create Database** &rarr; Select **KV**.
3. Choose a name and click **Create**.
4. Click **Connect to Project** &rarr; Select `crisis-web`.
5. Vercel automatically injects `KV_REST_API_URL` and `KV_REST_API_TOKEN`.

*Once connected, any changes made from your admin console will instantly update all devices and screens globally!*

---

## 📄 Two-Page Architecture

### 1. 🏆 Public Live Leaderboard ([`index.html`](./index.html))
- **Purpose**: Pure display for the audience, projector screens, or public viewers.
- **Features**:
  - Clean, distraction-free rankings: **Rank**, **Team Name**, and **Points**.
  - Inverted highlight for the **#1 Leader**.
  - Real-time search filter and team counter.
  - Automatic background polling (updates every 2 seconds).
  - Unlinked & clean: No visible admin buttons on the public screen (navigate manually to `/admin.html`).

### 2. ⚙️ Protected Score Management ([`admin.html`](./admin.html))
- **Purpose**: Secure control console for judges, event coordinators, and admins.
- **🔒 Password Protection**:
  - Gated by a serverless verification endpoint (`/api/verify`).
  - Password is **never hardcoded** in frontend code and is securely read from environment variables (`ADMIN_PASSWORD`).
  - Active session authentication stored in `sessionStorage` with a manual **Lock** button.
- **Features**:
  - **Add Team Form**: Enter team name and starting points.
  - **Quick Adjust Buttons**: One-click score offsets (`+5`, `+10`, `+30`, `+50`, and `-5`).
  - **Edit Score Modal (✎)**: Direct score input and quick offset chips.
  - **Delete Team (✕)**: Instant removal with confirmation.
  - **1-Click CSV Export**: Download current standings as `.csv`.
  - **Clear All**: Reset the event with one click.
  - Navigation link back to the live public leaderboard (`← View Leaderboard`).

---

## 🔐 Environment Variables

- `ADMIN_PASSWORD`: Admin password for `/admin.html` (e.g. `crisisnotsoeasy404`).
- `KV_REST_API_URL` & `KV_REST_API_TOKEN`: Automatically provided by Vercel when connecting Vercel KV.

---

## 🚀 Running Locally & Deploying

### Run Locally (With Multi-Device Local Sync)
```bash
node server.js
```
Devices on your local network (e.g. `http://<your-ip>:3000`) share the same standings automatically!

### Deploy to Vercel
Push to GitHub and deploy on Vercel. In **Project Settings → Environment Variables**, add:
- `ADMIN_PASSWORD`: `crisisnotsoeasy404`
- Connect **Vercel KV** under the **Storage** tab for global persistence across all devices.
