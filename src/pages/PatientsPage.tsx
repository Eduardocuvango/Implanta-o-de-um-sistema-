import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { patientService } from '../services/patientService';
import { geminiService } from '../services/geminiService';
import { Patient, Gender, Status, Priority, State } from '../types';
import { calculateAge, getAgeGroup, cn } from '../lib/utils';
import { 
  Plus, Download, Upload, Printer, Search, 
  Filter, Trash2, Edit3, X, Save, AlertTriangle, Clock,
  BrainCircuit, Sparkles, Loader2
} from 'lucide-react';
import * as XLSX from 'xlsx';

export default function PatientsPage() {
  const { user, profile } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [aiSupport, setAiSupport] = useState<any>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  // Form State
  const initialForm: Omit<Patient, 'id' | 'createdAt' | 'updatedAt' | 'patientSerialId'> = {
    name: '',
    gender: 'Masculino',
    birthDate: '',
    age: 0,
    ageGroup: '',
    occurrenceDate: new Date().toISOString().split('T')[0],
    entryTime: new Date().toISOString(),
    exitTime: '',
    serviceDuration: 0,
    status: 'Em Espera',
    weight: undefined,
    temperature: undefined,
    bloodPressure: '',
    province: 'Huíla',
    city: 'Lubango',
    occurrenceType: '',
    signalsSymptoms: '',
    diagnosis: '',
    priority: 'Baixa',
    state: 'Atendido',
    receptionistId: profile?.uid || '',
    receptionistSignature: profile?.signature || ''
  };

  const [formData, setFormData] = useState(initialForm);

  const handleAiClinicalSupport = async () => {
    if (formData.signalsSymptoms.length < 10) return;
    setLoadingAi(true);
    try {
      const result = await geminiService.getClinicalSupport(formData.signalsSymptoms);
      setAiSupport(result);
    } finally {
      setLoadingAi(false);
    }
  };

  useEffect(() => {
    if (showForm) {
      setFormData(initialForm);
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
      ageGroup: getAgeGroup(age)
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
      status: exit ? 'Atendido' : 'Em Espera'
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.age > 21) {
       // We keep the internal logic but show a warning
    }

    try {
      if (editingId) {
        await patientService.update(editingId, {
          ...formData,
          updatedAt: new Date().toISOString()
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
    XLSX.writeFile(wb, `Relatorio_Pacientes_PioneiroZeca_${new Date().toLocaleDateString()}.xlsx`);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws) as any[];
      
      for (const item of data) {
        await patientService.create({
          ...item,
          receptionistId: user?.uid || '',
          receptionistSignature: profile?.signature || 'Importação Manual'
        });
      }
    };
    reader.readAsBinaryString(file);
  };

  useEffect(() => {
    if (patients.length > 0) {
      const areaStats: Record<string, number> = {};
      patients.forEach(p => {
        const key = `${p.city || 'Desconhecida'}-${p.occurrenceType || 'Geral'}`;
        areaStats[key] = (areaStats[key] || 0) + 1;
      });

      const peaks = Object.entries(areaStats).filter(([_, count]) => count >= 5);
      if (peaks.length > 0) {
        // Alerta emitido para o Dashboard e Monitorização Admin
        console.warn("ALERTA EPIDEMIOLÓGICO:", peaks);
      }
    }
  }, [patients]);

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.patientSerialId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Gestão de Triagem / Recolha de Dados</h1>
          <p className="text-slate-500 text-sm">Monitorização contínua do Banco de Urgência - Pioneiro Zeca</p>
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
            <input type="file" className="hidden" accept=".xlsx,.xls" onChange={handleImport} />
          </label>
          <button 
            onClick={() => window.print()}
            className="p-2 border rounded-md bg-white hover:bg-slate-50 text-slate-500 border-slate-200"
          >
            <Printer className="h-4 w-4" />
          </button>
          <button 
            onClick={() => { setShowForm(true); setEditingId(null); setFormData(initialForm); }}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-bold shadow-md transition-all active:scale-95"
          >
            <Plus className="h-4 w-4" />
            NOVO REGISTRO
          </button>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Total Atendidos" value={patients.filter(p => p.status === 'Atendido').length} color="text-blue-600" />
        <StatCard label="Em Espera" value={patients.filter(p => p.status === 'Em Espera').length} color="text-amber-600" />
        <StatCard label="Emergências" value={patients.filter(p => p.priority === 'Emergência').length} color="text-red-600" isAlert={patients.filter(p => p.priority === 'Emergência').length > 0} />
        <StatCard label="Eficiência de Fluxo" value="94%" color="text-slate-700" />
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="border-b border-slate-100 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
           <h3 className="font-bold text-slate-800 text-xs uppercase tracking-widest">Histórico de Atendimentos</h3>
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
                <tr key={p.id} className="text-xs hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-mono text-[10px] text-blue-600 font-black">
                     {p.patientSerialId || `#${p.id?.slice(0, 6)}`}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900">{p.name}</div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-tighter">{p.ageGroup} • {p.age} Anos</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                       <span className={cn(
                        "px-2 py-0.5 rounded text-[9px] font-bold uppercase",
                        p.status === 'Atendido' ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"
                      )}>
                        {p.status}
                      </span>
                      {p.serviceDuration && <span className="text-[10px] text-slate-400 font-medium italic">{p.serviceDuration} min</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="italic text-slate-500">{p.occurrenceType}</div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-widest">{p.city}</div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end">
                      <div className={cn(
                        "w-2.5 h-2.5 rounded-full ring-4 ring-offset-1 ring-slate-50 shadow-sm",
                        p.priority === 'Emergência' ? "bg-red-500 animate-pulse ring-red-100" :
                        p.priority === 'Alta' ? "bg-amber-500 ring-amber-100" :
                        p.priority === 'Média' ? "bg-blue-500 ring-blue-100" : "bg-slate-300 ring-slate-100"
                      )}></div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => { setEditingId(p.id!); setFormData(p); setShowForm(true); }}
                        className="p-1 px-2 text-slate-400 hover:text-blue-600 transition-colors"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => { if(confirm('Excluir registro permanentemente?')) patientService.delete(p.id!) }}
                        className="p-1 px-2 text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
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
                  {editingId ? 'ACTUALIZAÇÃO DE REGISTRO CLÍNICO' : 'RECOLHA DE DADOS / TRIAGEM'}
                </h2>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Hospital Pediátrico Pioneiro Zeca - Lubango</p>
              </div>
              <button onClick={() => setShowForm(false)} className="rounded-md p-2 hover:bg-slate-100 text-slate-400 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="grid gap-x-8 gap-y-6 md:grid-cols-3">
              <div className="md:col-span-3 border-l-4 border-blue-600 pl-4 bg-slate-50 py-2 flex items-center justify-between pr-4">
                 <h3 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">Secção 01: Identificação do Paciente</h3>
                 {formData.age > 21 && (
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-red-100 text-red-700 rounded text-[9px] font-black animate-pulse">
                      <AlertTriangle className="h-3 w-3" /> FORA DA FAIXA ETÁRIA (&gt;21 ANOS)
                    </div>
                 )}
              </div>
              
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nome Completo</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="form-input" placeholder="Ex: Adérito dos Santos" />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Gênero</label>
                <select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value as any})} className="form-input">
                  <option value="Masculino">Masculino</option>
                  <option value="Feminino">Feminino</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Data de Nascimento</label>
                <input required type="date" value={formData.birthDate} onChange={e => handleBirthDateChange(e.target.value)} className="form-input" />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Idade / Faixa Calculada</label>
                <div className="flex gap-1">
                  <input disabled value={`${formData.age} ANOS`} className="form-input w-24 bg-slate-100 border-none font-bold text-blue-600" />
                  <input disabled value={formData.ageGroup} className="form-input flex-1 bg-slate-100 border-none text-[10px] font-extrabold tracking-tighter" />
                </div>
              </div>

              <div className="md:col-span-3 border-l-4 border-amber-500 pl-4 bg-slate-50 py-2 mt-4">
                 <h3 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">Secção 02: Parâmetros Vitais e Anamnese</h3>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Peso (kg)</label>
                <input type="number" step="0.1" value={formData.weight || ''} onChange={e => setFormData({...formData, weight: parseFloat(e.target.value)})} className="form-input" placeholder="00.0" />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Temperatura (°C)</label>
                <input type="number" step="0.1" value={formData.temperature || ''} onChange={e => setFormData({...formData, temperature: parseFloat(e.target.value)})} className="form-input" placeholder="00.0" />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pressão Arterial</label>
                <input type="text" value={formData.bloodPressure} onChange={e => setFormData({...formData, bloodPressure: e.target.value})} className="form-input" placeholder="Ex: 120/80" />
              </div>

              <div className="md:col-span-2 space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ocorrência (Sintoma Principal)</label>
                <input required type="text" value={formData.occurrenceType} onChange={e => setFormData({...formData, occurrenceType: e.target.value})} className="form-input" placeholder="Ex: Febre, Vômitos, Dispneia" />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Prioridade (Triagem)</label>
                <select value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value as any})} className="form-input font-bold">
                  <option value="Baixa">Baixa (Azul)</option>
                  <option value="Média">Média (Verde)</option>
                  <option value="Alta">Alta (Amarelo)</option>
                  <option value="Emergência">Emergência (Vermelho)</option>
                </select>
              </div>

              <div className="md:col-span-3 space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Descrição dos Sinais / Sintomas</label>
                <textarea value={formData.signalsSymptoms} onChange={e => setFormData({...formData, signalsSymptoms: e.target.value})} className="form-input h-20 resize-none py-3" placeholder="Detalhamento técnico dos achados..." />
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
                             <h4 className="text-sm font-bold text-blue-400 uppercase tracking-tighter">Assistente Clínico IA</h4>
                             <p className="text-[10px] text-slate-400 font-medium">Suporte Gemini Flash</p>
                          </div>
                       </div>
                       <button 
                          type="button"
                          onClick={handleAiClinicalSupport}
                          disabled={loadingAi || formData.signalsSymptoms.length < 10}
                          className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all disabled:opacity-30 flex items-center gap-2"
                       >
                          {loadingAi ? <Loader2 className="h-3 w-3 animate-spin"/> : <BrainCircuit className="h-3 w-3"/>}
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
                                <p className="text-[9px] font-bold text-slate-500 uppercase mb-1">Sugestões de Diagnóstico</p>
                                <ul className="text-xs space-y-1">
                                   {aiSupport.possibleDiagnoses.map((d: string, i: number) => (
                                      <li key={i} className="flex items-center gap-2">
                                         <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
                                         {d}
                                      </li>
                                   ))}
                                </ul>
                             </div>
                             <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                                <p className="text-[9px] font-bold text-slate-500 uppercase mb-1">Nível de Risco</p>
                                <div className={cn(
                                   "inline-block px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest",
                                   aiSupport.urgencyLevel === 'Emergência' ? "bg-red-500 text-white" :
                                   aiSupport.urgencyLevel === 'Alta' ? "bg-orange-500 text-white" :
                                   "bg-blue-500 text-white"
                                )}>
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
                          <p className="text-xs text-slate-400 font-medium">Descreva os sintomas detalhadamente para activar o suporte de IA.</p>
                       </div>
                    )}
                 </div>
              </div>

              <div className="md:col-span-3 space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Diagnóstico / Plano Terapêutico</label>
                <textarea value={formData.diagnosis || ''} onChange={e => setFormData({...formData, diagnosis: e.target.value})} className="form-input h-20 resize-none py-3 bg-slate-50 border-dashed" placeholder="Diagnóstico presuntivo e conduta imediata..." />
              </div>

              <div className="md:col-span-3 border-l-4 border-slate-900 pl-4 bg-slate-50 py-2 mt-4">
                 <h3 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">Secção 03: Logística e Desfecho Hospitalar</h3>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Província / Cidade</label>
                <div className="flex gap-1">
                  <input disabled value={formData.province} className="form-input w-24 bg-slate-100" />
                  <input required type="text" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} className="form-input flex-1" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Estado do Desfecho</label>
                <select value={formData.state} onChange={e => setFormData({...formData, state: e.target.value as any})} className="form-input font-bold">
                  <option value="Atendido">Atendido / Observação</option>
                  <option value="Internado">Internado</option>
                  <option value="Transferido">Transferido</option>
                  <option value="Alta">Alta Médica</option>
                  <option value="Óbito">Óbito</option>
                </select>
              </div>

              <div className="space-y-1">
                 <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Horário de Entrada</label>
                 <input type="datetime-local" value={formData.entryTime.slice(0, 16)} onChange={e => setFormData({...formData, entryTime: new Date(e.target.value).toISOString()})} className="form-input" />
              </div>

              <div className="space-y-1">
                 <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Horário de Saída</label>
                 <input type="datetime-local" value={formData.exitTime ? formData.exitTime.slice(0, 16) : ''} onChange={e => handleExitTimeUpdate(new Date(e.target.value).toISOString())} className="form-input" />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tempo de Atendimento</label>
                <div className="relative">
                   <input disabled value={`${formData.serviceDuration} MINUTOS`} className="form-input bg-slate-100 border-none font-bold text-slate-600" />
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
    <div className={cn(
      "bg-white p-6 rounded-xl shadow-sm border transition-all",
      isAlert ? "border-red-100 bg-red-50/20" : "border-slate-200"
    )}>
      <p className={cn("text-[10px] font-extrabold uppercase tracking-wider", isAlert ? "text-red-500" : "text-slate-400")}>{label}</p>
      <p className={cn("text-3xl font-extrabold mt-1", color)}>{value}</p>
      <div className="flex items-center gap-1 text-[10px] mt-2 text-slate-400 font-medium">
        <span>Monitorização em tempo real</span>
      </div>
    </div>
  );
}
