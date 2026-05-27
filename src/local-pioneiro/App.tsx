import React, { useState } from "react";
import { LocalAuthProvider, useLocalAuth } from "./context/LocalAuthContext";
import LocalLandingPage from "./pages/LocalLandingPage";
import LocalLoginPage from "./pages/LocalLoginPage";
import LocalRegisterPage from "./pages/LocalRegisterPage";
import LocalDashboardPage from "./pages/LocalDashboardPage";
import LocalPatientsPage from "./pages/LocalPatientsPage";
import LocalProfilePage from "./pages/LocalProfilePage";
import LocalSettingsPage from "./pages/LocalSettingsPage";
import {
  Activity, LayoutDashboard, Users, User, Settings, LogOut, Globe, ShieldCheck
} from "lucide-react";

type Views = "landing" | "login" | "register" | "dashboard" | "patients" | "profile" | "settings";

function LocalAppContent({ onReturnToCloud }: { onReturnToCloud: () => void }) {
  const { user, profile, loading, signOut } = useLocalAuth();
  const [view, setView] = useState<Views>("landing");

  // Router protection & RBAC helper
  const navigate = (newView: Views) => {
    if (!user && (newView === "dashboard" || newView === "patients" || newView === "profile" || newView === "settings")) {
      setView("login");
      return;
    }
    // Operator restrictions
    if (profile?.role === "staff") {
      if (newView === "dashboard" || newView === "settings" || newView === "profile") {
        setView("patients");
        return;
      }
    }
    setView(newView);
  };

  const currentViewComponent = () => {
    switch (view) {
      case "landing": return <LocalLandingPage onNavigate={navigate} />;
      case "login": return <LocalLoginPage onNavigate={navigate} />;
      case "register": return <LocalRegisterPage onNavigate={navigate} />;
      case "dashboard": return <LocalDashboardPage />;
      case "patients": return <LocalPatientsPage />;
      case "profile": return <LocalProfilePage />;
      case "settings": return <LocalSettingsPage />;
      default: return <LocalLandingPage onNavigate={navigate} />;
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-950">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
      </div>
    );
  }

  // If we are logged in, we render the layout with sidebar & upper indicator
  if (user && profile && view !== "landing" && view !== "login" && view !== "register") {
    return (
      <div className="flex min-h-screen bg-slate-950 text-white font-sans selection:bg-emerald-800 selection:text-white">
        {/* Left Sidebar Layout */}
        <aside className="fixed inset-y-0 left-0 z-40 w-64 border-r border-slate-800 bg-slate-900 flex flex-col justify-between">
          <div className="p-6">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-600 p-2 rounded-xl shadow-md">
                <Activity className="h-5 w-5 text-white animate-pulse" />
              </div>
              <div>
                <h1 className="text-sm font-black tracking-tight text-white leading-none">PIONEIRO <span className="text-emerald-500">ZECA</span></h1>
                <p className="text-[9px] text-emerald-400 font-bold uppercase tracking-widest mt-1">Sessão Local</p>
              </div>
            </div>

            {/* Navigation links */}
            <nav className="mt-10 space-y-2">
              {profile.role === "admin" && (
                <button
                  onClick={() => navigate("dashboard")}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-xs font-bold uppercase tracking-widest cursor-pointer transition-all ${
                    view === "dashboard" ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20" : "text-slate-400 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Painel Geral
                </button>
              )}

              <button
                onClick={() => navigate("patients")}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-xs font-bold uppercase tracking-widest cursor-pointer transition-all ${
                  view === "patients" ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/20" : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Users className="h-4 w-4" />
                Fichas Triagem
              </button>

              <button
                onClick={() => navigate("profile")}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-xs font-bold uppercase tracking-widest cursor-pointer transition-all ${
                  view === "profile" ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/20" : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <User className="h-4 w-4" />
                Meu Perfil
              </button>

              {profile.role === "admin" && (
                <button
                  onClick={() => navigate("settings")}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-xs font-bold uppercase tracking-widest cursor-pointer transition-all ${
                    view === "settings" ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/20" : "text-slate-400 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <Settings className="h-4 w-4" />
                  Definições
                </button>
              )}
            </nav>
          </div>

          <div className="p-6 border-t border-slate-800 space-y-3 bg-slate-950/40">
            {/* Operator info label */}
            <div className="flex items-center gap-3 p-1 rounded-lg">
              <div className="h-8 w-8 rounded-lg bg-slate-800 flex items-center justify-center text-xs font-black text-emerald-400 border border-slate-700">
                {profile.name.charAt(0).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-black truncate">{profile.name}</p>
                <p className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider">{profile.staffId}</p>
              </div>
            </div>

            <button
              onClick={() => { signOut().then(() => setView("landing")); }}
              className="flex w-full items-center gap-3 rounded-xl hover:bg-slate-800 px-4 py-3 text-xs font-bold uppercase tracking-widest text-red-400 cursor-pointer transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sair da Conta
            </button>
          </div>
        </aside>

        {/* Right Dashboard Container Panel */}
        <div className="flex-1 pl-64 flex flex-col min-h-screen">
          <header className="h-20 border-b border-slate-800 bg-slate-900/40 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-8">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-emerald-950 border border-emerald-800/80 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-emerald-400">
                Offline LocalStorage ativado
              </span>
            </div>
            
            <button
              onClick={onReturnToCloud}
              className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white uppercase tracking-wider cursor-pointer transition-colors"
            >
              <Globe className="h-4 w-4" />
              Voltar ao Modo Cloud
            </button>
          </header>

          <main className="flex-1 p-8 bg-slate-950 overflow-y-auto">
            {currentViewComponent()}
          </main>
        </div>
      </div>
    );
  }

  // Not logged in or landing page view
  return (
    <div className="bg-slate-950 min-h-screen">
      {/* Absolute Header Option to fallback back to Cloud */}
      <div className="absolute top-4 left-6 z-50 flex items-center gap-6">
        <button
          onClick={onReturnToCloud}
          className="flex items-center gap-2 rounded-xl bg-slate-900 border border-slate-800 px-4 py-2 text-xs font-bold uppercase tracking-widest leading-none text-slate-400 hover:text-white cursor-pointer transition-all"
        >
          <Globe className="h-3.5 w-3.5" />
          Voltar para MODO CLOUD (Firebase)
        </button>
      </div>

      {currentViewComponent()}
    </div>
  );
}

export default function LocalApp({ onReturnToCloud }: { onReturnToCloud: () => void }) {
  return (
    <LocalAuthProvider>
      <LocalAppContent onReturnToCloud={onReturnToCloud} />
    </LocalAuthProvider>
  );
}
