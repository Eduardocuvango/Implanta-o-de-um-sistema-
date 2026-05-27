/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import PatientsPage from './pages/PatientsPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import { Layout } from './components/Layout';
import LocalApp from './local-pioneiro/App';
import { Database } from 'lucide-react';

function AppContent({ onSwitchToLocal }: { onSwitchToLocal: () => void }) {
  const { user, profile, loading } = useAuth();
  const [view, setView] = useState<'landing' | 'login' | 'register' | 'dashboard' | 'patients' | 'profile' | 'settings'>('landing');

  // Auto-redirect authenticated users
  useEffect(() => {
    if (!loading && user && profile) {
      if (view === 'landing' || view === 'login' || view === 'register') {
        setView(profile.role === 'admin' ? 'dashboard' : 'patients');
      }
    }
  }, [user, profile, loading, view]);

  // Redirect to landing on sign out
  useEffect(() => {
    if (!loading && !user) {
      if (view !== 'landing' && view !== 'login' && view !== 'register') {
        setView('landing');
      }
    }
  }, [user, loading, view]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#f5f5f0]">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  // Route protection & RBAC
  const navigate = (newView: typeof view) => {
    if (!user && (newView === 'dashboard' || newView === 'patients' || newView === 'profile' || newView === 'settings')) {
      setView('login');
      return;
    }

    // Role-based restrictions
    if (profile?.role === 'staff') {
      if (newView === 'dashboard' || newView === 'settings' || newView === 'profile') {
        setView('patients');
        return;
      }
    }

    setView(newView);
  };

  const renderView = () => {
    switch (view) {
      case 'landing': return <LandingPage onNavigate={navigate} />;
      case 'login': return <LoginPage onNavigate={navigate} />;
      case 'register': return <RegisterPage onNavigate={navigate} />;
      case 'dashboard': return <DashboardPage />;
      case 'patients': return <PatientsPage />;
      case 'profile': return <ProfilePage />;
      case 'settings': return <SettingsPage />;
      default: return <LandingPage onNavigate={navigate} />;
    }
  };

  return (
    <div className="relative">
      {/* Dynamic Offline / Local Mode suggestions for Landing, Login, and Register */}
      {(view === 'landing' || view === 'login' || view === 'register') && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce">
          <button
            onClick={onSwitchToLocal}
            className="flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-4 text-xs font-black uppercase tracking-widest text-white shadow-2xl hover:bg-emerald-500 cursor-pointer transition-all active:scale-95"
          >
            <Database className="h-4.5 w-4.5" />
            Aceder à Cópia Local (Sem Autenticação) 🗄️
          </button>
        </div>
      )}

      <Layout currentView={view} onNavigate={navigate}>
        {renderView()}
      </Layout>
    </div>
  );
}

export default function App() {
  const [localMode, setLocalMode] = useState<boolean>(() => {
    return localStorage.getItem('op_mode_pioneiro') === 'local';
  });

  const handleSwitchToLocal = () => {
    localStorage.setItem('op_mode_pioneiro', 'local');
    setLocalMode(true);
  };

  const handleReturnToCloud = () => {
    localStorage.setItem('op_mode_pioneiro', 'cloud');
    setLocalMode(false);
  };

  if (localMode) {
    return <LocalApp onReturnToCloud={handleReturnToCloud} />;
  }

  return (
    <AuthProvider>
      <AppContent onSwitchToLocal={handleSwitchToLocal} />
    </AuthProvider>
  );
}
