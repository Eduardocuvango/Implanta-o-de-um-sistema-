import React, { useState, useEffect } from "react";
import { useLocalAuth } from "../context/LocalAuthContext";
import { localDatabase } from "../services/localDatabase";
import { Patient } from "../../types";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area
} from "recharts";
import {
  Activity, Users, Clock, AlertTriangle, TrendingUp, Info, Sparkles,
  HeartPulse, Database, ArrowLeftRight
} from "lucide-react";

export default function LocalDashboardPage() {
  const { profile } = useLocalAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [lastSync, setLastSync] = useState<Date>(new Date());
  const [aiInsights, setAiInsights] = useState("");
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [temporalMode, setTemporalMode] = useState<"semanal" | "mensal">("semanal");

  useEffect(() => {
    // Read from our local data on load and hook a short interval to poll updates
    const loadState = () => {
      const data = localDatabase.getPatients();
      setPatients(data);
      setLastSync(new Date());
    };
    loadState();
    const interval = setInterval(loadState, 2000);
    return () => clearInterval(interval);
  }, []);

  // Compute local intelligent diagnostic clinical analysis offline
  useEffect(() => {
    if (patients.length === 0) {
      setAiInsights("Ainda não existem registos de triagem de menores na base de dados local para gerar previsões epidemiológicas.");
      return;
    }

    setLoadingInsights(true);
    const timer = setTimeout(() => {
      const total = patients.length;
      const emergencies = patients.filter((p) => p.priority === "Emergência").length;
      const waiting = patients.filter((p) => p.status === "Em Espera").length;
      const male = patients.filter((p) => p.gender === "Masculino").length;
      const female = patients.filter((p) => p.gender === "Feminino").length;
      
      // Look for top neighborhood
      const neighborhoods = patients.map(p => p.neighborhood || "Desconhecido");
      const neighborhoodCounts = neighborhoods.reduce((acc: any, n) => {
        acc[n] = (acc[n] || 0) + 1;
        return acc;
      }, {});
      const topNeighborhood = Object.entries(neighborhoodCounts)
        .sort((a: any, b: any) => b[1] - a[1])[0]?.[0] || "Centro";

      // Look for top symptom
      const symptoms = patients.map(p => p.occurrenceType || "Outro");
      const symptomCounts = symptoms.reduce((acc: any, s) => {
        acc[s] = (acc[s] || 0) + 1;
        return acc;
      }, {});
      const topSymptom = Object.entries(symptomCounts)
        .sort((a: any, b: any) => b[1] - a[1])[0]?.[0] || "Febre Superior a 38.5C";

      let insightText = `Análise Epidemiológica Local: Atualmente, estão sob monitorização ${total} menores na base de dados física do Lubango. O motivo de triagem predominante é "${topSymptom}" com maior concentração epidemiológica no bairro "${topNeighborhood}". `;
      
      if (emergencies > 0) {
        insightText += `Alerta de Risco: Foram detetados ${emergencies} casos identificados como Emergência Crítica. Recomenda-se transferência prioritária para reidratação endovenosa ou oxigenoterapia imediata. `;
      } else {
        insightText += `Estado Operacional: O fluxo de triagem encontra-se estável com tempo médio de atendimento inferior a 15 minutos em toda a ala do Hospital Pioneiro Zeca. `;
      }

      const malePercentage = Math.round((male / total) * 100);
      insightText += `A proporção atual de género é de ${malePercentage}% Masculino e ${Math.round((female / total) * 100)}% Feminino.`;
      
      setAiInsights(insightText);
      setLoadingInsights(false);
    }, 400);

    return () => clearTimeout(timer);
  }, [patients]);

  if (profile?.role !== "admin") {
    return (
      <div className="flex h-[70vh] flex-col items-center justify-center gap-4 text-center px-4 bg-slate-950">
        <AlertTriangle className="h-16 w-16 text-emerald-500 animate-pulse" />
        <h1 className="text-2xl font-black text-white">Diretor Clínico Requerido</h1>
        <p className="max-w-md text-slate-400 text-sm">
          Apenas utilizadores com função de <strong>Diretor Clínico (Admin)</strong> podem visualizar análises analíticas de triagem no Lubango. Altere o perfil para Admin.
        </p>
      </div>
    );
  }

  // Pre-calculations
  const total = patients.length;
  const waiting = patients.filter((p) => p.status === "Em Espera").length;
  const inTriagem = patients.filter((p) => p.status === "Em Triagem").length;
  const attended = patients.filter((p) => p.status === "Atendido").length;
  const critical = patients.filter((p) => p.priority === "Emergência").length;

  const male = patients.filter((p) => p.gender === "Masculino").length;
  const female = patients.filter((p) => p.gender === "Feminino").length;

  // Gender Chart representation
  const genderData = [
    { name: "Masc.", value: male, color: "#38bdf8" },
    { name: "Fem.", value: female, color: "#f472b6" }
  ];

  // Age representation
  const ageGroupCounts = patients.reduce((acc: { [key: string]: number }, p) => {
    const group = p.ageGroup || "Bebé Menor que 1 Ano";
    acc[group] = (acc[group] || 0) + 1;
    return acc;
  }, {});

  const ageData = Object.entries(ageGroupCounts).map(([name, value], idx) => {
    const colors = ["#818cf8", "#34d399", "#fbbf24", "#f87171", "#a78bfa"];
    return {
      name,
      value,
      color: colors[idx % colors.length]
    };
  });

  // Urgencies
  const prioritiesCounts = patients.reduce((acc: { [key: string]: number }, p) => {
    const norm = p.priority || "Médio";
    acc[norm] = (acc[norm] || 0) + 1;
    return acc;
  }, {});

  const priorityData = Object.entries(prioritiesCounts).map(([name, value]) => ({
    name,
    value
  }));

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

  const completionRate = total > 0 ? Math.round((attended / total) * 100) : 100;

  return (
    <div className="space-y-8 bg-slate-950 p-6 min-h-screen text-white">
      {/* Local Badge Warning */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-emerald-800/40 bg-emerald-950/20 p-4">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-emerald-600 p-2 text-white">
            <Database className="h-5 w-5" />
          </div>
          <div>
            <span className="rounded bg-emerald-900 border border-emerald-700 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-emerald-400">
              BANCO LOCAL STORAGE
            </span>
            <p className="text-xs text-slate-300 mt-1">
              Este painel de triagem está operando de forma 100% isolada e física sem dependências à nuvem.
            </p>
          </div>
        </div>
        <div className="text-xs text-slate-400 font-mono">
          Sincronização: <span className="text-emerald-400">{lastSync.toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Grid Counters */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Registos</span>
            <Users className="h-5 w-5 text-indigo-400" />
          </div>
          <p className="mt-4 text-3xl font-black">{total}</p>
          <span className="text-[10px] text-zinc-500 font-medium">menores triados no total</span>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Aguardando</span>
            <Clock className="h-5 w-5 text-amber-500" />
          </div>
          <p className="mt-4 text-3xl font-black">{waiting}</p>
          <span className="text-[10px] text-zinc-500 font-medium">crianças na sala de espera</span>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Em Triagem</span>
            <Activity className="h-5 w-5 text-blue-500" />
          </div>
          <p className="mt-4 text-3xl font-black">{inTriagem}</p>
          <span className="text-[10px] text-zinc-500 font-medium">atendimento ativo agora</span>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Casos Críticos</span>
            <AlertTriangle className="h-5 w-5 text-red-500" />
          </div>
          <p className="mt-4 text-3xl font-black text-red-400">{critical}</p>
          <span className="text-[10px] text-red-400/80 font-bold">prioridade de Emergência</span>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Taxa de Alta</span>
            <HeartPulse className="h-5 w-5 text-emerald-400" />
          </div>
          <p className="mt-4 text-3xl font-black text-emerald-400">{completionRate}%</p>
          <span className="text-[10px] text-zinc-500 font-medium">atendimento concluído</span>
        </div>
      </div>

      {/* AI epidemiological insights */}
      <div className="rounded-2xl border border-emerald-800/40 bg-slate-900 p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 pointer-events-none opacity-10">
          <Sparkles className="h-16 w-16 text-emerald-400" />
        </div>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-5 w-5 text-emerald-400 animate-pulse" />
          <h2 className="text-sm font-black uppercase tracking-widest text-emerald-400">
            Cérebro Analítico Offline (Triagem Ativa)
          </h2>
        </div>
        {loadingInsights ? (
          <div className="h-10 animate-pulse bg-slate-800 rounded-lg w-full"></div>
        ) : (
          <p className="text-sm text-slate-300 leading-relaxed font-semibold">
            {aiInsights}
          </p>
        )}
      </div>

      {/* Evolução Temporal das Triagens (Semanal / Mensal) */}
      <div id="local-chart-temporal" className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-slate-800 p-2 text-indigo-400 rounded-xl">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">
                Evolução Temporal de Atendimentos
              </h3>
              <p className="text-xs text-slate-500 font-medium">Fluxo operacional por dia da semana ou histórico de meses</p>
            </div>
          </div>
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setTemporalMode("semanal")}
              className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                temporalMode === "semanal"
                  ? "bg-slate-800 text-indigo-400 font-bold"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              Semana
            </button>
            <button
              type="button"
              onClick={() => setTemporalMode("mensal")}
              className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                temporalMode === "mensal"
                  ? "bg-slate-800 text-indigo-400 font-bold"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              Meses
            </button>
          </div>
        </div>

        <div className="h-64 w-full">
          {total > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart 
                data={temporalMode === "semanal" ? weeklyData : monthlyData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="localColorCasos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#64748b" 
                  fontSize={10} 
                  tickLine={false} 
                />
                <YAxis 
                  stroke="#64748b" 
                  fontSize={10} 
                  tickLine={false} 
                  allowDecimals={false}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "#0f172a", 
                    border: "1px solid #1e293b",
                    borderRadius: "12px",
                    color: "#fff",
                    fontSize: "11px"
                  }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="Casos" 
                  stroke="#818cf8" 
                  strokeWidth={2.5} 
                  fillOpacity={1} 
                  fill="url(#localColorCasos)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-slate-500 text-xs text-center">
              Nenhum dado temporal disponível para traçar tendências.
            </div>
          )}
        </div>
      </div>

      {/* Recharts Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Gender Pie Chart */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-6">
            Distribuição Demográfica por Género
          </h3>
          {total === 0 ? (
            <div className="flex h-60 items-center justify-center text-slate-500 text-xs">
              Sem dados disponíveis para traçar gráficos.
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center sm:flex-row gap-6">
              <div className="h-60 w-60">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={genderData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {genderData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip cursor={{ fill: "transparent" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3">
                {genderData.map((g, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <span
                      className="inline-block h-3.5 w-3.5 rounded-full"
                      style={{ backgroundColor: g.color }}
                    ></span>
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      {g.name}: {g.value} ({total > 0 ? Math.round((g.value / total) * 100) : 0}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Age Groups Bar Chart */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-6">
            Grupos Etários Pediátricos (Triagem Local)
          </h3>
          {ageData.length === 0 ? (
            <div className="flex h-60 items-center justify-center text-slate-500 text-xs">
              Nenhuma triagem efetuada hoje na Huíla.
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ageData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155" }} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {ageData.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
