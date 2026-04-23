import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { userService } from '../services/userService';
import { User, Mail, Shield, Signature, Save, CheckCircle } from 'lucide-react';

export default function ProfilePage() {
  const { profile } = useAuth();
  const [name, setName] = useState(profile?.name || '');
  const [signature, setSignature] = useState(profile?.signature || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    setSaved(false);
    try {
      await userService.updateProfile(profile.uid, { name, signature });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-bold text-[#141414]">Configurações da Conta</h1>
        <p className="text-[#141414]/60">Gerencie sua identidade profissional no sistema</p>
      </div>

      <div className="rounded-3xl bg-white p-8 border border-[#141414]/5 shadow-sm space-y-8">
        <div className="flex items-center gap-6 pb-8 border-b border-[#141414]/10">
          <div className="h-20 w-20 rounded-full bg-[#f5f5f0] flex items-center justify-center text-[#5A5A40]">
            <User className="h-10 w-10" />
          </div>
          <div>
            <h2 className="text-xl font-bold">{profile?.name}</h2>
            <p className="text-sm text-[#141414]/60 flex items-center gap-2">
              <Mail className="h-4 w-4" /> {profile?.email}
            </p>
            <div className="flex gap-2 mt-2">
               <span className="inline-flex items-center gap-1 rounded-full bg-[#5A5A40]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#5A5A40]">
                 <Shield className="h-3 w-3" /> {profile?.role}
               </span>
               {profile?.staffId && (
                 <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-blue-600">
                    ID: {profile.staffId}
                 </span>
               )}
            </div>
          </div>
        </div>

        <form onSubmit={handleUpdate} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-[#141414]/40">Nome Completo</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#141414]/30" />
              <input 
                type="text" 
                value={name} 
                onChange={e => setName(e.target.value)}
                className="w-full rounded-2xl border border-[#141414]/10 bg-[#f5f5f0]/50 py-4 pl-12 pr-4 text-[#141414] focus:border-[#5A5A40] focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-[#141414]/40">Assinatura Digital de Atendimento</label>
            <div className="relative">
              <Signature className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#141414]/30" />
              <input 
                type="text" 
                value={signature} 
                onChange={e => setSignature(e.target.value)}
                placeholder="Ex: Dr. Silva - CRM 1234"
                className="w-full rounded-2xl border border-[#141414]/10 bg-[#f5f5f0]/50 py-4 pl-12 pr-4 font-serif italic text-lg text-[#5A5A40] focus:border-[#5A5A40] focus:outline-none"
              />
            </div>
            <p className="text-[10px] text-[#141414]/40">Esta assinatura aparecerá em todos os registros do Banco de Urgência sob sua responsabilidade.</p>
          </div>

          <button 
            type="submit"
            disabled={saving}
            className="flex items-center justify-center gap-2 w-full rounded-2xl bg-[#141414] py-4 font-bold text-white transition-all hover:bg-[#141414]/90 active:scale-95 disabled:opacity-50"
          >
            {saved ? <CheckCircle className="h-5 w-5 text-green-400" /> : <Save className="h-5 w-5" />}
            {saving ? 'A salvar...' : saved ? 'Atualizado com Sucesso' : 'Guardar Alterações'}
          </button>
        </form>
      </div>
    </div>
  );
}
