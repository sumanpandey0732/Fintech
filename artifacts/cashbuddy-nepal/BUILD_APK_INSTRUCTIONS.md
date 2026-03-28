# Building CashBuddy Nepal APK

## Prerequisites
1. Install EAS CLI globally:
   ```bash
   npm install -g eas-cli
   ```

2. Navigate to the project directory:
   ```bash
   cd artifacts/cashbuddy-nepal
   ```

## Step-by-Step Build Instructions

### 1. Login to Expo Account
```bash
eas login
```
Enter your credentials when prompted:
- Email: sumanpandey0732@gmail.com
- Password: (enter your password)

### 2. Configure EAS Project
If this is your first time, initialize EAS:
```bash
eas build:configure
```
This will update your `app.json` with the correct project ID.

### 3. Build the APK

#### Option A: Development Build (for testing)
```bash
eas build --platform android --profile development
```

#### Option B: Preview Build (internal distribution)
```bash
eas build --platform android --profile preview
```

#### Option C: Production Build (for release)
```bash
eas build --platform android --profile production
```

### 4. Download the APK
After the build completes, you'll receive a URL to download the APK file.
Or use:
```bash
eas build:list
```
Then download from the Expo dashboard.

## Quick Build Command (All-in-one)
```bash
# Login and build preview APK
eas login && eas build --platform android --profile preview --non-interactive
```

## Troubleshooting

### If build fails with "Project not found":
```bash
eas project:init
```

### If you need to update the project ID:
Edit `app.json` and update the `extra.eas.projectId` field with your actual project ID from expo.dev

### Clear cache if needed:
```bash
npx expo start --clear
```

## Build Profiles Explained

| Profile | Type | Use Case |
|---------|------|----------|
| development | APK | Testing with Expo Go features |
| preview | APK | Internal testing/distribution |
| production | AAB/APK | Play Store release |

## After Building

The APK will be available for download from:
1. The terminal link after build completion
2. expo.dev dashboard under your project builds
3. `eas build:list` command output
