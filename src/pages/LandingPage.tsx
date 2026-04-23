import React from 'react';
import { Activity, ShieldCheck, PieChart, Users, ChevronRight, ArrowRight, Shield, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';

export default function LandingPage({ onNavigate }: { onNavigate: (view: any) => void }) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 selection:bg-blue-100">
      {/* Navigation */}
      <nav className="fixed top-0 z-50 w-full bg-[#0f172a] border-b border-slate-800 px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Activity className="h-6 w-6 text-white" />
            </div>
            <div>
               <h1 className="text-lg font-bold tracking-tight text-white leading-none">PIONEIRO ZECA</h1>
               <span className="text-[10px] text-blue-400 uppercase tracking-widest font-bold">Unidade de Emergência</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => onNavigate('login')}
              className="text-sm font-bold text-slate-300 hover:text-white transition-colors"
            >
              ACESSO RESTRITO
            </button>
            <button 
              onClick={() => onNavigate('register')}
              className="rounded-md bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg hover:bg-blue-500 transition-all uppercase tracking-widest"
            >
              SOLICITAR CREDENCIAIS
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-32 pb-20">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-100 rounded-full blur-3xl opacity-30 animate-pulse"></div>
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-slate-200 rounded-full blur-3xl opacity-20"></div>
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="mb-6 text-5xl font-extrabold tracking-tight text-slate-900 md:text-7xl">
              Inteligência de Gestão <br />
              <span className="text-blue-600">Hospitalar Pediátrica</span>
            </h2>
            <p className="mx-auto mb-10 max-w-2xl text-lg text-slate-500 leading-relaxed font-medium">
              Sistema avançado de triagem e análise preditiva para o Hospital Pioneiro Zeca. 
              Transformando dados brutos em decisões que salvam vidas na linha de frente do Lubango.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <button 
                onClick={() => onNavigate('register')}
                className="group flex items-center gap-2 rounded-md bg-[#0f172a] px-8 py-4 font-bold text-white shadow-xl hover:bg-slate-800 transition-all active:scale-95"
              >
                COMEÇAR RECOLHA
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </button>
              <button 
                onClick={() => onNavigate('login')}
                className="rounded-md border border-slate-200 bg-white px-8 py-4 font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition-all"
              >
                ÁREA ADMINISTRATIVA
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="bg-white py-24 border-y border-slate-100">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-16 text-center">
             <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full mb-4 inline-block">Módulos do Sistema</span>
             <h3 className="text-3xl font-bold text-slate-900 tracking-tight">Arquitectura de Decisão em Tempo Real</h3>
          </div>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid gap-8 md:grid-cols-3"
          >
            <FeatureCard 
              icon={Shield} 
              title="Triagem Segura" 
              desc="Validação automática de faixa etária e prioridades clínicas codificadas por cores (azul a vermelho)."
            />
            <FeatureCard 
              icon={TrendingUp} 
              title="Análise Preditiva" 
              desc="Motor de IA Gemini integrado para previsão de fluxo semanal e gestão optimizada de insumos."
            />
            <FeatureCard 
              icon={Activity} 
              title="Dashboard KPI" 
              desc="Monitorização em tempo real de taxas de mortalidade, ocupação de leitos e eficiência de triagem."
            />
          </motion.div>
        </div>
      </section>

      {/* Social / Trust Section */}
      <section className="py-20 bg-slate-50">
        <div className="mx-auto max-w-7xl px-6 flex flex-col md:flex-row items-center justify-between gap-12">
           <div className="max-w-xl">
              <h4 className="text-2xl font-bold text-slate-900 mb-4 tracking-tight">Compromisso com a Excelência Clínica</h4>
              <p className="text-slate-500 font-medium leading-relaxed">
                Desenvolvemos ferramentas digitais que capacitam médicos e gestores a focar no que realmente importa: a recuperação dos nossos pequenos pacientes no Lubango.
              </p>
           </div>
           <div className="flex items-center gap-8 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
              <div className="text-xl font-black text-slate-400">HUÍLA TECH</div>
              <div className="text-xl font-black text-slate-400">SAÚDE 4.0</div>
           </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0f172a] py-12 text-center border-t border-slate-800">
        <div className="flex justify-center items-center gap-2 mb-6">
           <Activity className="h-5 w-5 text-blue-500" />
           <span className="text-sm font-bold text-white uppercase tracking-widest tracking-tighter">Pioneiro Zeca Lubango</span>
        </div>
        <p className="text-xs font-medium text-slate-500 uppercase tracking-widest">
          © 2026 • Arrifana, Lubango, Angola
        </p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, desc }: any) {
  return (
    <motion.div 
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
      }}
      className="group rounded-xl border border-slate-200 bg-slate-50 p-8 transition-all hover:bg-white hover:shadow-xl hover:-translate-y-1"
    >
      <div className="mb-6 inline-flex rounded-lg bg-blue-600 p-3 text-white shadow-lg group-hover:scale-110 transition-transform">
        <Icon className="h-6 w-6" />
      </div>
      <h4 className="mb-3 text-lg font-bold text-slate-900 tracking-tight">{title}</h4>
      <p className="text-sm text-slate-500 leading-relaxed font-medium">{desc}</p>
    </motion.div>
  );
}
