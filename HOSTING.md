# Firebase Hosting Setup for Overdrip

This guide covers how to host the Overdrip web app and installer script on Firebase Hosting.

## Overview

Firebase Hosting serves:

- **Web App** — React/Mantine frontend at the root (`/`)
- **Install Script** — `install.sh` at `https://get.overdrip.app/install.sh`

Users can:

- Visit `https://get.overdrip.app` to see the landing page with auth and install instructions
- Install Overdrip with: `curl -sSL https://get.overdrip.app/install.sh | bash`

## Architecture

The web app is built from `packages/web/` and deployed to Firebase Hosting:

```
packages/web/
├── src/
│   ├── components/
│   │   └── landing/landing-page.tsx  # Public landing page (/ route)
│   ├── index.html                     # HTML template
│   └── frontend.tsx                   # React entry point
├── dist/                              # Build output (created by build.ts)
│   ├── index.html
│   ├── *.js, *.css
│   └── install.sh                     # Copied during predeploy
└── build.ts                           # Bun build script

install.sh (root)                      # Source installer script
```

The landing page (`LandingPage` component) is accessible to everyone at `/`:

- **Unauthenticated users**: See "Log In" and "Sign Up" buttons
- **Authenticated users**: See "Go to Dashboard" button
- **All users**: See installer instructions and project info

## Initial Setup

### 1. Enable Firebase Hosting

If you haven't already:

```bash
firebase init hosting
```

Select:

- **Public directory:** `packages/web/dist`
- **Configure as single-page app:** Yes (rewrites to `/index.html`)
- **Set up automatic builds:** No
- **Overwrite index.html:** No

The `firebase.json` is already configured with:

- Public directory: `packages/web/dist`
- Predeploy hooks: Build web app + copy installer
- SPA rewrites: All routes → `/index.html` (except static files like `install.sh`)
- Proper MIME type for `.sh` files (`text/plain`)
- Cache headers (5 minutes for install script updates)

### 2. Test Locally

Start the Firebase emulators:

```bash
firebase emulators:start
```

Visit:

- **Web app**: `http://localhost:5050` (landing page, login, signup, dashboard)
- **Installer**: `http://localhost:5050/install.sh`

Test the install script:

```bash
curl -sSL http://localhost:5050/install.sh | head -20
```

### 3. Build and Deploy

Build the web app and deploy hosting:

```bash
# Build happens automatically during deploy via predeploy hook
firebase deploy --only hosting
```

Your site will be available at:

- Default: `https://YOUR-PROJECT-ID.web.app`
- Custom (if configured): `https://get.overdrip.app`

## Custom Domain Setup

To use `get.overdrip.app`:

### 1. Add Custom Domain in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your Overdrip project
3. Navigate to **Hosting** → **Add custom domain**
4. Enter `get.overdrip.app`
5. Firebase will provide DNS records to add

### 2. Configure DNS

Add the DNS records provided by Firebase to your domain registrar:

**For `get.overdrip.app` subdomain:**

- Type: `A` or `AAAA`
- Name: `get`
- Value: Firebase IP addresses (provided in console)

**Or use CNAME (alternative):**

- Type: `CNAME`
- Name: `get`
- Value: `YOUR-PROJECT-ID.web.app.`

### 3. Wait for Verification

- DNS propagation: 5 minutes to 48 hours (usually ~15 minutes)
- SSL certificate provisioning: Automatic once DNS is verified
- Firebase will show status in console

## Build Process

The `firebase.json` predeploy hooks handle everything:

```json
{
  "hosting": {
    "predeploy": [
      "cd packages/web && bun run build",
      "cp install.sh packages/web/dist/install.sh"
    ]
  }
}
```

This:

1. Builds the web app from `packages/web/src/` → `packages/web/dist/`
2. Copies `install.sh` from repo root into the build output

You can also build manually:

```bash
cd packages/web
bun run build
```

Output: `packages/web/dist/` contains:

- `index.html` — HTML entry point
- JavaScript and CSS bundles
- Icons and assets
- `install.sh` — Installer script

## Routing

The web app uses client-side routing with React Router:

- `/` — Landing page (public, shows install instructions)
- `/login` — Login page
- `/signup` — Signup page
- `/dashboard` — User dashboard (auth required)
- `/devices` — Device list (auth required)
- `/devices/:id` — Device detail (auth required)

Firebase Hosting rewrites all routes to `/index.html` (SPA pattern), but serves static files like `install.sh` directly.

## Updating the Installer

When you update `install.sh`:

1. Edit `install.sh` in the repo root
2. Redeploy hosting:

```bash
firebase deploy --only hosting
```

The predeploy hook automatically copies the updated script to `packages/web/dist/install.sh`.

The 5-minute cache (`Cache-Control: max-age=300`) means users get updates quickly.

## CI/CD Integration

Add hosting deployment to your GitHub Actions workflow:

