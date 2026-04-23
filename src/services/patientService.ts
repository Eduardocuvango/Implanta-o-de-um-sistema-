import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  query, 
  onSnapshot, 
  serverTimestamp, 
  orderBy,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Patient } from '../types';
import { dataService } from './dataService';

const COLLECTION_NAME = 'patients';

export const patientService = {
  async create(patient: Omit<Patient, 'id' | 'createdAt' | 'updatedAt' | 'patientSerialId'>) {
    const patientSerialId = await dataService.getNextPatientId();
    const data = {
      ...patient,
      patientSerialId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    return await addDoc(collection(db, COLLECTION_NAME), data);
  },

  async update(id: string, patient: Partial<Patient>) {
    const docRef = doc(db, COLLECTION_NAME, id);
    return await updateDoc(docRef, {
      ...patient,
      updatedAt: new Date().toISOString()
    });
  },

  async delete(id: string) {
    return await deleteDoc(doc(db, COLLECTION_NAME, id));
  },

  subscribe(callback: (patients: Patient[]) => void) {
    const q = query(collection(db, COLLECTION_NAME), orderBy('updatedAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const patients = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Patient[];
      callback(patients);
    });
  }
};
