import React, { useState } from 'react';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signOut, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { userService } from '../services/userService';
import { adminService } from '../services/adminService';
import { dataService } from '../services/dataService';
import { translateFirebaseAuthError } from '../lib/utils';
import { Activity, Lock, Mail, AlertCircle, Chrome, FlaskConical, User } from 'lucide-react';

export default function LoginPage({ onNavigate }: { onNavigate: (view: any) => void }) {
  const [role, setRole] = useState<'staff' | 'admin'>('staff');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      let resolvedEmail = '';
      if (role === 'staff') {
        const cleanUsername = username.trim().toLowerCase();
        if (!cleanUsername) {
          throw new Error('Por favor, introduza o seu nome de utilizador.');
        }
        resolvedEmail = `${cleanUsername}@pioneirozeca.local`;
      } else {
        const cleanEmail = email.trim().toLowerCase();
        if (!cleanEmail) {
          throw new Error('Por favor, introduza o seu e-mail corporativo.');
        }
        resolvedEmail = cleanEmail;
      }

      const userCredential = await signInWithEmailAndPassword(auth, resolvedEmail, password);
      const user = userCredential.user;
      
      const profile = await userService.getProfile(user.uid);
      
      if (!profile) {
        setError('Conta não encontrada nos nossos registos de perfil. Por favor, crie uma conta primeiro.');
        await signOut(auth);
        return;
      }
      
      onNavigate(profile.role === 'admin' ? 'dashboard' : 'patients');
    } catch (err: any) {
      console.error(err);
      if (err.code) {
        setError(translateFirebaseAuthError(err.code));
      } else {
        setError(err.message || 'Credenciais inválidas ou erro de conexão.');
      }
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
      
      let profile = await userService.getProfile(user.uid);
      
      if (!profile) {
        const email = user.email || '';
        const adminExists = await userService.hasAnyAdmin();
        const isBootstrap = !adminExists && (email.toLowerCase() === 'eduardocuvangohd@gmail.com' || email.toLowerCase() === 'admin.hospital@demo.com');
        const authData = await adminService.getAuthorizedUser(email);

        if (!isBootstrap && !authData) {
          if (adminExists && (email.toLowerCase() === 'eduardocuvangohd@gmail.com' || email.toLowerCase() === 'admin.hospital@demo.com')) {
            setError('O primeiro administrador (mãe) já se encontra registado. Qualquer nova conta de administrador ou operador deve ser cadastrada por ele no sistema.');
          } else {
            setError('O seu e-mail não está cadastrado ou pré-autorizado por um administrador no sistema. Solicite autorização primeiro.');
          }
          await signOut(auth);
          return;
        }

        const role = isBootstrap ? 'admin' : (authData?.role || 'staff');
        const staffId = authData?.staffId || await dataService.getNextStaffId();

        profile = {
          uid: user.uid,
          email: email,
          name: user.displayName || 'Utilizador Google',
          role: role as any,
          staffId
        };
        await userService.createProfile(profile);
      }
      onNavigate(profile.role === 'admin' ? 'dashboard' : 'patients');
    } catch (err: any) {
      console.error(err);
      setError('Falha na autenticação Google.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    setError('');
    const demoEmail = 'admin.hospital@demo.com';
    const demoPass = 'demo123456';

    try {
      const adminExists = await userService.hasAnyAdmin();
      const profiles = await userService.getAllProfiles();
      const demoProfileExists = profiles.some(p => p.email.toLowerCase() === demoEmail);

      if (adminExists && !demoProfileExists) {
        setError('O primeiro administrador (mãe) já se encontra registado no sistema. A criação de novos utilizadores via modo Demo foi bloqueada.');
        setLoading(false);
        return;
      }

      try {
        await signInWithEmailAndPassword(auth, demoEmail, demoPass);
        onNavigate('dashboard');
      } catch (signInErr: any) {
        try {
          const userCredential = await createUserWithEmailAndPassword(auth, demoEmail, demoPass);
          const staffId = await dataService.getNextStaffId();
          await userService.createProfile({
            uid: userCredential.user.uid,
            email: demoEmail,
            name: 'Diretor Clínico (Demo)',
            role: 'admin',
            staffId
          });
          onNavigate('dashboard');
        } catch (createErr: any) {
          if (createErr.code === 'auth/email-already-in-use') {
             setError('A conta demo já está em uso com uma senha diferente. Por favor, utilize o registo normal ou entre com outra conta.');
          } else {
             throw createErr;
          }
        }
      }
    } catch (err: any) {
      console.error(err);
      if (err.code) {
        setError(translateFirebaseAuthError(err.code));
      } else {
        setError('Erro ao iniciar modo demo. Tente a autenticação Google.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6 gap-4">
      <button 
        type="button"
        onClick={() => onNavigate('landing')}
        className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-slate-800 transition-all self-center bg-white border border-slate-200 px-5 py-2.5 rounded-xl shadow-sm hover:shadow active:scale-95 hover:-translate-y-0.5"
      >
        ← Voltar ao Início
      </button>
      <div className="w-full max-w-md bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="bg-[#0f172a] p-8 text-center border-b border-slate-800">
          <h1 className="text-2xl font-bold tracking-tight text-blue-400">PIONEIRO ZECA</h1>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1 font-semibold">Sistema de Emergência Pediátrica</p>
        </div>

        <div className="p-8">
          <div className="flex gap-2 p-1 bg-slate-100 rounded-lg mb-6">
            <button
              onClick={() => { setRole('staff'); setError(''); }}
              className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${role === 'staff' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              RECOLHA DE DADOS
            </button>
            <button
              onClick={() => { setRole('admin'); setError(''); }}
              className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${role === 'admin' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              ADMINISTRADOR
            </button>
          </div>

          <h2 className="text-xl font-bold text-slate-900 mb-2 font-sans tracking-tight">
            {role === 'staff' ? 'Portal de Recolha' : 'Acesso Administrativo'}
          </h2>
          <p className="text-sm text-slate-500 mb-6 font-medium">
            {role === 'staff' ? 'Entre com o seu nome de utilizador e senha.' : 'Entre com as credenciais administrativas e senha.'}
          </p>

          <form className="space-y-4" onSubmit={handleLogin}>
            {role === 'staff' ? (
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nome de Utilizador</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Ex: joao"
                    className="w-full rounded-md border border-slate-200 bg-slate-50 p-3 pl-10 text-sm focus:border-blue-500 focus:outline-none transition-all placeholder:text-slate-300"
                  />
                </div>
              </div>
            ) : (
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
            )}
            
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
              className="w-full rounded-xl bg-blue-600 py-3.5 text-xs font-black text-white shadow-lg transition-all hover:bg-blue-700 active:scale-95 disabled:opacity-50 uppercase tracking-widest"
            >
              {loading ? 'AUTENTICANDO...' : 'ENTRAR NO SISTEMA'}
            </button>
          </form>

          {role === 'admin' && (
            <>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-100"></span></div>
                <div className="relative flex justify-center text-[10px] uppercase font-bold"><span className="bg-white px-3 text-slate-400">Ou continuar com</span></div>
              </div>

              <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 rounded-xl border border-slate-200 py-3.5 text-xs font-bold text-slate-700 transition-all hover:bg-slate-50 active:scale-95 disabled:opacity-50 uppercase tracking-widest"
              >
                <Chrome className="h-4 w-4 text-slate-400" />
                CONTA GOOGLE PROFISSIONAL
              </button>

              <div className="mt-3">
                <button
                  onClick={handleDemoLogin}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 rounded-xl bg-amber-50 border border-amber-200 py-3.5 text-xs font-bold text-amber-700 transition-all hover:bg-amber-100 active:scale-95 disabled:opacity-50 uppercase tracking-widest"
                >
                  <FlaskConical className="h-4 w-4" />
                  ENTRAR COMO ADMIN DEMO
                </button>
              </div>
            </>
          )}

          <p className="mt-8 text-center text-xs text-slate-400 font-medium px-4 leading-relaxed">
            O registo de novos operadores recolhedores ou contas administrativas é gerido exclusivamente pelo administrador principal dentro das configurações do painel.
          </p>
        </div>
      </div>
    </div>
  );
}
