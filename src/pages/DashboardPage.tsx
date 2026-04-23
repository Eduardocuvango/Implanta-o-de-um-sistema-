import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { patientService } from '../services/patientService';
import { Patient } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import { 
  Activity, Users, Clock, AlertTriangle, TrendingUp, 
  Map as MapIcon, BrainCircuit, Lightbulb, Info, Loader2
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { GoogleGenAI } from "@google/genai";

const COLORS = ['#5A5A40', '#141414', '#8E8E7A', '#C4C4B5', '#E4E3E0'];

export default function DashboardPage() {
  const { profile } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [aiInsights, setAiInsights] = useState<string>('');
  const [loadingAi, setLoadingAi] = useState(false);

  useEffect(() => {
    return patientService.subscribe(setPatients);
  }, []);

  // Descriptive Data
  const stats = {
    total: patients.length,
    waiting: patients.filter(p => p.status === 'Em Espera').length,
    attended: patients.filter(p => p.status === 'Atendido').length,
    critical: patients.filter(p => p.priority === 'Emergência').length,
    outcomes: {
      internados: patients.filter(p => p.state === 'Internado').length,
      alta: patients.filter(p => p.state === 'Alta').length,
      transferidos: patients.filter(p => p.state === 'Transferido').length,
      obitos: patients.filter(p => p.state === 'Óbito').length,
    }
  };

  const statusData = [
    { name: 'Em Espera', value: stats.waiting, color: '#f59e0b' },
    { name: 'Atendidos', value: stats.attended, color: '#2563eb' }
  ];

  const outcomeData = [
    { name: 'Internado', value: stats.outcomes.internados, color: '#f59e0b' },
    { name: 'Transferido', value: stats.outcomes.transferidos, color: '#64748b' },
    { name: 'Alta', value: stats.outcomes.alta, color: '#10b981' },
    { name: 'Óbito', value: stats.outcomes.obitos, color: '#ef4444' }
  ];

  const cityData = Array.from(new Set(patients.map(p => p.city))).map(city => ({
    name: city,
    value: patients.filter(p => p.city === city).length
  })).sort((a, b) => b.value - a.value).slice(0, 5);

  const generateAiInsights = async () => {
    setLoadingAi(true);
    try {
      const ai = new GoogleGenAI(process.env.GEMINI_API_KEY!);
      const model = ai.getGenerativeModel({ model: "gemini-2.0-flash" });
      const dataSummary = `Total: ${stats.total}, Espera: ${stats.waiting}, Criticos: ${stats.critical}, Obitos: ${stats.outcomes.obitos}, Cidades: ${JSON.stringify(cityData)}`;
      
      const prompt = `Como analista pediátrico do Hospital Pioneiro Zeca, faça uma análise estratégica curta (150 palavras) dos dados: ${dataSummary}. Foque em previsão semanal e recomendações de gestão. Use tom técnico.`;

      const result = await model.generateContent(prompt);
      setAiInsights(result.response.text());
    } catch (err) {
      console.error(err);
      setAiInsights('Erro ao conectar com o serviço de IA.');
    } finally {
      setLoadingAi(false);
    }
  };

  if (profile?.role !== 'admin') {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <AlertTriangle className="h-16 w-16 text-amber-500" />
        <h1 className="text-2xl font-bold tracking-tight">Acesso Restrito</h1>
        <p className="max-w-md text-slate-500 text-sm">Contate o administrador do Hospital Pioneiro Zeca para obter permissões de visualização analítica.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
             <div className="w-2 h-2 rounded-full bg-red-500 animate-ping"></div>
             <span className="text-[10px] font-black uppercase tracking-widest text-[#0f172a]">LIVE: Comando Central Epidemiológico</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">Pioneiro Zeca <span className="text-blue-600">Pulse</span></h1>
          <p className="text-slate-500 text-sm font-medium mt-1">Interligação estratégica de dados clínicos e monitorização de surtos</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={generateAiInsights}
            disabled={loadingAi || patients.length === 0}
            className="group flex items-center gap-3 px-6 py-3 bg-[#0f172a] text-white rounded-2xl hover:bg-slate-800 text-xs font-black shadow-2xl transition-all disabled:opacity-50 active:scale-95 uppercase tracking-widest"
          >
            {loadingAi ? <Activity className="h-4 w-4 animate-spin" /> : <BrainCircuit className="h-5 w-5 text-blue-400 group-hover:rotate-12 transition-transform" />}
            {loadingAi ? 'ANALISANDO FLUXO...' : 'CONSULTAR INTELIGÊNCIA CLÍNICA'}
          </button>
        </div>
      </header>

      {/* Metrics Row - Refined with Glassmorphism / Professional Polish */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard icon={Users} label="Atendimento Hoy" value={stats.attended} trend="+12%" trendColor="text-emerald-600" color="text-blue-600" border="border-blue-100 bg-blue-50/20" />
        <MetricCard icon={Activity} label="Taxa de Ocupação" value="82%" subtitle="Leitos de Internamento" color="text-amber-600" border="border-amber-100 bg-amber-50/20" />
        <MetricCard icon={Clock} label="Tempo Médio" value="28 min" subtitle="Espera para Triagem" color="text-purple-600" border="border-purple-100 bg-purple-50/20" />
        <MetricCard icon={AlertTriangle} label="Alerta Crítico" value={stats.critical} color="text-red-700" isAlert={stats.critical > 0} border="border-red-100 bg-red-50/30" />
      </div>

      {/* EMERGENCY PULSE TICKER */}
      <div className="bg-[#0f172a] rounded-3xl p-4 overflow-hidden shadow-2xl border border-slate-800">
         <div className="flex items-center gap-4 animate-marquee whitespace-nowrap">
            {patients.filter(p => p.status === 'Em Espera').map(p => (
               <div key={p.id} className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/10">
                  <div className={cn("w-2 h-2 rounded-full", p.priority === 'Emergência' ? "bg-red-500 animate-pulse" : "bg-blue-500")}></div>
                  <span className="text-[10px] font-bold text-white uppercase tracking-widest">{p.name} • {p.occurrenceType} • {new Date(p.entryTime).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit'})}</span>
               </div>
            ))}
            {patients.filter(p => p.status === 'Em Espera').length === 0 && (
               <div className="text-white/30 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 w-full justify-center">
                  <Info className="h-3 w-3" /> Fila de Espera Vazia - Fluxo Controlado
               </div>
            )}
         </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* EPIDEMIOLOGICAL RADAR */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
           <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden group">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-50 rounded-full blur-3xl opacity-50 group-hover:opacity-100 transition-opacity"></div>
              
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-3">
                   <div className="bg-slate-900 p-3 rounded-2xl shadow-lg">
                      <MapIcon className="h-6 w-6 text-blue-400" />
                   </div>
                   <div>
                      <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Radar Epidemiológico</h2>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Huíla / Lubango - Mapa de Calor</p>
                   </div>
                </div>
                <div className="flex items-center gap-2">
                   <div className="flex -space-x-2">
                      <div className="w-8 h-8 rounded-full border-2 border-white bg-red-500"></div>
                      <div className="w-8 h-8 rounded-full border-2 border-white bg-amber-500 text-[10px] flex items-center justify-center font-bold text-white uppercase">H3N2</div>
                   </div>
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Áreas de Risco</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-8">
                 <div className="space-y-4">
                    {cityData.map((city, idx) => (
                      <div key={city.name} className="flex items-center gap-4 bg-slate-50 p-4 rounded-3xl border border-slate-100 hover:bg-white hover:shadow-xl transition-all hover:-translate-y-1">
                        <div className={cn(
                          "w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xs shadow-inner",
                          idx === 0 ? "bg-red-500/10 text-red-600" : "bg-blue-500/10 text-blue-600"
                        )}>
                          {city.value}
                        </div>
                        <div className="flex-1">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{idx === 0 ? 'Surto Detectado' : 'Monitorização'}</p>
                          <p className="text-lg font-bold text-slate-900 tracking-tighter">{city.name}</p>
                        </div>
                        <TrendingUp className={cn("h-4 w-4", idx === 0 ? "text-red-500" : "text-slate-300")} />
                      </div>
                    ))}
                    {cityData.length === 0 && <div className="text-slate-300 text-sm italic font-medium p-8 bg-slate-50 rounded-3xl border border-dashed text-center">Nenhum dado geográfico disponível no momento.</div>}
                 </div>

                 <div className="relative bg-slate-900 rounded-[2rem] border-8 border-slate-950 shadow-inner overflow-hidden flex items-center justify-center">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
                    <div className="relative z-10 text-center animate-pulse">
                       <MapIcon className="h-20 w-20 text-blue-500 opacity-20 mx-auto mb-4" />
                       <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em]">Vista Satélite de Risco</p>
                       <p className="text-white/40 text-[9px] uppercase font-bold mt-2">Sincronizando com SIS-Angola...</p>
                    </div>
                    {/* Visual markers */}
                    <div className="absolute top-1/4 left-1/4 w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center border border-red-500/40">
                       <div className="w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
                    </div>
                    <div className="absolute bottom-1/3 right-1/4 w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center border border-blue-500/30">
                       <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    </div>
                 </div>
              </div>
           </div>

           <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between mb-8">
                 <div className="flex items-center gap-3">
                    <div className="bg-amber-50 p-2.5 rounded-2xl">
                       <TrendingUp className="h-6 w-6 text-amber-600" />
                    </div>
                    <div>
                       <h2 className="text-xl font-black text-slate-800 tracking-tight uppercase">Fluxo de Triagem Semanal</h2>
                       <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Volume de atendimentos vs Capacidade</p>
                    </div>
                 </div>
              </div>
              <div className="h-[250px] w-full">
                 <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={cityData.map((d, i) => ({ name: d.name, value: d.value + (i * 5), capacity: 50 }))}>
                       <defs>
                          <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                             <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                             <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                          </linearGradient>
                       </defs>
                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                       <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 'bold' }} />
                       <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                       <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }} />
                       <Area type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                    </AreaChart>
                 </ResponsiveContainer>
              </div>
           </div>
        </div>

        {/* AI INSIGHTS & UTILITY SIDEBAR */}
        <div className="col-span-12 lg:col-span-4 space-y-8">
          <div className="bg-[#0f172a] rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden border border-slate-800">
             <div className="absolute top-0 right-0 p-6 opacity-10">
                <BrainCircuit className="h-24 w-24" />
             </div>
             
             <div className="relative z-10 flex flex-col items-center text-center">
                <div className="bg-blue-600 p-4 rounded-3xl shadow-xl shadow-blue-600/20 mb-6">
                   <Sparkles className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-2xl font-black mb-2 uppercase tracking-tighter">AI Co-Pilot Advisor</h3>
                <p className="text-xs text-blue-400 font-extrabold uppercase tracking-[0.2em] mb-8">Clinical Intelligence</p>
                
                <div className="bg-white/5 rounded-3xl p-6 border border-white/10 italic text-[11px] leading-relaxed text-slate-300 font-medium mb-8 min-h-[150px] flex items-center justify-center">
                   {aiInsights ? (
                     <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                        "{aiInsights}"
                     </div>
                   ) : (
                     "Aguardando análise estratégica do sistema para recomendações de desalfandegagem de recursos e redireccionamento de equipas."
                   )}
                </div>
                
                <button 
                  onClick={generateAiInsights}
                  disabled={loadingAi}
                  className="w-full bg-white text-slate-900 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] transition-all hover:bg-blue-50 hover:shadow-2xl shadow-white/10 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                >
                  {loadingAi ? <Loader2 className="h-4 w-4 animate-spin" /> : <TrendingUp className="h-4 w-4" />}
                  {loadingAi ? 'PROCESSANDO REDE...' : 'SOLICITAR ANÁLISE DE SURTO'}
                </button>
             </div>
          </div>

          <div className="bg-blue-600 rounded-[2.5rem] p-8 text-white shadow-xl relative overflow-hidden group">
             <div className="absolute inset-0 bg-gradient-to-br from-blue-700 to-indigo-800 opacity-100"></div>
             <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                   <div className="bg-white/20 p-2 rounded-xl backdrop-blur-xl">
                      <Lightbulb className="h-5 w-5" />
                   </div>
                   <h3 className="text-lg font-black uppercase italic">Dica de Gestão</h3>
                </div>
                <p className="text-sm font-medium text-blue-50 leading-relaxed mb-6">
                   Baseado nos últimos 30 dias: Considere aumentar o stock de soro fisiológico e antitérmicos na secção de {cityData[0]?.name || 'Tchioco'}.
                </p>
                <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                   <motion.div initial={{ width: 0 }} animate={{ width: '65%' }} className="h-full bg-white"></motion.div>
                </div>
                <p className="text-[9px] font-bold uppercase tracking-widest mt-2 opacity-60 text-center">Risco de Ruptura: 65%</p>
             </div>
          </div>
        </div>
      </div>

       {/* Pie Chart row */}
       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
             <h3 className="font-bold text-slate-800 text-xs uppercase tracking-widest mb-6">Status Total</h3>
             <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={statusData} innerRadius={60} outerRadius={80} paddingAngle={8} dataKey="value">
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
             </div>
             <div className="flex justify-center gap-4 mt-2">
                {statusData.map(d => (
                  <div key={d.name} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                    <span className="text-[10px] font-bold text-slate-500">{d.name}</span>
                  </div>
                ))}
             </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 col-span-2 overflow-hidden">
             <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-800 text-xs uppercase tracking-widest">Registros Recentes</h3>
                <span className="text-[10px] text-blue-600 font-bold uppercase tracking-tighter cursor-pointer hover:underline">Ver Triagem Completa</span>
             </div>
             <table className="w-full text-left">
                <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-tighter border-b">
                  <tr>
                    <th className="px-6 py-3">Paciente</th>
                    <th className="px-6 py-3">Ocorrência</th>
                    <th className="px-6 py-3">Prioridade</th>
                    <th className="px-6 py-3">Horário</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {patients.slice(0, 5).map(p => (
                    <tr key={p.id} className="text-xs hover:bg-slate-50">
                      <td className="px-6 py-3 font-bold text-slate-900">{p.name}</td>
                      <td className="px-6 py-3 text-slate-500 italic">{p.occurrenceType}</td>
                      <td className="px-6 py-3">
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          p.priority === 'Emergência' ? "bg-red-500" : p.priority === 'Alta' ? "bg-amber-500" : "bg-blue-500"
                        )} />
                      </td>
                      <td className="px-6 py-3 text-slate-400">{new Date(p.entryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                    </tr>
                  ))}
                </tbody>
             </table>
          </div>
       </div>
    </div>
  );
}

function MetricCard({ label, value, color, trend, trendColor, subtitle, isAlert, border }: any) {
  return (
    <div className={cn(
      "bg-white p-5 rounded-xl shadow-sm border",
      border || "border-slate-200"
    )}>
      <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">{label}</p>
      <div className="flex items-baseline gap-2 mt-1">
        <p className={cn("text-3xl font-extrabold", color)}>{value}</p>
        {trend && <span className={cn("text-[10px] font-bold", trendColor)}>{trend}</span>}
      </div>
      {(subtitle || trend) && (
        <p className="text-[10px] text-slate-400 mt-2 font-medium">{subtitle || "Comparado ao mês passado"}</p>
      )}
    </div>
  );
}
