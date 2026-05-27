import React, { useState, useEffect } from "react";
import { localDatabase } from "../services/localDatabase";
import { useLocalAuth } from "../context/LocalAuthContext";
import { Key, ShieldAlert, UserPlus, Trash, ShieldCheck } from "lucide-react";

export default function LocalSettingsPage() {
  const { profile } = useLocalAuth();
  const [authorizedUsers, setAuthorizedUsers] = useState<{ email: string; role: string; addedAt?: string; staffId?: string }[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState("staff");
  const [newStaffId, setNewStaffId] = useState("");

  useEffect(() => {
    loadAuthorized();
  }, []);

  const loadAuthorized = () => {
    setAuthorizedUsers(localDatabase.getAuthorizedUsers());
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;

    const formattedStaffId = newStaffId.trim() || `OP-${Math.floor(Math.random() * 90) + 10}`;
    localDatabase.addAuthorizedUser(newEmail.trim().toLowerCase(), newRole, formattedStaffId);
    
    setNewEmail("");
    setNewStaffId("");
    loadAuthorized();
    alert("Operador pré-autorizado com êxito!");
  };

  const handleRemove = (email: string) => {
    if (window.confirm(`Tem a certeza que deseja remover a pré-autorização de ${email}?`)) {
      localDatabase.removeAuthorizedUser(email);
      loadAuthorized();
    }
  };

  if (profile?.role !== "admin") {
    return (
      <div className="flex h-[70vh] flex-col items-center justify-center gap-4 text-center px-4 bg-slate-950">
        <ShieldAlert className="h-16 w-16 text-emerald-500 animate-pulse" />
        <h1 className="text-xl font-bold text-white">Acesso Reservado ao Diretor Clínico</h1>
        <p className="max-w-md text-slate-400 text-sm">
          Apenas administradores podem gerir os operadores pré-autorizados do sistema de triagem.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 bg-slate-950 p-6 min-h-screen text-white">
      <div>
        <h1 className="text-2xl font-black text-white">Definições Clínicas</h1>
        <p className="text-xs text-slate-400">Controle parâmetros de segurança física e gestão de operadores de triagem.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Form: Add Operator */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-sm md:col-span-1 h-fit">
          <div className="flex items-center gap-2 mb-4">
            <UserPlus className="h-5 w-5 text-emerald-400" />
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-200">Pré-Autorizar Operador</h2>
          </div>

          <form onSubmit={handleAdd} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">E-mail Corporativo</label>
              <input
                type="email"
                required
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="operador@hospital.local"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-xs font-medium placeholder-slate-700 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Identificação (Staff ID)</label>
              <input
                type="text"
                value={newStaffId}
                onChange={(e) => setNewStaffId(e.target.value)}
                placeholder="ex: OP-45"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-xs font-medium placeholder-slate-700 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Função no Hospital</label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-xs font-bold text-slate-300 focus:outline-none"
              >
                <option value="staff">Enfermeiro de Triagem (Op)</option>
                <option value="admin">Diretor Clínico (Admin)</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full cursor-pointer rounded-xl bg-emerald-600 py-3.5 text-xs font-black uppercase tracking-widest text-white hover:bg-emerald-500 transition-all active:scale-95"
            >
              Adicionar Autorização
            </button>
          </form>
        </div>

        {/* Right Panel: Pre-Authorized List */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-sm md:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <Key className="h-5 w-5 text-emerald-400" />
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-200">Operadores Ativos Autónomos</h2>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950">
            {authorizedUsers.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                Nenhum operador pré-autorizado cadastrado.
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="px-4 py-3">E-mail de Operador</th>
                    <th className="px-4 py-3">Função</th>
                    <th className="px-4 py-3 font-mono">Staff ID</th>
                    <th className="px-4 py-3 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {authorizedUsers.map((u) => (
                    <tr key={u.email} className="hover:bg-slate-900 transition-colors">
                      <td className="px-4 py-3.5 font-semibold text-white">{u.email}</td>
                      <td className="px-4 py-3.5 capitalize font-semibold text-slate-300">
                        {u.role === "admin" ? "Diretor Clínico" : "Enfermeiro Triador"}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-emerald-400 font-bold">{u.staffId || "OP-Geral"}</td>
                      <td className="px-4 py-3.5 text-right">
                        <button
                          onClick={() => handleRemove(u.email)}
                          className="p-1.5 text-red-400 hover:bg-slate-900 rounded hover:text-red-300 cursor-pointer"
                        >
                          <Trash className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
