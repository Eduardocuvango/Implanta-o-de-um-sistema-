import { 
  db 
} from '../lib/firebase';
import { 
  collection, 
  doc, 
  runTransaction, 
  getDocs, 
  setDoc,
  writeBatch
} from 'firebase/firestore';

const COUNTERS_COLLECTION = 'counters';
const PATIENTS_COUNTER_DOC = 'patients';
const STAFF_COUNTER_DOC = 'staff';

export const dataService = {
  /**
   * Generates a sequential ID for patients (e.g., P-2026-0001)
   */
  async getNextPatientId(): Promise<string> {
    const counterRef = doc(db, COUNTERS_COLLECTION, PATIENTS_COUNTER_DOC);
    const year = new Date().getFullYear();

    return await runTransaction(db, async (transaction) => {
      const counterDoc = await transaction.get(counterRef);
      let count = 1;

      if (counterDoc.exists()) {
        const data = counterDoc.data();
        if (data.year === year) {
          count = data.count + 1;
        }
      }

      transaction.set(counterRef, { count, year });
      
      const paddedCount = count.toString().padStart(4, '0');
      return `P-${year}-${paddedCount}`;
    });
  },

  /**
   * Generates a sequential ID for staff (e.g., STF-001)
   */
  async getNextStaffId(): Promise<string> {
    const counterRef = doc(db, COUNTERS_COLLECTION, STAFF_COUNTER_DOC);

    return await runTransaction(db, async (transaction) => {
      const counterDoc = await transaction.get(counterRef);
      let count = 1;

      if (counterDoc.exists()) {
        count = counterDoc.data().count + 1;
      }

      transaction.set(counterRef, { count });
      
      const paddedCount = count.toString().padStart(3, '0');
      return `STF-${paddedCount}`;
    });
  },

  /**
   * Creates a full backup of the database
   */
  async createBackup() {
    const collections = ['patients', 'doctors', 'users', 'settings', 'authorized_users'];
    const backup: Record<string, any[]> = {};

    for (const colName of collections) {
      const snapshot = await getDocs(collection(db, colName));
      backup[colName] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    }

    return backup;
  },

  /**
   * Restores a backup
   */
  async restoreBackup(backup: Record<string, any[]>) {
    for (const colName in backup) {
      const items = backup[colName];
      const batch = writeBatch(db);
      
      for (const item of items) {
        const { id, ...data } = item;
        const docRef = doc(db, colName, id);
        batch.set(docRef, data);
      }
      
      await batch.commit();
    }
  },

  /**
   * Performs an automated snapshot backup to Firestore
   */
  async runAutoBackupCheck(settings: any) {
    if (!settings || settings.backupFrequency === 'manual') return;

    const lastDate = settings.lastBackupDate ? new Date(settings.lastBackupDate) : new Date(0);
    const now = new Date();
    const diffDays = (now.getTime() - lastDate.getTime()) / (1000 * 3600 * 24);

    let isDue = false;
    if (settings.backupFrequency === 'weekly' && diffDays >= 7) isDue = true;
    if (settings.backupFrequency === 'monthly' && diffDays >= 30) isDue = true;

    if (isDue) {
      console.log('🔄 Iniciando Cópia de Segurança Automática...');
      const backupData = await this.createBackup();
      const backupId = `auto_${now.toISOString().split('T')[0]}`;
      
      await setDoc(doc(db, 'backups', backupId), {
        data: backupData,
        type: 'automatic',
        frequency: settings.backupFrequency,
        createdAt: now.toISOString()
      });

      await setDoc(doc(db, 'settings', 'config'), {
        lastBackupDate: now.toISOString()
      }, { merge: true });
      
      console.log('✅ Backup Automático Concluído e Armazenado no Firestore.');
    }
  },

  /**
   * Gets list of available snapshots
   */
  async getBackups() {
    const snap = await getDocs(collection(db, 'backups'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }
};
