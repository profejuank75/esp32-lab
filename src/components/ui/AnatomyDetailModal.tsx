import React from 'react';
import { AnatomyPart } from '../../types/esp32';
import { X, Layers, Cpu, Shield, Wifi, Zap, Activity } from 'lucide-react';

interface AnatomyDetailModalProps {
  selectedPart: AnatomyPart | null;
  onClose: () => void;
  onSelectPart: (part: AnatomyPart) => void;
  allParts: AnatomyPart[];
}

export const AnatomyDetailModal: React.FC<AnatomyDetailModalProps> = ({
  selectedPart,
  onClose,
  onSelectPart,
  allParts,
}) => {
  if (!selectedPart) return null;

  const getCategoryIcon = (cat: AnatomyPart['category']) => {
    switch (cat) {
      case 'CHIP':
        return <Cpu className="w-4 h-4 text-cyan-600" />;
      case 'RF':
        return <Wifi className="w-4 h-4 text-emerald-600" />;
      case 'POWER':
        return <Zap className="w-4 h-4 text-amber-600" />;
      case 'INTERFACE':
        return <Activity className="w-4 h-4 text-blue-600" />;
      default:
        return <Layers className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="fixed inset-x-3 bottom-20 sm:bottom-auto sm:top-20 sm:right-6 sm:inset-x-auto sm:w-96 max-h-[75vh] sm:max-h-[82vh] overflow-y-auto bg-white/98 border border-slate-200/90 rounded-2xl p-4 shadow-2xl backdrop-blur-md z-40 flex flex-col gap-3 text-slate-800 animate-in fade-in slide-in-from-bottom-4 sm:slide-in-from-right-4 duration-200">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-slate-100 pb-2.5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-slate-50 rounded-xl border border-slate-200">
            {getCategoryIcon(selectedPart.category)}
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-[#00878a]">
              Anatomía · {selectedPart.category}
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              {selectedPart.name}
            </h3>
          </div>
        </div>

        <button
          onClick={onClose}
          className="min-h-[36px] min-w-[36px] p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-800 transition-colors flex items-center justify-center"
          title="Cerrar ficha técnica"
          aria-label="Cerrar ficha"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Subtitle & Description */}
      <div className="text-xs text-[#00878a] font-semibold">
        {selectedPart.subtitle}
      </div>
      <p className="text-xs text-slate-600 leading-relaxed">
        {selectedPart.description}
      </p>

      {/* Specifications list */}
      <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/90 flex flex-col gap-2">
        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          Especificaciones Clave
        </div>
        <div className="grid grid-cols-1 gap-1.5 text-xs">
          {Object.entries(selectedPart.specs).map(([k, v]) => (
            <div key={k} className="flex justify-between items-baseline border-b border-slate-200/50 pb-1">
              <span className="text-slate-500 font-mono text-[11px]">{k}:</span>
              <span className="text-slate-900 font-semibold text-right max-w-[60%]">{v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick switcher to other components */}
      <div className="flex flex-col gap-1.5 pt-1">
        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
          Explorar otras partes:
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {allParts.map((part) => (
            <button
              key={part.id}
              onClick={() => onSelectPart(part)}
              className={`min-h-[32px] px-2.5 py-1 rounded-lg text-[11px] whitespace-nowrap transition-colors border ${
                part.id === selectedPart.id
                  ? 'bg-[#00878a] text-white border-[#00878a] font-bold'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {part.name.split(' ')[0]} {part.name.split(' ')[1] || ''}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
