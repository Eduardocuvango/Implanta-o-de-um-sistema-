import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserProfile } from '../types';
import { handleFirestoreError, OperationType } from '../lib/databaseErrors';

const COLLECTION_NAME = 'users';

export const userService = {
  async getProfile(uid: string): Promise<UserProfile | null> {
    const path = `${COLLECTION_NAME}/${uid}`;
    try {
      const docRef = doc(db, COLLECTION_NAME, uid);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return snap.data() as UserProfile;
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
      return null;
    }
  },

  async createProfile(profile: UserProfile) {
    const path = `${COLLECTION_NAME}/${profile.uid}`;
    try {
      const docRef = doc(db, COLLECTION_NAME, profile.uid);
      return await setDoc(docRef, profile);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  },

  async updateProfile(uid: string, data: Partial<UserProfile>) {
    const path = `${COLLECTION_NAME}/${uid}`;
    try {
      const docRef = doc(db, COLLECTION_NAME, uid);
      return await updateDoc(docRef, data);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  async getAllProfiles(): Promise<UserProfile[]> {
    try {
      const { collection, getDocs, query } = await import('firebase/firestore');
      const q = query(collection(db, COLLECTION_NAME));
      const snap = await getDocs(q);
      return snap.docs.map(doc => doc.data() as UserProfile);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, COLLECTION_NAME);
      return [];
    }
  },

  async hasAnyAdmin(): Promise<boolean> {
    try {
      const { collection, getDocs, query, where, limit } = await import('firebase/firestore');
      const q = query(collection(db, COLLECTION_NAME), where('role', '==', 'admin'), limit(1));
      const snap = await getDocs(q);
      return !snap.empty;
    } catch (error) {
      console.error(error);
      return false;
    }
  },

  async deleteProfile(uid: string) {
    const path = `${COLLECTION_NAME}/${uid}`;
    try {
      const { doc, deleteDoc } = await import('firebase/firestore');
      const docRef = doc(db, COLLECTION_NAME, uid);
      return await deleteDoc(docRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }
};

