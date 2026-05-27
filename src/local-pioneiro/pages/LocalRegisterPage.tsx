import React, { useState } from "react";
import { useLocalAuth } from "../context/LocalAuthContext";
import { Activity, Mail, Lock, AlertCircle, Chrome, User, Shield } from "lucide-react";

export default function LocalRegisterPage({ onNavigate }: { onNavigate: (view: any) => void }) {
  const { register, signInWithGoogle } = useLocalAuth();
  const [role, setRole] = useState<"staff" | "admin">("staff");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [staffId, setStaffId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const cleanEmail = email.trim().toLowerCase();
      if (!cleanEmail) {
        throw new Error("Por favor, introduza o e-mail.");
      }
      
      const cleanName = name.trim();
      if (!cleanName) {
        throw new Error("Por favor, introduza o seu nome.");
      }

      await register(cleanEmail, role, cleanName, staffId || undefined);
      alert("Sucesso: Perfil de operador registado localmente sem autenticação externa!");
      onNavigate(role === "admin" ? "dashboard" : "patients");
    } catch (err: any) {
      setError(err.message || "Erro de registo local.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    setLoading(true);
    setError("");
    try {
      const profile = await signInWithGoogle();
      alert(`Registo completado via Google: Bem-vindo, ${profile.name}!`);
      onNavigate(profile.role === "admin" ? "dashboard" : "patients");
    } catch (err: any) {
      setError(err.message || "Falha ao registar com o Google.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-12 selection:bg-emerald-800 selection:text-white">
      <div className="w-full max-w-md space-y-8 rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
        <div className="text-center">
          <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 shadow-lg shadow-emerald-500/20">
            <Activity className="h-7 w-7 text-white" />
          </div>
          <h2 className="mt-6 text-2xl font-black tracking-tight text-white">
            Criar Conta <span className="text-emerald-400">Local</span>
          </h2>
          <p className="mt-2 text-xs text-slate-400 font-bold uppercase tracking-wider">
            Registo Rápido sem Net / Firebase 🗄️
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-3 rounded-xl bg-red-950/40 border border-red-800/80 p-4 text-xs font-semibold text-red-400">
            <AlertCircle className="h-5 w-5 shrink-0 text-red-400" />
            <p>{error}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-950 p-1 border border-slate-800">
          <button
            type="button"
            onClick={() => { setRole("staff"); setError(""); }}
            className={`rounded-lg py-2.5 text-xs font-bold transition-all uppercase tracking-wider ${
              role === "staff" ? "bg-emerald-600 text-white shadow" : "text-slate-400 hover:text-white"
            }`}
          >
            Operador de Triagem
          </button>
          <button
            type="button"
            onClick={() => { setRole("admin"); setError(""); }}
            className={`rounded-lg py-2.5 text-xs font-bold transition-all uppercase tracking-wider ${
              role === "admin" ? "bg-emerald-600 text-white shadow" : "text-slate-400 hover:text-white"
            }`}
          >
            Diretor Clínico
          </button>
        </div>

        <form className="mt-8 space-y-5" onSubmit={handleRegister}>
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-widest mb-1.5">
              Nome Completo do Operador
            </label>
            <div className="relative rounded-2xl bg-slate-950 border border-slate-800 focus-within:border-emerald-500 transition-colors">
              <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-500">
                <User className="h-5 w-5" />
              </span>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ex: Dr. António Valente"
                className="w-full bg-transparent py-3.5 pl-12 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-widest mb-1.5">
              Endereço de E-mail
            </label>
            <div className="relative rounded-2xl bg-slate-950 border border-slate-800 focus-within:border-emerald-500 transition-colors">
              <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-500">
                <Mail className="h-5 w-5" />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ex: operador@hospital.local"
                className="w-full bg-transparent py-3.5 pl-12 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-widest mb-1.5">
              Código de Identificação / ID de Operador (Opcional)
            </label>
            <div className="relative rounded-2xl bg-slate-950 border border-slate-800 focus-within:border-emerald-500 transition-colors">
              <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-500">
                <Shield className="h-5 w-5" />
              </span>
              <input
                type="text"
                value={staffId}
                onChange={(e) => setStaffId(e.target.value)}
                placeholder="ex: OP-29 (opcional)"
                className="w-full bg-transparent py-3.5 pl-12 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-widest mb-1.5">
              Escolha uma senha
            </label>
            <div className="relative rounded-2xl bg-slate-950 border border-slate-800 focus-within:border-emerald-500 transition-colors">
              <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-500">
                <Lock className="h-5 w-5" />
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Pode ser qualquer palavra passe"
                className="w-full bg-transparent py-3.5 pl-12 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full cursor-pointer rounded-2xl bg-emerald-600 py-4 text-xs font-black uppercase tracking-widest text-white shadow-xl hover:bg-emerald-500 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {loading ? "A processar..." : "Registar e Iniciar Sessão"}
          </button>
        </form>

        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-slate-800"></div>
          <span className="flex-shrink mx-4 text-[10px] font-black uppercase text-slate-600 tracking-widest">OU</span>
          <div className="flex-grow border-t border-slate-800"></div>
        </div>

        <button
          onClick={handleGoogleRegister}
          disabled={loading}
          className="flex w-full cursor-pointer items-center justify-center gap-3 rounded-2xl border border-slate-800 bg-slate-950 py-4 text-xs font-black uppercase tracking-widest text-white hover:bg-slate-900 active:scale-[0.98] transition-all"
        >
          <Chrome className="h-5 w-5 text-emerald-400" />
          Registrar via Google
        </button>

        <div className="text-center pt-2">
          <button
            onClick={() => onNavigate("login")}
            className="text-xs font-semibold text-emerald-400 hover:underline"
          >
            Já possui acesso? Clique aqui para entrar
          </button>
        </div>
      </div>
    </div>
  );
}
