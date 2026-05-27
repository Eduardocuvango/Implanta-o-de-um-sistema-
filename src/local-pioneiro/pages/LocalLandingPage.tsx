import React from "react";
import { Activity, ShieldCheck, ArrowRight, Shield, Heart } from "lucide-react";

export default function LocalLandingPage({ onNavigate }: { onNavigate: (view: any) => void }) {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-blue-800 selection:text-white">
      {/* Top Header */}
      <nav className="fixed top-0 z-50 w-full bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
        <div className="mx-auto flex max-w-7xl h-20 items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-600 p-2 rounded-xl shadow-md">
              <Activity className="h-6 w-6 text-white animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white leading-none">
                PIONEIRO <span className="text-emerald-500">ZECA</span>
              </h1>
              <p className="text-[10px] text-emerald-400 uppercase tracking-widest font-black mt-1">
                Versão Local Offline 🗄️
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <button
              onClick={() => onNavigate("login")}
              className="text-xs font-bold text-slate-400 hover:text-emerald-400 transition-colors uppercase tracking-widest"
            >
              Entrar sem Autenticação
            </button>
            <button
              onClick={() => onNavigate("register")}
              className="rounded-xl bg-emerald-600 px-6 py-3 text-xs font-bold text-white shadow-xl hover:bg-emerald-500 transition-all uppercase tracking-widest active:scale-95"
            >
              Iniciar Cadastro
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-24 overflow-hidden flex items-center min-h-[80vh]">
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-900/20 rounded-full blur-[120px] -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-900/10 rounded-full blur-[100px] -ml-20 -mb-20"></div>

        <div className="relative z-10 mx-auto max-w-7xl px-6 w-full">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/50 border border-emerald-800/80 mb-8">
              <ShieldCheck className="h-4 w-4 text-emerald-400 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
                Executado Localmente com Node.js e LocalStorage
              </span>
            </div>

            <h2 className="text-5xl md:text-7xl font-black tracking-tighter text-white mb-8 leading-[0.95]">
              Banco de Dados <br />
              <span className="text-emerald-400">100% Local e Físico.</span>
            </h2>

            <p className="text-lg text-slate-400 font-medium mb-12 leading-relaxed max-w-2xl">
              Esta é a cópia integrada autónoma do sistema pediátrico do Lubango. Iniciará sessão instantaneamente com qualquer email de operador sem necessitar de registos na Google Cloud ou restrições de internet.
            </p>

            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => onNavigate("login")}
                className="group flex items-center gap-3 rounded-2xl bg-emerald-600 px-10 py-5 text-sm font-black text-white shadow-2xl shadow-emerald-600/30 hover:bg-emerald-500 transition-all active:scale-95 uppercase tracking-widest cursor-pointer"
              >
                Aceder ao Painel Local
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </button>
              <button
                onClick={() => onNavigate("register")}
                className="rounded-2xl border border-slate-700 bg-slate-800/40 px-10 py-5 text-sm font-black text-slate-300 shadow-sm hover:bg-slate-800 transition-all uppercase tracking-widest cursor-pointer"
              >
                Cadastrar Operador
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-12 border-y border-slate-800 bg-slate-950/40">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-6">
            TECNOLOGIA INTERNA SEM INTERPRETAÇÃO EXTERNA DE DADOS
          </h3>
          <div className="flex flex-wrap items-center justify-around gap-8 opacity-60">
            <div className="text-sm font-black text-slate-400 tracking-wider">HOSPITAL PEDIÁTRICO LUBANGO</div>
            <div className="text-sm font-black text-slate-400 tracking-wider">REDE SEGUIDA PRIVADA</div>
            <div className="text-sm font-black text-slate-400 tracking-wider">ESTÁVEL OFFLINE</div>
          </div>
        </div>
      </section>
    </div>
  );
}
