import React, { useState } from 'react';
import { Patient } from '../types';
import { Map as MapIcon, ShieldAlert, Sparkles, Filter, Info, Users, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface InteractiveMapProps {
  patients: Patient[];
}

type MapMode = 'huila' | 'lubango_bairros';

interface GeoRegion {
  id: string;
  name: string;
  x: number;
  y: number;
  // Stylized poly points (relative to 400x320 SVG viewport) to represent geographic sectors
  points?: string;
}

const HUILA_REGIONS: GeoRegion[] = [
  { id: 'Lubango', name: 'Lubango', x: 120, y: 120, points: '100,100 150,90 170,120 150,150 110,140' },
  { id: 'Humpata', name: 'Humpata', x: 70, y: 130, points: '60,110 100,100 110,140 80,165 50,140' },
  { id: 'Chibia', name: 'Chibia', x: 115, y: 195, points: '110,140 150,150 140,210 100,225 90,180' },
  { id: 'Cacula', name: 'Cacula', x: 140, y: 65, points: '120,40 160,45 170,90 130,95' },
  { id: 'Quilengues', name: 'Quilengues', x: 75, y: 45, points: '50,30 100,20 120,40 80,75' },
  { id: 'Caconda', name: 'Caconda', x: 210, y: 35, points: '180,20 230,10 240,50 190,45' },
  { id: 'Caluquembe', name: 'Caluquembe', x: 200, y: 80, points: '170,90 220,70 230,100 180,110' },
  { id: 'Chicomba', name: 'Chicomba', x: 265, y: 45, points: '240,50 280,30 300,60 250,70' },
  { id: 'Chipindo', name: 'Chipindo', x: 310, y: 65, points: '300,60 340,50 350,90 310,95' },
  { id: 'Quipungo', name: 'Quipungo', x: 190, y: 165, points: '170,120 210,125 210,185 160,180' },
  { id: 'Matala', name: 'Matala', x: 250, y: 180, points: '210,185 270,170 280,210 220,230' },
  { id: 'Kuvango', name: 'Kuvango', x: 320, y: 165, points: '280,150 340,140 330,195 290,200' },
  { id: 'Jamba', name: 'Jamba', x: 295, y: 245, points: '260,240 330,220 310,285 250,280' },
  { id: 'Gambos', name: 'Gambos', x: 155, y: 265, points: '140,210 185,225 180,295 120,280' }
];

const LUBANGO_NEIGHBORHOODS: GeoRegion[] = [
  { id: 'Tchioco', name: 'Tchioco', x: 260, y: 95, points: '210,110 270,70 310,100 250,130' },
  { id: 'Mapunda', name: 'Mapunda', x: 110, y: 105, points: '70,110 130,85 150,120 90,140' },
  { id: 'Nambambe', name: 'Nambambe', x: 275, y: 215, points: '230,190 290,170 320,230 250,250' },
  { id: 'Santo António', name: 'Santo António', x: 200, y: 265, points: '170,230 230,220 220,290 160,280' },
  { id: 'Centro da Cidade', name: 'Centro da Cidade', x: 195, y: 165, points: '150,150 220,135 230,190 160,200' },
  { id: 'Laureanos', name: 'Laureanos', x: 290, y: 155, points: '250,130 330,120 320,170 260,180' },
  { id: 'Lucrécia', name: 'Lucrécia', x: 115, y: 195, points: '80,170 140,165 130,220 70,215' },
  { id: 'João de Almeida', name: 'João de Almeida', x: 130, y: 250, points: '110,230 160,225 150,280 100,270' },
  { id: 'Comandante Cowboy', name: 'Comandante Cowboy', x: 185, y: 215, points: '160,200 210,190 200,240 150,230' },
  { id: 'Arco-Íris', name: 'Arco-Íris', x: 205, y: 115, points: '170,90 230,85 240,125 180,130' },
  { id: 'Senzala', name: 'Senzala', x: 185, y: 65, points: '140,50 210,40 220,80 150,85' },
  { id: 'Mitcha', name: 'Mitcha', x: 135, y: 150, points: '100,135 150,130 150,175 110,180' },
  { id: 'Bula', name: 'Bula', x: 265, y: 130, points: '230,110 280,105 290,145 240,150' }
];

export default function InteractiveMap({ patients }: InteractiveMapProps) {
  const [mode, setMode] = useState<MapMode>('lubango_bairros');
  const [selectedRegion, setSelectedRegion] = useState<string | null>('Tchioco');
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);

  const activeRegions = mode === 'huila' ? HUILA_REGIONS : LUBANGO_NEIGHBORHOODS;

  // Calculate statistics per region
  const getRegionStats = (regionName: string) => {
    const regionalPatients = patients.filter(p => {
      if (mode === 'huila') {
        return p.province === 'Huíla' && p.city.toLowerCase() === regionName.toLowerCase();
      } else {
        return p.province === 'Huíla' && 
               p.city.toLowerCase() === 'lubango' && 
               p.neighborhood?.toLowerCase() === regionName.toLowerCase();
      }
    });

    const total = regionalPatients.length;
    const critical = regionalPatients.filter(p => p.priority === 'Emergência').length;
    const waiting = regionalPatients.filter(p => p.status === 'Em Espera').length;

    // Dominant symptom/occurrence type
    const occurrenceCounts = regionalPatients.reduce((acc: { [key: string]: number }, p) => {
      acc[p.occurrenceType] = (acc[p.occurrenceType] || 0) + 1;
      return acc;
    }, {});
    const topSymptom = Object.entries(occurrenceCounts)
      .sort((a, b) => b[1] - a[1])?.[0]?.[0] || 'Nenhum';

    return { total, critical, waiting, topSymptom, list: regionalPatients };
  };

  // Pre-calculate statistics for active list to find the maxima for color shades
  const regionData = activeRegions.map(r => ({
    ...r,
    stats: getRegionStats(r.name)
  }));

  const maxCases = Math.max(...regionData.map(r => r.stats.total), 1);

  // Get color intensity based on case ratio
  const getRegionFillColor = (count: number, isHovered: boolean, isSelected: boolean) => {
    if (count === 0) {
      return isHovered ? 'fill-slate-100 stroke-slate-300' : 'fill-slate-50 stroke-slate-200';
    }
    const ratio = count / maxCases;
    
    // Select styling
    if (isSelected) {
      if (ratio > 0.6) return 'fill-red-500 stroke-red-700';
      if (ratio > 0.2) return 'fill-amber-400 stroke-amber-600';
      return 'fill-blue-400 stroke-blue-700';
    }

    // Default shaded heatmap colors
    if (ratio > 0.6) {
      return isHovered ? 'fill-red-400 stroke-red-600' : 'fill-red-100 stroke-red-300';
    }
    if (ratio > 0.2) {
      return isHovered ? 'fill-amber-300 stroke-amber-500' : 'fill-amber-50 stroke-amber-200';
    }
    return isHovered ? 'fill-blue-200 stroke-blue-400' : 'fill-blue-50/70 stroke-blue-100/100';
  };

  // Get pin glow marker class
  const getPulseColor = (count: number) => {
    if (count === 0) return 'bg-slate-400';
    const ratio = count / maxCases;
    if (ratio > 0.6) return 'bg-red-500';
    if (ratio > 0.2) return 'bg-amber-500';
    return 'bg-blue-500';
  };

  // Selected region insights
  const selectedInfo = selectedRegion ? regionData.find(r => r.name === selectedRegion) : null;
  const selectedStats = selectedInfo ? selectedInfo.stats : null;

  // Custom localized health support recommendations
  const getSanitationAdvice = (region: string, topSymptom: string, total: number) => {
    if (total === 0) {
      return "Sem alertas ativos. Recomenda-se manter a habitual monitoração sanitária e vacinal.";
    }
    const symptomLower = topSymptom.toLowerCase();
    if (symptomLower.includes('malária') || symptomLower.includes('febre')) {
      return `${region}: Taxa de Malária sob atenção. Recomenda-se reforço imediato de mosquiteiros impregnados, eliminação de águas estagnadas nas imediações e pulverização intra-domiciliar pelas brigadas comunitárias de saúde.`;
    }
    if (symptomLower.includes('diarreia') || symptomLower.includes('vómito') || symptomLower.includes('gastro')) {
      return `${region}: Incidência de perturbações gastrointestinais. Essencial distribuir pastilhas de hipoclorito de cálcio (certeza) para purificação da água, fervura obrigatória de água de consumo e campanhas de saneamento fluvial básico.`;
    }
    if (symptomLower.includes('tosse') || symptomLower.includes('pneumonia') || symptomLower.includes('pulmão')) {
      return `${region}: Sintomatologia respiratória prevalente. Orientar famílias sobre isolamento de fumo, monitoração de hipotermia infantil e encaminhamento precoce de bronco-espasmos a esta unidade hospitalar.`;
    }
    return `${region}: Casos de interesse clínico sob observação pediátrica urgente. Manter o isolamento preventivo de sintomáticos e orientar a comunidade sobre boas práticas de biossegurança comunitária.`;
  };

  return (
    <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">
      {/* 1. MAP VISUALIZATION CANVAS (8 COLUMNS) */}
      <div className="lg:col-span-8 p-6 sm:p-8 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-100 select-none bg-slate-950 text-white relative">
        <div className="absolute inset-0 bg-radial-at-t from-slate-900 via-slate-950 to-slate-950 opacity-100 z-0"></div>
        
        {/* Top bar controls */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-500/10 p-2.5 rounded-xl border border-blue-500/20">
              <MapIcon className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-100">Mapa Geográfico de Risco</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Indicadores em tempo real para tomada de decisões</p>
            </div>
          </div>
          
          {/* Mode Toggles */}
          <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-xl">
            <button 
              onClick={() => { setMode('lubango_bairros'); setSelectedRegion('Tchioco'); }}
              className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all duration-300 ${mode === 'lubango_bairros' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
            >
              🏠 Bairros de Lubango
            </button>
            <button 
              onClick={() => { setMode('huila'); setSelectedRegion('Lubango'); }}
              className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all duration-300 ${mode === 'huila' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
            >
              📍 Municípios de Huíla
            </button>
          </div>
        </div>

        {/* Master SVG Map Screen */}
        <div className="relative z-10 flex-1 h-[340px] w-full flex items-center justify-center mt-6">
          <svg viewBox="0 0 400 320" className="w-full h-full max-h-[340px]">
            {/* Background grids styling with futuristic overlay */}
            <defs>
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(51, 65, 85, 0.15)" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" rx="16" />

            {/* Render geographic borders / colored regions */}
            <g className="transition-all duration-500">
              {regionData.map((reg) => (
                <polygon
                  key={reg.id}
                  points={reg.points}
                  onClick={() => setSelectedRegion(reg.name)}
                  onMouseEnter={() => setHoveredRegion(reg.name)}
                  onMouseLeave={() => setHoveredRegion(null)}
                  className={`transition-all duration-300 cursor-pointer stroke-2 ${getRegionFillColor(
                    reg.stats.total,
                    hoveredRegion === reg.name,
                    selectedRegion === reg.name
                  )}`}
                />
              ))}
            </g>

            {/* Glowing active indicator markers/pulsing hotspots */}
            {regionData.map((reg) => {
              const casesCount = reg.stats.total;
              if (casesCount === 0) return null;

              // Radius size based on proportion
              const radiusSize = Math.max(3, Math.min(10, 3 + (casesCount / maxCases) * 7));

              return (
                <g key={`pin-${reg.id}`} className="pointer-events-none">
                  {/* Outer breathing ring */}
                  <motion.circle
                    cx={reg.x}
                    cy={reg.y}
                    r={radiusSize * 2.5}
                    className={`${casesCount > 8 ? 'fill-red-500/20' : casesCount > 3 ? 'fill-amber-500/25' : 'fill-blue-500/25'}`}
                    animate={{
                      scale: [1, 1.4, 1],
                      opacity: [0.3, 0.7, 0.3],
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: casesCount > 8 ? 1.5 : casesCount > 3 ? 2.5 : 3.5,
                      ease: "easeInOut",
                    }}
                  />
                  {/* Pin core */}
                  <circle
                    cx={reg.x}
                    cy={reg.y}
                    r={radiusSize}
                    className={`stroke-white stroke-[1.5] ${
                      casesCount > 8 ? 'fill-red-500 shadow-lg shadow-red-500/50' :
                      casesCount > 3 ? 'fill-amber-500 shadow-lg shadow-amber-500/50' : 'fill-blue-500'
                    }`}
                  />
                  {/* Floating badge for high hotspot count */}
                  {hoveredRegion === reg.name && (
                    <g transform={`translate(${reg.x}, ${reg.y - 15})`}>
                      <rect x="-15" y="-12" width="30" height="15" rx="4" fill="black" stroke="white" strokeWidth="0.5" />
                      <text x="0" y="-1" textAnchor="middle" fill="white" className="text-[8px] font-black">{casesCount}</text>
                    </g>
                  )}
                </g>
              );
            })}

            {/* Map labels */}
            {regionData.map((reg) => {
              const isSelected = selectedRegion === reg.name;
              const hasCases = reg.stats.total > 0;
              return (
                <text
                  key={`label-${reg.id}`}
                  x={reg.x}
                  y={reg.y + 14}
                  textAnchor="middle"
                  onClick={() => setSelectedRegion(reg.name)}
                  className={`text-[9px] font-bold select-none cursor-pointer tracking-wide transition-all ${
                    isSelected ? 'fill-blue-400 font-extrabold text-[10px]' : 
                    hasCases ? 'fill-slate-100 font-semibold' : 'fill-slate-500 font-medium'
                  }`}
                >
                  {reg.name}
                </text>
              );
            })}
          </svg>
        </div>

        {/* Legend */}
        <div className="relative z-10 flex flex-wrap justify-between gap-4 mt-4 pt-4 border-t border-slate-900 text-xs">
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block animate-pulse"></span>
                <span className="text-[10px] text-slate-300 font-bold uppercase tracking-wider">Alto Alerta (+8 Casos)</span>
             </div>
             <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
                <span className="text-[10px] text-slate-300 font-bold uppercase tracking-wider">Médio Alerta (3-7 Casos)</span>
             </div>
             <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span>
                <span className="text-[10px] text-slate-300 font-bold uppercase tracking-wider">Baixo Alerta (1-2 Casos)</span>
             </div>
          </div>
          <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{mode === 'huila' ? 'Estatísticas Gerais de Província' : 'Distribuição Urbana de Lubango'}</span>
        </div>
      </div>

      {/* 2. TARGETED STATS & ACTIONABLE RECOMMENDATIONS BLOCK (4 COLUMNS) */}
      <div className="lg:col-span-4 p-8 bg-slate-50 flex flex-col justify-between">
        <AnimatePresence mode="wait">
          {selectedInfo ? (
            <motion.div
              key={selectedRegion}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6 flex flex-col justify-between h-full"
            >
              {/* Region Info */}
              <div>
                <span className="text-[9px] bg-blue-100 border border-blue-200 text-blue-700 px-3 py-1 rounded-full font-black uppercase tracking-widest">
                  Zona Selecionada
                </span>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-2 uppercase">{selectedRegion}</h2>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  {mode === 'huila' ? 'Município do Huíla' : 'Bairro Residencial do Lubango'}
                </p>

                {/* Main statistics layout */}
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                      <Users className="h-3.5 w-3.5 text-blue-500" /> Pacientes
                    </span>
                    <span className="text-3xl font-black text-slate-900 mt-2">{selectedStats?.total}</span>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                      <AlertTriangle className="h-3.5 w-3.5 text-red-500" /> Urgentes
                    </span>
                    <span className={`text-3xl font-black mt-2 ${selectedStats && selectedStats.critical > 0 ? 'text-red-600 animate-pulse' : 'text-slate-900'}`}>
                      {selectedStats?.critical}
                    </span>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 mt-4 shadow-sm space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Sintoma Prevalente:</span>
                    <span className="font-extrabold text-slate-800 text-[11px] truncate max-w-[140px]" title={selectedStats?.topSymptom}>
                      {selectedStats?.topSymptom}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Em Espera de Triagem:</span>
                    <span className="font-extrabold text-[#f59e0b] text-[11px]">
                      {selectedStats?.waiting} pacientes
                    </span>
                  </div>
                </div>

                {/* Targeted preventive health recommendation clinical co-pilot insights */}
                <div className="mt-6 border-l-4 border-blue-600 bg-blue-50/50 p-4 rounded-r-2xl border border-y-slate-200 border-r-slate-200">
                  <h4 className="text-[10px] font-black text-blue-700 uppercase tracking-widest flex items-center gap-1.5 leading-none">
                    <ShieldAlert className="h-4 w-4 text-blue-600" /> Medidas De Saneamento Ativas
                  </h4>
                  <p className="text-xs text-slate-700 font-medium mt-3 leading-relaxed">
                    {getSanitationAdvice(selectedRegion || '', selectedStats?.topSymptom || 'Nenhum', selectedStats?.total || 0)}
                  </p>
                </div>
              </div>

              {/* Patient mini logs for selected area */}
              <div className="mt-4 pt-4 border-t border-slate-200">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5 text-yellow-500" /> Casos Recentes da Zona
                </h4>
                <div className="max-h-[110px] overflow-y-auto space-y-1.5 pr-1">
                  {selectedStats && selectedStats.list.length > 0 ? (
                    selectedStats.list.map(p => (
                      <div key={p.id} className="flex items-center justify-between text-xs p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-100/50 transition-all font-semibold">
                        <span className="text-slate-800 font-bold truncate max-w-[120px]" title={p.name}>{p.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] text-slate-400">{p.age} Anos</span>
                          <span className={`w-2 h-2 rounded-full ${p.priority === 'Emergência' ? 'bg-red-500 animate-pulse' : 'bg-blue-500'}`}></span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-slate-400 text-xs italic py-4 text-center">Nenhum registo activo para esta área geográfica.</div>
                  )}
                </div>
              </div>

            </motion.div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 py-12">
              <Info className="h-10 w-10 text-slate-300 stroke-1 mb-2 animate-bounce" />
              <p className="text-xs font-bold uppercase tracking-wider">Selecione uma área no mapa</p>
              <p className="text-[10px] text-slate-400 mt-1 max-w-[170px]">Clique em qualquer município de Huíla ou bairro do Lubango no mapa para extrair indicadores e medidas de prevenção ativa.</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
