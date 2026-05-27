import { Patient, UserProfile, SystemSettings } from "../../types";

const PATIENTS_KEY = "pioneiro_zeca_local_patients";
const USERS_KEY = "pioneiro_zeca_local_users";
const SETTINGS_KEY = "pioneiro_zeca_local_settings";
const ALERTS_KEY = "pioneiro_zeca_local_alerts";
const AUTH_USERS_KEY = "pioneiro_zeca_local_auth_users";

// Top-level generic storage reading utility
function getFromStorage<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? (JSON.parse(item) as T) : fallback;
  } catch (e) {
    console.error(`Error reading key ${key} from storage:`, e);
    return fallback;
  }
}

// Sample Seed Patients data matching exactly the Patient type
const SAMPLE_PATIENTS: Patient[] = [
  {
    id: "pat-1",
    patientSerialId: "P0001",
    name: "Afonso Tchipalanga",
    gender: "Masculino",
    birthDate: "2023-11-12",
    age: 2,
    ageGroup: "1-4 Anos",
    occurrenceDate: new Date().toISOString().split("T")[0],
    entryTime: "08:30",
    status: "Atendido",
    province: "Huíla",
    city: "Lubango",
    neighborhood: "Cavalaria",
    occurrenceType: "Febre Alta Pediátrica (>38.5°C)",
    signalsSymptoms: "Apresenta picos febris altos há 3 dias, vômitos pós-alimentares e sonolência ligeira.",
    priority: "Alta",
    state: "Internado",
    receptionistId: "admin-local",
    receptionistSignature: "Enf. Adelina",
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 4).toISOString()
  },
  {
    id: "pat-2",
    patientSerialId: "P0002",
    name: "Clara Noemi Kahala",
    gender: "Feminino",
    birthDate: "2025-02-05",
    age: 0,
    ageGroup: "Bebé Menor que 1 Ano",
    occurrenceDate: new Date().toISOString().split("T")[0],
    entryTime: "10:15",
    status: "Em Espera",
    province: "Huíla",
    city: "Lubango",
    neighborhood: "Mitano",
    occurrenceType: "Diarreia Líquida Aguda com Sinais de Desidratação",
    signalsSymptoms: "Mais de 6 dejeções líquidas hoje, perda de turgor cutâneo moderada, choro sem lágrimas.",
    priority: "Emergência",
    state: "Internado",
    receptionistId: "admin-local",
    receptionistSignature: "Enf. Adelina",
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: "pat-3",
    patientSerialId: "P0003",
    name: "Manuel Diniz",
    gender: "Masculino",
    birthDate: "2018-06-20",
    age: 7,
    ageGroup: "5-9 Anos",
    occurrenceDate: new Date().toISOString().split("T")[0],
    entryTime: "11:00",
    status: "Em Espera",
    province: "Huíla",
    city: "Chibia",
    neighborhood: "Centro",
    occurrenceType: "Tosse Seca Espasmódica Persistente",
    signalsSymptoms: "Tosse seca persistente, sem sibilâncias audíveis, sem esforço respiratório acentuado.",
    priority: "Média",
    state: "Internado",
    receptionistId: "staff-local",
    receptionistSignature: "Enf. Victor",
    createdAt: new Date(Date.now() - 1800000).toISOString(),
    updatedAt: new Date(Date.now() - 1800000).toISOString()
  }
];

// Sample seed users
const SAMPLE_USERS: UserProfile[] = [
  {
    uid: "admin-local",
    email: "eduardocuvangohd@gmail.com",
    name: "Eduardo Cuvango (Administrador)",
    role: "admin",
    staffId: "OP-01"
  },
  {
    uid: "staff-local",
    email: "operador.pioneiro@pioneirozeca.local",
    name: "Operador de Triagem",
    role: "staff",
    staffId: "OP-02"
  }
];

const DEFAULT_SETTINGS: SystemSettings = {
  alertEmail: "eduardocuvangohd@gmail.com",
  alertPhone: "+244900000000",
  alertThreshold: 3,
  backupFrequency: "weekly",
  monitoredAreas: []
};

