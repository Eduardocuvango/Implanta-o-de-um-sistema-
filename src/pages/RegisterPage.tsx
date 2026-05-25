import React, { useState } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { userService } from '../services/userService';
import { adminService } from '../services/adminService';
import { dataService } from '../services/dataService';
import { translateFirebaseAuthError } from '../lib/utils';
import { Activity, User, Mail, Lock, AlertCircle, Chrome } from 'lucide-react';

export default function RegisterPage({ onNavigate }: { onNavigate: (view: any) => void }) {
  const [role, setRole] = useState<'staff' | 'admin'>('staff');
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      let resolvedEmail = '';
      if (role === 'staff') {
        const cleanUsername = formData.username.trim().toLowerCase();
        if (!cleanUsername) {
          throw new Error('Por favor, introduza um nome de utilizador válido.');
        }
        resolvedEmail = `${cleanUsername}@pioneirozeca.local`;
      } else {
        const cleanEmail = formData.email.trim().toLowerCase();
        if (!cleanEmail) {
          throw new Error('Por favor, introduza um e-mail corporativo válido.');
        }
        resolvedEmail = cleanEmail;
      }

      // Check authorization
      const adminExists = await userService.hasAnyAdmin();
      const isBootstrap = !adminExists && (resolvedEmail.toLowerCase() === 'eduardocuvangohd@gmail.com' || resolvedEmail.toLowerCase() === 'admin.hospital@demo.com');
      const authData = await adminService.getAuthorizedUser(resolvedEmail);

      if (!isBootstrap && !authData) {
        if (adminExists && (resolvedEmail.toLowerCase() === 'eduardocuvangohd@gmail.com' || resolvedEmail.toLowerCase() === 'admin.hospital@demo.com')) {
          throw new Error('O primeiro administrador (mãe) já se encontra registado no sistema. Qualquer nova conta deve ser autorizada por ele primeiro.');
        }
        if (role === 'staff') {
          throw new Error(`O nome de utilizador '${formData.username}' não está pré-autorizado no sistema. Solicite autorização ao Administrador.`);
        } else {
          throw new Error('O e-mail indicado não está cadastrado ou pré-autorizado por um administrador no sistema. Solicite autorização primeiro.');
        }
      }

      const assignedRole = isBootstrap ? 'admin' : (authData?.role || role);
      const assignedStaffId = authData?.staffId || await dataService.getNextStaffId();

      let user;
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, resolvedEmail, formData.password);
        user = userCredential.user;
      } catch (authErr: any) {
        if (authErr.code === 'auth/email-already-in-use') {
          try {
            const userCredential = await signInWithEmailAndPassword(auth, resolvedEmail, formData.password);
            user = userCredential.user;
          } catch (signInErr: any) {
            if (signInErr.code === 'auth/invalid-credential' || signInErr.code === 'auth/wrong-password') {
              throw new Error('Este utilizador já existe com outra senha. Introduza a senha correcta ou contacte o administrador.');
            }
            throw signInErr;
          }
        } else {
          throw authErr;
        }
      }

      const profile = await userService.getProfile(user.uid);
      if (!profile) {
        await userService.createProfile({
          uid: user.uid,
          name: formData.name,
          email: resolvedEmail,
          role: assignedRole,
          staffId: assignedStaffId
        });
      }
      onNavigate(assignedRole === 'admin' ? 'dashboard' : 'patients');
    } catch (err: any) {
      console.error(err);
      if (err.code) {
        setError(translateFirebaseAuthError(err.code));
      } else {
        setError(err.message || 'Erro ao criar conta. Verifique os dados introduzidos.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    setLoading(true);
    setError('');
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      const email = user.email || '';
      const adminExists = await userService.hasAnyAdmin();
      const isBootstrap = !adminExists && (email.toLowerCase() === 'eduardocuvangohd@gmail.com' || email.toLowerCase() === 'admin.hospital@demo.com');
      const authData = await adminService.getAuthorizedUser(email);

      if (!isBootstrap && !authData) {
        if (adminExists && (email.toLowerCase() === 'eduardocuvangohd@gmail.com' || email.toLowerCase() === 'admin.hospital@demo.com')) {
          setError('O primeiro administrador (mãe) já se encontra registado no sistema. Qualquer nova conta de administrador ou operador deve ser pré-cadastrada por ele.');
        } else {
          setError('O seu e-mail não está cadastrado ou pré-autorizado por um administrador no sistema. Solicite autorização primeiro.');
        }
        await signOut(auth);
        return;
      }

      const assignedRole = isBootstrap ? 'admin' : (authData?.role || 'staff');
      const assignedStaffId = authData?.staffId || await dataService.getNextStaffId();

      const profile = await userService.getProfile(user.uid);
      if (!profile) {
        await userService.createProfile({
          uid: user.uid,
          name: user.displayName || 'Utilizador Google',
          email: email,
          role: assignedRole as any,
          staffId: assignedStaffId
        });
      }
      onNavigate(assignedRole === 'admin' ? 'dashboard' : 'patients');
    } catch (err: any) {
      setError('Falha no registo via Google.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="bg-[#0f172a] p-8 text-center border-b border-slate-800">
           <div className="bg-blue-600 w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-600/30">
              <Activity className="text-white h-6 w-6" />
           </div>
           <h1 className="text-2xl font-bold tracking-tight text-blue-400 uppercase">Hospital Pioneiro Zeca</h1>
           <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1 font-bold">Portal de Acesso e Gestão</p>
        </div>

        <div className="p-8">
          <div className="flex gap-2 p-1 bg-slate-100 rounded-lg mb-6">
            <button
              type="button"
              onClick={() => { setRole('staff'); setError(''); }}
              className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${role === 'staff' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              CRIAR RECOLHA DE DADOS
            </button>
            <button
              type="button"
              onClick={() => { setRole('admin'); setError(''); }}
              className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${role === 'admin' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              CRIAR ADMINISTRADOR
            </button>
          </div>

          <div className="mb-6 text-center">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Registo de Perfil</h2>
            <p className="text-sm text-slate-500 font-medium font-sans">
              {role === 'staff' ? 'Registe-se com o seu nome de utilizador e senha.' : 'Registo de perfil para administradores clínicos.'}
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {role === 'staff' ? (
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nome de Utilizador</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300" />
                  <input
                    required
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                    placeholder="Ex: joao"
                    className="form-input pl-10"
                  />
                </div>
              </div>
            ) : (
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
            )}

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nome Completo</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300" />
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Nome Completo do Profissional"
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
                  minLength={6}
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  placeholder="Mínimo 6 caracteres"
                  className="form-input pl-10"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-md bg-red-50 p-3 text-[11px] font-bold text-red-600 border border-red-100">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            <div className="pt-2 space-y-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-blue-600 py-3.5 text-xs font-black text-white shadow-xl shadow-blue-600/20 transition-all hover:bg-blue-500 active:scale-95 disabled:opacity-50 uppercase tracking-widest"
              >
                {loading ? 'PROCESSANDO...' : role === 'staff' ? 'REGISTAR RECOLHEDOR DE DADOS' : 'CRIAR CONTA ADMINISTRATIVA'}
              </button>

              {role === 'admin' && (
                <>
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center text-slate-100"><span className="w-full border-t border-slate-100"></span></div>
                    <div className="relative flex justify-center text-[10px] uppercase font-bold"><span className="bg-white px-3 text-slate-400">Ou continuar com</span></div>
                  </div>

                  <button
                    type="button"
                    onClick={handleGoogleRegister}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-3 rounded-xl border border-slate-200 py-3.5 text-xs font-bold text-slate-700 transition-all hover:bg-slate-50 active:scale-95 disabled:opacity-50 uppercase tracking-widest"
                  >
                    <Chrome className="h-4 w-4 text-slate-400" />
                    Registar com Google
                  </button>
                </>
              )}
            </div>
          </form>

          <p className="mt-8 text-center text-xs text-slate-500">
            Já tem uma conta?{' '}
            <button onClick={() => onNavigate('login')} className="font-bold text-blue-600 hover:underline underline-offset-4 font-sans uppercase text-[10px] tracking-widest">Iniciar Sessão</button>
          </p>
        </div>
      </div>
      <style>{`
        .form-input {
          width: 100%;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          background: #f8fafc;
          padding: 0.75rem 0.85rem;
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
