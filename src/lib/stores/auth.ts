import { writable } from 'svelte/store';
import type { User } from '../types';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';

export const user = writable<User | null>(null);
export const isLoading = writable(true);

onAuthStateChanged(auth, (firebaseUser) => {
  if (firebaseUser) {
    // Convert Firebase user to our User type
    user.set({
      id: firebaseUser.uid,
      email: firebaseUser.email!,
      role: 'user', // Default role, should be updated from Firestore
      createdAt: new Date()
    });
  } else {
    user.set(null);
  }
  isLoading.set(false);
});