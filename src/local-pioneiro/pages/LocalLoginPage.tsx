import React, { useState } from "react";
import { useLocalAuth } from "../context/LocalAuthContext";
import { Activity, Mail, Lock, AlertCircle, Chrome, User } from "lucide-react";

export default function LocalLoginPage({ onNavigate }: { onNavigate: (view: any) => void }) {
  const { signIn, signInWithGoogle } = useLocalAuth();
  const [role, setRole] = useState<"staff" | "admin">("staff");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      let resolvedEmail = "";
      let resolvedName = "";

      if (role === "staff") {
        const cleanUser = username.trim().toLowerCase();
        if (!cleanUser) {
          throw new Error("Por favor, introduza o seu nome de utilizador.");
        }
        resolvedEmail = `${cleanUser}@pioneirozeca.local`;
        resolvedName = username.charAt(0).toUpperCase() + username.slice(1);
      } else {
        const cleanEmail = email.trim().toLowerCase();
        if (!cleanEmail) {
          throw new Error("Por favor, introduza o seu e-mail corporativo.");
        }
        resolvedEmail = cleanEmail;
        resolvedName = cleanEmail.split("@")[0].charAt(0).toUpperCase() + cleanEmail.split("@")[0].slice(1);
      }

      // Bypass Auth directly and save/verify user locally
      const profile = await signIn(resolvedEmail, role, resolvedName);
      
      onNavigate(profile.role === "admin" ? "dashboard" : "patients");
    } catch (err: any) {
      setError(err.message || "Erro de validação local.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");
    try {
      const profile = await signInWithGoogle();
      alert(`Sessão iniciada via Google: Bem-vindo, ${profile.name}!`);
      onNavigate(profile.role === "admin" ? "dashboard" : "patients");
    } catch (err: any) {
      setError(err.message || "Falha ao ligar com o Google.");
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
            Pioneiro Zeca <span className="text-emerald-400">Local</span>
          </h2>
          <p className="mt-2 text-xs text-slate-400 font-bold uppercase tracking-wider">
            Painel Sem Autenticação Obrigatória 🗄️
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-3 rounded-xl bg-red-950/40 border border-red-800/80 p-4 text-xs font-semibold text-red-400">
            <AlertCircle className="h-5 w-5 shrink-0 text-red-400" />
            <p>{error}</p>
          </div>
        )}

        {/* Operational Mode Toggle */}
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

        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          {role === "staff" ? (
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-widest mb-2">
                Nome de Operador (Utilizador)
              </label>
              <div className="relative rounded-2xl bg-slate-950 border border-slate-800 focus-within:border-emerald-500 transition-colors">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-500">
                  <User className="h-5 w-5" />
                </span>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="ex: adelina.enf"
                  className="w-full bg-transparent py-4 pl-12 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none"
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-widest mb-2">
                E-mail de Administrador
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
                  placeholder="ex: admin.hospital@demo.com"
                  className="w-full bg-transparent py-4 pl-12 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-widest mb-2">
              Palavra-passe (Qualquer valor é aceite)
            </label>
            <div className="relative rounded-2xl bg-slate-950 border border-slate-800 focus-within:border-emerald-500 transition-colors">
              <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-500">
                <Lock className="h-5 w-5" />
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Introduza qualquer passe offline"
                className="w-full bg-transparent py-4 pl-12 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full cursor-pointer rounded-2xl bg-emerald-600 py-4 text-xs font-black uppercase tracking-widest text-white shadow-xl hover:bg-emerald-500 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {loading ? "A processar..." : "Entrar no Sistema Local"}
          </button>
        </form>

        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-slate-800"></div>
          <span className="flex-shrink mx-4 text-[10px] font-black uppercase text-slate-600 tracking-widest">OU</span>
          <div className="flex-grow border-t border-slate-800"></div>
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="flex w-full cursor-pointer items-center justify-center gap-3 rounded-2xl border border-slate-800 bg-slate-950 py-4 text-xs font-black uppercase tracking-widest text-white hover:bg-slate-900 active:scale-[0.98] transition-all"
        >
          <Chrome className="h-5 w-5 text-emerald-400" />
          Conectar com o Google
        </button>

        <div className="text-center pt-2">
          <button
            onClick={() => onNavigate("register")}
            className="text-xs font-semibold text-emerald-400 hover:underline"
          >
            Ainda não tem conta de Operador? Cadastre-se aqui
          </button>
        </div>
      </div>
    </div>
  );
}
