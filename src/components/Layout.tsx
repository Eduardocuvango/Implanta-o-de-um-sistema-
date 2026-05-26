import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  LogOut, LayoutDashboard, Table as TableIcon, User, Home, Activity, X, Settings,
  Bell, ShieldAlert, Mail, Phone, Calendar, AlertTriangle, ChevronRight
} from 'lucide-react';
import { auth, db } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { cn } from '../lib/utils';
import { adminService } from '../services/adminService';
import { dataService } from '../services/dataService';
import { alertService } from '../services/alertService';
import { SystemAlert } from '../types';
import { collection, writeBatch, getDocs } from 'firebase/firestore';

interface LayoutProps {
  children: React.ReactNode;
  currentView: string;
  onNavigate: (view: any) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentView, onNavigate }) => {
  const { user, profile } = useAuth();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [alerts, setAlerts] = React.useState<SystemAlert[]>([]);
  const [alertsOpen, setAlertsOpen] = React.useState(false);

  React.useEffect(() => {
    if (profile?.role === 'admin') {
      const triggerBackup = async () => {
        const settings = await adminService.getSettings();
        if (settings) {
          await dataService.runAutoBackupCheck(settings);
        }
      };
      triggerBackup();
    }
  }, [profile]);

  // Subscribe to real-time Alerts
  React.useEffect(() => {
    if (user) {
      const unsubscribe = alertService.subscribeAlerts((fetchedAlerts) => {
        setAlerts(fetchedAlerts);
      });
      return () => unsubscribe();
    }
  }, [user]);

  const handleClearAllAlerts = async () => {
    if (window.confirm("Deseja realmente limpar de forma permanente todo o histórico de alertas epidemiológicos e de emergência do Lubango?")) {
      try {
        const querySnapshot = await getDocs(collection(db, 'alerts'));
        const batch = writeBatch(db);
        querySnapshot.docs.forEach((doc) => {
          batch.delete(doc.ref);
        });
        await batch.commit();
        setAlerts([]);
        setAlertsOpen(false);
      } catch (err) {
        console.error("Erro ao limpar alertas:", err);
      }
    }
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard Resumo (IA)', icon: Home, show: profile?.role === 'admin' },
    { id: 'patients', label: 'Recolha de Dados', icon: TableIcon, show: !!user },
    { id: 'settings', label: 'Admin / Alertas', icon: Settings, show: profile?.role === 'admin' },
    { id: 'profile', label: 'Perfil / Config', icon: User, show: profile?.role === 'admin' },
  ].filter(item => item.show);

  const handleNavigate = (id: any) => {
    onNavigate(id);
    setMenuOpen(false);
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800 overflow-hidden print:h-auto print:overflow-visible print:bg-white">
      {/* Sidebar */}
      {user && !['landing', 'login', 'register'].includes(currentView) && (
        <aside className="w-64 bg-[#0f172a] text-white flex flex-col hidden md:flex shrink-0 print:hidden">
          <div className="p-6 border-b border-slate-700">
            <h1 className="text-xl font-bold tracking-tight text-blue-400">PIONEIRO ZECA</h1>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1 font-semibold">Hospital Pediátrico</p>
          </div>
          
          <nav className="flex-1 p-4 space-y-1">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                  currentView === item.id 
                    ? "bg-blue-600/20 text-blue-400" 
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                )}
              >
                <item.icon className={cn("h-4 w-4", currentView === item.id ? "text-blue-400" : "opacity-60")} />
                {item.label}
              </button>
            ))}
          </nav>

          <div className="p-4 border-t border-slate-700 bg-slate-950/50">
            <div className="flex items-center gap-3 mb-4 px-2">
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center font-bold text-xs">
                {profile?.name?.slice(0, 2).toUpperCase() || '??'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold truncate">{profile?.name || 'Utilizador'}</p>
                <p className="text-[10px] text-blue-400 truncate uppercase tracking-tighter font-bold">
                   {profile?.staffId || 'ADMIN'} • {profile?.role}
                </p>
              </div>
            </div>
            <button
              onClick={() => signOut(auth)}
              className="flex w-full items-center gap-3 rounded-lg px-4 py-2 text-xs font-bold text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sair do Sistema
            </button>
          </div>
        </aside>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden print:h-auto print:overflow-visible">
        {/* Header Bar */}
        {user && !['landing', 'login', 'register'].includes(currentView) && (
          <header className="h-16 bg-white border-b flex items-center justify-between px-8 shadow-sm shrink-0 print:hidden">
            <div className="flex items-center gap-4">
               <button onClick={() => setMenuOpen(true)} className="md:hidden">
                <LayoutDashboard className="h-6 w-6 text-slate-600" />
              </button>
              <span className="text-slate-400 text-xs font-medium uppercase tracking-wider hidden sm:inline">
                Pioneiro Zeca / {menuItems.find(i => i.id === currentView)?.label}
              </span>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Bell notification for critical alerts */}
              <div className="relative">
                <button 
                  onClick={() => setAlertsOpen(!alertsOpen)}
                  className={cn(
                    "relative p-2 rounded-xl border border-slate-200 transition-all hover:bg-slate-50 cursor-pointer flex items-center justify-center",
                    alerts.length > 0 ? "bg-red-50/70 border-red-200 text-red-600 animate-pulse" : "bg-white text-slate-600"
                  )}
                  title="Alertas Epidemiológicos & Emergências"
                >
                  <Bell className="h-4 w-4" />
                  {alerts.length > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-red-600 text-white font-extrabold text-[9px] h-5 w-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                      {alerts.length}
                    </span>
                  )}
                </button>
              </div>

               <div className="flex items-center gap-2 px-3 py-1.5 border border-slate-200 rounded-md text-xs bg-slate-50 font-medium">
                  <Activity className="h-3.5 w-3.5 text-blue-500" />
                  <span className="text-slate-600">Sistema Conectado</span>
               </div>
            </div>
          </header>
        )}

        {/* Global Slide-Over Panel for Epidemic Alerts */}
        {alertsOpen && (
          <>
            <div 
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 print:hidden" 
              onClick={() => setAlertsOpen(false)}
            />
            <div className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl z-50 flex flex-col border-l border-slate-200 print:hidden animate-slide-in">
              <header className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div>
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <ShieldAlert className="h-5 w-5 text-red-600" />
                    Central de Alertas e Disparos
                  </h3>
                  <p className="text-[10px] text-slate-505 font-bold mt-1 uppercase">Monitorização SMTP e SMS do Lubango</p>
                </div>
                <button 
                  onClick={() => setAlertsOpen(false)}
                  className="p-1.5 rounded-lg text-slate-450 hover:text-slate-750 hover:bg-slate-100 transition-all cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </header>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {alerts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-center p-6 text-slate-400">
                    <div className="h-12 w-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-300 mb-4 border border-dashed border-slate-300">
                      <Bell className="h-6 w-6" />
                    </div>
                    <p className="text-xs font-black uppercase tracking-wider text-slate-500">Sem Alertas Activos</p>
                    <p className="text-[10px] text-slate-400 mt-2 max-w-xs leading-relaxed">
                      O canal automático de SMTP para Emails e canal de SMS para telemóveis do Lubango está operacional e em standby.
                    </p>
                  </div>
                ) : (
                  alerts.map((item) => (
                    <div 
                      key={item.id} 
                      className={cn(
                        "p-4 rounded-2xl border transition-all text-xs relative overflow-hidden shadow-sm",
                        item.type === 'emergency' 
                          ? "bg-red-50/40 border-red-100" 
                          : "bg-amber-50/40 border-amber-100"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "p-2 rounded-xl shrink-0 border",
                          item.type === 'emergency' 
                            ? "bg-red-50 border-red-200 text-red-600" 
                            : "bg-amber-50 border-amber-200 text-amber-600"
                        )}>
                          {item.type === 'emergency' ? (
                            <ShieldAlert className="h-4 w-4" />
                          ) : (
                            <AlertTriangle className="h-4 w-4" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1 space-y-1">
                          <h4 className="font-extrabold text-slate-800 leading-tight">
                            {item.title}
                          </h4>
                          <p className="text-[10px] text-slate-500 font-bold flex items-center gap-1">
                            <Calendar className="h-3 w-3 inline" />
                            {new Date(item.triggeredAt).toLocaleString('pt-AO')} • localidade: {item.city}
                          </p>
                          <p className="text-slate-600 text-[11px] leading-relaxed pt-1.5 font-medium">
                            {item.message}
                          </p>

                          <div className="mt-3.5 pt-3 border-t border-slate-200/50 space-y-2">
                            <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">
                              Canal de Saída & Status:
                            </p>
                            
                            {/* Email Details */}
                            <div className="flex items-center justify-between gap-2 p-1.5 rounded-lg bg-white/60 border border-slate-100">
                              <span className="flex items-center gap-1.5 text-slate-500 font-bold truncate max-w-[190px]" title={item.recipientEmail}>
                                <Mail className="h-3.5 w-3.5 text-slate-450 shrink-0" />
                                {item.recipientEmail}
                              </span>
                              <span className="bg-emerald-50 text-emerald-750 border border-emerald-200 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0">
                                Email Enviado (SMTP)
                              </span>
                            </div>

                            {/* SMS Details */}
                            <div className="flex items-center justify-between gap-2 p-1.5 rounded-lg bg-white/60 border border-slate-100">
                              <span className="flex items-center gap-1.5 text-slate-500 font-bold shrink-0">
                                <Phone className="h-3.5 w-3.5 text-slate-450 text-slate-400 shrink-0" />
                                {item.recipientPhone}
                              </span>
                              <span className="bg-emerald-50 text-emerald-750 border border-emerald-200 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0">
                                SMS Enviado (Unitel)
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {alerts.length > 0 && (
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-3 print:hidden">
                  <button
                    onClick={handleClearAllAlerts}
                    className="w-full py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-600 text-xs font-black rounded-xl transition-all active:scale-95 uppercase tracking-wider cursor-pointer"
                  >
                    Marcar Como Lido / Limpar Central
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {/* Mobile Menu Overlay */}
        {menuOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900 p-6 md:hidden text-white print:hidden">
            <div className="flex items-center justify-between mb-8 border-b border-slate-700 pb-4">
               <h1 className="text-xl font-bold tracking-tight text-blue-450">PIONEIRO ZECA</h1>
               <button onClick={() => setMenuOpen(false)}><X className="h-6 w-6" /></button>
            </div>
            <nav className="space-y-4">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavigate(item.id)}
                  className={cn(
                    "flex w-full items-center gap-4 py-3 text-lg font-medium",
                    currentView === item.id ? "text-blue-400" : "text-slate-300"
                  )}
                >
                  <item.icon className="h-6 w-6" />
                  {item.label}
                </button>
              ))}
            </nav>
            <div className="mt-8 border-t border-slate-700 pt-8">
               <button onClick={() => signOut(auth)} className="flex items-center gap-4 text-red-400 font-bold">
                  <LogOut className="h-6 w-6" /> Sair
               </button>
            </div>
          </div>
        )}
        
        <div className={cn(
          "flex-1 overflow-auto print:overflow-visible print:p-0",
          ['landing', 'login', 'register'].includes(currentView) ? "" : "p-8"
        )}>
          <div className={cn(
            "max-w-7xl mx-auto h-full print:max-w-none print:w-full",
            ['landing', 'login', 'register'].includes(currentView) ? "" : "flex flex-col gap-6"
          )}>
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};
