import { collection, doc, getDoc, getDocs, setDoc, updateDoc, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { SystemSettings, Doctor, UserProfile } from '../types';
import { dataService } from './dataService';
import { handleFirestoreError, OperationType } from '../lib/databaseErrors';

const SETTINGS_COLLECTION = 'settings';
const DOCTORS_COLLECTION = 'doctors';
const AUTHORIZED_COLLECTION = 'authorized_users';

export const adminService = {
  // Authorization
  async authorizeUser(email: string, adminUid: string, role: 'admin' | 'staff' = 'staff') {
    const staffId = await dataService.getNextStaffId();
    const cleanEmail = email.toLowerCase();
    const path = `${AUTHORIZED_COLLECTION}/${cleanEmail}`;
    try {
      const docRef = doc(db, AUTHORIZED_COLLECTION, cleanEmail);
      return await setDoc(docRef, {
        email: cleanEmail,
        role,
        staffId,
        addedBy: adminUid,
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async deauthorizeUser(email: string) {
    const cleanEmail = email.toLowerCase();
    const path = `${AUTHORIZED_COLLECTION}/${cleanEmail}`;
    try {
      const { deleteDoc, doc } = await import('firebase/firestore');
      const docRef = doc(db, AUTHORIZED_COLLECTION, cleanEmail);
      return await deleteDoc(docRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  async getAuthorizedUsers(): Promise<any[]> {
    try {
      const q = query(collection(db, AUTHORIZED_COLLECTION));
      const snap = await getDocs(q);
      return snap.docs.map(d => d.data());
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, AUTHORIZED_COLLECTION);
      return [];
    }
  },

  async isUserAuthorized(email: string): Promise<boolean> {
    const cleanEmail = email.toLowerCase();
    const path = `${AUTHORIZED_COLLECTION}/${cleanEmail}`;
    try {
      const docRef = doc(db, AUTHORIZED_COLLECTION, cleanEmail);
      const snap = await getDoc(docRef);
      return snap.exists();
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
      return false;
    }
  },

  async getAuthorizedUser(email: string): Promise<any | null> {
    const cleanEmail = email.toLowerCase();
    const path = `${AUTHORIZED_COLLECTION}/${cleanEmail}`;
    try {
      const docRef = doc(db, AUTHORIZED_COLLECTION, cleanEmail);
      const snap = await getDoc(docRef);
      return snap.exists() ? snap.data() : null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
      return null;
    }
  },

  // Settings
  async getSettings(): Promise<SystemSettings | null> {
    const path = `${SETTINGS_COLLECTION}/config`;
    try {
      const docRef = doc(db, SETTINGS_COLLECTION, 'config');
      const snap = await getDoc(docRef);
      if (snap.exists()) return snap.data() as SystemSettings;
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
      return null;
    }
  },

  async updateSettings(settings: Partial<SystemSettings>) {
    const path = `${SETTINGS_COLLECTION}/config`;
    try {
      const docRef = doc(db, SETTINGS_COLLECTION, 'config');
      return await setDoc(docRef, settings, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  // Doctors
  async getDoctors(): Promise<Doctor[]> {
    try {
      const q = query(collection(db, DOCTORS_COLLECTION));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as Doctor));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, DOCTORS_COLLECTION);
      return [];
    }
  },

  async addDoctor(doctor: Omit<Doctor, 'id' | 'createdAt'>) {
    try {
      const docRef = doc(collection(db, DOCTORS_COLLECTION));
      return await setDoc(docRef, {
        ...doctor,
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `${DOCTORS_COLLECTION}/(new-doc)`);
    }
  },

  async updateDoctor(id: string, data: Partial<Doctor>) {
    const path = `${DOCTORS_COLLECTION}/${id}`;
    try {
      const docRef = doc(db, DOCTORS_COLLECTION, id);
      return await updateDoc(docRef, data);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  }
};

