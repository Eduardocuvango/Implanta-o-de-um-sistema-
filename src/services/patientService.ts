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
import { handleFirestoreError, OperationType } from '../lib/databaseErrors';

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
    try {
      return await addDoc(collection(db, COLLECTION_NAME), data);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `${COLLECTION_NAME}/(new-doc)`);
    }
  },

  async update(id: string, patient: Partial<Patient>) {
    const path = `${COLLECTION_NAME}/${id}`;
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      return await updateDoc(docRef, {
        ...patient,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  async delete(id: string) {
    const path = `${COLLECTION_NAME}/${id}`;
    try {
      return await deleteDoc(doc(db, COLLECTION_NAME, id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  subscribe(callback: (patients: Patient[]) => void) {
    const q = query(collection(db, COLLECTION_NAME), orderBy('updatedAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const patients = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Patient[];
      callback(patients);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, COLLECTION_NAME);
    });
  }
};

