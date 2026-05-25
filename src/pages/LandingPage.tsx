import React from 'react';
import { Activity, ShieldCheck, ArrowRight, Shield, TrendingUp, Users, Heart, ClipboardCheck, Clock } from 'lucide-react';
import { motion } from 'motion/react';

export default function LandingPage({ onNavigate }: { onNavigate: (view: any) => void }) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Top Header */}
      <nav className="fixed top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="mx-auto flex max-w-7xl h-20 items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-xl shadow-md">
              <Activity className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-900 leading-none">PIONEIRO <span className="text-blue-600">ZECA</span></h1>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mt-1 text-center">Unidade de Emergência</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <button 
              onClick={() => onNavigate('login')}
              className="text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors uppercase tracking-widest"
            >
              Portal Administrativo
            </button>
            <button 
              onClick={() => onNavigate('register')}
              className="rounded-xl bg-[#0f172a] px-6 py-3 text-xs font-bold text-white shadow-xl hover:bg-slate-800 transition-all uppercase tracking-widest active:scale-95"
            >
              Criar Conta
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-24 overflow-hidden">
        {/* Abstract Background Shapes */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-100 rounded-full blur-[100px] -mr-40 -mt-40 opacity-50"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-50 rounded-full blur-[80px] -ml-20 -mb-20 opacity-50"></div>

        <div className="relative z-10 mx-auto max-w-7xl px-6">
          <div className="max-w-3xl">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={containerVariants}
            >
              <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 border border-blue-200 mb-8">
                <ShieldCheck className="h-4 w-4 text-blue-600" />
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-700">Sistema Certificado HUÍLA-TECH</span>
              </motion.div>
              
              <motion.h2 variants={itemVariants} className="text-6xl md:text-8xl font-black tracking-tighter text-slate-900 mb-8 leading-[0.95]">
                Eficiência que salva <br />
                <span className="text-blue-600">Vidas Pediátricas.</span>
              </motion.h2>

              <motion.p variants={itemVariants} className="text-xl text-slate-500 font-medium mb-12 leading-relaxed max-w-2xl">
                Plataforma integrada de triagem, monitorização e análise preditiva para o Hospital Pioneiro Zeca Lubango. Transforme dados em decisões clínicas seguras.
              </motion.p>

              <motion.div variants={itemVariants} className="flex flex-wrap gap-4">
                <button 
                  onClick={() => onNavigate('register')}
                  className="group flex items-center gap-3 rounded-2xl bg-blue-600 px-10 py-5 text-sm font-black text-white shadow-2xl shadow-blue-600/30 hover:bg-blue-500 transition-all active:scale-95 uppercase tracking-widest"
                >
                  Começar Triagem
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </button>
                <button 
                  onClick={() => onNavigate('login')}
                  className="rounded-2xl border border-slate-200 bg-white px-10 py-5 text-sm font-black text-slate-700 shadow-sm hover:bg-slate-50 transition-all uppercase tracking-widest"
                >
                  Acesso Restrito
                </button>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-12 border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-wrap items-center justify-between gap-8 opacity-40 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-500">
             <div className="text-xl font-black text-slate-400">HUÍLA TECH</div>
             <div className="text-xl font-black text-slate-400">SAÚDE 24</div>
             <div className="text-xl font-black text-slate-400">MINISTERIO SAUDE</div>
             <div className="text-xl font-black text-slate-400">EMERGÊNCIA OK</div>
          </div>
        </div>
      </section>

      {/* Professional Features Section */}
      <section className="py-32 bg-white">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid md:grid-cols-3 gap-12">
            <FeatureItem 
              icon={Users} 
              title="Triagem Inteligente" 
              desc="Protocolo de Manchester adaptado para pediatria, garantindo prioridade imediata aos casos críticos."
            />
            <FeatureItem 
              icon={TrendingUp} 
              title="Monitorização em Tempo Real" 
              desc="Dashboards dinâmicos que reflectem a ocupação e o fluxo da unidade em milissegundos."
            />
            <FeatureItem 
              icon={Heart} 
              title="Excelência Clínica" 
              desc="Ferramentas desenhadas por especialistas para reduzir o tempo de espera e optimizar recursos."
            />
          </div>
        </div>
      </section>

      {/* Region Section */}
      <section className="py-24 bg-slate-900 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-blue-600 opacity-10 blur-[120px]"></div>
        <div className="mx-auto max-w-7xl px-6 relative z-10 flex flex-col md:flex-row items-center justify-between gap-16">
          <div className="max-w-xl">
             <h3 className="text-3xl font-black mb-6 tracking-tight uppercase">Ao serviço do Lubango</h3>
             <p className="text-slate-400 font-medium leading-relaxed mb-8">
               O Hospital Pioneiro Zeca é um pilar da saúde pediátrica na Huíla. A nossa tecnologia assegura que cada criança receba a atenção necessária com a máxima brevidade.
             </p>
             <div className="flex gap-8">
                <div>
                   <p className="text-3xl font-black text-blue-500">24/7</p>
                   <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Operacional</p>
                </div>
                <div className="w-[1px] h-12 bg-slate-800"></div>
                <div>
                   <p className="text-3xl font-black text-blue-500">REAL-TIME</p>
                   <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Sincronização</p>
                </div>
             </div>
          </div>
          <div className="bg-white/5 p-8 rounded-[3rem] border border-white/10 backdrop-blur-xl">
             <Activity className="h-24 w-24 text-blue-500 animate-pulse" />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 bg-white border-t border-slate-200">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="flex items-center gap-3">
              <Activity className="h-6 w-6 text-blue-600" />
              <span className="text-xl font-black tracking-tighter">PIONEIRO ZECA</span>
            </div>
            <div className="flex gap-12 text-xs font-bold text-slate-400 uppercase tracking-widest">
               <a href="#" className="hover:text-blue-600 transition-colors">Segurança</a>
               <a href="#" className="hover:text-blue-600 transition-colors">Suporte</a>
               <a href="#" className="hover:text-blue-600 transition-colors">Contacto</a>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              © 2026 • Lubango, Huíla, Angola
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureItem({ icon: Icon, title, desc }: any) {
  return (
    <div className="group">
      <div className="mb-6 inline-flex rounded-2xl bg-blue-50 p-4 text-blue-600 transition-all group-hover:bg-blue-600 group-hover:text-white group-hover:shadow-xl group-hover:shadow-blue-600/30">
        <Icon className="h-8 w-8" />
      </div>
      <h4 className="text-xl font-black text-slate-900 mb-3 tracking-tight">{title}</h4>
      <p className="text-slate-500 font-medium leading-relaxed">{desc}</p>
    </div>
  );
}
