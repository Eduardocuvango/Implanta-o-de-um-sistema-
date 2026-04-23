import React, { useState } from 'react';
import { createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { userService } from '../services/userService';
import { dataService } from '../services/dataService';
import { Activity, User, Mail, Lock, Signature, Shield, AlertCircle, Chrome } from 'lucide-react';

export default function RegisterPage({ onNavigate }: { onNavigate: (view: any) => void }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'admin' as 'admin', // Restricted to admin only
    adminCode: '' // Security code for first setup
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, adminCode would be checked against a server secret or env
    if (formData.adminCode !== 'PIONEIRO2026') {
      setError('Código de Autenticação Administrativa inválido.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const staffId = await dataService.getNextStaffId();
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      await userService.createProfile({
        uid: userCredential.user.uid,
        name: formData.name,
        email: formData.email,
        role: 'admin',
        staffId
      });
      onNavigate('dashboard');
    } catch (err: any) {
      setError(err.message || 'Erro ao criar conta administrativa.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    setError('O registo administrativo via Google deve ser autorizado previamente.');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="bg-[#0f172a] p-8 text-center border-b border-slate-800">
           <div className="bg-blue-600 w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-600/30">
              <Shield className="text-white h-6 w-6" />
           </div>
           <h1 className="text-2xl font-bold tracking-tight text-blue-400 uppercase">Acesso Administrativo</h1>
           <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1 font-bold">Portal de Gestão - Pioneiro Zeca</p>
        </div>

        <div className="p-8">
          <div className="mb-8">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Novo Administrador</h2>
            <p className="text-sm text-slate-500 font-medium">Configure a conta mestre do sistema.</p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nome Completo</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300" />
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Administrador de Turno"
                  className="form-input pl-10"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Oficial</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300" />
                <input
                  required
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="admin@pioneirozeca.ao"
                  className="form-input pl-10"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300" />
                <input
                  required
                  type="password"
                  minLength={8}
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="form-input pl-10"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-red-400 uppercase tracking-wider">Código de Ativação Admin</label>
              <div className="relative">
                <Activity className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-red-300" />
                <input
                  required
                  type="text"
                  value={formData.adminCode}
                  onChange={(e) => setFormData({...formData, adminCode: e.target.value})}
                  placeholder="Introduza o código mestre"
                  className="form-input pl-10 border-red-100 bg-red-50/10 focus:border-red-400"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-md bg-red-50 p-3 text-[11px] font-bold text-red-600 border border-red-100">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            <div className="pt-4 space-y-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-slate-900 py-4 text-xs font-black text-white shadow-xl transition-all hover:bg-slate-800 active:scale-95 disabled:opacity-50 uppercase tracking-widest"
              >
                {loading ? 'AUTENTICANDO...' : 'ATIVAR CONTA ADMINISTRADOR'}
              </button>
              <button
                type="button"
                onClick={() => onNavigate('login')}
                className="w-full text-center text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-widest"
              >
                Voltar ao Login
              </button>
            </div>
          </form>
        </div>
      </div>
      <style>{`
        .form-input {
          width: 100%;
          border-radius: 6px;
          border: 1px solid #e2e8f0;
          background: #f8fafc;
          padding: 0.6rem 0.75rem;
          font-size: 0.75rem;
          font-weight: 500;
          transition: all 0.15s;
        }
        .form-input:focus {
          border-color: #2563eb;
          background: white;
          outline: none;
          box-shadow: 0 0 0 1px #2563eb;
        }
      `}</style>
    </div>
  );
}
