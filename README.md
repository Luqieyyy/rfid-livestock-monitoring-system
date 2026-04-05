# FarmSense - Smart Livestock Management System

A modern web-based livestock management platform built with Next.js, TypeScript, and Firebase.

## Overview

FarmSense provides comprehensive farm management tools through an Admin Dashboard and Buyer Portal, designed to streamline livestock operations and improve farm efficiency.

## Features

**Admin Dashboard:**
- Real-time livestock monitoring
- Health records management  
- Breeding cycle tracking
- Sales transaction management
- Analytics and insights

**Buyer Portal:**
- Browse available livestock
- View detailed information
- Health-verified listings

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Firebase Firestore
- **Authentication**: Firebase Auth
- **UI Components**: Custom components with Lucide icons

## Quick Start

1. Clone the repository
2. Install dependencies: `npm install`
3. Configure Firebase credentials in `.env.local`
4. Run development server: `npm run dev`
5. Access application at `http://localhost:3000`

## Authentication

The system supports role-based authentication:
- **Admin**: Full farm management access
- **Buyer**: Marketplace browsing access

## Project Structure

```
src/
├── app/              # App router pages
├── components/       # Reusable UI components
├── context/          # React context providers
├── lib/              # Utility libraries
├── services/         # API and business logic
├── types/            # TypeScript type definitions
└── utils/            # Helper functions
```

## License

This project is part of an academic assignment for livestock management system development.

### Key Features

**Admin Dashboard:**
- Real-time livestock monitoring with status indicators
- Health records management (vaccinations, treatments, checkups)
- Breeding cycle tracking and pregnancy monitoring
- Sales transaction management
- Comprehensive KPI dashboard with visual analytics

**Buyer Portal:**
- Browse available livestock with detailed information
- Health-verified and traceable livestock listings
- Professional, user-friendly interface for potential buyers

## 🏗️ Architecture

```
┌─────────────────┐
│  Flutter Mobile │  (Field Data Collection)
│   Application   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    Firebase     │  (Shared Backend)
│  - Firestore    │
│  - Auth         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Web Portal    │  (Admin & Buyer)
│  - Next.js 14   │
│  - TypeScript   │
└─────────────────┘
```

## 🛠️ Technology Stack

- **Frontend**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Backend**: Firebase Firestore
- **Authentication**: Firebase Auth

## 📁 Project Structure

