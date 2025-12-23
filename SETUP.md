# Quick Setup Guide

## Step 1: Install Dependencies
```bash
npm install
```

## Step 2: Configure Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (the same one used by your Flutter app)
3. Go to Project Settings > General
4. Scroll to "Your apps" section
5. If no web app exists, click "Add app" and select Web
6. Copy the configuration values

## Step 3: Create Environment File

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

## Step 4: Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Step 5: Verify Data Connection

1. Ensure your Firestore has the following collections:
   - `livestock`
   - `health_records`
   - `breeding_records`
   - `sales`

2. Add sample data using your Flutter mobile app or Firestore console

3. Navigate to Admin Dashboard to see if data loads

## Project Structure

- `/` - Landing page with links to Admin and Buyer portals
- `/admin` - Admin Dashboard (livestock management)
- `/buyer` - Buyer Portal (browse livestock)

## Need Help?

Check the main README.md for:
- Detailed Firebase setup
- Collection schema definitions
- Troubleshooting guide
- Security rules examples

## Production Build

```bash
npm run build
npm start
```

## Common Commands

```bash
npm run dev      # Start development server
npm run build    # Create production build
npm start        # Start production server
npm run lint     # Run ESLint
```
