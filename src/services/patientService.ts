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
import { alertService } from './alertService';

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
      const docRef = await addDoc(collection(db, COLLECTION_NAME), data);
      
      // Automatic real-time epidemiological alert check evaluation
      const generatedPatient: Patient = {
        id: docRef.id,
        ...data
      };
      
      // Run async assessment in background safely
      setTimeout(() => {
        alertService.evaluationTrigger(generatedPatient).catch(err => {
          console.error("[PatientService] Erro ao disparar avaliação de alerta:", err);
        });
      }, 500);

      return docRef;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `${COLLECTION_NAME}/(new-doc)`);
    }
  },

  async update(id: string, patient: Partial<Patient>) {
    const path = `${COLLECTION_NAME}/${id}`;
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      const dataToSave = {
        ...patient,
        updatedAt: new Date().toISOString()
      };
      await updateDoc(docRef, dataToSave);

      // Verify if changes trigger alerts
      setTimeout(() => {
        const fullPatientRecord: Patient = {
          id,
          name: patient.name || "",
          gender: patient.gender || "Masculino",
          birthDate: patient.birthDate || "",
          age: patient.age || 0,
          ageGroup: patient.ageGroup || "",
          occurrenceDate: patient.occurrenceDate || "",
          entryTime: patient.entryTime || "",
          status: patient.status || "Em Espera",
          province: patient.province || "Huíla",
          city: patient.city || "Lubango",
          occurrenceType: patient.occurrenceType || "",
          signalsSymptoms: patient.signalsSymptoms || "",
          priority: patient.priority || "Média",
          state: patient.state || "Internado",
          receptionistId: patient.receptionistId || "",
          receptionistSignature: patient.receptionistSignature || "",
          createdAt: patient.createdAt || new Date().toISOString(),
          updatedAt: dataToSave.updatedAt,
          ...patient
        };
        alertService.evaluationTrigger(fullPatientRecord).catch(err => {
          console.error("[PatientService] Erro ao avaliar atualizações para alertas:", err);
        });
      }, 500);

      return docRef;
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
    const q = query(collection(db, COLLECTION_NAME));
    return onSnapshot(q, (snapshot) => {
      const patients = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Patient[];
      
      // Sort in memory by updatedAt (descending) with robust fallback
      patients.sort((a, b) => {
        const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime();
        const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime();
        return timeB - timeA;
      });
      
      callback(patients);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, COLLECTION_NAME);
    });
  }
};

