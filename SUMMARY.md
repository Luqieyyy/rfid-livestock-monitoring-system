# FarmSense - Livestock Management System

## Overview
FarmSense is a modern web-based livestock management platform designed for efficient farm operations. The system provides comprehensive tools for livestock monitoring, health management, and marketplace functionality.

## Features
- **Unified Authentication**: Single login system with role-based access
- **Admin Dashboard**: Complete livestock management with analytics
- **Buyer Portal**: Marketplace for browsing livestock
- **Real-time Data**: Firebase integration for live updates
- **Responsive Design**: Works across all devices

## Technology Stack
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Firebase (Auth & Firestore)
- React Hooks & Context

## File Structure
```
src/
├── app/                 # App router pages
│   ├── admin/          # Admin dashboard pages
│   ├── buyer/          # Buyer portal pages
│   └── login/          # Unified authentication
├── components/         # Reusable UI components
├── context/            # React context providers
├── lib/                # Firebase initialization
├── services/           # Business logic & API calls
├── types/              # TypeScript definitions
└── utils/              # Helper functions & constants
```

## Authentication Flow
1. User visits `/login`
2. Selects role (Admin/Buyer)
3. Enters credentials
4. Redirected to appropriate dashboard
5. Firebase UID stored in Firestore for user management

## Production Ready
- Clean codebase without development tools
- Optimized file structure
- Professional UI/UX
- Secure authentication
- Type-safe implementation