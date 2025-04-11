import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin with environment variables
const app = initializeApp({
  credential: cert({
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
  })
});

const db = getFirestore();

async function createIndexes() {
  try {
    // Create composite indexes
    const indexes = [
      {
        collectionId: 'clinics',
        fields: [
          { fieldPath: 'address.country', mode: 'ASCENDING' },
          { fieldPath: 'rating', mode: 'DESCENDING' }
        ]
      },
      {
        collectionId: 'clinics',
        fields: [
          { fieldPath: 'address.city', mode: 'ASCENDING' },
          { fieldPath: 'rating', mode: 'DESCENDING' }
        ]
      },
      {
        collectionId: 'clinics',
        fields: [
          { fieldPath: 'services', mode: 'ARRAY_CONTAINS' },
          { fieldPath: 'rating', mode: 'DESCENDING' }
        ]
      }
    ];

    for (const index of indexes) {
      await db.collection(index.collectionId).createIndex(index.fields);
      console.log(`Created index for ${index.collectionId} with fields:`, index.fields);
    }

    console.log('All indexes created successfully');
  } catch (error) {
    console.error('Error creating indexes:', error);
    process.exit(1);
  }
}

createIndexes();