import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { adminService } from '../services/adminService';
import { SystemSettings, Doctor } from '../types';
import { 
  Bell, 
  UserPlus, 
  Mail, 
  Phone, 
  MapPin, 
  Save, 
  Plus, 
  Users, 
  ShieldAlert,
  ChevronRight,
  TrendingUp,
  X,
  Database,
  Download,
  Upload,
  RefreshCcw,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { dataService } from '../services/dataService';
import * as XLSX from 'xlsx';

export default function SettingsPage() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<SystemSettings>({
    alertEmail: '',
    alertPhone: '',
    alertThreshold: 5,
    backupFrequency: 'manual',
    monitoredAreas: []
  });
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [authorizedUsers, setAuthorizedUsers] = useState<any[]>([]);
  const [backups, setBackups] = useState<any[]>([]);
  const [newAuthEmail, setNewAuthEmail] = useState('');
  const [showDoctorForm, setShowDoctorForm] = useState(false);
  const [newDoctor, setNewDoctor] = useState({ name: '', specialty: '', active: true });
  const [saving, setSaving] = useState(false);
  const [backingUp, setBackingUp] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [restoreMessage, setRestoreMessage] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [s, d, a, b] = await Promise.all([
      adminService.getSettings(),
      adminService.getDoctors(),
      adminService.getAuthorizedUsers(),
      dataService.getBackups()
    ]);
    if (s) setSettings(s);
    setDoctors(d);
    setAuthorizedUsers(a);
    setBackups(b.sort((x: any, y: any) => new Date(y.createdAt).getTime() - new Date(x.createdAt).getTime()));
  };

  const handleCreateBackup = async (format: 'json' | 'xlsx') => {
    setBackingUp(true);
    try {
      const data = await dataService.createBackup();
      
      if (format === 'json') {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup_pioneiro_zeca_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
      } else {
        const wb = XLSX.utils.book_new();
        for (const colName in data) {
          const ws = XLSX.utils.json_to_sheet(data[colName]);
          XLSX.utils.book_append_sheet(wb, ws, colName);
        }
        XLSX.writeFile(wb, `backup_pioneiro_zeca_${new Date().toISOString().split('T')[0]}.xlsx`);
      }
    } finally {
      setBackingUp(false);
    }
  };

  const handleRestoreBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setRestoring(true);
    setRestoreMessage('A processar ficheiro...');

    try {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        try {
          const content = evt.target?.result as string;
          const data = JSON.parse(content);
          setRestoreMessage('A restaurar base de dados...');
          await dataService.restoreBackup(data);
          setRestoreMessage('Restauro completo com sucesso!');
          loadData();
          setTimeout(() => setRestoreMessage(''), 3000);
        } catch (err) {
          setRestoreMessage('Erro ao ler JSON. Verifique o formato.');
        }
      };
      reader.readAsText(file);
    } catch (err) {
      setRestoreMessage('Falha no restauro.');
    } finally {
      setRestoring(false);
    }
  };

  const handleAuthorizeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAuthEmail || !user) return;
    try {
      await adminService.authorizeUser(newAuthEmail, user.uid);
      setNewAuthEmail('');
      loadData();
    } catch (err) {
      console.error(err);
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

  const handleAddDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminService.addDoctor(newDoctor);
      setShowDoctorForm(false);
      setNewDoctor({ name: '', specialty: '', active: true });
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-20">
      <header>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Painel de Configurações Administrativas</h1>
        <p className="text-slate-500 font-medium">Controlo de alertas epidemiológicos e gestão do corpo clínico</p>
      </header>

      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Alerts Configuration */}
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm border-t-4 border-t-red-600">
            <div className="flex items-center gap-3 mb-8">
              <div className="bg-red-50 p-2.5 rounded-2xl">
                <Bell className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Configuração de Alertas Automáticos</h2>
                <p className="text-sm text-slate-400">Notificações em tempo real para anomalias epidemiológicas</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Mail className="h-3 w-3" /> E-mail para Alertas
                </label>
                <input 
                  type="email" 
                  value={settings.alertEmail}
                  onChange={e => setSettings({...settings, alertEmail: e.target.value})}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 px-4 text-sm focus:border-red-500 focus:outline-none transition-all"
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
                  onChange={e => setSettings({...settings, alertPhone: e.target.value})}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 px-4 text-sm focus:border-red-500 focus:outline-none transition-all"
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
                    onChange={e => setSettings({...settings, alertThreshold: parseInt(e.target.value)})}
                    className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-red-600"
                  />
                  <span className="bg-red-600 text-white font-black px-4 py-1.5 rounded-lg text-sm">{settings.alertThreshold} CASOS</span>
                </div>
                <p className="text-[10px] text-slate-400 italic">Disparar alerta se uma mesma patologia for detectada nesta quantidade numa única área em 24h.</p>
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

          {/* Area Monitoring View (Mock representation) */}
          <section className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
             <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-50 p-2.5 rounded-2xl">
                    <MapPin className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Cerca Epidemiológica</h2>
                    <p className="text-sm text-slate-400">Áreas sob monitorização activa</p>
                  </div>
                </div>
                <button className="text-xs font-bold text-blue-600 hover:underline">ADICIONAR ZONA</button>
             </div>

             <div className="grid sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between group hover:border-blue-300 transition-all">
                   <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <div>
                         <p className="text-[10px] font-bold text-slate-400">HUÍLA / LUBANGO</p>
                         <p className="text-sm font-bold text-slate-700">Bairro Arrifana</p>
                      </div>
                   </div>
                   <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between group hover:border-blue-300 transition-all">
                   <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
                      <div>
                         <p className="text-[10px] font-bold text-slate-400">HUÍLA / LUBANGO</p>
                         <p className="text-sm font-bold text-slate-700">Tchioco</p>
                      </div>
                   </div>
                   <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
                </div>
             </div>
          </section>

          {/* User Access Authorization */}
          <section className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
             <div className="flex items-center gap-3 mb-8">
               <div className="bg-purple-50 p-2.5 rounded-2xl">
                 <ShieldAlert className="h-6 w-6 text-purple-600" />
               </div>
               <div>
                 <h2 className="text-xl font-bold text-slate-900">Gestão de Acesso (Staff)</h2>
                 <p className="text-sm text-slate-400">Autorizar novos médicos e recepcionistas</p>
               </div>
             </div>

             <form onSubmit={handleAuthorizeEmail} className="flex gap-4 mb-6">
                <input 
                   type="email"
                   required
                   value={newAuthEmail}
                   onChange={e => setNewAuthEmail(e.target.value)}
                   className="flex-1 rounded-xl border border-slate-200 bg-slate-50 py-3 px-4 text-sm focus:border-purple-500 focus:outline-none"
                   placeholder="Introduza o email a autorizar..."
                />
                <button 
                   type="submit"
                   className="bg-purple-600 text-white px-6 py-3 rounded-xl font-bold text-xs hover:bg-purple-700 transition-all uppercase tracking-widest active:scale-95"
                >
                   Autorizar Email
                </button>
             </form>

             <div className="space-y-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Utilizadores Autorizados</p>
                <div className="grid sm:grid-cols-2 gap-3">
                   {authorizedUsers.map(auth => (
                      <div key={auth.email} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 italic text-sm text-slate-600 font-medium">
                         <div className="flex flex-col">
                            <span className="font-bold text-slate-900">{auth.email}</span>
                            <span className="text-[9px] text-purple-600 font-black uppercase tracking-tighter">{auth.staffId}</span>
                         </div>
                         <button className="text-red-400 hover:text-red-600"><X className="h-3 w-3" /></button>
                      </div>
                   ))}
                   {authorizedUsers.length === 0 && <p className="text-xs text-slate-400 italic">Nenhum email autorizado ainda.</p>}
                </div>
             </div>
          </section>

          {/* DATA VAULT / BACKUP SECTION */}
          <section className="bg-slate-900 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden border border-slate-800">
             <div className="absolute top-0 right-0 p-6 opacity-5">
                <Database className="h-24 w-24" />
             </div>
             
             <div className="relative z-10">
                <div className="flex items-center gap-3 mb-8">
                  <div className="bg-white/10 p-2.5 rounded-2xl">
                    <Database className="h-6 w-6 text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white tracking-tight">Cofre de Dados (Data Vault)</h2>
                    <p className="text-sm text-slate-400 uppercase tracking-widest text-[9px] font-bold">Resiliência e Continuidade de Negócio</p>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4 mb-8">
                   <button 
                      onClick={() => handleCreateBackup('json')}
                      disabled={backingUp}
                      className="flex items-center justify-center gap-3 p-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group"
                   >
                      <Download className="h-5 w-5 text-blue-400 group-hover:scale-110 transition-transform" />
                      <div className="text-left">
                         <p className="text-xs font-black uppercase tracking-widest">Backup JSON</p>
                         <p className="text-[9px] text-slate-500 font-bold uppercase">Formato de Engenharia</p>
                      </div>
                   </button>
                   <button 
                      onClick={() => handleCreateBackup('xlsx')}
                      disabled={backingUp}
                      className="flex items-center justify-center gap-3 p-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group"
                   >
                      <Save className="h-5 w-5 text-green-400 group-hover:scale-110 transition-transform" />
                      <div className="text-left">
                         <p className="text-xs font-black uppercase tracking-widest">Relatório Excel</p>
                         <p className="text-[9px] text-slate-500 font-bold uppercase">Formato Administrativo</p>
                      </div>
                   </button>
                </div>

                <div className="bg-white/5 rounded-2xl p-6 border border-white/10 mb-8">
                   <h4 className="text-xs font-black uppercase tracking-[0.2em] mb-4 text-blue-300">Agendamento de Alta Resiliência</h4>
                   <div className="grid sm:grid-cols-3 gap-3">
                      {['manual', 'weekly', 'monthly'].map((freq) => (
                         <button
                            key={freq}
                            onClick={() => setSettings({...settings, backupFrequency: freq as any})}
                            className={cn(
                               "py-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all",
                               settings.backupFrequency === freq 
                                  ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/20" 
                                  : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10"
                            )}
                         >
                            {freq === 'manual' ? 'Desativado' : freq === 'weekly' ? 'Semanal' : 'Mensal'}
                         </button>
                      ))}
                   </div>
                   <p className="mt-3 text-[9px] text-slate-500 font-bold italic">
                      Último backup automático: {settings.lastBackupDate ? new Date(settings.lastBackupDate).toLocaleDateString() : 'NUNCA'}
                   </p>
                </div>

                <div className="space-y-4 mb-8">
                   <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Histórico de Snapshots</h4>
                   <div className="max-h-[200px] overflow-y-auto pr-2 custom-scrollbar space-y-2">
                      {backups.map(b => (
                         <div key={b.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 text-[10px]">
                            <div className="flex items-center gap-3">
                               <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                               <span className="font-bold text-slate-300">{new Date(b.createdAt).toLocaleString()}</span>
                               <span className="bg-white/10 px-2 py-0.5 rounded text-blue-400 font-black uppercase text-[8px]">{b.type}</span>
                            </div>
                            <button 
                              onClick={() => {
                                 const blob = new Blob([JSON.stringify(b.data, null, 2)], { type: 'application/json' });
                                 const url = URL.createObjectURL(blob);
                                 const a = document.createElement('a');
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
                      {backups.length === 0 && <p className="text-[10px] text-slate-500 italic">Nenhum snapshot automático registado.</p>}
                   </div>
                </div>

                <div className="bg-white/5 rounded-2xl p-6 border border-dashed border-white/20">
                   <div className="flex items-start gap-4">
                      <div className="bg-amber-500/10 p-3 rounded-xl">
                         <Upload className="h-6 w-6 text-amber-500" />
                      </div>
                      <div className="flex-1">
                         <h4 className="text-sm font-bold mb-1">Restaurar Ponto de Segurança</h4>
                         <p className="text-[10px] text-slate-500 font-medium mb-4">Carregue um ficheiro JSON de backup para sincronizar a base de dados.</p>
                         
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
                         {restoring ? <RefreshCcw className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                         {restoreMessage}
                      </motion.div>
                   )}
                </div>
                
                <p className="mt-6 text-[9px] text-slate-500 text-center font-bold uppercase tracking-widest leading-relaxed">
                   Nota: O restauro de dados é uma operação crítica que pode sobrepor registos existentes. Utilize com precaução máxima.
                </p>
             </div>
          </section>
        </div>

        {/* Doctor Management Sidebar */}
        <div className="space-y-8">
          <section className="bg-[#0f172a] rounded-3xl p-8 text-white shadow-xl">
             <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                   <div className="bg-blue-600 p-2 rounded-lg">
                      <Users className="h-5 w-5" />
                   </div>
                   <h3 className="text-lg font-bold">Corpo Clínico</h3>
                </div>
                <button 
                  onClick={() => setShowDoctorForm(true)}
                  className="rounded-full bg-white/10 p-2 hover:bg-white/20 transition-all"
                >
                   <Plus className="h-4 w-4" />
                </button>
             </div>

             <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {doctors.map(dr => (
                  <div key={dr.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
                     <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-blue-600/30 flex items-center justify-center font-bold text-blue-400">
                           {dr.name.charAt(0)}
                        </div>
                        <div>
                           <p className="text-sm font-bold">{dr.name}</p>
                           <p className="text-[10px] text-white/40 uppercase tracking-widest">{dr.specialty}</p>
                        </div>
                     </div>
                     <div className={`h-1.5 w-1.5 rounded-full ${dr.active ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  </div>
                ))}
             </div>

             <div className="mt-8 pt-8 border-t border-white/5 flex items-center justify-between">
                <div>
                   <p className="text-2xl font-black text-blue-400">{doctors.length}</p>
                   <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Registados</p>
                </div>
                <div className="text-right">
                   <p className="text-2xl font-black text-green-400">{doctors.filter(d => d.active).length}</p>
                   <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Activos Hoje</p>
                </div>
             </div>
          </section>

          <section className="bg-white rounded-3xl p-6 border border-slate-200 text-center">
             <div className="bg-blue-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-6 w-6 text-blue-600" />
             </div>
             <p className="text-sm font-bold text-slate-800">IA de Monitorização</p>
             <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                O motor Gemini analisa padrões de endereço IP e moradas para prever novos surtos.
             </p>
          </section>
        </div>
      </div>

      {/* Doctor Add Modal */}
      <AnimatePresence>
        {showDoctorForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <motion.div 
               initial={{ opacity: 0, scale: 0.9, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.9, y: 20 }}
               className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl"
            >
               <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-bold text-slate-900 tracking-tight">Registar Novo Médico</h3>
                  <button onClick={() => setShowDoctorForm(false)} className="text-slate-400 hover:text-slate-600">
                     <X className="h-6 w-6" />
                  </button>
               </div>

               <form onSubmit={handleAddDoctor} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nome Completo</label>
                    <input 
                      required
                      type="text" 
                      value={newDoctor.name}
                      onChange={e => setNewDoctor({...newDoctor, name: e.target.value})}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-4 px-4 text-sm focus:border-blue-600 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Especialidade / Secção</label>
                    <input 
                      required
                      type="text" 
                      value={newDoctor.specialty}
                      onChange={e => setNewDoctor({...newDoctor, specialty: e.target.value})}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-4 px-4 text-sm focus:border-blue-600 focus:outline-none"
                      placeholder="Ex: Pediatria Geral"
                    />
                  </div>

                  <button 
                    type="submit"
                    className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-95"
                  >
                    CONFIRMAR CADASTRO
                  </button>
               </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
