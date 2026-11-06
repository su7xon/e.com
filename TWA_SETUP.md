# TWA (Trusted Web Activity) Setup Guide

## Overview
Convert the 7 Cheese Pizza PWA into an Android app and publish on Google Play Store.

## Prerequisites
- PWA already live at `https://order.7cheesepizza.com` (HTTPS required)
- Google Play Console developer account ($25 one-time fee)
- Android Studio or PWABuilder/Bubblewrap tool

## Files Included

| File | Purpose |
|------|---------|
| `twa-manifest.json` | TWA configuration for PWABuilder / Bubblewrap |
| `public/.well-known/assetlinks.json` | Digital Asset Links (verify domain ownership) |
| `TWA_SETUP.md` | This guide |

---

## Step 1: Build PWA and Deploy

```bash
cd D:\e.com-main
npm install
npm run build
```

Deploy the `dist/` folder to your hosting (Vercel / Netlify / Firebase) on `order.7cheesepizza.com`.

Ensure HTTPS is active — TWA requires HTTPS.

---

## Step 2: Generate SHA-256 Fingerprint

You need your app's signing certificate fingerprint.

### Option A: Using Android Studio
1. Open Android Studio
2. Build → Generate Signed Bundle / APK
3. Create new keystore or use existing
4. Copy the **SHA-256 certificate fingerprint**

### Option B: Using keytool (command line)
```bash
keytool -list -v -keystore your-release-key.keystore -alias your-alias
```

Copy the `SHA256` value (looks like: `14:CF:E3:...`).

---

## Step 3: Update assetlinks.json

Open `public/.well-known/assetlinks.json` and replace:

- `package_name` → your Android package (e.g. `com.sevencheese.pizza`)
- `sha256_cert_fingerprints` → paste your SHA-256 fingerprint (no colons, lowercase)

Example:
```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.sevencheese.pizza",
      "sha256_cert_fingerprints": [
        "14cfe3ab22cd0f8a4e1a9b5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5"
      ]
    }
  }
]
```

Deploy this file to `https://order.7cheesepizza.com/.well-known/assetlinks.json`.

Verify it works:
```
https://digitalassetlinks.googleapis.com/v1/statements/list?source.web.site=https://order.7cheesepizza.com&relation=delegate_permission/common.handle_all_urls
```

---

## Step 4: Build TWA (Choose one method)

### Method A: PWABuilder (Easiest, Web-based)
1. Go to https://www.pwabuilder.com
2. Enter your PWA URL: `https://order.7cheesepizza.com`
3. Click "Start" → "Android"
4. Package name: `com.sevencheese.pizza`
5. Download the `.aab` file
6. Upload to Google Play Console

### Method B: Bubblewrap (CLI)
```bash
npm install -g @bubblewrap/cli
bubblewrap init --manifest https://order.7cheesepizza.com/twa-manifest.json
bubblewrap build
```

This produces `app-release.aab` in the output folder.

---

## Step 5: Publish on Google Play Store

1. Go to https://play.google.com/console
2. Create app: "7 Cheese Pizza"
3. App type: App, Free
4. Default language: English (India)
5. Upload `app-release.aab`
6. Fill store listing:
   - **Title:** 7 Cheese Pizza
   - **Short Description:** Order fresh pizzas from 7 Cheese Pizza
   - **Full Description:** Order delicious pizzas, burgers, and more from 7 Cheese Pizza. Delivery, Takeaway & Dine-in available in Haldwani, Dehradun, and more cities across Uttarakhand.
7. Upload screenshots (from your phone running the PWA)
8. Submit for review

---

## Step 6: Update assetlinks after Play Store signing

Google Play may re-sign your app with a different key.

1. In Play Console: Release → Setup → App integrity
2. Copy the **SHA-256 certificate fingerprint** from "App signing certificate"
3. Update `assetlinks.json` with this fingerprint
4. Redeploy to `https://order.7cheesepizza.com/.well-known/assetlinks.json`

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| TWA won't open | Ensure HTTPS is active on `order.7cheesepizza.com` |
| Asset links not verified | Check SHA-256 matches your signing key |
| White screen on launch | Check service worker is registered properly |
| Play Store rejection | Ensure app has real functionality (not just a website wrapper) |

---

## Support
Contact the developer who built this React+Vite app if you need help with:
- Firebase configuration
- API keys
- Build errors