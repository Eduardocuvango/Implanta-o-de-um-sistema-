import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { patientService } from '../services/patientService';
import { Patient } from '../types';
import InteractiveMap from '../components/InteractiveMap';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';
import { 
  Activity, Users, Clock, AlertTriangle, TrendingUp, 
  Map as MapIcon, BrainCircuit, Lightbulb, Info, Loader2, Sparkles,
  UserCheck, Baby, HeartPulse, History, Printer, Download
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import * as XLSX from 'xlsx';

export default function DashboardPage() {
  const { profile } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [aiInsights, setAiInsights] = useState<string>('');
  const [loadingAi, setLoadingAi] = useState(false);
  const [lastSync, setLastSync] = useState<Date>(new Date());
  const [temporalMode, setTemporalMode] = useState<'semanal' | 'mensal'>('semanal');
  const lastAnalysis = React.useRef<number>(0);

  useEffect(() => {
    return patientService.subscribe((data) => {
      setPatients(data);
      setLastSync(new Date());
    });
  }, []);

  // Automated Real-time Analysis
  useEffect(() => {
    if (patients.length > 0 && Date.now() - lastAnalysis.current > 300000) { // 5 minutes throttle
      generateAiInsights();
      lastAnalysis.current = Date.now();
    }
  }, [patients.length]);

  // Descriptive Data Calculations
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

  // 1. Gender Distribution (Male vs Female Chart)
  const maleCount = patients.filter(p => p.gender === 'Masculino').length;
  const femaleCount = patients.filter(p => p.gender === 'Feminino').length;
  const otherGenderCount = patients.filter(p => p.gender !== 'Masculino' && p.gender !== 'Feminino').length;

  const genderData = [
    { name: 'Masculino', value: maleCount, color: '#0ea5e9' }, // Cyan
    { name: 'Feminino', value: femaleCount, color: '#ec4899' } // Pink
  ];
  if (otherGenderCount > 0) {
    genderData.push({ name: 'Outro', value: otherGenderCount, color: '#a855f7' }); // Purple
  }

  // 2. Dynamic Pediatric Age Groups Chart (Neonatos, Lactentes, Pediátricos)
  const ageGroupsMapped = patients.reduce((acc: { [key: string]: number }, p) => {
    const group = p.ageGroup || 'Não Consta';
    acc[group] = (acc[group] || 0) + 1;
    return acc;
  }, {});

  const ageColors = ['#6366f1', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6'];
  const ageGroupData = Object.entries(ageGroupsMapped).map(([name, value], i) => ({
    name,
    value,
    color: ageColors[i % ageColors.length]
  }));

  // 3. Epidemiological Common Symptoms (Occurrence types) Chart
  const symptomDataMap = patients.reduce((acc: { [key: string]: number }, p) => {
    const symptom = p.occurrenceType || 'Outro';
    acc[symptom] = (acc[symptom] || 0) + 1;
    return acc;
  }, {});

  const commonSymptomsData = Object.entries(symptomDataMap)
    .map(([name, value]) => ({ name, value: Number(value) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  // 4. Clinical Outcomes Distribution
  const outcomesData = [
    { name: 'Alta Médica', value: stats.outcomes.alta, color: '#10b981' },
    { name: 'Internamento', value: stats.outcomes.internados, color: '#3b82f6' },
    { name: 'Transferido', value: stats.outcomes.transferidos, color: '#f59e0b' },
    { name: 'Óbito', value: stats.outcomes.obitos, color: '#ef4444' }
  ];

  // Geolocation risk breakdown
  const cityData = Array.from(new Set(patients.map(p => p.city))).map(city => ({
    name: city,
    value: patients.filter(p => p.city === city).length
  })).sort((a, b) => b.value - a.value).slice(0, 5);

  // Group visits by Day of the Week
  const daysOfWeek = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
  const daysOfWeekAbbr = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const weeklyCounts = Array(7).fill(0);
  patients.forEach(p => {
    const rawDate = p.createdAt || p.occurrenceDate;
    const date = rawDate ? new Date(rawDate) : new Date();
    const day = date.getDay();
    weeklyCounts[day]++;
  });
  const labelOrder = [1, 2, 3, 4, 5, 6, 0]; // Monday to Sunday
  const weeklyData = labelOrder.map(dayIndex => ({
    name: daysOfWeekAbbr[dayIndex],
    fullName: daysOfWeek[dayIndex],
    "Casos": weeklyCounts[dayIndex]
  }));

  // Group visits by Month of the Year
  const monthsAbbr = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  const monthlyCounts = Array(12).fill(0);
  patients.forEach(p => {
    const rawDate = p.createdAt || p.occurrenceDate;
    const date = rawDate ? new Date(rawDate) : new Date();
    const month = date.getMonth();
    monthlyCounts[month]++;
  });
  const monthlyData = monthsAbbr.map((name, idx) => ({
    name,
    "Casos": monthlyCounts[idx]
  }));

  const generateAiInsights = async () => {
    setLoadingAi(true);
    try {
      const dataSummary = `Total: ${stats.total}, Atendidos: ${stats.attended}, Espera: ${stats.waiting}, Criticos: ${stats.critical}, Obitos: ${stats.outcomes.obitos}, Masculino: ${maleCount}, Feminino: ${femaleCount}, Top Cidades: ${JSON.stringify(cityData)}`;
      
      const prompt = `Como analista clínico pediátrico sénior do Hospital Pioneiro Zeca, faça uma análise resumida extremamente profissional e humanizada daquilo que os dados indicam (aproximadamente 120-140 palavras). Aborde padrões epidemiológicos relativos ao género (Masculino vs Feminino) e surtos nas localidades do Lubango de forma inteligente.`;

      const response = await fetch("/api/ai-insights", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ dataSummary, prompt })
      });

      if (!response.ok) {
        throw new Error("Falha no servidor analítico.");
      }

      const resData = await response.json();
      setAiInsights(resData.text || 'Sem insights disponíveis de momento.');
    } catch (err) {
      console.error(err);
      setAiInsights('Para ativar a sincronização automatizada dos gráficos em tempo real e consultar a Inteligência Artificial, ligue a chave GEMINI_API_KEY no painel de Definições.');
    } finally {
      setLoadingAi(false);
    }
  };

  if (profile?.role !== 'admin') {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <AlertTriangle className="h-16 w-16 text-amber-500 animate-pulse" />
        <h1 className="text-2xl font-bold tracking-tight">Acesso Restrito</h1>
        <p className="max-w-md text-slate-500 text-sm">Contate o administrador do Hospital Pioneiro Zeca para obter permissões de visualização analítica.</p>
      </div>
    );
  }

  // Calculate percentage of treatment completions
  const rateCompletion = stats.total > 0 ? Math.round((stats.attended / stats.total) * 100) : 0;

  const handleDownloadReport = () => {
    // 1. Informações/Métricas Gerais
    const generalData = [
      { "Indicador": "Total de Pacientes Registados", "Valor": stats.total },
      { "Indicador": "Pacientes Atendidos", "Valor": stats.attended },
      { "Indicador": "Pacientes Em Espera", "Valor": stats.waiting },
      { "Indicador": "Casos de Emergência/Críticos", "Valor": stats.critical },
      { "Indicador": "Taxa de Sucesso Clínico", "Valor": `${rateCompletion}%` },
      { "Indicador": "Género Masculino", "Valor": maleCount },
      { "Indicador": "Género Feminino", "Valor": femaleCount },
      { "Indicador": "Casos de Alta Médica", "Valor": stats.outcomes.alta },
      { "Indicador": "Casos de Internamento", "Valor": stats.outcomes.internados },
      { "Indicador": "Casos Transferidos", "Valor": stats.outcomes.transferidos },
      { "Indicador": "Casos de Óbito", "Valor": stats.outcomes.obitos },
    ];

    // 2. Distribuição por Cidade/Município
    const municipalSheetData = cityData.map(c => ({
      "Município/Cidade": c.name,
      "Número de Ocorrências": c.value,
      "Percentagem": `${stats.total > 0 ? Math.round((c.value / stats.total) * 100) : 0}%`
    }));

    // 3. Sintomas Frequentes
    const symptomsSheetData = Object.entries(symptomDataMap).map(([name, value]) => ({
      "Sintoma/Ocorrência": name,
      "Quantidade": Number(value),
      "Percentagem": `${stats.total > 0 ? Math.round((Number(value) / stats.total) * 100) : 0}%`
    })).sort((a, b) => b["Quantidade"] - a["Quantidade"]);

    // 4. Lista Completa de Pacientes
    const patientsSheetData = patients.map(p => ({
      "ID": p.id || p.patientId || "",
      "Nome": p.name || "",
      "Idade": p.age || 0,
      "Grupo Etário": p.ageGroup || "",
      "Género": p.gender || "",
      "Nome da Mãe": p.motherName || "",
      "Província": p.province || "",
      "Município": p.city || "",
      "Bairro": p.neighborhood || "",
      "Contacto": p.phone || "",
      "Sintomas/Ocorrência": p.occurrenceType || "",
      "Prioridade": p.priority || "",
      "Estado": p.state || "",
      "Status": p.status || "",
      "Data de Registo": p.createdAt ? new Date(p.createdAt).toLocaleDateString("pt-AO") : "",
      "Última Atualização": p.updatedAt ? new Date(p.updatedAt).toLocaleDateString("pt-AO") : "",
    }));

    // Generate Excel file
    const wb = XLSX.utils.book_new();

    const wsGeneral = XLSX.utils.json_to_sheet(generalData);
    const wsMunicipal = XLSX.utils.json_to_sheet(municipalSheetData);
    const wsSymptoms = XLSX.utils.json_to_sheet(symptomsSheetData);
    const wsPatientsList = XLSX.utils.json_to_sheet(patientsSheetData);

    // Append sheets to workbook
    XLSX.utils.book_append_sheet(wb, wsGeneral, "Metricas Gerais");
    XLSX.utils.book_append_sheet(wb, wsMunicipal, "Distribuicao Geografica");
    XLSX.utils.book_append_sheet(wb, wsSymptoms, "Sintomas e Ocorrencias");
    XLSX.utils.book_append_sheet(wb, wsPatientsList, "Lista de Pacientes");

    // Save/write the workbook
    XLSX.writeFile(
      wb,
      `Relatorio_Dashboard_PioneiroZeca_${new Date().toLocaleDateString("pt-AO").replace(/\//g, "-")}.xlsx`
    );
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20 px-4 sm:px-6">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-slate-900 text-white p-6 sm:p-8 rounded-[2rem] shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-950 opacity-90"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
             <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></div>
             <span className="text-[10px] font-black uppercase tracking-widest text-[#60a5fa]">PAINEL ANALÍTICO CENTRAL (PIONEIRO ZECA)</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tighter uppercase leading-none">
            INDICADORES <span className="text-blue-400">PEDIÁTRICOS</span>
          </h1>
          <div className="flex flex-wrap items-center gap-4 mt-3">
            <p className="text-slate-300 text-xs sm:text-sm font-medium">Relatórios e monitorização estatística em tempo real</p>
            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20">
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
               <span className="text-[9px] font-bold uppercase text-emerald-300 tracking-wider">Base Atualizada: {lastSync.toLocaleTimeString()}</span>
            </div>
          </div>
        </div>
        <div className="relative z-10 flex flex-wrap items-center gap-3">
          <button 
            onClick={generateAiInsights}
            disabled={loadingAi || patients.length === 0}
            className="group flex items-center gap-3 px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-black shadow-lg shadow-blue-600/30 transition-all disabled:opacity-50 active:scale-95 uppercase tracking-wider print:hidden"
          >
            {loadingAi ? <Loader2 className="h-4 w-4 animate-spin" /> : <BrainCircuit className="h-5 w-5 text-blue-200 group-hover:rotate-12 transition-transform" />}
            {loadingAi ? 'A Sincronizar IA...' : 'GERAR INSIGHTS CO-PILOT'}
          </button>
          
          <button 
            onClick={handleDownloadReport}
            disabled={patients.length === 0}
            className="flex items-center gap-2.5 px-6 py-3.5 bg-emerald-600 hover:bg-emerald-500 hover:text-white border border-emerald-500 text-white rounded-2xl text-xs font-black shadow-lg transition-all active:scale-95 uppercase tracking-wider print:hidden disabled:opacity-50"
          >
            <Download className="h-5 w-5 text-emerald-100" />
            Baixar Relatório (.xlsx)
          </button>

          <button 
            onClick={() => window.print()}
            disabled={patients.length === 0}
            className="flex items-center gap-2.5 px-6 py-3.5 bg-slate-800 hover:bg-slate-700 hover:text-white border border-slate-700 text-white rounded-2xl text-xs font-black shadow-lg transition-all active:scale-95 uppercase tracking-wider print:hidden disabled:opacity-50"
          >
            <Printer className="h-5 w-5 text-slate-300" />
            Imprimir Relatório
          </button>
        </div>
      </header>

      {/* METRIC CARD ROW - TOTAL PATIENTS TREATED AND REGISTERED ADDED EXPLICITLY */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          icon={Users} 
          label="Total de Pacientes" 
          value={stats.total} 
          subtitle="Registados no sistema" 
          color="text-slate-900" 
          iconBg="bg-slate-100 text-slate-700"
          border="border-slate-200 bg-white" 
        />
        <MetricCard 
          icon={UserCheck} 
          label="Total de Atendidos" 
          value={stats.attended} 
          subtitle={`${rateCompletion}% de sucesso clínico`}
          color="text-emerald-700" 
          iconBg="bg-emerald-50 text-emerald-600"
          border="border-emerald-100 bg-emerald-100/10" 
        />
        <MetricCard 
          icon={Clock} 
          label="Fila de Espera" 
          value={stats.waiting} 
          subtitle="Aguardando atendimento" 
          color="text-amber-700" 
          iconBg="bg-amber-50 text-amber-600"
          border="border-amber-100 bg-amber-50/20" 
        />
        <MetricCard 
          icon={AlertTriangle} 
          label="Emergência Crítica" 
          value={stats.critical} 
          subtitle="Casos clínicos urgentes" 
          color="text-red-700" 
          iconBg="bg-red-50 text-red-600"
          border="border-red-100 bg-red-50/40" 
          isAlert={stats.critical > 0} 
        />
      </div>

      {/* EMERGENCY PATIENT CURRENT QUEUE TICKER */}
      <div className="bg-slate-950 rounded-2xl p-4 overflow-hidden shadow-md border border-slate-800">
         <div className="flex items-center gap-4 animate-marquee whitespace-nowrap">
            {patients.filter(p => p.status === 'Em Espera').map(p => (
               <div key={p.id} className="flex items-center gap-2 bg-slate-900 px-4 py-2 rounded-xl border border-slate-850">
                  <div className={cn("w-2 h-2 rounded-full", p.priority === 'Emergência' ? "bg-red-500 animate-pulse" : "bg-cyan-500")}></div>
                  <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{p.name} • {p.occurrenceType} • {new Date(p.entryTime).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit'})}</span>
               </div>
            ))}
            {patients.filter(p => p.status === 'Em Espera').length === 0 && (
               <div className="text-slate-500 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 w-full justify-center py-1">
                  <Info className="h-3.5 w-3.5 text-blue-500" /> Fila de Espera Pediátrica Vazia - Fluxo Totalmente Controlado
               </div>
            )}
         </div>
      </div>

      {/* INTERACTIVE GEOGRAPHIC RISK & HEATMAP CARD */}
      <InteractiveMap patients={patients} />

      {/* DETAILED STATS GRID */}
      <div className="grid grid-cols-12 gap-8">
        {/* Epidemic, Symptoms and Outcomes (Line & Bar reports) */}
        <div className="col-span-12 lg:col-span-8 space-y-8">
          
          {/* Evolução Temporal das Triagens (Semanal / Mensal) */}
          <div id="chart-temporal-flow" className="bg-white p-6 sm:p-8 rounded-[2rem] border border-slate-200 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-blue-50 p-3 rounded-2xl">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Fluxo e Evolução de Triagem</h3>
                  <p className="text-xs text-slate-500 font-medium">Acompanhamento temporal por dia de semana ou mês</p>
                </div>
              </div>
              <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setTemporalMode('semanal')}
                  className={cn(
                    "px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer",
                    temporalMode === 'semanal' 
                      ? "bg-white text-blue-600 shadow" 
                      : "text-slate-500 hover:text-slate-900"
                  )}
                >
                  Semana (Dias)
                </button>
                <button
                  type="button"
                  onClick={() => setTemporalMode('mensal')}
                  className={cn(
                    "px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer",
                    temporalMode === 'mensal' 
                      ? "bg-white text-blue-600 shadow" 
                      : "text-slate-500 hover:text-slate-900"
                  )}
                >
                  Meses (Histórico)
                </button>
              </div>
            </div>

            <div className="h-[280px] w-full">
              {stats.total > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart 
                    data={temporalMode === 'semanal' ? weeklyData : monthlyData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorCasos" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fill: '#64748b' }} 
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fill: '#64748b' }} 
                      allowDecimals={false}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        borderRadius: '16px', 
                        border: '1px solid #e2e8f0', 
                        boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                        fontSize: '11px'
                      }} 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="Casos" 
                      stroke="#3b82f6" 
                      strokeWidth={3} 
                      fillOpacity={1} 
                      fill="url(#colorCasos)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-400">
                  <TrendingUp className="h-10 w-10 stroke-1 stroke-slate-300 mb-2 animate-pulse" />
                  <p className="text-sm">Nenhum dado temporal disponível para traçar tendências.</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Epidemiological Surtos & Prevalência de Sintomas */}
          <div className="bg-white p-6 sm:p-8 rounded-[2rem] border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-blue-50 p-3 rounded-2xl">
                <HeartPulse className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Ocorrências & Surtos Epidemiológicos</h3>
                <p className="text-xs text-slate-500 font-medium">Prevalência de sintomas e patologias comuns catalogadas</p>
              </div>
            </div>

            <div className="h-[280px] w-full">
              {commonSymptomsData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={commonSymptomsData} layout="vertical" margin={{ left: 20, right: 20, top: 10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                    <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#334155', fontWeight: 'bold' }} width={110} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }} />
                    <Bar dataKey="value" fill="#3b82f6" radius={[0, 8, 8, 0]} barSize={20}>
                      {commonSymptomsData.map((entry, idx) => {
                        const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#6366f1'];
                        return <Cell key={`cell-${idx}`} fill={colors[idx % colors.length]} />;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-400">
                  <Activity className="h-10 w-10 stroke-1 stroke-slate-300 mb-2 animate-pulse" />
                  <p className="text-sm">Nenhum dado epidemiológico registado de momento.</p>
                </div>
              )}
            </div>
          </div>

          {/* Outcomes report (Desfecho Clínico) */}
          <div className="bg-white p-6 sm:p-8 rounded-[2rem] border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-emerald-50 p-3 rounded-2xl">
                <UserCheck className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Desfecho Clínico (Outcomes)</h3>
                <p className="text-xs text-slate-500 font-medium">Estado final de saída dos pacientes internados de urgência</p>
              </div>
            </div>

            <div className="h-[240px] w-full">
              {patients.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={outcomesData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={40}>
                      {outcomesData.map((entry, idx) => (
                        <Cell key={`cell-${idx}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-400">
                  <p className="text-sm">Sem dados de alta ou internamento para analisar.</p>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* AI INSIGHTS & UTILITY SIDEBAR */}
        <div className="col-span-12 lg:col-span-4 space-y-8">
          
          {/* AI Advisor Block with glowing border */}
          <div className="bg-slate-900 rounded-[2rem] p-8 text-white shadow-2xl relative overflow-hidden border border-slate-800">
             <div className="absolute top-0 right-0 p-6 opacity-5">
                <BrainCircuit className="h-28 w-28 text-blue-400 animate-pulse" />
             </div>
             
             <div className="relative z-10 flex flex-col">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-blue-600 p-3 rounded-2xl shadow-lg shadow-blue-600/20">
                     <Sparkles className="h-6 w-6 text-white animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black uppercase tracking-tight">AI Co-Pilot Clinic</h3>
                    <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">Análise do Hospital</p>
                  </div>
                </div>
                
                <div className="bg-slate-800/100 border border-slate-700/50 rounded-2xl p-5 text-xs leading-relaxed text-slate-200 mb-6 min-h-[170px] flex items-center justify-center">
                   {aiInsights ? (
                     <div className="space-y-2">
                        <p className="font-medium whitespace-pre-line">"{aiInsights}"</p>
                     </div>
                   ) : (
                     <div className="text-center text-slate-400 text-xs italic">
                        Clique no botão acima ou aguarde para solicitar uma análise epidemiológica estratégica com Inteligência Artificial baseada no histórico actual.
                     </div>
                   )}
                </div>
                
                <button 
                  onClick={generateAiInsights}
                  disabled={loadingAi || patients.length === 0}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all hover:shadow-xl active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loadingAi ? <Loader2 className="h-4 w-4 animate-spin" /> : <TrendingUp className="h-4 w-4" />}
                  {loadingAi ? 'ANALISANDO DADOS...' : 'Efetuar Nova Leitura IA'}
                </button>
             </div>
          </div>

          {/* Clinician Assistant and backup advice */}
          <div className="bg-gradient-to-br from-indigo-700 to-blue-800 text-white rounded-[2rem] p-8 shadow-md relative overflow-hidden">
             <div className="absolute top-0 right-0 p-6 opacity-10">
                <Lightbulb className="h-20 w-20" />
             </div>
             <div className="relative z-10">
                <div className="flex items-center gap-2 mb-3">
                   <div className="bg-white/10 p-2 rounded-xl backdrop-blur-md">
                      <Lightbulb className="h-5 w-5 text-amber-300" />
                   </div>
                   <h3 className="text-base font-black uppercase tracking-tight">Alerta de Prevenção</h3>
                </div>
                <p className="text-xs font-medium text-blue-50 leading-relaxed mb-4">
                  De acordo com a incidência geográfica, sugerimos reforço na fiscalização vacinal e reservas médicas na zona de: <strong className="text-amber-300 underline">{cityData[0]?.name || 'Tchioco (Sede)'}</strong>.
                </p>
                <div className="h-2 bg-black/20 rounded-full overflow-hidden">
                   <motion.div initial={{ width: 0 }} animate={{ width: '70%' }} className="h-full bg-amber-400"></motion.div>
                </div>
                <div className="flex justify-between items-center mt-2 text-[9px] font-bold uppercase tracking-wider text-slate-200">
                  <span>Risco Epidemiológico</span>
                  <span className="text-amber-300">Alto (70%)</span>
                </div>
             </div>
          </div>

        </div>
      </div>

      {/* DEMOGRAPHICS GRID - INCLUDES REQUESTED GENDER (MALE/FEMALE) ANALYSIS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* 1. GENDER PIE CHART AS REQUESTED */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Baby className="h-5 w-5 text-blue-500" />
              <h3 className="font-black text-slate-800 text-sm uppercase tracking-tight">Distribuição por Género</h3>
            </div>
            <p className="text-xs text-slate-400 mb-4">Análise comparativa de taxa de admissão por sexo</p>
          </div>
          
          <div className="h-[180px] w-full relative flex items-center justify-center">
            {patients.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={genderData} 
                    innerRadius={45} 
                    outerRadius={65} 
                    paddingAngle={5} 
                    dataKey="value"
                    labelLine={false}
                  >
                    {genderData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val) => [`${val} paciente(s)`, 'Quantidade']} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <span className="text-xs text-slate-400 italic">Sem registros clínicos</span>
            )}
          </div>

          <div className="flex justify-center flex-wrap gap-4 mt-3">
            {genderData.map(d => (
              <div key={d.name} className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                <span className="text-[11px] font-bold text-slate-700">{d.name} ({d.value})</span>
              </div>
            ))}
          </div>
        </div>

        {/* 2. AGE GROUPS CHART */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Activity className="h-5 w-5 text-indigo-500" />
              <h3 className="font-black text-slate-800 text-sm uppercase tracking-tight">Faixa Etária</h3>
            </div>
            <p className="text-xs text-slate-400 mb-4">Grupos de idades pediátricas dominantes</p>
          </div>

          <div className="h-[180px] w-full relative flex items-center justify-center">
            {ageGroupData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={ageGroupData} 
                    innerRadius={45} 
                    outerRadius={65} 
                    paddingAngle={4} 
                    dataKey="value"
                    labelLine={false}
                  >
                    {ageGroupData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val) => [`${val} paciente(s)`, 'Quantidade']} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <span className="text-xs text-slate-400 italic">Sem faixas etárias definidas</span>
            )}
          </div>

          <div className="flex justify-center flex-wrap gap-3 mt-3">
            {ageGroupData.map(d => (
              <div key={d.name} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                <span className="text-[10px] font-bold text-slate-700 truncate max-w-[90px]" title={d.name}>{d.name} ({d.value})</span>
              </div>
            ))}
          </div>
        </div>

        {/* 3. TOP RESORT GEOGRAPHIC AREAS FROM LUBANGO */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <MapIcon className="h-5 w-5 text-emerald-500" />
              <h3 className="font-black text-slate-800 text-sm uppercase tracking-tight">Geografia de Origem</h3>
            </div>
            <p className="text-xs text-slate-400 mb-4">Principais bairros e comunas com maior incidência</p>
          </div>

          <div className="space-y-3 flex-1 flex flex-col justify-center">
            {cityData.map((city, idx) => {
              const maxVal = cityData[0]?.value || 1;
              const pct = Math.round((city.value / maxVal) * 100);
              return (
                <div key={city.name} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                     <span className="font-bold text-slate-800">{city.name}</span>
                     <span className="font-black text-slate-500 text-[11px]">{city.value} Pacientes</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                     <div className="h-full bg-blue-600 rounded-full" style={{ width: `${pct}%` }}></div>
                  </div>
                </div>
              );
            })}
            {cityData.length === 0 && (
              <div className="text-slate-400 text-xs italic text-center py-6">Sem estatísticas geográficas</div>
            )}
          </div>
        </div>

      </div>

      {/* RECENT REGISTRATIONS TABLE */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
         <div className="px-6 py-5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <History className="h-5 w-5 text-blue-400 animate-pulse" />
              <h3 className="font-black text-white text-sm uppercase tracking-wider">Histórico Recente de Entradas</h3>
            </div>
            <span className="text-[10px] bg-slate-800 hover:bg-slate-700 text-blue-400 p-2 rounded-xl font-bold uppercase tracking-wider transition-all">Sincronização Ativa</span>
         </div>
         <div className="overflow-x-auto">
           <table className="w-full text-left">
              <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Serial ID / Nome</th>
                  <th className="px-6 py-4">Género</th>
                  <th className="px-6 py-4">Idade</th>
                  <th className="px-6 py-4">Sintomas / Diagnóstico</th>
                  <th className="px-6 py-4">Prioridade</th>
                  <th className="px-6 py-4">Saída / Estado</th>
                  <th className="px-6 py-4">Horário Entrada</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {patients.slice(0, 5).map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-all">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900">{p.name}</p>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{p.patientSerialId || 'Sem ID'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                        p.gender === 'Masculino' ? "bg-blue-50 text-blue-600" : "bg-pink-50 text-pink-600"
                      )}>
                        {p.gender}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800">{p.age} Anos</p>
                      <p className="text-[9px] text-slate-400">{p.ageGroup}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800 truncate max-w-[160px]" title={p.occurrenceType}>{p.occurrenceType}</p>
                      <p className="text-[10px] text-slate-400 truncate max-w-[160px]" title={p.diagnosis || p.signalsSymptoms}>{p.diagnosis || p.signalsSymptoms}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2 px-1 rounded text-[10px] font-bold",
                        p.priority === 'Emergência' ? "bg-red-500 text-white" :
                        p.priority === 'Alta' ? "bg-amber-100 text-amber-800" :
                        p.priority === 'Média' ? "bg-blue-100 text-blue-800" : "bg-slate-100 text-slate-700"
                      )}>
                        {p.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold">
                      <span className={cn(
                        "text-[10px] tracking-wider",
                        p.state === 'Alta' ? "text-emerald-600" :
                        p.state === 'Internado' ? "text-blue-600" :
                        p.state === 'Óbito' ? "text-red-600" : "text-slate-600"
                      )}>
                        ● {p.state}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400 font-bold">{new Date(p.entryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                  </tr>
                ))}
                {patients.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-400 italic">Nenhum paciente registado no banco de dados.</td>
                  </tr>
                )}
              </tbody>
           </table>
         </div>
      </div>
    </div>
  );
}

// Reusable Subcomponent for Polish and consistency
interface MetricCardProps {
  icon: React.ComponentType<any>;
  label: string;
  value: string | number;
  subtitle?: string;
  color?: string;
  iconBg?: string;
  border?: string;
  isAlert?: boolean;
}

function MetricCard({ 
  icon: Icon, 
  label, 
  value, 
  subtitle, 
  color, 
  iconBg, 
  border, 
  isAlert 
}: MetricCardProps) {
  return (
    <div className={cn(
      "p-6 rounded-[2rem] border shadow-sm transition-all relative overflow-hidden flex flex-col justify-between",
      border || "border-slate-200 bg-white"
    )}>
      {isAlert && (
        <div className="absolute top-0 left-0 w-2 h-full bg-red-500"></div>
      )}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
          <p className={cn("text-4xl font-black tracking-tight", color || "text-slate-900")}>
            {value}
          </p>
        </div>
        <div className={cn("p-3.5 rounded-2xl shadow-inner", iconBg || "bg-slate-50 text-slate-600")}>
          {Icon && <Icon className="h-6 w-6" />}
        </div>
      </div>
      {subtitle && (
        <p className="text-xs text-slate-400 mt-4 font-semibold tracking-tight">{subtitle}</p>
      )}
    </div>
  );
}
