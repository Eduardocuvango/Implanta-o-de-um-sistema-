import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { patientService } from "../services/patientService";
import { geminiService } from "../services/geminiService";
import { Patient, Gender, Status, Priority, State } from "../types";
import { calculateAge, getAgeGroup, cn } from "../lib/utils";
import {
  Plus,
  Download,
  Upload,
  Printer,
  Search,
  Filter,
  Trash2,
  Edit3,
  X,
  Save,
  AlertTriangle,
  Clock,
  BrainCircuit,
  Sparkles,
  Loader2,
} from "lucide-react";
import { motion } from "motion/react";
import * as XLSX from "xlsx";

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

const PEDIATRIC_DIAGNOSES = [
  "Malária Complicada (Grave)",
  "Malária Simples não complicada",
  "Pneumonia Bacteriana Aguda",
  "Bronquiolite Viral Aguda Pediátrica",
  "Gastroenterite Aguda com Desidratação Grave",
  "Desidratação Moderada por Perdas Líquidas",
  "Anemia Grave Pediátrica (necessidade de hemoterapia)",
  "Suspeita de Meningite Bacteriana Sepsis",
  "Asma Brônquica Exacerbada em Crise",
  "Otite Média Aguda Supurada",
  "Infecção Activa das Vias Urinárias (IVU)",
  "Amigdalite Estreptocócica Exsudativa",
  "Desnutrição Aguda Grave (Marasmo / Kwashiorkor)"
];

const ANGOLA_PROVINCES = [
  "Huíla",
  "Luanda",
  "Benguela",
  "Huambo",
  "Namibe",
  "Cunene",
  "Cabinda",
  "Cuanza Norte",
  "Cuanza Sul",
  "Malanje",
  "Uíge",
  "Zaire",
  "Bié",
  "Moxico",
  "Lunda Norte",
  "Lunda Sul",
  "Cuando Cubango",
  "Bengo"
];

const HUILA_MUNICIPALITIES = [
  "Lubango",
  "Chibia",
  "Humpata",
  "Cacula",
  "Matala",
  "Quipungo",
  "Chicomba",
  "Caluquembe",
  "Caconda",
  "Gambos",
  "Chipindo",
  "Kuvango",
  "Quilengues",
  "Jamba"
];

const HUILA_NEIGHBORHOODS: Record<string, string[]> = {
  "Lubango": [
    "Tchioco", "Mapunda", "Nambambe", "Santo António", "Centro da Cidade", 
    "Laureanos", "Lucrécia", "João de Almeida", "Comandante Cowboy", 
    "Arco-Íris", "Senzala", "Mitcha", "Bula"
  ],
  "Chibia": ["Chibia Sede", "Jau", "Capunda Cavilongo", "Quihita"],
  "Humpata": ["Humpata Sede", "Neves", "Palanca", "Kaholo", "Bata-Bata"],
  "Cacula": ["Cacula Sede", "Viti Vivali", "Chituto", "Tchiquaqueia"],
  "Matala": ["Matala Sede", "Capelongo", "Mulondo", "Micosse"],
  "Quipungo": ["Quipungo Sede", "Sendi", "Chicungo", "Cainda"],
  "Chicomba": ["Chicomba Sede", "Libongue", "Cutenda", "Que"],
  "Caluquembe": ["Caluquembe Sede", "Calepi", "Negola", "M'bula"],
  "Caconda": ["Caconda Sede", "Cusse", "Gungue", "Uaba"],
  "Gambos": ["Chiange Sede", "Chibemba", "Gambos Sede"],
  "Chipindo": ["Chipindo Sede", "Bambi", "Bunjei"],
  "Kuvango": ["Kuvango Sede", "Galangue", "Vicungo"],
  "Quilengues": ["Quilengues Sede", "Impulo", "Dongo"],
  "Jamba": ["Jamba Sede", "Cassinga", "Dongo", "Chamutete"]
};

