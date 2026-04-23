import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserProfile } from '../types';

const COLLECTION_NAME = 'users';

export const userService = {
  async getProfile(uid: string): Promise<UserProfile | null> {
    const docRef = doc(db, COLLECTION_NAME, uid);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
    return null;
  },

  async createProfile(profile: UserProfile) {
    const docRef = doc(db, COLLECTION_NAME, profile.uid);
    return await setDoc(docRef, profile);
  },

  async updateProfile(uid: string, data: Partial<UserProfile>) {
    const docRef = doc(db, COLLECTION_NAME, uid);
    return await updateDoc(docRef, data);
  }
};
