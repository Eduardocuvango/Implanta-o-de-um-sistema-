import React, { useState, useEffect } from "react";
import { useLocalAuth } from "../context/LocalAuthContext";
import { localDatabase } from "../services/localDatabase";
import { Patient, Gender, Status, Priority, State } from "../../types";
import {
  Plus, Search, Filter, Trash2, Edit3, X, Save, AlertTriangle, Clock,
  HeartPulse, Printer, Sparkles, CheckSquare, Download, Clipboard
} from "lucide-react";

const PEDIATRIC_SYMPTOMS = [
  "Febre Alta Pediátrica (>38.5°C)",
  "Vómitos Incoercíveis / Recorrentes",
  "Diarreia Líquida Aguda com Sinais de Desidratação",
  "Dificuldade Respiratória Grave (Asfixia / Chio)",
  "Tosse Seca Espasmódica Persistente",
  "Convulsões Febris Repetidas",
  "Letargia / Estado Comatoso",
  "Recusa Alimentar Grave (Inabilidade de mamar)",
  "Dor Abdominal Aguda Irradiada",
  "Erupção Cutânea Difusa (Sarampo / Varicela Suspeita)",
  "Prostração Intensa com Palidez Cutâneo-Mucosa",
  "Cefaleia Intensa com Rigidez na Nuca"
];

const HUILA_MUNICIPALITIES = ["Lubango", "Chibia", "Humpata", "Cacula", "Matala", "Quipungo", "Chicomba", "Caluquembe", "Caconda"];