export const localDatabase = {
  get: getFromStorage,

  set(key: string, value: any) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`Error writing key ${key} to storage:`, e);
    }
  },

  // Database seeders (sets defaults if empty)
  initialize() {
    if (!localStorage.getItem(PATIENTS_KEY)) {
      this.set(PATIENTS_KEY, SAMPLE_PATIENTS);
    }
    if (!localStorage.getItem(USERS_KEY)) {
      this.set(USERS_KEY, SAMPLE_USERS);
    }
    if (!localStorage.getItem(SETTINGS_KEY)) {
      this.set(SETTINGS_KEY, DEFAULT_SETTINGS);
    }
    if (!localStorage.getItem(ALERTS_KEY)) {
      this.set(ALERTS_KEY, []);
    }
    if (!localStorage.getItem(AUTH_USERS_KEY)) {
      this.set(AUTH_USERS_KEY, [
        { email: "eduardocuvangohd@gmail.com", role: "admin" },
        { email: "operador.pioneiro@pioneirozeca.local", role: "staff" }
      ]);
    }
  },

  // PATIENTS CRUD
  getPatients(): Patient[] {
    this.initialize();
    return getFromStorage<Patient[]>(PATIENTS_KEY, []).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  addPatient(patient: Omit<Patient, "id" | "createdAt" | "updatedAt">): Patient {
    const patients = this.getPatients();
    const newId = `local-pat-${Date.now()}`;
    const formatted: Patient = {
      ...patient,
      id: newId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    patients.unshift(formatted);
    this.set(PATIENTS_KEY, patients);
    return formatted;
  },

  updatePatient(id: string, updates: Partial<Patient>): Patient {
    const patients = this.getPatients();
    const index = patients.findIndex((p) => p.id === id);
    if (index === -1) throw new Error("Paciente não encontrado no banco local.");
    patients[index] = {
      ...patients[index],
      ...updates,
      updatedAt: new Date().toISOString()
    } as Patient;
    this.set(PATIENTS_KEY, patients);
    return patients[index];
  },

  deletePatient(id: string) {
    let patients = this.getPatients();
    patients = patients.filter((p) => p.id !== id);
    this.set(PATIENTS_KEY, patients);
  },

  // USERS CRUD
  getUsers(): UserProfile[] {
    this.initialize();
    return getFromStorage<UserProfile[]>(USERS_KEY, []);
  },

  getUserByUid(uid: string): UserProfile | null {
    const users = this.getUsers();
    return users.find((u) => u.uid === uid) || null;
  },

  getUserByEmail(email: string): UserProfile | null {
    const users = this.getUsers();
    return users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
  },

  addUserProfile(profile: UserProfile): UserProfile {
    const users = this.getUsers();
    const withoutExisting = users.filter((u) => u.uid !== profile.uid && u.email.toLowerCase() !== profile.email.toLowerCase());
    withoutExisting.push(profile);
    this.set(USERS_KEY, withoutExisting);
    return profile;
  },

  deleteUserProfile(uid: string) {
    let users = this.getUsers();
    users = users.filter((u) => u.uid !== uid);
    this.set(USERS_KEY, users);
  },

  // ALERTS (Real-time outbreaks alert logs)
  getAlerts(): any[] {
    this.initialize();
    return getFromStorage<any[]>(ALERTS_KEY, []);
  },

  addAlert(alert: any) {
    const alerts = this.getAlerts();
    alerts.unshift({
      id: `alert-${Date.now()}`,
      timestamp: new Date().toISOString(),
      ...alert
    });
    this.set(ALERTS_KEY, alerts);
  },

  // SETTINGS
  getSettings(): SystemSettings {
    this.initialize();
    return getFromStorage<SystemSettings>(SETTINGS_KEY, DEFAULT_SETTINGS);
  },

  saveSettings(settings: SystemSettings) {
    this.set(SETTINGS_KEY, settings);
  },

  // PRE-AUTHORIZED USERS (For operator authorization controls)
  getAuthorizedUsers(): { email: string; role: string; addedAt?: string; staffId?: string }[] {
    this.initialize();
    return getFromStorage<{ email: string; role: string; addedAt?: string; staffId?: string }[]>(AUTH_USERS_KEY, []);
  },

  addAuthorizedUser(email: string, role: string, staffId: string) {
    const authList = this.getAuthorizedUsers();
    const index = authList.findIndex((u) => u.email.toLowerCase() === email.toLowerCase());
    if (index !== -1) {
      authList[index] = { email, role, staffId, addedAt: new Date().toISOString() };
    } else {
      authList.push({ email, role, staffId, addedAt: new Date().toISOString() });
    }
    this.set(AUTH_USERS_KEY, authList);
  },

  removeAuthorizedUser(email: string) {
    let authList = this.getAuthorizedUsers();
    authList = authList.filter((u) => u.email.toLowerCase() !== email.toLowerCase());
    this.set(AUTH_USERS_KEY, authList);
  }
};
