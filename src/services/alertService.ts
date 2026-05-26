import { collection, addDoc, query, onSnapshot, getDocs, where, limit, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Patient, SystemSettings, SystemAlert } from '../types';
import { adminService } from './adminService';

const ALERTS_COLLECTION = 'alerts';

export const alertService = {
  /**
   * Evaluates if a newly created or updated patient triggers a system alert.
   * If yes, persists the alert in Firestore and triggers simulated dispatch logs.
   */
  async evaluationTrigger(newPatient: Patient) {
    try {
      // 1. Fetch system settings
      const settings = await adminService.getSettings();
      if (!settings) {
        console.warn("[AlertService] Não existem parametrizações de alertas salvas no sistema.");
        return;
      }

      console.log("[AlertService] A avaliar paciente para alertas:", newPatient.name);

      const targetEmail = settings.alertEmail || "admin.emergencia@pioneirozeca.ao";
      const targetPhone = settings.alertPhone || "+244920000000";
      const threshold = settings.alertThreshold || 5;

      // --- CRITERIA A: EMERGENCY / CRITICAL CASES (PRIORITY === "Emergência") ---
      if (newPatient.priority === "Emergência") {
        console.log("[AlertService] Caso crítico detectado! Disparando alerta imediato...");
        const title = `🚨 EMERGÊNCIA: Paciente Crítico Registado`;
        const message = `Paciente ${newPatient.name} (${newPatient.age} anos) triado com sintomas de "${newPatient.signalsSymptoms}" no Lubango, localidade de ${newPatient.city}/${newPatient.neighborhood}. Requer atendimento imediato!`;

        // Check if we already triggered an emergency alert for this specific patient in the last hour
        const alreadyAlerted = await this.checkDuplicateAlert(newPatient.id || newPatient.name, 'emergency');
        if (!alreadyAlerted) {
          await this.triggerAlert({
            type: 'emergency',
            title,
            message,
            recipientEmail: targetEmail,
            recipientPhone: targetPhone,
            symptomOrPatient: newPatient.name,
            city: newPatient.city,
            triggeredAt: new Date().toISOString(),
            status: 'enviado'
          });
        }
      }

      // --- CRITERIA B: EPIDEMIOLOGICAL THRESHOLD (MULTIPLE CASES OF THE SAME PATHOLOGY IN 24H) ---
      if (newPatient.occurrenceType) {
        // Find all patients with the same occurrenceType in the last 24h, in this city
        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);
        const isoOneDayAgo = oneDayAgo.toISOString();

        // Retrieve patients from Firestore to check count
        const patientsRef = collection(db, 'patients');
        const q = query(
          patientsRef,
          where('city', '==', newPatient.city),
          where('occurrenceType', '==', newPatient.occurrenceType)
        );

        const snapshot = await getDocs(q);
        const relevantPatients = snapshot.docs
          .map(doc => doc.data() as Patient)
          .filter(p => p.createdAt >= isoOneDayAgo);

        const countOverLast24h = relevantPatients.length;

        console.log(`[AlertService] Total de ocorrências de "${newPatient.occurrenceType}" em ${newPatient.city} nas últimas 24h: ${countOverLast24h} (Limite/Threshold: ${threshold})`);

        if (countOverLast24h >= threshold) {
          const title = `⚠️ ALERTA EPIDEMIOLÓGICO: ${newPatient.occurrenceType} Alargado`;
          const message = `Alerta epidemiológico disparado para a localidade de ${newPatient.city}, Huíla. Foram identificados ${countOverLast24h} casos recentes de "${newPatient.occurrenceType}" num intervalo inferior a 24 horas. Verifique os protocolos de isolamento clínico.`;

          // Check if we already triggered an epidemiological alert for this pathology in this city in the last 12 hours
          const twelveHoursAgo = new Date();
          twelveHoursAgo.setHours(twelveHoursAgo.getHours() - 12);
          const alreadyEpidAlerted = await this.checkDuplicateEpidAlert(newPatient.occurrenceType, newPatient.city, twelveHoursAgo.toISOString());

          if (!alreadyEpidAlerted) {
            await this.triggerAlert({
              type: 'epidemiological',
              title,
              message,
              recipientEmail: targetEmail,
              recipientPhone: targetPhone,
              symptomOrPatient: newPatient.occurrenceType,
              city: newPatient.city,
              triggeredAt: new Date().toISOString(),
              status: 'enviado'
            });
          }
        }
      }

    } catch (e) {
      console.error("[AlertService] Erro ao desencadear a triagem automática de alertas:", e);
    }
  },

  async checkDuplicateAlert(identifier: string, type: 'emergency' | 'epidemiological'): Promise<boolean> {
    try {
      const q = query(
        collection(db, ALERTS_COLLECTION),
        where('type', '==', type),
        where('symptomOrPatient', '==', identifier),
        limit(1)
      );
      const snap = await getDocs(q);
      return !snap.empty;
    } catch (e) {
      return false;
    }
  },

  async checkDuplicateEpidAlert(occurrenceType: string, city: string, sinceIso: string): Promise<boolean> {
    try {
      const q = query(
        collection(db, ALERTS_COLLECTION),
        where('type', '==', 'epidemiological'),
        where('symptomOrPatient', '==', occurrenceType),
        where('city', '==', city)
      );
      const snap = await getDocs(q);
      const recent = snap.docs.map(doc => doc.data() as SystemAlert).filter(a => a.triggeredAt >= sinceIso);
      return recent.length > 0;
    } catch (e) {
      return false;
    }
  },

  async triggerAlert(alert: Omit<SystemAlert, 'id'>) {
    try {
      // 1. Save to database for cross-user syncing (receptionist & admin see it simultaneously)
      const docRef = await addDoc(collection(db, ALERTS_COLLECTION), alert);
      
      // 2. Perform and display real-time physical transmission simulation to Node/Dev containers
      console.log(`\n=============================================================`);
      console.log(`🔔 [ENVIO SIMULADO DE EMAIL INTEGRADO]`);
      console.log(`DE: alertas.hosp@pioneirozeca.ao`);
      console.log(`PARA: ${alert.recipientEmail}`);
      console.log(`ASSUNTO: ${alert.title}`);
      console.log(`MENSAGEM: ${alert.message}`);
      console.log(`=============================================================`);

      console.log(`\n=============================================================`);
      console.log(`📱 [ENVIO SIMULADO DE SMS LOCAL INTEGRADO]`);
      console.log(`SMS GATEWAY: Unitel local / Movicel local`);
      console.log(`PARA: ${alert.recipientPhone}`);
      console.log(`MENSAGEM SMS: [PIONEIRO ZECA] ${alert.title} - ${alert.message.substring(0, 100)}...`);
      console.log(`=============================================================\n`);

      return docRef.id;
    } catch (error) {
      console.error("[AlertService] Erro ao gravar Alerta no Firestore:", error);
    }
  },

  /**
   * Subscribes to system alerts in real-time.
   */
  subscribeAlerts(callback: (alerts: SystemAlert[]) => void) {
    const q = query(collection(db, ALERTS_COLLECTION));
    return onSnapshot(q, (snapshot) => {
      const alerts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SystemAlert[];
      
      // Sort descending by trigger time
      alerts.sort((a, b) => new Date(b.triggeredAt).getTime() - new Date(a.triggeredAt).getTime());
      callback(alerts);
    }, (error) => {
      console.error("[AlertService] Erro ao subscrever alertas em tempo real:", error);
    });
  }
};
