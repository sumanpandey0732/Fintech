#!/bin/bash

# CashBuddy Nepal - APK Build Script
# This script will build your APK using EAS

echo "========================================="
echo "   CashBuddy Nepal - APK Builder"
echo "========================================="
echo ""

# Check if eas-cli is installed
if ! command -v eas &> /dev/null; then
    echo "Installing EAS CLI..."
    npm install -g eas-cli
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

echo ""
echo "Please login to your Expo account..."
echo "Email: sumanpandey0732@gmail.com"
echo ""

# Login to EAS
eas login

echo ""
echo "Starting APK build..."
echo "This will take 10-20 minutes..."
echo ""

# Build APK
eas build --platform android --profile preview --non-interactive

echo ""
echo "========================================="
echo "   Build Complete!"
echo "========================================="
echo "Download your APK from the link above."
