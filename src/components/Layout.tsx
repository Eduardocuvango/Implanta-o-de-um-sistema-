import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, LayoutDashboard, Table as TableIcon, User, Home, Activity, X, Settings } from 'lucide-react';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { cn } from '../lib/utils';
import { adminService } from '../services/adminService';
import { dataService } from '../services/dataService';

interface LayoutProps {
  children: React.ReactNode;
  currentView: string;
  onNavigate: (view: any) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentView, onNavigate }) => {
  const { user, profile } = useAuth();
  const [menuOpen, setMenuOpen] = React.useState(false);

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

  const menuItems = [
    { id: 'landing', label: 'Dashboard Resumo', icon: Home, show: true },
    { id: 'patients', label: 'Recolha de Dados', icon: TableIcon, show: !!user },
    { id: 'dashboard', label: 'Análise Estratégica', icon: LayoutDashboard, show: profile?.role === 'admin' },
    { id: 'settings', label: 'Admin / Alertas', icon: Settings, show: profile?.role === 'admin' },
    { id: 'profile', label: 'Perfil / Config', icon: User, show: !!user },
  ].filter(item => item.show);

  const handleNavigate = (id: any) => {
    onNavigate(id);
    setMenuOpen(false);
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800 overflow-hidden">
      {/* Sidebar */}
      {user && !['landing', 'login', 'register'].includes(currentView) && (
        <aside className="w-64 bg-[#0f172a] text-white flex flex-col hidden md:flex shrink-0">
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
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header Bar */}
        {user && !['landing', 'login', 'register'].includes(currentView) && (
          <header className="h-16 bg-white border-b flex items-center justify-between px-8 shadow-sm shrink-0">
            <div className="flex items-center gap-4">
               <button onClick={() => setMenuOpen(true)} className="md:hidden">
                <LayoutDashboard className="h-6 w-6 text-slate-600" />
              </button>
              <span className="text-slate-400 text-xs font-medium uppercase tracking-wider hidden sm:inline">
                Pioneiro Zeca / {menuItems.find(i => i.id === currentView)?.label}
              </span>
            </div>
            
            <div className="flex items-center gap-4">
               <div className="flex items-center gap-2 px-3 py-1.5 border border-slate-200 rounded-md text-xs bg-slate-50 font-medium">
                  <Activity className="h-3.5 w-3.5 text-blue-500" />
                  <span className="text-slate-600">Sistema Conectado</span>
               </div>
            </div>
          </header>
        )}

        {/* Mobile Menu Overlay */}
        {menuOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900 p-6 md:hidden text-white">
            <div className="flex items-center justify-between mb-8 border-b border-slate-700 pb-4">
               <h1 className="text-xl font-bold tracking-tight text-blue-400">PIONEIRO ZECA</h1>
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
          "flex-1 overflow-auto",
          ['landing', 'login', 'register'].includes(currentView) ? "" : "p-8"
        )}>
          <div className={cn(
            "max-w-7xl mx-auto h-full",
            ['landing', 'login', 'register'].includes(currentView) ? "" : "flex flex-col gap-6"
          )}>
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};
