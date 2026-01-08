# Notification System - Mobile App Integration Guide

## Overview
Admin can setup automatic notifications for farmers based on feeding schedules. When feeding time approaches, farmers will receive push notifications on their mobile app.

## Database Structure

### 1. Feeding Schedules Collection: `feedingSchedules`
```typescript
{
  id: string;
  name: string;                    // "Morning Feed", "Evening Feed"
  time: string;                    // "07:00", "17:00" (24-hour format)
  feedType: string;                // "Hay", "Grain", "Mixed"
  quantity: number;                // Amount of feed
  unit: "kg" | "lbs";             // Unit of measurement
  livestockTypes: string[];        // ["cows", "goat", "sheep"]
  isActive: boolean;               // Schedule is active/inactive
  notificationEnabled: boolean;    // Send notifications or not
  notifyBefore: number;           // Minutes before feeding time (15, 30, 60, 120)
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### 2. Notifications Collection: `notifications`
```typescript
{
  id: string;
  type: "feeding" | "health" | "breeding" | "general";
  title: string;                   // "Feeding Time: Morning Feed"
  body: string;                    // "Time to feed cows. 10kg of Hay"
  data: {
    scheduleId: string;
    scheduleName: string;
    feedType: string;
    quantity: number;
    unit: string;
    time: string;
  };
  recipientId?: string;            // Specific farmer ID or null for all farmers
  scheduleId?: string;
  sentAt: Timestamp;
  status: "pending" | "sent" | "failed";
  readAt?: Timestamp;
}
```

### 3. Feeding Activities Collection: `feedingActivities`
```typescript
{
  id: string;
  scheduleId?: string;             // Reference to feeding schedule
  scheduleName?: string;
  livestockId: string;
  livestockTagId: string;
  farmerId: string;                // From Firebase Auth
  farmerName: string;
  feedType: string;
  quantity: number;
  unit: "kg" | "lbs";
  fedAt: Timestamp;                // When farmer actually fed the animal
  notes?: string;
  location?: string;
  photoUrl?: string;               // Photo proof of feeding
  createdAt: Timestamp;
}
```

## Mobile App Implementation

### 1. Firebase Cloud Messaging (FCM) Setup

#### Step 1: Store FCM Token
When farmer logs in, save their FCM token to Firestore:
```dart
// In Flutter mobile app
import 'package:firebase_messaging/firebase_messaging.dart';

Future<void> saveFCMToken(String userId) async {
  final fcmToken = await FirebaseMessaging.instance.getToken();
  
  await FirebaseFirestore.instance
    .collection('users')
    .doc(userId)
    .update({
      'fcmToken': fcmToken,
      'lastTokenUpdate': FieldValue.serverTimestamp(),
    });
}
```

#### Step 2: Listen for Notifications
```dart
FirebaseMessaging.onMessage.listen((RemoteMessage message) {
  // Handle foreground notifications
  if (message.notification != null) {
    showLocalNotification(
      title: message.notification!.title!,
      body: message.notification!.body!,
      data: message.data,
    );
  }
});

FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
  // Handle notification tap when app is in background
  navigateToFeedingScreen(message.data);
});
```

### 2. Cloud Function for Scheduled Notifications

Create a Cloud Function to send notifications based on schedules:

```javascript
// functions/index.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

// Run every minute to check for scheduled notifications
exports.sendFeedingNotifications = functions.pubsub
  .schedule('* * * * *')  // Every minute
  .onRun(async (context) => {
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    // Get active schedules
    const schedulesSnapshot = await admin.firestore()
      .collection('feedingSchedules')
      .where('isActive', '==', true)
      .where('notificationEnabled', '==', true)
      .get();
    
    for (const doc of schedulesSnapshot.docs) {
      const schedule = doc.data();
      
      // Calculate notification time
      const [scheduleHour, scheduleMinute] = schedule.time.split(':').map(Number);
      const scheduleDate = new Date();
      scheduleDate.setHours(scheduleHour, scheduleMinute, 0, 0);
      
      const notificationDate = new Date(scheduleDate.getTime() - schedule.notifyBefore * 60000);
      const notificationTime = `${String(notificationDate.getHours()).padStart(2, '0')}:${String(notificationDate.getMinutes()).padStart(2, '0')}`;
      
      if (notificationTime === currentTime) {
        // Send notification to all farmers
        await sendNotificationToFarmers(schedule);
      }
    }
    
    return null;
  });

async function sendNotificationToFarmers(schedule) {
  // Get all farmers' FCM tokens
  const usersSnapshot = await admin.firestore()
    .collection('users')
    .where('role', '==', 'farmer')
    .get();
  
  const tokens = [];
  usersSnapshot.forEach(doc => {
    if (doc.data().fcmToken) {
      tokens.push(doc.data().fcmToken);
    }
  });
  
  if (tokens.length === 0) return;
  
  const message = {
    notification: {
      title: `Feeding Time: ${schedule.name}`,
      body: `Time to feed ${schedule.livestockTypes.join(', ')}. ${schedule.quantity}${schedule.unit} of ${schedule.feedType}`,
    },
    data: {
      type: 'feeding',
      scheduleId: schedule.id,
      scheduleName: schedule.name,
      feedType: schedule.feedType,
      quantity: String(schedule.quantity),
      unit: schedule.unit,
      time: schedule.time,
    },
    tokens: tokens,
  };
  
  try {
    const response = await admin.messaging().sendMulticast(message);
    console.log(`Successfully sent ${response.successCount} notifications`);
    
    // Log notification in Firestore
    await admin.firestore().collection('notifications').add({
      type: 'feeding',
      title: message.notification.title,
      body: message.notification.body,
      data: message.data,
      scheduleId: schedule.id,
      sentAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'sent',
      successCount: response.successCount,
      failureCount: response.failureCount,
    });
  } catch (error) {
    console.error('Error sending notification:', error);
  }
}
```

### 3. Deploy Cloud Function

```bash
cd functions
npm install firebase-functions firebase-admin
firebase deploy --only functions:sendFeedingNotifications
```

### 4. Mobile App Feeding Screen

```dart
// In Flutter mobile app
class FeedingScreen extends StatefulWidget {
  @override
  _FeedingScreenState createState() => _FeedingScreenState();
}

