import React from "react";
import { useLocalAuth } from "../context/LocalAuthContext";
import { User, Shield, Briefcase, Mail, Key } from "lucide-react";

export default function LocalProfilePage() {
  const { profile } = useLocalAuth();

  return (
    <div className="max-w-xl mx-auto space-y-6 bg-slate-950 p-6 min-h-[80vh] text-white">
      <div>
        <h1 className="text-2xl font-black text-white">Perfil do Operador</h1>
        <p className="text-xs text-slate-400">Verifique as suas informações de acesso e credenciais físicas locais.</p>
      </div>

      <div className="rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-sm text-center relative overflow-hidden">
        {/* Decorative Badge */}
        <div className="absolute top-4 right-4 rounded-full bg-emerald-950/50 border border-emerald-800/80 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-emerald-400">
          Sessão Local Persistida
        </div>

        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-3xl bg-slate-950 border border-slate-800 text-emerald-400 shadow-inner">
          <User className="h-12 w-12" />
        </div>

        <h2 className="mt-6 text-xl font-bold text-white">{profile?.name || "Operador Sem Nome"}</h2>
        <span className="mt-1 inline-block px-3 py-1 rounded-full bg-slate-950 border border-slate-800 text-[10px] font-black uppercase tracking-widest text-[#94a3b8]">
          {profile?.role === "admin" ? "Diretor Clínico" : "Operador de Triagem"}
        </span>

        <div className="mt-8 space-y-4 text-left border-t border-slate-800 pt-6">
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-slate-950 border border-slate-800 p-3 text-slate-400">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Correio Eletrónico</p>
              <p className="text-sm font-semibold text-white">{profile?.email || "sem-email@local.local"}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-slate-950 border border-slate-800 p-3 text-slate-400">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Identificador Clínico (Staff ID)</p>
              <p className="text-sm font-mono font-bold text-emerald-400">{profile?.staffId || "OP-DEMO"}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-slate-950 border border-slate-800 p-3 text-slate-400">
              <Briefcase className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Limites de Acesso</p>
              <p className="text-sm font-semibold text-slate-300">
                {profile?.role === "admin" 
                  ? "Acesso Total Administrativo e Epidemiológico" 
                  : "Admissão e Controle de Fichas de Triage"
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
