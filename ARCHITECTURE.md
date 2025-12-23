# System Architecture Document

## Overview

The Livestock Farming Management System is a comprehensive web-based platform designed to integrate with a Flutter mobile application through a shared Firebase backend.

## System Components

### 1. Web Portal (This Project)
- **Technology**: Next.js 14, TypeScript, Tailwind CSS
- **Purpose**: Admin management and buyer marketplace
- **Deployment**: Vercel, Netlify, or custom hosting

### 2. Mobile Application (Flutter)
- **Purpose**: Field data collection by farm operators
- **Features**: Add livestock, update health records, track breeding
- **Integration**: Direct Firestore write access

### 3. Backend (Firebase)
- **Firestore**: Real-time NoSQL database
- **Authentication**: User management
- **Storage**: Document and image storage
- **Cloud Functions**: Business logic and notifications (optional)

## Data Flow

```
┌─────────────────────────────────────────────────────┐
│                   Firebase Firestore                 │
│                  (Shared Database)                   │
└──────────┬───────────────────────────┬──────────────┘
           │                           │
           ▼                           ▼
┌──────────────────────┐    ┌──────────────────────┐
│   Flutter Mobile     │    │    Next.js Web       │
│   - Add livestock    │    │    - View data       │
│   - Update health    │    │    - Analytics       │
│   - Field operations │    │    - Buyer portal    │
└──────────────────────┘    └──────────────────────┘
```

## Admin Dashboard Architecture

### Pages
1. **Dashboard** (`/admin`)
   - KPI cards (total, healthy, sick, deceased)
   - Recent additions
   - Upcoming checkups
   - Alert notifications

2. **Livestock Management** (`/admin/livestock`)
   - Table view with filters
   - Search functionality
   - Status indicators
   - Detail views

3. **Health Records** (`/admin/health`)
   - Medical history tracking
   - Vaccination schedules
   - Treatment records

4. **Breeding Management** (`/admin/breeding`)
   - Pregnancy tracking
   - Offspring records
   - Lineage management

5. **Sales Management** (`/admin/sales`)
   - Transaction history
   - Payment tracking
   - Delivery status

### Components
- **UI Components**: Reusable cards, tables, badges, buttons
- **Service Layer**: Abstracted Firestore queries
- **Type Definitions**: Strongly typed data models

## Buyer Portal Architecture

### Features
- Browse available livestock
- Filter by type and search
- View health verification
- Contact information display

### Design Principles
- Public-facing, professional design
- Read-only data access
- Fast loading times
- Mobile-responsive

## Security Considerations

### Firestore Security Rules
```javascript
// Example rules
match /livestock/{document} {
  allow read: if true; // Public read for buyer portal
  allow write: if request.auth != null; // Authenticated write
}

match /health_records/{document} {
  allow read, write: if request.auth != null; // Admin only
}
```

### Environment Variables
- All Firebase credentials in `.env.local`
- Never commit credentials to version control
- Use different configs for dev/prod

## Data Consistency

### Ensuring Data Integrity
1. **Shared Schema**: Both mobile and web use same data structure
2. **Timestamps**: Firestore server timestamps for consistency
3. **Validation**: Input validation on both platforms
4. **Atomic Operations**: Use Firestore transactions for critical updates

### Data Synchronization
- Real-time listeners for live updates (optional)
- Periodic refresh in web portal
- Optimistic UI updates

## Performance Optimization

### Web Portal
- Server-side rendering with Next.js
- Code splitting and lazy loading
- Image optimization
- Efficient Firestore queries with indexes

### Firestore
- Composite indexes for complex queries
- Pagination for large datasets
- Caching strategies

## Scalability

### Current Capacity
- Handles 1,000-10,000 livestock records efficiently
- Suitable for medium-sized farms

### Future Scaling
- Add pagination for larger datasets
- Implement virtual scrolling
- Use Firestore data bundles
- Consider Cloud Functions for heavy computation

## Deployment

### Development
```bash
npm run dev
```

### Production
```bash
npm run build
npm start
```

### Recommended Hosting
- **Vercel**: Automatic deployments, serverless functions
- **Netlify**: Easy setup, form handling
- **Firebase Hosting**: Integrated with backend
- **Custom**: VPS with Node.js

## Monitoring and Maintenance

### Recommended Tools
- **Firebase Console**: Monitor database usage
- **Vercel Analytics**: Track web performance
- **Error Tracking**: Sentry or LogRocket
- **Uptime Monitoring**: UptimeRobot or Pingdom

## Future Enhancements

### Phase 2
- User authentication and roles
- Advanced analytics dashboard
- Export to PDF/Excel
- Email notifications

### Phase 3
- Mobile app integration (PWA)
- Real-time chat support
- Payment gateway integration
- Multi-farm management

## Integration Points

### With Flutter Mobile App
- **Shared Collections**: Same Firestore structure
- **Data Format**: Consistent date/time handling
- **Status Codes**: Aligned enum values
- **ID Generation**: Consistent ID patterns

### With External Systems
- **Accounting Software**: Export sales data
- **Veterinary Services**: Share health records
- **Government Databases**: Compliance reporting

## Testing Strategy

### Unit Tests
- Component rendering
- Service layer functions
- Utility functions

### Integration Tests
- Firebase connection
- Data fetching
- User flows

### E2E Tests
- Critical user paths
- Admin workflows
- Buyer browsing

## Documentation

- README.md: Setup and overview
- SETUP.md: Quick start guide
- ARCHITECTURE.md: This document
- Code comments: Inline documentation
