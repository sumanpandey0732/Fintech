# CashBuddy Nepal - APK Build Instructions

## IMPORTANT
- This is a React Native app - it CANNOT run in web browser preview
- The "404 page not found" error is EXPECTED in browser
- You MUST build an APK to run on Android device/emulator

---

## Quick Build (Copy-Paste These Commands)

Open terminal on your computer and run:

```bash
# 1. Extract and navigate to project folder
cd cashbuddy-nepal

# 2. Install dependencies
npm install

# 3. Install EAS CLI
npm install -g eas-cli

# 4. Login to Expo (enter your email and password when asked)
eas login

# 5. Build APK (takes 10-20 minutes)
eas build --platform android --profile preview
```

After build completes, you'll get a download link for the APK file.

---

## Detailed Steps

### Step 1: Download Project
1. Click the three dots (...) in top right of v0
2. Select "Download ZIP"
3. Extract the ZIP file

### Step 2: Install Tools
Make sure you have:
- Node.js 18+ (download from nodejs.org)
- npm (comes with Node.js)

### Step 3: Open Terminal
- Windows: Press `Win + R`, type `cmd`, press Enter
- Mac: Press `Cmd + Space`, type `Terminal`, press Enter
- Linux: Press `Ctrl + Alt + T`

### Step 4: Navigate to Project
```bash
cd path/to/cashbuddy-nepal
```

### Step 5: Install Dependencies
```bash
npm install
```

### Step 6: Install EAS CLI
```bash
npm install -g eas-cli
```

### Step 7: Login to Expo
```bash
eas login
```
Enter your email and password when prompted.

### Step 8: Build APK
```bash
eas build --platform android --profile preview
```

### Step 9: Download APK
- Build takes 10-20 minutes
- When done, you'll see a download URL
- Download the APK and install on your Android phone

---

## Troubleshooting

**"Command not found: eas"**
```bash
npm install -g eas-cli
```

**"Not logged in"**
```bash
eas login
```

**Build fails with errors**
```bash
# Clear cache and try again
npm cache clean --force
rm -rf node_modules
npm install
eas build --platform android --profile preview --clear-cache
```

---

## Security Warning
NEVER share your Expo account password publicly.
If you have shared it, change it immediately at expo.dev
