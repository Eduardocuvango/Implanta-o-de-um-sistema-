export type Gender = 'Masculino' | 'Feminino' | 'Outro';
export type Status = 'Atendido' | 'Em Espera';
export type Priority = 'Baixa' | 'Média' | 'Alta' | 'Emergência';
export type State = 'Internado' | 'Atendido' | 'Transferido' | 'Alta' | 'Óbito';
export type Role = 'admin' | 'staff';

export interface UserProfile {
  uid: string;
  staffId?: string;
  name: string;
  email: string;
  role: Role;
  signature?: string;
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  crm?: string; // Or local registry ID
  active: boolean;
  createdAt: string;
}

export interface SystemSettings {
  alertEmail: string;
  alertPhone: string;
  alertThreshold: number; 
  backupFrequency: 'weekly' | 'monthly' | 'manual';
  lastBackupDate?: string;
  monitoredAreas: {
    province: string;
    city: string;
    neighborhood: string;
  }[];
}

export interface Patient {
  id?: string;
  patientSerialId?: string;
  name: string;
  gender: Gender;
  birthDate: string; // ISO string
  age: number;
  ageGroup: string;
  occurrenceDate: string;
  entryTime: string;
  exitTime?: string;
  serviceDuration?: number;
  status: Status;
  weight?: number;
  temperature?: number;
  bloodPressure?: string;
  province: string;
  city: string;
  occurrenceType: string;
  signalsSymptoms: string;
  diagnosis?: string;
  priority: Priority;
  state: State;
  receptionistId: string;
  receptionistSignature: string;
  deathReason?: string;
  createdAt: string;
  updatedAt: string;
}
