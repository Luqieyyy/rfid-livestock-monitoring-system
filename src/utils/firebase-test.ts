// Test Firebase connection and data retrieval
export async function testFirebaseConnection() {
  try {
    const { collection, getDocs } = await import('firebase/firestore');
    const { db } = await import('../lib/firebase');
    
    console.log('🔗 Testing Firebase connection...');
    
    // Test animals collection (the one you have data in)
    const animalsRef = collection(db, 'animals');
    const snapshot = await getDocs(animalsRef);
    
    console.log('📊 Animals collection:');
    console.log(`- Found ${snapshot.docs.length} documents`);
    
    snapshot.docs.forEach((doc, index) => {
      console.log(`${index + 1}. ID: ${doc.id}`);
      console.log(`   Data:`, doc.data());
    });
    
    return {
      success: true,
      count: snapshot.docs.length,
      data: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    };
    
  } catch (error) {
    console.error('❌ Firebase connection test failed:', error);
    return { success: false, error: error.message };
  }
}

// Call this in browser console to test
if (typeof window !== 'undefined') {
  window.testFirebaseConnection = testFirebaseConnection;
}