export default function LocalPatientsPage() {
  const { profile } = useLocalAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPriority, setFilterPriority] = useState<string>("todos");
  const [filterStatus, setFilterStatus] = useState<string>("todos");

  // Form State
  const [name, setName] = useState("");
  const [gender, setGender] = useState<Gender>("Masculino");
  const [birthDate, setBirthDate] = useState("");
  const [age, setAge] = useState<number>(1);
  const [status, setStatus] = useState<Status>("Em Espera");
  const [priority, setPriority] = useState<Priority>("Baixa");
  const [province, setProvince] = useState("Huíla");
  const [city, setCity] = useState("Lubango");
  const [neighborhood, setNeighborhood] = useState("Centro");
  const [occurrenceType, setOccurrenceType] = useState(PEDIATRIC_SYMPTOMS[0]);
  const [signalsSymptoms, setSignalsSymptoms] = useState("");
  const [patientState, setPatientState] = useState<State>("Internado");

  const [aiAnalysis, setAiAnalysis] = useState("");
  const [loadingAi, setLoadingAi] = useState(false);

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = () => {
    setPatients(localDatabase.getPatients());
  };

  const handleSymptomAnalysis = () => {
    if (!signalsSymptoms || signalsSymptoms.trim().length < 5) {
      alert("Por favor descreva os sintomas de forma mais detalhada para a IA avaliar.");
      return;
    }
    setLoadingAi(true);
    setTimeout(() => {
      // Offline local diagnostics simulation
      const text = signalsSymptoms.toLowerCase();
      let dx = "Sintomatologia inespecífica.";
      let level: Priority = "Baixa";
      let advice = "Manter vigilância geral e hidratação oral.";

      if (text.includes("febre") && text.includes("vómito")) {
        dx = "Forte suspeita de Malária Pediátrica.";
        level = "Alta";
        advice = "Recomendada triagem com Teste Rápida de Malária (RDT) imediato e administração de antipiréticos.";
      } else if (text.includes("diarreia") || text.includes("perda")) {
        dx = "Desidratação Aguda por Perdas Gastrointestinais.";
        level = "Emergência";
        advice = "Iniciar reidratação oral imediata ou cateterização para fluidoterapia.";
      } else if (text.includes("tosse") || text.includes("respirar") || text.includes("chio")) {
        dx = "Bronquiolite ou Pneumonia Bacteriana.";
        level = "Emergência";
        advice = "Avaliar saturação de Oxigênio. Encaminhar para oxigenoterapia se inferior a 92%.";
      }

      setAiAnalysis(`[DIAGNÓSTICO OFFLINE]
Sugerido: ${dx}
Nível de Gravidade: ${level}
Recomendação: ${advice}`);
      
      setPriority(level); // Auto-suggest
      setLoadingAi(false);
    }, 500);
  };

  const resetForm = () => {
    setName("");
    setGender("Masculino");
    setBirthDate("");
    setAge(1);
    setStatus("Em Espera");
    setPriority("Baixa");
    setCity("Lubango");
    setNeighborhood("Centro");
    setOccurrenceType(PEDIATRIC_SYMPTOMS[0]);
    setSignalsSymptoms("");
    setPatientState("Internado");
    setAiAnalysis("");
    setEditingId(null);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("Nome do menor é obrigatório!");
      return;
    }

    const nextSerialId = `P${String(patients.length + 1).padStart(4, "0")}`;

    const parsedAge = Number(age);
    let ageGroup = "Bebé Menor que 1 Ano";
    if (parsedAge >= 1 && parsedAge <= 4) ageGroup = "1-4 Anos";
    if (parsedAge >= 5 && parsedAge <= 9) ageGroup = "5-9 Anos";
    if (parsedAge >= 10) ageGroup = "Maior que 10 Anos";

    const payload = {
      patientSerialId: nextSerialId,
      name,
      gender,
      birthDate: birthDate || new Date().toISOString().split("T")[0],
      age: parsedAge,
      ageGroup,
      occurrenceDate: new Date().toISOString().split("T")[0],
      entryTime: new Date().toLocaleTimeString().slice(0, 5),
      status,
      province,
      city,
      neighborhood,
      occurrenceType,
      signalsSymptoms,
      priority,
      state: patientState,
      receptionistId: profile?.uid || "local-op",
      receptionistSignature: profile?.name || "Enfermeira Local"
    };

    if (editingId) {
      localDatabase.updatePatient(editingId, payload);
      alert("Ficha de Triagem atualizada com sucesso no banco local!");
    } else {
      localDatabase.addPatient(payload);
      alert("Novo paciente registado com sucesso no banco local!");
    }

    resetForm();
    setShowForm(false);
    loadPatients();
  };

  const startEdit = (p: Patient) => {
    setEditingId(p.id);
    setName(p.name);
    setGender(p.gender);
    setBirthDate(p.birthDate || "");
    setAge(p.age);
    setStatus(p.status);
    setPriority(p.priority);
    setCity(p.city);
    setNeighborhood(p.neighborhood || "Centro");
    setOccurrenceType(p.occurrenceType);
    setSignalsSymptoms(p.signalsSymptoms);
    setPatientState(p.state);
    setShowForm(true);
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Tem a certeza que deseja remover permanentemente o menor ${name}?`)) {
      localDatabase.deletePatient(id);
      loadPatients();
    }
  };

  const handlePrint = (p: Patient) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Ficha de Triagem - ${p.name}</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #1e293b; }
            .header { text-align: center; border-bottom: 3px double #059669; padding-bottom: 20px; }
            h1 { margin: 0; font-size: 24px; color: #047857; }
            .meta { display: grid; grid-template-cols: 1fr 1fr; gap: 15px; margin-top: 30px; }
            .field { margin-bottom: 10px; font-size: 14px; }
            .field strong { text-transform: uppercase; color: #475569; font-size: 11px; }
            .box { border: 1px solid #cbd5e1; padding: 15px; border-radius: 8px; margin-top: 15px; }
            .priority { font-weight: bold; padding: 4px 8px; border-radius: 4px; display: inline-block; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>HOSPITAL PEDIÁTRICO PIONEIRO ZECA LUBANGO</h1>
            <p><strong>REDE DE TRIAGEM GERAL - FICHA DO PACIENTE</strong></p>
          </div>
          <div class="meta">
            <div class="field"><strong>ID DO PACIENTE:</strong> <br/> ${p.patientSerialId || p.id}</div>
            <div class="field"><strong>NOME COMPLETO:</strong> <br/> ${p.name}</div>
            <div class="field"><strong>GÉNERO:</strong> <br/> ${p.gender}</div>
            <div class="field"><strong>IDADE:</strong> <br/> ${p.age} Anos (${p.ageGroup})</div>
            <div class="field"><strong>CIDADE/MUNICÍPIO:</strong> <br/> ${p.province} / ${p.city} (${p.neighborhood})</div>
            <div class="field"><strong>ESTADO DO REGISTO:</strong> <br/> ${p.status}</div>
          </div>
          <div class="box">
            <div class="field"><strong>MOTIVO DE ENTRADA:</strong> <br/> ${p.occurrenceType}</div>
            <div class="field"><strong>SINTOMAS DETALHADOS:</strong> <br/> ${p.signalsSymptoms || "Sem detalhes adicionais."}</div>
            <div class="field"><strong>PRIORIDADE DE ATENDIMENTO:</strong> <br/> <span class="priority">${p.priority}</span></div>
          </div>
          <div class="box" style="margin-top: 40px; text-align: center; border-top: 1px solid #1e293b; border-bottom: none; border-left: none; border-right: none; border-radius: 0;">
             <p style="font-size: 12px; margin-top:0;">ASSINATURA DO ENFERMEIRO RESPONSÁVEL</p>
             <p style="font-style: italic; font-weight: bold; margin-bottom:0;">${p.receptionistSignature || "Triage Local"}</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  // Filter and search computation
  const filtered = patients.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.occurrenceType.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (p.patientSerialId && p.patientSerialId.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesPriority = filterPriority === "todos" || p.priority === filterPriority;
    const matchesStatus = filterStatus === "todos" || p.status === filterStatus;

    return matchesSearch && matchesPriority && matchesStatus;
  });

  return (
    <div className="space-y-6 bg-slate-950 p-6 min-h-screen text-white selection:bg-emerald-800 selection:text-white">
      {/* Top action bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Triagem de Menores (Modo Offline)</h1>
          <p className="text-xs text-slate-400">Admissão direta no Lubango sem necessidade de sincronização em nuvem.</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-4.5 text-xs font-black uppercase tracking-widest text-white shadow-lg hover:bg-emerald-500 transition-all active:scale-95"
        >
          <Plus className="h-5 w-5" />
          Nova Ficha de Triagem
        </button>
      </div>

      {/* SEARCH AND FILTERS BAR */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4 rounded-2xl border border-slate-800 bg-slate-900 p-4 shadow-sm">
        <div className="relative focus-within:text-emerald-400 transition-colors">
          <Search className="absolute left-4 top-4 h-5 w-5 text-slate-500" />
          <input
            type="text"
            placeholder="Procurar menor por nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3.5 pl-12 pr-4 text-xs font-medium placeholder-slate-600 text-white focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-4.5 px-4 text-xs font-bold text-slate-300 focus:outline-none focus:border-emerald-500"
          >
            <option value="todos">Prioridade: Todas</option>
            <option value="Baixa">Baixa</option>
            <option value="Média">Média</option>
            <option value="Alta">Alta</option>
            <option value="Emergência">Emergência</option>
          </select>
        </div>

        <div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-4.5 px-4 text-xs font-bold text-slate-300 focus:outline-none focus:border-emerald-500"
          >
            <option value="todos">Fase: Todas</option>
            <option value="Em Espera">Em Espera</option>
            <option value="Em Triagem">Em Triagem</option>
            <option value="Atendido">Atendido</option>
          </select>
        </div>

        <div className="flex items-center justify-center border border-dashed border-slate-800 rounded-xl bg-slate-950 p-2 text-center text-[10px] font-black uppercase text-emerald-400">
           {filtered.length} Menor(es) Encontrado(s)
        </div>
      </div>

      {/* PATIENT TRIAGE FORM MODAL OVERLAY */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-2xl relative">
            <button
              onClick={() => { resetForm(); setShowForm(false); }}
              className="absolute right-6 top-6 rounded-full bg-slate-950 p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            <h2 className="text-xl font-black text-white mb-6">
              {editingId ? "Editar Ficha de Triagem" : "Admitir Novo Menor na Triagem"}
            </h2>

            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-widest mb-2">
                    Nome Completo do Menor
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="ex: Carlos Francisco"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3.5 px-4 text-xs font-medium placeholder-slate-700 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-widest mb-2">
                    Idade da Criança (Anos)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="18"
                    required
                    value={age}
                    onChange={(e) => setAge(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3.5 px-4 text-xs font-medium text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-widest mb-2">
                    Género Clínico
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as Gender)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3.5 px-4 text-xs font-bold text-slate-300 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Masculino">Masculino</option>
                    <option value="Feminino">Feminino</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-widest mb-2">
                    Prioridade de Triagem
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as Priority)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3.5 px-4 text-xs font-bold text-slate-300 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Baixa">Baixa (Verde)</option>
                    <option value="Média">Média (Amarelo)</option>
                    <option value="Alta">Alta (Laranja)</option>
                    <option value="Emergência">Emergência (Vermelho)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-widest mb-2">
                    Fase de Atendimento
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as Status)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3.5 px-4 text-xs font-bold text-slate-300 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Em Espera">Em Espera</option>
                    <option value="Em Triagem">Em Triagem</option>
                    <option value="Atendido">Atendido</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-widest mb-2">
                    Município / Localização
                  </label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3.5 px-4 text-xs font-bold text-slate-300 focus:outline-none"
                  >
                    {HUILA_MUNICIPALITIES.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-widest mb-2">
                    Bairro / Comuna
                  </label>
                  <input
                    type="text"
                    value={neighborhood}
                    onChange={(e) => setNeighborhood(e.target.value)}
                    placeholder="ex: Santo António"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3.5 px-4 text-xs font-medium placeholder-slate-700 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-widest mb-2">
                  Queixa Principal / Motivo de Entrada
                </label>
                <select
                  value={occurrenceType}
                  onChange={(e) => setOccurrenceType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3.5 px-4 text-xs font-bold text-slate-300 focus:outline-none focus:border-emerald-500"
                >
                  {PEDIATRIC_SYMPTOMS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-widest">
                    Observações de Sintomas Críticos
                  </label>
                  <button
                    type="button"
                    onClick={handleSymptomAnalysis}
                    disabled={loadingAi}
                    className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-emerald-400 hover:text-emerald-300 cursor-pointer"
                  >
                    <Sparkles className="h-4 w-4 animate-spin" style={{ animationDuration: "3s" }} />
                    {loadingAi ? "A analisar..." : "Triagem Rápida IA"}
                  </button>
                </div>
                <textarea
                  rows={3}
                  value={signalsSymptoms}
                  onChange={(e) => setSignalsSymptoms(e.target.value)}
                  placeholder="ex: Teve episódios febris de início súbito. Solonência ligeira nas últimas horas..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-xs font-semibold placeholder-slate-700 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {aiAnalysis && (
                <div className="rounded-2xl border border-emerald-800/40 bg-emerald-950/20 p-4 font-mono text-xs text-emerald-400 whitespace-pre-line leading-relaxed">
                  {aiAnalysis}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 cursor-pointer rounded-2xl bg-emerald-600 py-4.5 text-xs font-black uppercase tracking-widest text-white hover:bg-emerald-500 transition-all text-center"
                >
                  <Save className="h-4 w-4 inline mr-2" />
                  Gravar Dados na Tabela
                </button>
                <button
                  type="button"
                  onClick={() => { resetForm(); setShowForm(false); }}
                  className="rounded-2xl border border-slate-800 bg-slate-950 px-6 py-4.5 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PATIENTS TABLE LIST */}
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950 text-slate-400 font-bold uppercase tracking-wider">
                <th className="px-6 py-4">ID / Registo</th>
                <th className="px-6 py-4">Nome Completo</th>
                <th className="px-6 py-4">Idade</th>
                <th className="px-6 py-4">Motivo / Queixa</th>
                <th className="px-6 py-4">Origem</th>
                <th className="px-6 py-4 text-center">Gravidade</th>
                <th className="px-6 py-4 text-center">Fase</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-500 font-medium">
                    Nenhum menor registado no Lubango com estes parâmetros.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => {
                  let badgeColor = "bg-green-950/40 text-emerald-400 border border-emerald-800/80";
                  if (p.priority === "Média") badgeColor = "bg-yellow-950/40 text-yellow-500 border border-yellow-800/85";
                  if (p.priority === "Alta") badgeColor = "bg-orange-950/40 text-orange-400 border border-orange-850/85";
                  if (p.priority === "Emergência") badgeColor = "bg-red-950/50 text-red-400 border border-red-800/80 animate-pulse";

                  let statusColor = "bg-slate-950 text-slate-400 border border-slate-800";
                  if (p.status === "Em Triagem") statusColor = "bg-blue-950/40 text-blue-400 border border-blue-800/80";
                  if (p.status === "Atendido") statusColor = "bg-emerald-950/50 text-emerald-400 border border-emerald-800/80";

                  return (
                    <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-slate-400">
                        {p.patientSerialId || p.id}
                      </td>
                      <td className="px-6 py-4 font-bold text-white">
                        {p.name}
                        <span className="block text-[10px] text-slate-500 mt-1 uppercase font-normal tracking-wide">
                          Triado por: {p.receptionistSignature || "Enfermeiro Triage"}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-300">
                        {p.age} Anos ({p.ageGroup})
                      </td>
                      <td className="px-6 py-4 text-slate-300">
                        <span className="font-semibold block">{p.occurrenceType}</span>
                        <span className="text-[10px] text-zinc-500 line-clamp-1 block mt-1">
                          {p.signalsSymptoms || "Sem notas."}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                        {p.city} / {p.neighborhood}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-block px-2.5 py-1 rounded-lg text-[10px] uppercase font-black tracking-widest ${badgeColor}`}>
                          {p.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-block px-2.5 py-1 rounded-lg text-[10px] uppercase font-black tracking-widest ${statusColor}`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handlePrint(p)}
                            title="Imprimir Ficha de Triage"
                            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-950"
                          >
                            <Printer className="h-4.5 w-4.5" />
                          </button>
                          <button
                            onClick={() => startEdit(p)}
                            title="Editar Dados"
                            className="p-2 text-emerald-400 hover:text-emerald-300 hover:bg-slate-950 rounded-lg"
                          >
                            <Edit3 className="h-4.5 w-4.5" />
                          </button>
                          {profile?.role === "admin" && (
                            <button
                              onClick={() => handleDelete(p.id, p.name)}
                              title="Remover Registros"
                              className="p-2 text-red-400 hover:text-red-300 hover:bg-slate-950 rounded-lg"
                            >
                              <Trash2 className="h-4.5 w-4.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
