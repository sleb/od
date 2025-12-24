# Firebase Hosting Setup for Overdrip Installer

This guide covers how to host the Overdrip install script on Firebase Hosting at `https://get.overdrip.app`.

## Overview

Firebase Hosting serves:
- `install.sh` — The installation script
- `index.html` — Landing page with install instructions

Users can install Overdrip with:
```bash
curl -sSL https://get.overdrip.app/install.sh | bash
```

## Initial Setup

### 1. Enable Firebase Hosting

If you haven't already:

```bash
firebase init hosting
```

Select:
- **Public directory:** `public`
- **Configure as single-page app:** No
- **Set up automatic builds:** No
- **Overwrite index.html:** No (we've already created it)

The `firebase.json` is already configured with:
- Proper MIME type for `.sh` files (`text/plain`)
- Cache headers (5 minutes for install script updates)
- Hosting emulator on port 5000

### 2. Test Locally

Start the Firebase emulators:

```bash
firebase emulators:start
```

Visit `http://localhost:5000` to see the landing page.

Test the install script:

```bash
curl -sSL http://localhost:5000/install.sh | head -20
```

### 3. Deploy to Firebase

Deploy hosting (without affecting functions/firestore):

```bash
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

## File Structure

```
od/
├── public/
│   ├── index.html      # Landing page
│   └── install.sh      # Installer script (copy of root install.sh)
├── install.sh          # Source installer (keep this updated)
└── firebase.json       # Hosting config
```

**Important:** Keep `public/install.sh` in sync with root `install.sh`:

```bash
# After updating install.sh:
cp install.sh public/install.sh
firebase deploy --only hosting
```

Or automate with a pre-deploy script in `firebase.json`:

```json
{
  "hosting": {
    "predeploy": ["cp install.sh public/install.sh"]
  }
}
```

## CI/CD Integration

Add hosting deployment to your GitHub Actions workflow:

```yaml
- name: Deploy Hosting
  run: firebase deploy --only hosting --token ${{ secrets.FIREBASE_TOKEN }}
```

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
curl -sSL http://localhost:5000/install.sh
```

## Updating the Installer

When you update `install.sh`:

1. Test changes locally
2. Copy to `public/install.sh`
3. Deploy:

```bash
cp install.sh public/install.sh
firebase deploy --only hosting
```

The 5-minute cache means users get updates quickly.

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

Add Google Analytics to `index.html` if you want to track landing page visits.

## Troubleshooting

### Install Script Returns 404

- Check deployment: `firebase deploy --only hosting`
- Verify file exists: `ls public/install.sh`
- Check Firebase Console → Hosting → Release history

### Wrong Content-Type

If browsers try to execute the script instead of downloading:

```json
{
  "hosting": {
    "headers": [{
      "source": "**/*.sh",
      "headers": [{
        "key": "Content-Type",
        "value": "text/plain; charset=utf-8"
      }]
    }]
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

If users report old script version:

```bash
# Clear hosting cache (redeploy)
firebase deploy --only hosting

# Or wait 5 minutes (current Cache-Control setting)
```

## Cost

Firebase Hosting free tier includes:
- **10 GB/month storage** (install.sh is ~5KB)
- **360 MB/day bandwidth** (~72,000 downloads/day)
- **SSL certificate:** Free
- **Custom domain:** Free

Overdrip installer hosting will stay within free tier unless you have millions of users.

## Summary

Firebase Hosting provides:
- ✅ Free, fast CDN for install script
- ✅ Automatic HTTPS + SSL certificates
- ✅ Custom domain support (`get.overdrip.app`)
- ✅ Simple deployment (`firebase deploy --only hosting`)
- ✅ Low maintenance (just keep `public/install.sh` in sync)

Perfect fit for a curl-to-install pattern!
