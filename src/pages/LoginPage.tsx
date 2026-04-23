import React, { useState } from 'react';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { userService } from '../services/userService';
import { adminService } from '../services/adminService';
import { Activity, Lock, Mail, AlertCircle, Chrome } from 'lucide-react';

export default function LoginPage({ onNavigate }: { onNavigate: (view: any) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      // 1. Check if profile exists and is admin, otherwise check whitelist
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      const profile = await userService.getProfile(user.uid);
      
      // If no profile, it must be an authorized staff first-time login
      if (!profile) {
        const authorizedData = await adminService.getAuthorizedUser(user.email || '');
        if (!authorizedData) {
          await signOut(auth);
          setError('Acesso Negado: Entre em contacto com o Administrador para ser autorizado.');
          return;
        }
        // Auto-create profile for authorized staff
        await userService.createProfile({
          uid: user.uid,
          email: user.email || '',
          name: user.displayName || 'Utilizador Autorizado',
          role: 'staff',
          staffId: authorizedData.staffId
        });
      }
      
      onNavigate('patients');
    } catch (err: any) {
      setError('Credenciais inválidas ou acesso não autorizado.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      const profile = await userService.getProfile(user.uid);
      
      if (!profile) {
        // Staff must be pre-authorized by admin
        const authorizedData = await adminService.getAuthorizedUser(user.email || '');
        if (!authorizedData) {
          await signOut(auth);
          setError('Acesso Negado: Conta Google não autorizada pela administração.');
          return;
        }

        await userService.createProfile({
          uid: user.uid,
          email: user.email || '',
          name: user.displayName || 'Utilizador Google',
          role: 'staff',
          staffId: authorizedData.staffId
        });
      }
      onNavigate('patients');
    } catch (err: any) {
      console.error(err);
      setError('Falha na autenticação Google.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="bg-[#0f172a] p-8 text-center border-b border-slate-800">
          <h1 className="text-2xl font-bold tracking-tight text-blue-400">PIONEIRO ZECA</h1>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1 font-semibold">Sistema de Emergência Pediátrica</p>
        </div>

        <div className="p-8">
          <h2 className="text-xl font-bold text-slate-900 mb-2 font-sans tracking-tight">Utilizador Autorizado</h2>
          <p className="text-sm text-slate-500 mb-8 font-medium">Introduza as suas credenciais para aceder ao sistema.</p>

          <form className="space-y-4" onSubmit={handleLogin}>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Corporativo</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="exemplo@hospital.com"
                  className="w-full rounded-md border border-slate-200 bg-slate-50 p-3 pl-10 text-sm focus:border-blue-500 focus:outline-none transition-all placeholder:text-slate-300"
                />
              </div>
            </div>
            
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Senha de Segurança</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-md border border-slate-200 bg-slate-50 p-3 pl-10 text-sm focus:border-blue-500 focus:outline-none transition-all placeholder:text-slate-300"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-md bg-red-50 p-3 text-[11px] font-bold text-red-600 border border-red-100">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-blue-600 py-3 text-sm font-bold text-white shadow-lg transition-all hover:bg-blue-700 active:scale-95 disabled:opacity-50"
            >
              {loading ? 'AUTENTICANDO...' : 'ENTRAR NO SISTEMA'}
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-100"></span></div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold"><span className="bg-white px-3 text-slate-400">Ou continuar com</span></div>
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 rounded-md border border-slate-200 py-3 text-sm font-bold text-slate-700 transition-all hover:bg-slate-50 active:scale-95 disabled:opacity-50"
          >
            <Chrome className="h-4 w-4 text-slate-400" />
            CONTA GOOGLE PROFISSIONAL
          </button>

          <p className="mt-8 text-center text-xs text-slate-500">
            Ainda sem acesso?{' '}
            <button onClick={() => onNavigate('register')} className="font-bold text-blue-600 hover:underline underline-offset-4">Solicitar novo perfil</button>
          </p>
        </div>
      </div>
    </div>
  );
}
