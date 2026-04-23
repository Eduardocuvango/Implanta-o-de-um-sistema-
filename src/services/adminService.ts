import { collection, doc, getDoc, getDocs, setDoc, updateDoc, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { SystemSettings, Doctor, UserProfile } from '../types';
import { dataService } from './dataService';

const SETTINGS_COLLECTION = 'settings';
const DOCTORS_COLLECTION = 'doctors';
const AUTHORIZED_COLLECTION = 'authorized_users';

export const adminService = {
  // Authorization
  async authorizeUser(email: string, adminUid: string) {
    const staffId = await dataService.getNextStaffId();
    const docRef = doc(db, AUTHORIZED_COLLECTION, email.toLowerCase());
    return await setDoc(docRef, {
      email: email.toLowerCase(),
      role: 'staff',
      staffId,
      addedBy: adminUid,
      createdAt: new Date().toISOString()
    });
  },

  async getAuthorizedUsers(): Promise<any[]> {
    const q = query(collection(db, AUTHORIZED_COLLECTION));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data());
  },

  async isUserAuthorized(email: string): Promise<boolean> {
    const docRef = doc(db, AUTHORIZED_COLLECTION, email.toLowerCase());
    const snap = await getDoc(docRef);
    return snap.exists();
  },

  async getAuthorizedUser(email: string): Promise<any | null> {
    const docRef = doc(db, AUTHORIZED_COLLECTION, email.toLowerCase());
    const snap = await getDoc(docRef);
    return snap.exists() ? snap.data() : null;
  },

  // Settings
  async getSettings(): Promise<SystemSettings | null> {
    const docRef = doc(db, SETTINGS_COLLECTION, 'config');
    const snap = await getDoc(docRef);
    if (snap.exists()) return snap.data() as SystemSettings;
    return null;
  },

  async updateSettings(settings: Partial<SystemSettings>) {
    const docRef = doc(db, SETTINGS_COLLECTION, 'config');
    return await setDoc(docRef, settings, { merge: true });
  },

  // Doctors
  async getDoctors(): Promise<Doctor[]> {
    const q = query(collection(db, DOCTORS_COLLECTION));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Doctor));
  },

  async addDoctor(doctor: Omit<Doctor, 'id' | 'createdAt'>) {
    const docRef = doc(collection(db, DOCTORS_COLLECTION));
    return await setDoc(docRef, {
      ...doctor,
      createdAt: new Date().toISOString()
    });
  },

  async updateDoctor(id: string, data: Partial<Doctor>) {
    const docRef = doc(db, DOCTORS_COLLECTION, id);
    return await updateDoc(docRef, data);
  }
};