export default function PatientsPage() {
  const { user, profile } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [aiSupport, setAiSupport] = useState<any>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  // Validation & Predefined List/Filter States
  const [showManualSymptom, setShowManualSymptom] = useState<boolean>(false);
  const [symptomSearch, setSymptomSearch] = useState<string>("");
  const [showManualDiagnosis, setShowManualDiagnosis] = useState<boolean>(false);
  const [diagnosisSearch, setDiagnosisSearch] = useState<string>("");

  // Form State
  const [activeTab, setActiveTab] = useState<"todos" | "criticos" | "espera" | "atendidos">("todos");

  const initialForm: Omit<
    Patient,
    "id" | "createdAt" | "updatedAt" | "patientSerialId"
  > = {
    name: "",
    gender: "Masculino",
    birthDate: "",
    age: 0,
    ageGroup: "",
    occurrenceDate: new Date().toISOString().split("T")[0],
    entryTime: new Date().toISOString(),
    exitTime: "",
    serviceDuration: 0,
    status: "Em Espera",
    weight: undefined,
    temperature: undefined,
    bloodPressure: "",
    province: "Huíla",
    city: "Lubango",
    neighborhood: "Tchioco",
    occurrenceType: "",
    signalsSymptoms: "",
    diagnosis: "",
    priority: "Baixa",
    state: "Atendido",
    receptionistId: profile?.uid || "",
    receptionistSignature: profile?.signature || "",
  };

  const [formData, setFormData] = useState(initialForm);

  const handleAiClinicalSupport = async () => {
    if (formData.signalsSymptoms.length < 10) return;
    setLoadingAi(true);
    try {
      const result = await geminiService.getClinicalSupport(
        formData.signalsSymptoms,
      );
      setAiSupport(result);
    } finally {
      setLoadingAi(false);
    }
  };

  useEffect(() => {
    if (showForm) {
      setAiSupport(null);
    }
  }, [showForm]);

  useEffect(() => {
    return patientService.subscribe(setPatients);
  }, []);

  const handleBirthDateChange = (date: string) => {
    const age = calculateAge(new Date(date));
    setFormData({
      ...formData,
      birthDate: date,
      age: age,
      ageGroup: getAgeGroup(age),
    });
  };

  const handleExitTimeUpdate = (exit: string) => {
    const entry = new Date(formData.entryTime).getTime();
    const exitDate = new Date(exit).getTime();
    const duration = Math.round((exitDate - entry) / (1000 * 60)); // minutes
    setFormData({
      ...formData,
      exitTime: exit,
      serviceDuration: duration > 0 ? duration : 0,
      status: exit ? "Atendido" : "Em Espera",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.age > 15 || formData.age < 0) {
      alert("Erro de Validação: Estão fora do limite de idade! O Hospital Pediátrico Pioneiro Zeca atende exclusivamente crianças e adolescentes dos 0 aos 15 anos.");
      return;
    }

    try {
      if (editingId) {
        await patientService.update(editingId, {
          ...formData,
          updatedAt: new Date().toISOString(),
        });
      } else {
        await patientService.create({
          ...formData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
      setShowForm(false);
      setEditingId(null);
      setFormData(initialForm);
    } catch (err) {
      console.error(err);
    }
  };

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(patients);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Pacientes");
    XLSX.writeFile(
      wb,
      `Relatorio_Pacientes_PioneiroZeca_${new Date().toLocaleDateString()}.xlsx`,
    );
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: "binary" });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws) as any[];

      for (const item of data) {
        await patientService.create({
          ...item,
          receptionistId: user?.uid || "",
          receptionistSignature: profile?.signature || "Importação Manual",
        });
      }
    };
    reader.readAsBinaryString(file);
  };

  useEffect(() => {
    if (patients.length > 0) {
      const areaStats: Record<string, number> = {};
      patients.forEach((p) => {
        const key = `${p.city || "Desconhecida"}-${p.occurrenceType || "Geral"}`;
        areaStats[key] = (areaStats[key] || 0) + 1;
      });

      const peaks = Object.entries(areaStats).filter(
        ([_, count]) => count >= 5,
      );
      if (peaks.length > 0) {
        // Alerta emitido para o Dashboard e Monitorização Admin
        console.warn("ALERTA EPIDEMIOLÓGICO:", peaks);
      }
    }
  }, [patients]);

  const filteredPatients = patients.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.patientSerialId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.id?.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (activeTab === "criticos") {
      return p.priority === "Emergência";
    }
    if (activeTab === "espera") {
      return p.status === "Em Espera";
    }
    if (activeTab === "atendidos") {
      return p.status === "Atendido";
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Gestão de Triagem / Recolha de Dados
          </h1>
          <p className="text-slate-500 text-sm">
            Monitorização contínua do Banco de Urgência - Pioneiro Zeca
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-3 py-1.5 border rounded-md text-xs bg-white border-slate-200 text-slate-700 hover:bg-slate-50 font-bold transition-all"
          >
            <Download className="h-4 w-4 text-slate-400" />
            EXPORTAR EXCEL
          </button>
          <label className="flex cursor-pointer items-center gap-2 px-3 py-1.5 border rounded-md text-xs bg-white border-slate-200 text-slate-700 hover:bg-slate-50 font-bold transition-all">
            <Upload className="h-4 w-4 text-slate-400" />
            IMPORTAR OFFLINE
            <input
              type="file"
              className="hidden"
              accept=".xlsx,.xls"
              onChange={handleImport}
            />
          </label>
          <button
            onClick={() => window.print()}
            className="p-2 border rounded-md bg-white hover:bg-slate-50 text-slate-500 border-slate-200"
          >
            <Printer className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              setShowForm(true);
              setEditingId(null);
              setFormData(initialForm);
            }}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-bold shadow-md transition-all active:scale-95"
          >
            <Plus className="h-4 w-4" />
            NOVO REGISTRO
          </button>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          label="Total de Pacientes"
          value={patients.length}
          color="text-slate-900"
        />
        <StatCard
          label="Total Atendidos"
          value={patients.filter((p) => p.status === "Atendido").length}
          color="text-blue-600"
        />
        <StatCard
          label="Fila de Espera"
          value={patients.filter((p) => p.status === "Em Espera").length}
          color="text-amber-600"
        />
        <StatCard
          label="Emergências Ativas"
          value={patients.filter((p) => p.priority === "Emergência").length}
          color="text-red-600"
          isAlert={
            patients.filter((p) => p.priority === "Emergência").length > 0
          }
        />
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="border-b border-slate-100 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="font-bold text-slate-800 text-xs uppercase tracking-widest">
            Histórico de Atendimentos
          </h3>
          <div className="relative w-full max-sm:max-w-none max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300" />
            <input
              type="text"
              placeholder="Pesquisar por nome ou ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-md border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-xs focus:border-blue-500 focus:outline-none transition-all"
            />
          </div>
        </div>

        {/* Filtros em Abas Interactivas para Casos Críticos, Em Espera, Atendidos */}
        <div className="border-b border-slate-100 px-6 py-3 flex flex-wrap gap-2 bg-slate-50/50">
          <button
            onClick={() => setActiveTab("todos")}
            className={cn(
              "px-3.5 py-2 text-xs font-black rounded-lg transition-all border",
              activeTab === "todos"
                ? "bg-slate-900 border-slate-900 text-white shadow-sm"
                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
            )}
          >
            Todos ({patients.length})
          </button>
          
          <button
            onClick={() => setActiveTab("criticos")}
            className={cn(
              "px-3.5 py-2 text-xs font-black rounded-lg transition-all border flex items-center gap-1.5",
              activeTab === "criticos"
                ? "bg-red-600 border-red-600 text-white shadow-sm animate-pulse"
                : "bg-white border-red-200 text-red-600 hover:bg-red-50"
            )}
          >
            <AlertTriangle className={cn("h-3.5 w-3.5", activeTab === "criticos" ? "text-white" : "text-red-500")} />
            Casos Críticos / Emergências ({patients.filter((p) => p.priority === "Emergência").length})
          </button>

          <button
            onClick={() => setActiveTab("espera")}
            className={cn(
              "px-3.5 py-2 text-xs font-black rounded-lg transition-all border flex items-center gap-1.5",
              activeTab === "espera"
                ? "bg-amber-500 border-amber-500 text-white shadow-sm"
                : "bg-white border-amber-200 text-amber-600 hover:bg-amber-50"
            )}
          >
            <Clock className={cn("h-3.5 w-3.5", activeTab === "espera" ? "text-white" : "text-amber-500")} />
            Em Espera ({patients.filter((p) => p.status === "Em Espera").length})
          </button>

          <button
            onClick={() => setActiveTab("atendidos")}
            className={cn(
              "px-3.5 py-2 text-xs font-black rounded-lg transition-all border flex items-center gap-1.5",
              activeTab === "atendidos"
                ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
            )}
          >
            Atendidos ({patients.filter((p) => p.status === "Atendido").length})
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-tighter border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">ID Hospital (Sequencial)</th>
                <th className="px-6 py-4">Paciente</th>
                <th className="px-6 py-4">Status / Tempo</th>
                <th className="px-6 py-4">Ocorrência</th>
                <th className="px-6 py-4 text-right">Prioridade</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPatients.map((p) => (
                <tr
                  key={p.id}
                  className="text-xs hover:bg-slate-50/50 transition-colors"
                >
                  <td className="px-6 py-4 font-mono text-[10px] text-blue-600 font-black">
                    {p.patientSerialId || `#${p.id?.slice(0, 6)}`}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900">{p.name}</div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-tighter">
                      {p.ageGroup} • {p.age} Anos
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded text-[9px] font-bold uppercase",
                          p.status === "Atendido"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-amber-100 text-amber-700",
                        )}
                      >
                        {p.status}
                      </span>
                      {p.serviceDuration && (
                        <span className="text-[10px] text-slate-400 font-medium italic">
                          {p.serviceDuration} min
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="italic text-slate-500">
                      {p.occurrenceType}
                    </div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-widest font-black">
                      {p.city} {p.neighborhood ? `• Bairro ${p.neighborhood}` : ""}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end">
                      <div
                        className={cn(
                          "w-2.5 h-2.5 rounded-full ring-4 ring-offset-1 ring-slate-50 shadow-sm",
                          p.priority === "Emergência"
                            ? "bg-red-500 animate-pulse ring-red-100"
                            : p.priority === "Alta"
                              ? "bg-amber-500 ring-amber-100"
                              : p.priority === "Média"
                                ? "bg-blue-500 ring-blue-100"
                                : "bg-slate-300 ring-slate-100",
                        )}
                      ></div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => {
                          setEditingId(p.id!);
                          setFormData(p);
                          setShowForm(true);
                        }}
                        className="p-1 px-2 text-slate-400 hover:text-blue-600 transition-colors"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm("Excluir registro permanentemente?"))
                            patientService.delete(p.id!);
                        }}
                        className="p-1 px-2 text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredPatients.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-bold">
                    Nenhum paciente encontrado para este filtro ou pesquisa.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Registration Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl bg-white p-8 shadow-2xl border border-slate-200"
          >
            <div className="mb-8 flex items-center justify-between border-b pb-6 border-slate-100">
              <div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  {editingId
                    ? "ACTUALIZAÇÃO DE REGISTRO CLÍNICO"
                    : "RECOLHA DE DADOS / TRIAGEM"}
                </h2>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                  Hospital Pediátrico Pioneiro Zeca - Lubango
                </p>
              </div>
              <button
                onClick={() => setShowForm(false)}
                className="rounded-md p-2 hover:bg-slate-100 text-slate-400 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="grid gap-x-8 gap-y-6 md:grid-cols-3"
            >
              <div className="md:col-span-3 border-l-4 border-blue-600 pl-4 bg-slate-50 py-2 flex items-center justify-between pr-4">
                <h3 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">
                  Secção 01: Identificação do Paciente
                </h3>
                {(formData.age > 15 || formData.age < 0) && formData.birthDate !== "" && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-750 border border-red-200 rounded-lg text-[10px] font-black animate-pulse">
                    <AlertTriangle className="h-4 w-4 text-red-650" /> FORA DA FAIXA ETÁRIA (0-15 ANOS)
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Nome Completo
                </label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="form-input"
                  placeholder="Ex: Adérito dos Santos"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Gênero
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) =>
                    setFormData({ ...formData, gender: e.target.value as any })
                  }
                  className="form-input"
                >
                  <option value="Masculino">Masculino</option>
                  <option value="Feminino">Feminino</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Data de Nascimento
                </label>
                <input
                  required
                  type="date"
                  value={formData.birthDate}
                  onChange={(e) => handleBirthDateChange(e.target.value)}
                  className={cn(
                    "form-input",
                    (formData.age > 15 || formData.age < 0) && formData.birthDate !== "" && "border-red-500 bg-red-50/20 focus:border-red-650"
                  )}
                />
                {(formData.age > 15 || formData.age < 0) && formData.birthDate !== "" && (
                  <p className="text-red-650 text-[10px] font-bold mt-1 flex items-center gap-1">
                    <AlertTriangle className="h-3.5 w-3.5" /> Admissão reservada de 0 a 15 anos de idade.
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Idade / Faixa Calculada
                </label>
                <div className="flex gap-1 font-semibold">
                  <input
                    disabled
                    value={formData.birthDate === "" ? "-" : `${formData.age} ANOS`}
                    className={cn(
                      "form-input w-24 border-none font-bold",
                      (formData.age > 15 || formData.age < 0) && formData.birthDate !== ""
                        ? "bg-red-100 text-red-700 font-extrabold"
                        : "bg-slate-100 text-blue-600"
                    )}
                  />
                  <input
                    disabled
                    value={formData.birthDate === "" ? "Selecione a Data" : formData.ageGroup}
                    className={cn(
                      "form-input flex-1 border-none text-[10px] font-extrabold tracking-tighter uppercase",
                      (formData.age > 15 || formData.age < 0) && formData.birthDate !== ""
                        ? "bg-red-100 text-red-700 font-black text-[9px]"
                        : "bg-slate-100 text-slate-800"
                    )}
                  />
                </div>
              </div>

              <div className="md:col-span-3 border-l-4 border-amber-500 pl-4 bg-slate-50 py-2 mt-4">
                <h3 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">
                  Secção 02: Parâmetros Vitais e Anamnese
                </h3>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Peso (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.weight || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      weight: parseFloat(e.target.value),
                    })
                  }
                  className="form-input"
                  placeholder="00.0"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Temperatura (°C)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.temperature || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      temperature: parseFloat(e.target.value),
                    })
                  }
                  className="form-input"
                  placeholder="00.0"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Pressão Arterial
                </label>
                <input
                  type="text"
                  value={formData.bloodPressure}
                  onChange={(e) =>
                    setFormData({ ...formData, bloodPressure: e.target.value })
                  }
                  className="form-input"
                  placeholder="Ex: 120/80"
                />
              </div>

              {/* Sinais / Sintomas validation, lists or filters */}
              <div className="md:col-span-3 bg-purple-50/55 p-6 rounded-3xl border border-purple-100/90 space-y-4 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-xs font-black text-purple-950 uppercase tracking-widest flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-purple-600 animate-ping"></span>
                    Sinais e Sintomas Clínicos Vacinados (Catálogo)
                  </span>
                  <label className="flex items-center gap-2 text-xs font-black text-purple-700 cursor-pointer hover:text-purple-900 transition-all select-none bg-white py-1.5 px-3 rounded-full border border-purple-200 shadow-sm active:scale-95">
                    <input
                      type="checkbox"
                      checked={showManualSymptom}
                      onChange={(e) => {
                        setShowManualSymptom(e.target.checked);
                        if (!e.target.checked) {
                          setFormData({ ...formData, occurrenceType: "", signalsSymptoms: "" });
                        }
                      }}
                      className="rounded border-purple-300 text-purple-600 focus:ring-purple-400 w-4 h-4"
                    />
                    Preenchimento Totalmente Manual
                  </label>
                </div>

                {!showManualSymptom ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={symptomSearch}
                      onChange={(e) => setSymptomSearch(e.target.value)}
                      placeholder="🔎 Filtrar sintomas pediátricos comuns do catálogo..."
                      className="w-full text-xs p-3.5 rounded-2xl border border-purple-200 bg-white focus:outline-none focus:scale-[1.005] focus:border-purple-500 transition-all placeholder:text-slate-400 font-sans shadow-inner font-semibold"
                    />
                    <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-2.5 bg-white/70 rounded-2xl border border-purple-100">
                      {PEDIATRIC_SYMPTOMS.filter((sym) =>
                        sym.toLowerCase().includes(symptomSearch.toLowerCase())
                      ).map((sym) => {
                        const isSelected = formData.occurrenceType === sym;
                        return (
                          <button
                            key={sym}
                            type="button"
                            onClick={() => {
                              setFormData({
                                ...formData,
                                occurrenceType: sym,
                                signalsSymptoms: `Apresenta o sintoma clínico padronizado de: ${sym}. Triagem e acompanhamento estabelecidos conforme protocolo.`,
                              });
                            }}
                            className={cn(
                              "text-[10px] font-bold px-3 py-2 rounded-xl border transition-all active:scale-95",
                              isSelected
                                ? "bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-600/10"
                                : "bg-purple-50 hover:bg-purple-100/80 text-purple-900 border-purple-100"
                            )}
                          >
                            {sym}
                          </button>
                        );
                      })}
                      {symptomSearch.trim() && !PEDIATRIC_SYMPTOMS.map(s => s.toLowerCase()).includes(symptomSearch.toLowerCase().trim()) && (
                        <button
                          type="button"
                          onClick={() => {
                            const trimmedVal = symptomSearch.trim();
                            setFormData({
                              ...formData,
                              occurrenceType: trimmedVal,
                              signalsSymptoms: `Apresenta o sinal/sintoma clínico personalizado de: ${trimmedVal}.`,
                            });
                          }}
                          className={cn(
                            "text-[10px] font-bold px-3 py-2 rounded-xl border transition-all active:scale-95",
                            formData.occurrenceType === symptomSearch.trim()
                              ? "bg-purple-600 text-white border-purple-600 shadow-md"
                              : "bg-purple-50 hover:bg-purple-100/80 text-purple-900 border-purple-200"
                          )}
                        >
                          ✨ Usar sintoma personalizado: "{symptomSearch.trim()}"
                        </button>
                      )}
                      {PEDIATRIC_SYMPTOMS.filter((sym) =>
                        sym.toLowerCase().includes(symptomSearch.toLowerCase())
                      ).length === 0 && !symptomSearch.trim() && (
                        <div className="text-center w-full py-4 text-xs text-slate-400 font-medium italic">
                          Nenhum sintoma encontrado na lista. Ative "Preenchimento Totalmente Manual" acima ou escreva para criar um personalizado.
                        </div>
                      )}
                    </div>
                  </div>
                ) : null}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="md:col-span-2 space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Ocorrência (Sintoma Principal)
                    </label>
                    <input
                      required
                      type="text"
                      disabled={!showManualSymptom && formData.occurrenceType !== ""}
                      value={formData.occurrenceType}
                      onChange={(e) =>
                        setFormData({ ...formData, occurrenceType: e.target.value })
                      }
                      className={cn(
                        "form-input transition-all",
                        !showManualSymptom && "bg-slate-100/90 text-slate-700 font-bold border-slate-200 shadow-none cursor-not-allowed"
                      )}
                      placeholder="Escolha no catálogo acima ou preencha manualmente..."
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Prioridade (Triagem)
                    </label>
                    <select
                      value={formData.priority}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          priority: e.target.value as any,
                        })
                      }
                      className="form-input font-bold text-slate-800"
                    >
                      <option value="Baixa">Baixa (Azul)</option>
                      <option value="Média">Média (Verde)</option>
                      <option value="Alta">Alta (Amarelo)</option>
                      <option value="Emergência">Emergência (Vermelho)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Descrição Detalhada dos Sinais / Sintomas
                  </label>
                  <textarea
                    required
                    value={formData.signalsSymptoms}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        signalsSymptoms: e.target.value,
                      })
                    }
                    className="form-input h-24 resize-none py-3 shadow-inner"
                    placeholder="Escreva detalhadamente todos os sinais ou sintomas observados..."
                  />
                </div>
              </div>

              {/* AI CO-PILOT INTEGRATION */}
              <div className="md:col-span-3">
                <div className="bg-slate-900 rounded-3xl p-6 text-white border border-slate-800 shadow-2xl overflow-hidden relative group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <BrainCircuit className="h-24 w-24" />
                  </div>

                  <div className="flex items-center justify-between relative z-10 mb-6">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-600 p-2 rounded-xl">
                        <Sparkles className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-blue-400 uppercase tracking-tighter">
                          Assistente Clínico IA
                        </h4>
                        <p className="text-[10px] text-slate-400 font-medium">
                          Suporte Gemini Flash
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleAiClinicalSupport}
                      disabled={
                        loadingAi || formData.signalsSymptoms.length < 10
                      }
                      className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all disabled:opacity-30 flex items-center gap-2"
                    >
                      {loadingAi ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <BrainCircuit className="h-3 w-3" />
                      )}
                      {loadingAi ? "Analisando..." : "Analisar Sintomas"}
                    </button>
                  </div>

                  {aiSupport ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="space-y-4 relative z-10"
                    >
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                          <p className="text-[9px] font-bold text-slate-500 uppercase mb-1">
                            Sugestões de Diagnóstico
                          </p>
                          <ul className="text-xs space-y-1">
                            {aiSupport.possibleDiagnoses.map(
                              (d: string, i: number) => (
                                <li key={i} className="flex items-center gap-2">
                                  <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
                                  {d}
                                </li>
                              ),
                            )}
                          </ul>
                        </div>
                        <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                          <p className="text-[9px] font-bold text-slate-500 uppercase mb-1">
                            Nível de Risco
                          </p>
                          <div
                            className={cn(
                              "inline-block px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest",
                              aiSupport.urgencyLevel === "Emergência"
                                ? "bg-red-500 text-white"
                                : aiSupport.urgencyLevel === "Alta"
                                  ? "bg-orange-500 text-white"
                                  : "bg-blue-500 text-white",
                            )}
                          >
                            {aiSupport.urgencyLevel}
                          </div>
                        </div>
                      </div>
                      <div className="bg-blue-600/10 rounded-2xl p-4 border border-blue-600/20 italic text-xs text-blue-200">
                        "{aiSupport.briefAdvice}"
                      </div>
                    </motion.div>
                  ) : (
                    <div className="text-center py-4 border border-dashed border-white/10 rounded-2xl">
                      <p className="text-xs text-slate-400 font-medium">
                        Descreva os sintomas detalhadamente para activar o
                        suporte de IA.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Diagnóstico validation, lists or filters */}
              <div className="md:col-span-3 bg-blue-50/55 p-6 rounded-3xl border border-blue-100/90 space-y-4 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-xs font-black text-blue-950 uppercase tracking-widest flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping"></span>
                    Diagnósticos Médicos Padronizados (Catálogo)
                  </span>
                  <label className="flex items-center gap-2 text-xs font-black text-blue-700 cursor-pointer hover:text-blue-900 transition-all select-none bg-white py-1.5 px-3 rounded-full border border-blue-200 shadow-sm active:scale-95">
                    <input
                      type="checkbox"
                      checked={showManualDiagnosis}
                      onChange={(e) => {
                        setShowManualDiagnosis(e.target.checked);
                        if (!e.target.checked) {
                          setFormData({ ...formData, diagnosis: "" });
                        }
                      }}
                      className="rounded border-blue-300 text-blue-600 focus:ring-blue-400 w-4 h-4"
                    />
                    Preenchimento Totalmente Manual
                  </label>
                </div>

                {!showManualDiagnosis ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={diagnosisSearch}
                      onChange={(e) => setDiagnosisSearch(e.target.value)}
                      placeholder="🔎 Filtrar diagnósticos pediátricos comuns..."
                      className="w-full text-xs p-3.5 rounded-2xl border border-blue-200 bg-white focus:outline-none focus:scale-[1.005] focus:border-blue-500 transition-all placeholder:text-slate-400 font-sans shadow-inner font-semibold"
                    />
                    <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-2.5 bg-white/70 rounded-2xl border border-blue-100">
                      {PEDIATRIC_DIAGNOSES.filter((diag) =>
                        diag.toLowerCase().includes(diagnosisSearch.toLowerCase())
                      ).map((diag) => {
                        const isSelected = formData.diagnosis === diag;
                        return (
                          <button
                            key={diag}
                            type="button"
                            onClick={() => {
                              setFormData({
                                ...formData,
                                diagnosis: diag,
                              });
                            }}
                            className={cn(
                              "text-[10px] font-bold px-3 py-2 rounded-xl border transition-all active:scale-95",
                              isSelected
                                ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/10"
                                : "bg-blue-50 hover:bg-blue-100/80 text-blue-900 border-blue-100"
                            )}
                          >
                            {diag}
                          </button>
                        );
                      })}
                      {diagnosisSearch.trim() && !PEDIATRIC_DIAGNOSES.map(d => d.toLowerCase()).includes(diagnosisSearch.toLowerCase().trim()) && (
                        <button
                          type="button"
                          onClick={() => {
                            const trimmedVal = diagnosisSearch.trim();
                            setFormData({
                              ...formData,
                              diagnosis: trimmedVal,
                            });
                          }}
                          className={cn(
                            "text-[10px] font-bold px-3 py-2 rounded-xl border transition-all active:scale-95",
                            formData.diagnosis === diagnosisSearch.trim()
                              ? "bg-blue-600 text-white border-blue-600 shadow-md"
                              : "bg-blue-50 hover:bg-blue-100/80 text-blue-900 border-blue-200"
                          )}
                        >
                          ✨ Usar diagnóstico personalizado: "{diagnosisSearch.trim()}"
                        </button>
                      )}
                      {PEDIATRIC_DIAGNOSES.filter((diag) =>
                        diag.toLowerCase().includes(diagnosisSearch.toLowerCase())
                      ).length === 0 && !diagnosisSearch.trim() && (
                        <div className="text-center w-full py-4 text-xs text-slate-400 font-medium italic">
                          Nenhum diagnóstico padronizado encontrado. Ative "Preenchimento Totalmente Manual" acima ou escreva para criar um personalizado.
                        </div>
                      )}
                    </div>
                  </div>
                ) : null}

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Diagnóstico Final Consolidado e Conduta
                  </label>
                  <textarea
                    required
                    value={formData.diagnosis || ""}
                    disabled={!showManualDiagnosis && formData.diagnosis !== ""}
                    onChange={(e) =>
                      setFormData({ ...formData, diagnosis: e.target.value })
                    }
                    className={cn(
                      "form-input h-24 resize-none py-3 shadow-inner transition-all",
                      !showManualDiagnosis && "bg-slate-100/90 text-slate-705 border-slate-200 font-bold shadow-none cursor-not-allowed"
                    )}
                    placeholder="Selecione um diagnóstico acima ou descreva manualmente as condutas terapêuticas..."
                  />
                </div>
              </div>

              <div className="md:col-span-3 border-l-4 border-slate-900 pl-4 bg-slate-50 py-2 mt-4">
                <h3 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">
                  Secção 03: Logística e Desfecho Hospitalar
                </h3>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Província
                </label>
                <select
                  value={formData.province}
                  onChange={(e) => {
                    const prov = e.target.value;
                    setFormData({
                      ...formData,
                      province: prov,
                      city: prov === "Huíla" ? "Lubango" : "",
                      neighborhood: prov === "Huíla" ? "Tchioco" : "",
                    });
                  }}
                  className="form-input font-bold"
                >
                  {ANGOLA_PROVINCES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Município / Cidade
                </label>
                {formData.province === "Huíla" ? (
                  <div className="space-y-1.5">
                    <select
                      value={HUILA_MUNICIPALITIES.includes(formData.city) ? formData.city : "Outro"}
                      onChange={(e) => {
                        const m = e.target.value;
                        setFormData({
                          ...formData,
                          city: m === "Outro" ? "" : m,
                          neighborhood: HUILA_NEIGHBORHOODS[m] ? HUILA_NEIGHBORHOODS[m][0] : "",
                        });
                      }}
                      className="form-input font-bold text-slate-800"
                    >
                      {HUILA_MUNICIPALITIES.map((mun) => (
                        <option key={mun} value={mun}>
                          {mun}
                        </option>
                      ))}
                      <option value="Outro">Outro...</option>
                    </select>
                    {!HUILA_MUNICIPALITIES.includes(formData.city) && (
                      <input
                        required
                        type="text"
                        value={formData.city}
                        onChange={(e) =>
                          setFormData({ ...formData, city: e.target.value })
                        }
                        className="form-input border-blue-400/80 text-xs py-2 bg-blue-50/20 font-semibold"
                        placeholder="Especifique o município..."
                      />
                    )}
                  </div>
                ) : (
                  <input
                    required
                    type="text"
                    value={formData.city}
                    onChange={(e) =>
                      setFormData({ ...formData, city: e.target.value })
                    }
                    className="form-input"
                    placeholder="Escreva o município/cidade..."
                  />
                )}
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Bairro / Localidade
                </label>
                {formData.province === "Huíla" && HUILA_NEIGHBORHOODS[formData.city] ? (
                  <div className="space-y-1.5">
                    <select
                      value={
                        formData.neighborhood && HUILA_NEIGHBORHOODS[formData.city].includes(formData.neighborhood)
                          ? formData.neighborhood
                          : "Outro"
                      }
                      onChange={(e) => {
                        const b = e.target.value;
                        setFormData({
                          ...formData,
                          neighborhood: b === "Outro" ? "" : b,
                        });
                      }}
                      className="form-input font-bold text-slate-800"
                    >
                      {HUILA_NEIGHBORHOODS[formData.city].map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                      <option value="Outro">Outro...</option>
                    </select>
                    {(!formData.neighborhood || !HUILA_NEIGHBORHOODS[formData.city].includes(formData.neighborhood)) && (
                      <input
                        required
                        type="text"
                        value={formData.neighborhood || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, neighborhood: e.target.value })
                        }
                        className="form-input border-blue-400/80 text-xs py-2 bg-blue-50/20 font-semibold"
                        placeholder="Especifique o bairro..."
                      />
                    )}
                  </div>
                ) : (
                  <input
                    required
                    type="text"
                    value={formData.neighborhood || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, neighborhood: e.target.value })
                    }
                    className="form-input"
                    placeholder="Escreva o bairro..."
                  />
                )}
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Estado do Desfecho
                </label>
                <select
                  value={formData.state}
                  onChange={(e) =>
                    setFormData({ ...formData, state: e.target.value as any })
                  }
                  className="form-input font-bold"
                >
                  <option value="Atendido">Atendido / Observação</option>
                  <option value="Internado">Internado</option>
                  <option value="Transferido">Transferido</option>
                  <option value="Alta">Alta Médica</option>
                  <option value="Óbito">Óbito</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Horário de Entrada
                </label>
                <input
                  type="datetime-local"
                  value={formData.entryTime.slice(0, 16)}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      entryTime: new Date(e.target.value).toISOString(),
                    })
                  }
                  className="form-input"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Horário de Saída
                </label>
                <input
                  type="datetime-local"
                  value={
                    formData.exitTime ? formData.exitTime.slice(0, 16) : ""
                  }
                  onChange={(e) =>
                    handleExitTimeUpdate(new Date(e.target.value).toISOString())
                  }
                  className="form-input"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Tempo de Atendimento
                </label>
                <div className="relative">
                  <input
                    disabled
                    value={`${formData.serviceDuration} MINUTOS`}
                    className="form-input bg-slate-100 border-none font-bold text-slate-600"
                  />
                  <Clock className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-300" />
                </div>
              </div>

              <div className="md:col-span-3 pt-8 border-t border-slate-100 flex gap-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white rounded-md py-4 text-xs font-bold shadow-xl hover:bg-blue-700 transition-all uppercase tracking-widest active:scale-95"
                >
                  Confirmar e Processar Registro
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-8 border border-slate-200 rounded-md py-4 text-xs font-bold text-slate-500 hover:bg-slate-50 uppercase tracking-widest transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      <style>{`
        .form-input {
          width: 100%;
          border-radius: 6px;
          border: 1px solid #e2e8f0;
          background: #f8fafc;
          padding: 0.6rem 0.75rem;
          font-size: 0.75rem;
          font-weight: 500;
          transition: all 0.15s;
        }
        .form-input:focus {
          border-color: #2563eb;
          background: white;
          outline: none;
          box-shadow: 0 0 0 1px #2563eb;
        }
      `}</style>
    </div>
  );
}

function StatCard({ label, value, color, isAlert }: any) {
  return (
    <div
      className={cn(
        "bg-white p-6 rounded-xl shadow-sm border transition-all",
        isAlert ? "border-red-100 bg-red-50/20" : "border-slate-200",
      )}
    >
      <p
        className={cn(
          "text-[10px] font-extrabold uppercase tracking-wider",
          isAlert ? "text-red-500" : "text-slate-400",
        )}
      >
        {label}
      </p>
      <p className={cn("text-3xl font-extrabold mt-1", color)}>{value}</p>
      <div className="flex items-center gap-1 text-[10px] mt-2 text-slate-400 font-medium">
        <span>Monitorização em tempo real</span>
      </div>
    </div>
  );
}