class _FeedingScreenState extends State<FeedingScreen> {
  Future<void> recordFeeding({
    required String livestockId,
    required String livestockTagId,
    String? scheduleId,
    String? scheduleName,
    required String feedType,
    required double quantity,
    required String unit,
    String? notes,
    File? photo,
  }) async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) return;
    
    String? photoUrl;
    if (photo != null) {
      // Upload photo to Firebase Storage
      final storageRef = FirebaseStorage.instance
        .ref()
        .child('feeding_photos/${DateTime.now().millisecondsSinceEpoch}.jpg');
      await storageRef.putFile(photo);
      photoUrl = await storageRef.getDownloadURL();
    }
    
    await FirebaseFirestore.instance.collection('feedingActivities').add({
      'scheduleId': scheduleId,
      'scheduleName': scheduleName,
      'livestockId': livestockId,
      'livestockTagId': livestockTagId,
      'farmerId': user.uid,
      'farmerName': user.displayName ?? 'Unknown',
      'feedType': feedType,
      'quantity': quantity,
      'unit': unit,
      'fedAt': FieldValue.serverTimestamp(),
      'notes': notes,
      'photoUrl': photoUrl,
      'createdAt': FieldValue.serverTimestamp(),
    });
    
    // Show success message
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Feeding recorded successfully')),
    );
  }
}
```

## Admin Web Setup

### Admin Features Implemented:
1. ✅ Create feeding schedules with notification settings
2. ✅ Set notification timing (15min, 30min, 1hr, 2hr before feeding)
3. ✅ Enable/disable notifications per schedule
4. ✅ View feeding activities from farmers in real-time
5. ✅ Dashboard widget showing recent feedings

### Admin Usage:
1. Go to **Admin Dashboard > Feeding**
2. Click **Add Schedule**
3. Fill in schedule details:
   - Name (e.g., "Morning Feed")
   - Time (e.g., 07:00)
   - Feed Type (e.g., "Hay")
   - Quantity & Unit
   - Livestock Types
4. Enable **Auto Notification**
5. Set **Notify Before** time
6. Click **Create Schedule**

## Notification Flow

```
1. Admin creates feeding schedule
   └─> notificationEnabled: true
   └─> notifyBefore: 30 (minutes)
   └─> time: "07:00"

2. Cloud Function runs every minute
   └─> Checks if current time matches notification time
   └─> (07:00 - 30min = 06:30)

3. At 06:30, sends push notification to all farmers
   └─> Title: "Feeding Time: Morning Feed"
   └─> Body: "Time to feed cows. 10kg of Hay"
   └─> Data: { scheduleId, feedType, quantity, etc }

4. Farmer receives notification on mobile app
   └─> Taps notification
   └─> Opens feeding screen with pre-filled data

5. Farmer records feeding activity
   └─> Creates feedingActivity document
   └─> Admin sees update in dashboard
```

## Testing

### Test Notification Manually:
1. Set a schedule with notification 5 minutes from now
2. Deploy cloud function
3. Wait for notification on mobile device
4. Check Firebase console for notification logs

### Test Feeding Activity:
1. On mobile app, record a feeding
2. Check admin dashboard > Feeding > Activities tab
3. Should see new activity appear in real-time

## Important Notes

1. **Timezone**: All times are stored in 24-hour format. Adjust for timezone in Cloud Function if needed.
2. **FCM Token**: Must be refreshed when it changes (Firebase handles this automatically)
3. **Permissions**: Request notification permission on first app launch
4. **Background**: iOS requires additional setup for background notifications
5. **Testing**: Use Firebase Console to send test notifications during development

## Security Rules

Update Firestore security rules:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Feeding schedules - Admin only
    match /feedingSchedules/{scheduleId} {
      allow read: if request.auth != null;
      allow write: if request.auth.token.role == 'admin';
    }
    
    // Feeding activities - Farmers can write, admin can read
    match /feedingActivities/{activityId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && 
                      request.auth.token.role == 'farmer' &&
                      request.resource.data.farmerId == request.auth.uid;
    }
    
    // Notifications - Read only for users
    match /notifications/{notificationId} {
      allow read: if request.auth != null;
      allow write: if false; // Only Cloud Function can write
    }
  }
}
```

## Next Steps for Mobile App Development

1. Setup Firebase Cloud Messaging in Flutter
2. Implement notification handlers
3. Create feeding recording screen
4. Add photo capture for feeding proof
5. Sync with admin dashboard
6. Test end-to-end flow

## Support

For issues or questions, refer to:
- Firebase Cloud Messaging: https://firebase.google.com/docs/cloud-messaging
- Cloud Functions: https://firebase.google.com/docs/functions
- Flutter FCM Plugin: https://pub.dev/packages/firebase_messaging