```yaml
- name: Build and Deploy Hosting
  run: firebase deploy --only hosting --token ${{ secrets.FIREBASE_TOKEN }}
  env:
    NODE_ENV: production
```

The predeploy hooks ensure the web app is built and installer is copied automatically.

Generate a CI token:

```bash
firebase login:ci
```

Add the token to GitHub Secrets as `FIREBASE_TOKEN`.

## Testing the Install Flow

### From Production

Once deployed:

```bash
# Download and inspect (don't run)
curl -sSL https://get.overdrip.app/install.sh

# Test the full install (on a test Pi)
curl -sSL https://get.overdrip.app/install.sh | bash
```

### From Emulator

```bash
firebase emulators:start --only hosting

# In another terminal
curl -sSL http://localhost:5050/install.sh
```

## Security Considerations

### Content Integrity

**Current:** Users download over HTTPS (automatic with Firebase Hosting + custom domain).

**Future Enhancement:** Add checksum verification:

1. Generate SHA256 hash of install script
2. Serve hash at `https://get.overdrip.app/install.sh.sha256`
3. Update installer to verify before execution

Example:

```bash
# Download both
curl -sSL https://get.overdrip.app/install.sh -o install.sh
curl -sSL https://get.overdrip.app/install.sh.sha256 -o install.sh.sha256

# Verify
sha256sum -c install.sh.sha256

# Run if verified
bash install.sh
```

### Script Review

Encourage users to review before piping to bash:

```bash
# Download first
curl -sSL https://get.overdrip.app/install.sh -o install.sh

# Review
less install.sh

# Run manually
bash install.sh
```

## Monitoring

### Firebase Console

Monitor hosting traffic:

- **Hosting** → **Dashboard** → **Usage**
- Track bandwidth, requests, and geographic distribution

### Analytics (Optional)

Add Google Analytics to the web app if you want to track:

- Landing page visits
- Sign-ups
- Device registrations

## Troubleshooting

### Install Script Returns 404

- Check deployment: `firebase deploy --only hosting`
- Verify build output: `ls packages/web/dist/install.sh`
- Check Firebase Console → Hosting → Release history

### Web App Not Loading

- Check build output: `ls packages/web/dist/`
- Verify `index.html` exists: `cat packages/web/dist/index.html`
- Check browser console for errors
- Verify Firebase config in `packages/core/.env.production`

### Wrong Content-Type for Install Script

If browsers try to execute the script instead of downloading:

```json
{
  "hosting": {
    "headers": [
      {
        "source": "**/*.sh",
        "headers": [
          {
            "key": "Content-Type",
            "value": "text/plain; charset=utf-8"
          }
        ]
      }
    ]
  }
}
```

Already configured in `firebase.json`.

### Custom Domain Not Working

1. Verify DNS propagation: `dig get.overdrip.app`
2. Check Firebase Console for verification status
3. Wait for SSL certificate (can take up to 24 hours)
4. Ensure no HTTPS redirect loops in DNS provider settings

### Cache Issues

If users report old script version or stale web app:

```bash
# Clear hosting cache (redeploy)
firebase deploy --only hosting

# Or wait 5 minutes (current Cache-Control setting for .sh files)
```

For the web app, use cache-busting filenames (Bun build does this automatically).

### Build Failures

Check predeploy hooks:

```bash
# Test build manually
cd packages/web
bun run build

# Verify output
ls dist/
```

## Cost

Firebase Hosting free tier includes:

- **10 GB/month storage** (web app + install.sh ~few MB)
- **360 MB/day bandwidth** (enough for thousands of page loads and installs)
- **SSL certificate:** Free
- **Custom domain:** Free

Overdrip hosting will stay within free tier unless you have significant traffic.

## Deployment Checklist

Before deploying:

- [ ] Test web app locally: `cd packages/web && bun run dev`
- [ ] Build succeeds: `cd packages/web && bun run build`
- [ ] Installer script works: `curl -sSL http://localhost:5050/install.sh | head`
- [ ] All routes work in emulator: `firebase emulators:start`
- [ ] Environment variables set: `packages/core/.env.production`
- [ ] Test authentication flows (login, signup, logout)
- [ ] Test protected routes redirect to login

Deploy:

```bash
firebase deploy --only hosting
```

Verify:

- [ ] Web app loads at `https://get.overdrip.app`
- [ ] Landing page shows install instructions
- [ ] Login/signup work
- [ ] Dashboard loads for authenticated users
- [ ] Install script downloads: `curl -sSL https://get.overdrip.app/install.sh`

## Summary

Firebase Hosting provides:

- ✅ Free, fast CDN for web app + install script
- ✅ Automatic HTTPS + SSL certificates
- ✅ Custom domain support (`get.overdrip.app`)
- ✅ SPA routing with rewrites
- ✅ Simple deployment (`firebase deploy --only hosting`)
- ✅ Automatic builds via predeploy hooks
- ✅ Public landing page with auth integration

Perfect for a modern web app + curl-to-install pattern!
