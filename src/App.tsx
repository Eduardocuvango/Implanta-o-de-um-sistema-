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

function AppContent() {
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
      if (newView === 'dashboard' || newView === 'settings') {
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
    <Layout currentView={view} onNavigate={navigate}>
      {renderView()}
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
