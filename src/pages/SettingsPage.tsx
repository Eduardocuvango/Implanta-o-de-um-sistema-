import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { adminService } from "../services/adminService";
import { userService } from "../services/userService";
import { auth as firebaseAuth } from "../lib/firebase";
import { signOut } from "firebase/auth";
import { SystemSettings, UserProfile } from "../types";
import {
  Bell,
  Mail,
  Phone,
  MapPin,
  Save,
  Users,
  ShieldAlert,
  ChevronRight,
  TrendingUp,
  X,
  Database,
  Download,
  Upload,
  RefreshCcw,
  CheckCircle2,
  Trash2,
} from "lucide-react";
import { motion } from "motion/react";
import { cn } from "../lib/utils";
import { dataService } from "../services/dataService";
import * as XLSX from "xlsx";

export default function SettingsPage() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<SystemSettings>({
    alertEmail: "",
    alertPhone: "",
    alertThreshold: 5,
    backupFrequency: "manual",
    monitoredAreas: [],
  });
  const [authorizedUsers, setAuthorizedUsers] = useState<any[]>([]);
  const [userProfiles, setUserProfiles] = useState<UserProfile[]>([]);
  const [backups, setBackups] = useState<any[]>([]);
  const [newAuthEmail, setNewAuthEmail] = useState("");
  const [newAuthRole, setNewAuthRole] = useState<"admin" | "staff">("staff");
  const [newAuthName, setNewAuthName] = useState("");
  const [newAuthPassword, setNewAuthPassword] = useState("");
  const [regError, setRegError] = useState("");
  const [regSuccess, setRegSuccess] = useState("");
  const [saving, setSaving] = useState(false);
  const [backingUp, setBackingUp] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [restoreMessage, setRestoreMessage] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [s, a, b, u] = await Promise.all([
      adminService.getSettings(),
      adminService.getAuthorizedUsers(),
      dataService.getBackups(),
      userService.getAllProfiles(),
    ]);
    if (s) setSettings(s);
    setAuthorizedUsers(a);
    setBackups(
      b.sort(
        (x: any, y: any) =>
          new Date(y.createdAt).getTime() - new Date(x.createdAt).getTime(),
      ),
    );
    setUserProfiles(u);
  };

  const handleCreateBackup = async (format: "json" | "xlsx") => {
    setBackingUp(true);
    try {
      const data = await dataService.createBackup();

      if (format === "json") {
        const blob = new Blob([JSON.stringify(data, null, 2)], {
          type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `backup_pioneiro_zeca_${new Date().toISOString().split("T")[0]}.json`;
        a.click();
      } else {
        const wb = XLSX.utils.book_new();
        for (const colName in data) {
          const ws = XLSX.utils.json_to_sheet(data[colName]);
          XLSX.utils.book_append_sheet(wb, ws, colName);
        }
        XLSX.writeFile(
          wb,
          `backup_pioneiro_zeca_${new Date().toISOString().split("T")[0]}.xlsx`,
        );
      }
    } finally {
      setBackingUp(false);
    }
  };

  const handleRestoreBackup = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setRestoring(true);
    setRestoreMessage("A processar ficheiro...");

    try {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        try {
          const content = evt.target?.result as string;
          const data = JSON.parse(content);
          setRestoreMessage("A restaurar base de dados...");
          await dataService.restoreBackup(data);
          setRestoreMessage("Restauro completo com sucesso!");
          loadData();
          setTimeout(() => setRestoreMessage(""), 3000);
        } catch (err) {
          setRestoreMessage("Erro ao ler JSON. Verifique o formato.");
        }
      };
      reader.readAsText(file);
    } catch (err) {
      setRestoreMessage("Falha no restauro.");
    } finally {
      setRestoring(false);
    }
  };

  const handleAuthorizeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAuthEmail || !newAuthName || !newAuthPassword || !user) {
      setRegError("Por favor preencha todos os campos do novo registo.");
      return;
    }
    
    setRegError("");
    setRegSuccess("");
    setSaving(true);
    
    try {
      const { initializeApp, deleteApp } = await import('firebase/app');
      const { getAuth, createUserWithEmailAndPassword, signOut: tempSignOut } = await import('firebase/auth');
      const firebaseConfig = (await import('../../firebase-applet-config.json')).default;

      let identifier = newAuthEmail.trim().toLowerCase();
      if (newAuthRole === 'staff') {
        if (identifier.includes('@')) {
          identifier = identifier.split('@')[0];
        }
        if (!/^[a-zA-Z0-9_.-]+$/.test(identifier)) {
          throw new Error('O nome de utilizador só pode conter letras, números, pontos e traços.');
        }
        identifier = `${identifier}@pioneirozeca.local`;
      } else {
        if (!identifier.includes('@')) {
          throw new Error('Introduza um e-mail válido para a conta de administrador.');
        }
      }

      if (newAuthPassword.length < 6) {
        throw new Error('A senha de segurança deve ter pelo menos 6 caracteres.');
      }

      // 1. Create credential in temp background firebase app instance so active admin session is preserved
      const tempAppName = `TempRegApp_${Date.now()}`;
      const tempApp = initializeApp(firebaseConfig, tempAppName);
      const tempAuth = getAuth(tempApp);
      
      const userCredential = await createUserWithEmailAndPassword(tempAuth, identifier, newAuthPassword);
      const newUser = userCredential.user;
      
      // Immediately sign out from temp auth and delete the temp app to avoid resource leak
      await tempSignOut(tempAuth);
      await deleteApp(tempApp);

      // 2. Authorize this email so they are registered in our authorized list
      await adminService.authorizeUser(identifier, user.uid, newAuthRole);

      // 3. Create active profile record
      const staffId = await dataService.getNextStaffId();
      await userService.createProfile({
        uid: newUser.uid,
        name: newAuthName,
        email: identifier,
        role: newAuthRole,
        staffId
      });

      setNewAuthEmail("");
      setNewAuthName("");
      setNewAuthPassword("");
      setRegSuccess(`Sucesso! A conta de ${newAuthRole === 'admin' ? 'Administrador' : 'Operador'} (${newAuthRole === 'staff' ? identifier.split('@')[0] : identifier}) foi registada e ativada.`);
      loadData();
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setRegError('Este nome de utilizador ou e-mail corporativo já se encontra em uso.');
      } else {
        setRegError(err.message || 'Erro ao registar a conta. Tente novamente.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDeauthorize = async (email: string) => {
    if (!email) return;
    const isLocalStaff = email.endsWith("@pioneirozeca.local");
    const label = isLocalStaff ? email.split("@")[0] : email;
    if (
      window.confirm(
        `Tem a certeza que deseja remover a autorização e apagar permanentemente a conta de ${label}?`,
      )
    ) {
      try {
        await adminService.deauthorizeUser(email);
        const matchingProfile = userProfiles.find(p => p.email && p.email.toLowerCase() === email.toLowerCase());
        if (matchingProfile) {
          await userService.deleteProfile(matchingProfile.uid);
        }
        await loadData();
        alert(`Sucesso: A autorização e perfil para "${label}" foram removidos com sucesso.`);
      } catch (err: any) {
        console.error(err);
        alert(`Erro ao remover autorização: ${err.message || err}`);
      }
    }
  };

  const handleDeleteProfile = async (uid: string, profileEmail: string) => {
    const isSelf = uid === user?.uid;
    const safeEmail = profileEmail || "";
    const isLocalStaff = safeEmail.endsWith("@pioneirozeca.local");
    const label = isLocalStaff ? safeEmail.split("@")[0] : (safeEmail || "sem e-mail");
    const confirmMessage = isSelf
      ? "ATENÇÃO CRÍTICA: Está prestes a APAGAR a sua própria conta de administrador! Será desconectado do sistema imediatamente. Deseja prosseguir?"
      : `Tem a certeza que deseja apagar permanentemente a conta de utilizador "${label}" e revogar a sua autorização?`;

    if (window.confirm(confirmMessage)) {
      try {
        await userService.deleteProfile(uid);
        if (safeEmail) {
          await adminService.deauthorizeUser(safeEmail);
        }
        if (isSelf) {
          await signOut(firebaseAuth);
        } else {
          await loadData();
          alert(`Sucesso: A conta "${label}" foi removida permanentemente de todos os registos do sistema.`);
        }
      } catch (err: any) {
        console.error(err);
        alert(`Erro ao apagar conta: ${err.message || err}`);
      }
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      await adminService.updateSettings(settings);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-20">
      <header>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase leading-none">
          Painel de Configurações Administrativas
        </h1>
        <p className="text-slate-500 font-medium mt-2">
          Controlo avançado de alertas epidemiológicos, agendamento de backups resilientes e gestão de autorização de acessos.
        </p>
      </header>

      <div className="space-y-8">
        {/* Alerts Configuration */}
        <section className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm border-t-4 border-t-red-650">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-red-50 p-2.5 rounded-2xl">
              <Bell className="h-6 w-6 text-red-650" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 leading-none">
                Configuração de Alertas Automáticos
              </h2>
              <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-bold">
                Sensores de Vigilância Epidemiológica Activa
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Mail className="h-3 w-3" /> E-mail para Alertas
              </label>
              <input
                type="email"
                value={settings.alertEmail}
                onChange={(e) =>
                  setSettings({ ...settings, alertEmail: e.target.value })
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 px-4 text-sm focus:border-red-500 focus:outline-none transition-all font-semibold"
                placeholder="admin.emergencia@pioneirozeca.ao"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Phone className="h-3 w-3" /> Telefone (SMS/WhatsApp)
              </label>
              <input
                type="tel"
                value={settings.alertPhone}
                onChange={(e) =>
                  setSettings({ ...settings, alertPhone: e.target.value })
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 px-4 text-sm focus:border-red-500 focus:outline-none transition-all font-semibold"
                placeholder="+244 9XX XXX XXX"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <ShieldAlert className="h-3 w-3" /> Limiar de Sensibilidade (Threshold)
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={settings.alertThreshold}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      alertThreshold: parseInt(e.target.value),
                    })
                  }
                  className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-red-650"
                />
                <span className="bg-red-650 text-white font-black px-4 py-1.5 rounded-lg text-xs leading-none">
                  {settings.alertThreshold} CASOS / 24H
                </span>
              </div>
              <p className="text-[10px] text-slate-400 italic">
                Disparar alerta se uma mesma patologia for detectada nesta quantidade numa única área em 24h.
              </p>
            </div>
          </div>

          <div className="mt-8 border-t border-slate-100 pt-8">
            <button
              onClick={handleSaveSettings}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 bg-[#0f172a] text-white py-4 rounded-xl font-bold hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50"
            >
              <Save className="h-5 w-5" />
              {saving ? "A GUARDAR..." : "GUARDAR CONFIGURAÇÃO DE SEGURANÇA"}
            </button>
          </div>
        </section>

        {/* Cerca Epidemiológica */}
        <section className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="bg-blue-50 p-2.5 rounded-2xl">
                <MapPin className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 leading-none">
                  Cerca Epidemiológica
                </h2>
                <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-bold">
                  Áreas sob monitorização activa do hospital
                </p>
              </div>
            </div>
            <button className="text-xs font-bold text-blue-600 hover:underline uppercase tracking-wider">
              ADICIONAR ZONA
            </button>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between group hover:border-blue-300 transition-all">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400">
                    HUÍLA / LUBANGO
                  </p>
                  <p className="text-sm font-bold text-slate-700">
                    Bairro Arrifana
                  </p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between group hover:border-blue-300 transition-all">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400">
                    HUÍLA / LUBANGO
                  </p>
                  <p className="text-sm font-bold text-slate-700">Tchioco</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
            </div>
          </div>
        </section>

        {/* User Access Authorization */}
        <section className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm border-t-4 border-t-purple-600">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-purple-50 p-2.5 rounded-2xl">
              <ShieldAlert className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 leading-none">
                Gestão e Registo de Utilizadores
              </h2>
              <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-bold">
                Criar e Ativar Contas para Recolha de Dados ou Administradores
              </p>
            </div>
          </div>

          <form onSubmit={handleAuthorizeEmail} className="space-y-4 mb-8 bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Função da Nova Conta:
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => { setNewAuthRole("staff"); setNewAuthEmail(""); }}
                  className={cn(
                    "text-[10px] font-bold px-3 py-1.5 rounded-full transition-all border",
                    newAuthRole === "staff"
                      ? "bg-purple-100 text-purple-700 border-purple-300"
                      : "bg-white text-slate-500 border-slate-200 hover:border-slate-300",
                  )}
                >
                  Recolha de Dados (Staff)
                </button>
                <button
                  type="button"
                  onClick={() => { setNewAuthRole("admin"); setNewAuthEmail(""); }}
                  className={cn(
                    "text-[10px] font-bold px-3 py-1.5 rounded-full transition-all border",
                    newAuthRole === "admin"
                      ? "bg-red-100 text-red-700 border-red-300"
                      : "bg-white text-slate-500 border-slate-200 hover:border-slate-300",
                  )}
                >
                  Administrador (Admin)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nome Completo do Profissional</label>
                <input
                  type="text"
                  required
                  value={newAuthName}
                  onChange={(e) => setNewAuthName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white py-3 px-4 text-sm focus:border-purple-500 focus:outline-none font-semibold text-slate-800"
                  placeholder="Ex: Dra. Joana Santos"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {newAuthRole === "staff" ? "Nome de Utilizador (Username)" : "E-mail Corporativo"}
                </label>
                <input
                  type={newAuthRole === "staff" ? "text" : "email"}
                  required
                  value={newAuthEmail}
                  onChange={(e) => setNewAuthEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white py-3 px-4 text-sm focus:border-purple-500 focus:outline-none font-semibold text-slate-800"
                  placeholder={
                    newAuthRole === "staff"
                      ? "Ex: joana"
                      : "Ex: joana@hospital.com"
                  }
                />
                {newAuthRole === "staff" && (
                  <p className="text-[9px] text-slate-400 font-medium">Nota: O login será efetuado usando este nome correspondente.</p>
                )}
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Senha de Segurança (Mínimo 6 caracteres)</label>
                <input
                  type="text"
                  required
                  value={newAuthPassword}
                  onChange={(e) => setNewAuthPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white py-3 px-4 text-sm focus:border-purple-500 focus:outline-none font-mono font-bold text-slate-800"
                  placeholder="Defina uma senha para este utilizador..."
                />
              </div>
            </div>

            {regError && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-bold mt-2">
                ⚠️ {regError}
              </div>
            )}

            {regSuccess && (
              <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-800 text-xs font-bold mt-2 leading-relaxed whitespace-pre-line">
                ✅ {regSuccess}
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={saving}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white py-3.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all active:scale-95 shadow-md shadow-purple-600/15"
              >
                {saving ? "A processar..." : `CADASTRAR E ATIVAR ${newAuthRole === 'admin' ? 'ADMINISTRADOR' : 'OPERADOR'}`}
              </button>
            </div>
          </form>

          <div className="space-y-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
              Utilizadores Autorizados na Base de Dados
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              {authorizedUsers.map((authDetail) => {
                const isLocalStaff = authDetail.email.endsWith("@pioneirozeca.local");
                const displayName = isLocalStaff ? authDetail.email.split("@")[0] : authDetail.email;
                return (
                  <div
                    key={authDetail.email}
                    className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-sm font-medium"
                  >
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-900 text-xs font-mono">
                          {displayName}
                        </span>
                        <span
                          className={cn(
                            "text-[8px] font-black uppercase px-2 py-0.5 rounded-md",
                            authDetail.role === "admin"
                              ? "bg-red-100 text-red-600"
                              : "bg-purple-100 text-purple-600",
                          )}
                        >
                          {authDetail.role === "admin" ? "Admin" : "Recolha"}
                        </span>
                      </div>
                      <span className="text-[9px] text-[#2563eb] font-bold uppercase tracking-widest mt-0.5">
                        {authDetail.staffId}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeauthorize(authDetail.email)}
                      className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-slate-105 transition-colors"
                      title="Remover autorização"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
              {authorizedUsers.length === 0 && (
                <p className="text-xs text-slate-400 italic">
                  Nenhum utilizador ou email autorizado ainda.
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Registos e Contas Ativas */}
        <section className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm border-t-4 border-t-blue-650">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-blue-50 p-2.5 rounded-2xl">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 leading-none">
                Contas Registadas no Sistema
              </h2>
              <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-bold">
                Gestão e desativação de contas ativas no sistema
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {userProfiles.map((prof) => {
              const isLocalStaff = prof.email.endsWith("@pioneirozeca.local");
              const displayEmail = isLocalStaff ? "Apenas Acesso Interno" : prof.email;
              const displayLoginName = isLocalStaff ? prof.email.split("@")[0] : prof.email;
              return (
                <div
                  key={prof.uid}
                  className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200 shadow-inner group"
                >
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-900 text-sm">
                        {prof.name}
                      </span>
                      <span
                        className={cn(
                          "text-[8px] font-black uppercase px-2 py-0.5 rounded-md",
                          prof.role === "admin"
                            ? "bg-red-100 text-red-700"
                            : "bg-green-100 text-green-700",
                        )}
                      >
                        {prof.role === "admin" ? "Administrador" : "Recolha de Dados"}
                      </span>
                    </div>
                    <span className="text-xs text-slate-500 font-medium font-sans">
                      {displayEmail} {isLocalStaff && <span className="text-xs font-mono font-bold text-slate-400">({displayLoginName})</span>}
                    </span>
                    <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                      UID: {prof.uid}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteProfile(prof.uid, prof.email)}
                    className="p-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-colors"
                    title={
                      prof.uid === user?.uid
                        ? "Apagar a minha conta"
                        : "Apagar conta de utilizador"
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
            {userProfiles.length === 0 && (
              <p className="text-xs text-slate-400 italic">
                Nenhuma conta registada.
              </p>
            )}
          </div>
        </section>

        {/* DATA VAULT / BACKUP SECTION */}
        <section className="bg-slate-900 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden border border-slate-800">
          <div className="absolute top-0 right-0 p-6 opacity-3">
            <Database className="h-24 w-24" />
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
              <div className="bg-white/10 p-2.5 rounded-2xl">
                <Database className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight leading-none">
                  Cofre de Dados (Data Vault)
                </h2>
                <p className="text-[9px] text-slate-400 uppercase tracking-widest font-bold mt-1">
                  Resiliência e Continuidade de Negócio
                </p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 mb-8">
              <button
                onClick={() => handleCreateBackup("json")}
                disabled={backingUp}
                className="flex items-center justify-center gap-3 p-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group"
              >
                <Download className="h-5 w-5 text-blue-400 group-hover:scale-110 transition-transform" />
                <div className="text-left">
                  <p className="text-xs font-black uppercase tracking-widest">
                    Backup JSON
                  </p>
                  <p className="text-[9px] text-slate-500 font-bold uppercase">
                    Formato de Engenharia
                  </p>
                </div>
              </button>
              <button
                onClick={() => handleCreateBackup("xlsx")}
                disabled={backingUp}
                className="flex items-center justify-center gap-3 p-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group"
              >
                <Save className="h-5 w-5 text-green-400 group-hover:scale-110 transition-transform" />
                <div className="text-left">
                  <p className="text-xs font-black uppercase tracking-widest">
                    Relatório Excel
                  </p>
                  <p className="text-[9px] text-slate-500 font-bold uppercase">
                    Formato Administrativo
                  </p>
                </div>
              </button>
            </div>

            <div className="bg-white/5 rounded-2xl p-6 border border-white/10 mb-8">
              <h4 className="text-xs font-black uppercase tracking-[0.2em] mb-4 text-blue-300">
                Agendamento de Alta Resiliência
              </h4>
              <div className="grid sm:grid-cols-3 gap-3">
                {["manual", "weekly", "monthly"].map((freq) => (
                  <button
                    key={freq}
                    onClick={() =>
                      setSettings({
                        ...settings,
                        backupFrequency: freq as any,
                      })
                    }
                    className={cn(
                      "py-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all",
                      settings.backupFrequency === freq
                        ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/20"
                        : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10",
                    )}
                  >
                    {freq === "manual"
                      ? "Desativado"
                      : freq === "weekly"
                        ? "Semanal"
                        : "Mensal"}
                  </button>
                ))}
              </div>
              <p className="mt-3 text-[9px] text-slate-500 font-bold italic">
                Último backup automático:{" "}
                {settings.lastBackupDate
                  ? new Date(settings.lastBackupDate).toLocaleDateString()
                  : "NUNCA"}
              </p>
            </div>

            <div className="space-y-4 mb-8">
              <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                Histórico de Snapshots
              </h4>
              <div className="max-h-[200px] overflow-y-auto pr-2 custom-scrollbar space-y-2">
                {backups.map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 text-[10px]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      <span className="font-bold text-slate-300">
                        {new Date(b.createdAt).toLocaleString()}
                      </span>
                      <span className="bg-white/10 px-2 py-0.5 rounded text-blue-400 font-black uppercase text-[8px]">
                        {b.type}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        const blob = new Blob(
                          [JSON.stringify(b.data, null, 2)],
                          { type: "application/json" },
                        );
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `restore_${b.id}.json`;
                        a.click();
                      }}
                      className="text-white hover:text-blue-400"
                    >
                      <Download className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                {backups.length === 0 && (
                  <p className="text-[10px] text-slate-500 italic">
                    Nenhum snapshot automático registado.
                  </p>
                )}
              </div>
            </div>

            <div className="bg-white/5 rounded-2xl p-6 border border-dashed border-white/20">
              <div className="flex items-start gap-4">
                <div className="bg-amber-500/10 p-3 rounded-xl">
                  <Upload className="h-6 w-6 text-amber-500" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold mb-1">
                    Restaurar Ponto de Segurança
                  </h4>
                  <p className="text-[10px] text-slate-500 font-medium mb-4">
                    Carregue um ficheiro JSON de backup para sincronizar a base de dados.
                  </p>

                  <label className="flex items-center gap-2 bg-white text-slate-900 px-4 py-2 rounded-lg text-[9px] font-black uppercase cursor-pointer hover:bg-blue-50 transition-colors w-fit">
                    <Upload className="h-3 w-3" />
                    Seleccionar Ficheiro
                    <input
                      type="file"
                      accept=".json"
                      className="hidden"
                      onChange={handleRestoreBackup}
                      disabled={restoring}
                    />
                  </label>
                </div>
              </div>

              {restoreMessage && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 flex items-center gap-2 text-[10px] font-black uppercase text-blue-400 bg-blue-500/10 p-3 rounded-xl"
                >
                  {restoring ? (
                    <RefreshCcw className="h-3 w-3 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-3 w-3" />
                  )}
                  {restoreMessage}
                </motion.div>
              )}
            </div>

            <p className="mt-6 text-[9px] text-slate-500 text-center font-bold uppercase tracking-widest leading-relaxed">
              Nota: O restauro de dados é uma operação crítica que pode sobrepor registos existentes. Utilize com precaução máxima.
            </p>
          </div>
        </section>

        <section className="bg-white rounded-3xl p-6 border border-slate-200 text-center">
          <div className="bg-blue-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="h-6 w-6 text-blue-600" />
          </div>
          <p className="text-sm font-bold text-slate-800">
            IA de Monitorização Activa
          </p>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            O motor Gemini analisa padrões de endereço IP, localizações e sintomas clínicos para prever novos surtos epidemiológicos na região do Lubango.
          </p>
        </section>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255,255,255,0.05);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.2);
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}
