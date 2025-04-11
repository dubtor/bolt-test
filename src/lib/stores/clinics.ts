import { writable } from 'svelte/store';
import type { Clinic } from '../types';
import { db } from '../firebase';
import { 
  collection, 
  query, 
  getDocs, 
  where, 
  orderBy, 
  limit,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  Query,
  QuerySnapshot,
  and,
  or,
  getDoc
} from 'firebase/firestore';
import { user } from './auth';
import { generateUniqueSlug } from '../utils/slugs';

export const clinics = writable<Clinic[]>([]);
export const isLoading = writable(true);
export const error = writable<string | null>(null);

// Helper function to handle common clinic fetching logic
async function fetchClinicsFromQuery(q: Query): Promise<Clinic[]> {
  try {
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Clinic[];
  } catch (e: any) {
    console.error('Firestore query error:', e);
    throw new Error('Error loading clinics');
  }
}

// Function to check if a slug exists
async function isSlugTaken(slug: string): Promise<boolean> {
  const q = query(collection(db, 'clinics'), where('slug', '==', slug));
  const querySnapshot = await getDocs(q);
  return !querySnapshot.empty;
}

// Function to generate a unique slug for a clinic
async function createUniqueSlug(name: string): Promise<string> {
  // Get all existing slugs
  const q = query(collection(db, 'clinics'));
  const querySnapshot = await getDocs(q);
  const existingSlugs = querySnapshot.docs.map(doc => (doc.data() as Clinic).slug);
  
  return generateUniqueSlug(name, existingSlugs);
}

// Function to fetch published clinics with filters
export async function fetchPublishedClinics(filters?: {
  countries?: string[];
  region?: string;
  city?: string;
  services?: string[];
  minRating?: number;
  minPrice?: number;
  maxPrice?: number;
}) {
  isLoading.set(true);
  error.set(null);

  try {
    const clinicsCollection = collection(db, 'clinics');
    
    // Start with base conditions
    const conditions = [
      where('status', '==', 'published')
    ];

    // Add country filter if specified
    if (filters?.countries?.length) {
      conditions.push(where('address.country', 'in', filters.countries));
    }

    // Add rating filter if specified
    if (filters?.minRating) {
      conditions.push(where('rating', '>=', filters.minRating));
    }

    // Create the query with all conditions
    const q = query(
      clinicsCollection,
      and(...conditions),
      orderBy('rating', 'desc'),
      limit(50)
    );

    let clinicData = await fetchClinicsFromQuery(q);

    // Apply additional filters in memory
    if (filters) {
      // Filter by services (all services must be present)
      if (filters.services && filters.services.length > 0) {
        clinicData = clinicData.filter(clinic => 
          filters.services!.every(service => clinic.services.includes(service))
        );
      }

      // Filter by city (case-insensitive partial match)
      if (filters.city) {
        const cityLower = filters.city.toLowerCase();
        clinicData = clinicData.filter(clinic => 
          clinic.address.city.toLowerCase().includes(cityLower)
        );
      }

      // Filter by region
      if (filters.region) {
        clinicData = clinicData.filter(clinic => 
          clinic.address.region === filters.region
        );
      }

      // Filter by price range
      if (filters.minPrice !== undefined) {
        clinicData = clinicData.filter(clinic => 
          clinic.priceRange.min >= filters.minPrice!
        );
      }
      if (filters.maxPrice !== undefined) {
        clinicData = clinicData.filter(clinic => 
          clinic.priceRange.max <= filters.maxPrice!
        );
      }
    }

    clinics.set(clinicData);
  } catch (e: any) {
    console.error('Error fetching published clinics:', e);
    error.set('Error loading clinics. Please try again.');
    clinics.set([]);
  } finally {
    isLoading.set(false);
  }
}

// Function to fetch clinic by slug
export async function getClinicBySlug(slug: string): Promise<Clinic | null> {
  try {
    const q = query(
      collection(db, 'clinics'),
      and(
        where('slug', '==', slug),
        where('status', '==', 'published')
      )
    );
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }

    const doc = querySnapshot.docs[0];
    return { id: doc.id, ...doc.data() } as Clinic;
  } catch (e) {
    console.error('Error fetching clinic by slug:', e);
    return null;
  }
}

// Function to fetch user's own clinics
export async function fetchMyClinics() {
  isLoading.set(true);
  error.set(null);

  try {
    let currentUserId: string | undefined;
    user.subscribe(u => currentUserId = u?.id)();

    if (!currentUserId) {
      throw new Error('User must be authenticated to view their clinics');
    }

    const clinicsCollection = collection(db, 'clinics');
    const q = query(
      clinicsCollection,
      where('userId', '==', currentUserId),
      orderBy('updatedAt', 'desc')
    );

    const clinicData = await fetchClinicsFromQuery(q);
    clinics.set(clinicData);
  } catch (e: any) {
    error.set(e.message || 'Error loading your clinics');
    clinics.set([]);
  } finally {
    isLoading.set(false);
  }
}

export async function addClinic(clinicData: Omit<Clinic, 'id' | 'createdAt' | 'updatedAt' | 'slug'>) {
  try {
    const slug = await createUniqueSlug(clinicData.name);
    
    let currentUserId: string | undefined;
    user.subscribe(u => currentUserId = u?.id)();

    if (!currentUserId) {
      throw new Error('User must be authenticated to create a clinic');
    }

    const dataToWrite = {
      ...clinicData,
      slug,
      status: 'draft',
      userId: currentUserId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    console.log('Adding new clinic with data:', dataToWrite);

    const docRef = await addDoc(collection(db, 'clinics'), dataToWrite);
    return docRef.id;
  } catch (e: any) {
    console.error('Error adding clinic:', e);
    throw new Error(e.message);
  }
}

export async function updateClinic(id: string, clinicData: Partial<Clinic>) {
  try {
    const docRef = doc(db, 'clinics', id);
    const currentDoc = await getDoc(docRef);
    
    if (!currentDoc.exists()) {
      throw new Error('Clinic not found');
    }

    const currentData = currentDoc.data() as Clinic;
    let updateData = { ...clinicData };

    // If name is being updated, update the slug as well
    if (clinicData.name && clinicData.name !== currentData.name) {
      const newSlug = await createUniqueSlug(clinicData.name);
      updateData.slug = newSlug;
    }

    const dataToWrite = {
      ...updateData,
      updatedAt: serverTimestamp()
    };

    console.log('Updating clinic with ID:', id);
    console.log('Update data:', dataToWrite);

    await updateDoc(docRef, dataToWrite);
  } catch (e: any) {
    console.error('Error updating clinic:', e);
    throw new Error(e.message);
  }
}

export async function publishClinic(id: string) {
  try {
    const docRef = doc(db, 'clinics', id);
    const dataToWrite = {
      status: 'published',
      updatedAt: serverTimestamp()
    };

    console.log('Publishing clinic with ID:', id);
    console.log('Update data:', dataToWrite);

    await updateDoc(docRef, dataToWrite);
  } catch (e: any) {
    console.error('Error publishing clinic:', e);
    throw new Error(e.message);
  }
}

export async function unpublishClinic(id: string) {
  try {
    const docRef = doc(db, 'clinics', id);
    const dataToWrite = {
      status: 'draft',
      updatedAt: serverTimestamp()
    };

    console.log('Unpublishing clinic with ID:', id);
    console.log('Update data:', dataToWrite);

    await updateDoc(docRef, dataToWrite);
  } catch (e: any) {
    console.error('Error unpublishing clinic:', e);
    throw new Error(e.message);
  }
}