```
AdminBuyer/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── admin/             # Admin Dashboard
│   │   │   ├── layout.tsx     # Admin layout with navigation
│   │   │   ├── page.tsx       # Dashboard overview
│   │   │   ├── livestock/     # Livestock management
│   │   │   ├── health/        # Health records
│   │   │   ├── breeding/      # Breeding management
│   │   │   └── sales/         # Sales tracking
│   │   ├── buyer/             # Buyer Portal
│   │   │   ├── layout.tsx     # Buyer layout
│   │   │   └── page.tsx       # Livestock browsing
│   │   ├── layout.tsx         # Root layout
│   │   ├── page.tsx           # Landing page
│   │   └── globals.css        # Global styles
│   ├── components/
│   │   └── ui/                # Reusable UI components
│   │       ├── Card.tsx       # Card components
│   │       ├── Table.tsx      # Table components
│   │       ├── Badge.tsx      # Status badges
│   │       ├── Button.tsx     # Button component
│   │       └── Loading.tsx    # Loading states
│   ├── services/
│   │   └── firestore.service.ts  # Firestore data services
│   ├── types/
│   │   └── livestock.types.ts    # TypeScript interfaces
│   ├── config/
│   │   └── firebase.config.ts    # Firebase configuration
│   └── lib/
│       └── firebase.ts           # Firebase initialization
├── public/                    # Static assets
├── .env.example              # Environment variables template
├── package.json              # Dependencies
├── tsconfig.json             # TypeScript configuration
├── tailwind.config.js        # Tailwind CSS configuration
└── next.config.js            # Next.js configuration
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Firebase project created
- Flutter mobile app configured (optional but recommended)

### Installation

1. **Clone or navigate to the project directory**

```bash
cd AdminBuyer
```

2. **Install dependencies**

```bash
npm install
```

3. **Configure Firebase**

Create a `.env.local` file in the root directory:

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your Firebase credentials:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_actual_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

4. **Run the development server**

```bash
npm run dev
```

5. **Open your browser**

Navigate to [http://localhost:3000](http://localhost:3000)

### Building for Production

```bash
npm run build
npm start
```

## 🔥 Firebase Setup

### Firestore Collections

The application expects the following Firestore collections:

#### `livestock`
```typescript
{
  id: string;
  tagId: string;
  type: 'cattle' | 'goat';
  breed: string;
  dateOfBirth: Timestamp;
  gender: 'male' | 'female';
  status: 'healthy' | 'sick' | 'quarantine' | 'deceased';
  weight: number;
  location: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### `health_records`
```typescript
{
  id: string;
  livestockId: string;
  date: Timestamp;
  type: 'vaccination' | 'treatment' | 'checkup' | 'diagnosis';
  description: string;
  veterinarian?: string;
  medication?: string;
  dosage?: string;
  nextCheckup?: Timestamp;
  status: 'completed' | 'ongoing' | 'scheduled';
  createdAt: Timestamp;
}
```

#### `breeding_records`
```typescript
{
  id: string;
  motherId: string;
  fatherId?: string;
  breedingDate: Timestamp;
  expectedDeliveryDate: Timestamp;
  actualDeliveryDate?: Timestamp;
  numberOfOffspring?: number;
  offspringIds?: string[];
  status: 'planned' | 'pregnant' | 'delivered' | 'failed';
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### `sales`
```typescript
{
  id: string;
  livestockId: string;
  buyerName: string;
  buyerContact: string;
  saleDate: Timestamp;
  price: number;
  paymentStatus: 'pending' | 'partial' | 'completed';
  deliveryStatus: 'pending' | 'in-transit' | 'delivered';
  notes?: string;
  createdAt: Timestamp;
}
```

### Security Rules (Example)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Admin access for livestock management
    match /livestock/{document=**} {
      allow read: if true; // Public read for buyer portal
      allow write: if request.auth != null; // Authenticated users
    }
    
    match /health_records/{document=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    
    match /breeding_records/{document=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    
    match /sales/{document=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

## 📊 Features Breakdown

### Admin Dashboard
- **Dashboard Overview**: Real-time KPIs, recent additions, health alerts
- **Livestock Management**: Complete CRUD operations, filtering, search
- **Health Records**: Track medical history, vaccinations, treatments
- **Breeding Management**: Monitor breeding cycles, pregnancies, offspring
- **Sales Tracking**: Transaction history, payment status, delivery tracking

### Buyer Portal
- **Browse Livestock**: View available animals with detailed information
- **Advanced Filters**: Search by type, breed, health status
- **Traceability**: Complete health verification and documentation
- **Professional UI**: Clean, buyer-friendly interface

## 🎓 Academic Notes

This system demonstrates:
- **Modern web architecture** using Next.js App Router
- **Type-safe development** with TypeScript
- **Real-time data** integration with Firebase
- **Responsive design** with Tailwind CSS
- **Component-based architecture** for maintainability
- **Service layer pattern** for data access
- **Professional UI/UX** suitable for production

## 🔧 Development Guidelines

### Code Style
- Use TypeScript strictly with proper type definitions
- Follow Next.js 14 App Router conventions
- Maintain consistent component structure
- Write clear, self-documenting code

### Component Organization
- UI components in `src/components/ui/`
- Page components in `src/app/`
- Services in `src/services/`
- Types in `src/types/`

### Best Practices
- Use 'use client' directive for client components
- Implement proper error handling
- Add loading states for async operations
- Maintain responsive design principles

## 🐛 Troubleshooting

### Common Issues

**Firebase Connection Error:**
- Verify `.env.local` credentials
- Check Firebase project settings
- Ensure Firestore is enabled

**Build Errors:**
- Clear `.next` folder: `rm -rf .next`
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`

**Data Not Loading:**
- Check Firestore security rules
- Verify collection names match code
- Check browser console for errors

## 📝 Future Enhancements

- User authentication and role management
- Advanced analytics and reporting
- Export data to PDF/Excel
- Mobile-responsive improvements
- Real-time notifications
- Integration with payment gateways

## 👥 Contributors

Developed as part of an academic final year project demonstrating full-stack development capabilities.

## 📄 License

This is an academic project. Please consult with your institution regarding usage and distribution.

---

**Note**: This system is designed to work with existing Firestore data from a Flutter mobile application. Ensure your Firebase project is properly configured and collections are created before running the web portal.
