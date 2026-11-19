import React from 'react';
import {
  Cpu,
  Box,
  Zap,
  Code2,
  ListOrdered,
  Download,
  FileText,
  RotateCcw,
  Code,
} from 'lucide-react';

export type AppTab = 'ANATOMY' | 'SIMULATOR' | 'IDE' | 'PINOUT';

interface TopbarProps {
  activeTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  onOpenDatasheet: () => void;
  onDownloadZip: () => void;
  onResetBoard: () => void;
  onOpenEmbed: () => void;
  isResetting: boolean;
}

export const Topbar: React.FC<TopbarProps> = ({
  activeTab,
  onSelectTab,
  onOpenDatasheet,
  onDownloadZip,
  onResetBoard,
  onOpenEmbed,
  isResetting,
}) => {
  return (
    <header className="h-14 sm:h-16 bg-white border-b border-slate-200/90 px-3 sm:px-5 flex items-center justify-between gap-2 sm:gap-4 z-40 shrink-0 shadow-xs">
      {/* 1. Left Brand Zone */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-[#00878a] text-white flex items-center justify-center shadow-xs shrink-0">
          <Cpu className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="text-base sm:text-lg font-extrabold tracking-tight text-slate-900 truncate">
              ESP32<span className="text-[#00878a]">Lab</span> 3D
            </span>
            <span className="px-1.5 py-0.5 text-[9px] sm:text-[10px] font-mono font-bold uppercase tracking-wider text-[#00878a] bg-[#00878a]/10 rounded-md border border-[#00878a]/30 hidden xs:inline shrink-0">
              38P
            </span>
          </div>
          <span className="text-[11px] sm:text-xs text-slate-500 font-medium hidden md:inline truncate">
            Simulador fotorrealista y laboratorio interactivo
          </span>
        </div>
      </div>

      {/* 2. Center Tabs (Visible on Desktop / Large Tablets) */}
      <nav className="hidden lg:flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200/80 shrink-0">
        <button
          onClick={() => onSelectTab('ANATOMY')}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-2 transition-all ${
            activeTab === 'ANATOMY'
              ? 'bg-[#00878a] text-white shadow-sm font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <Box className="w-4 h-4" />
          <span>1. Anatomía</span>
        </button>

        <button
          onClick={() => onSelectTab('SIMULATOR')}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-2 transition-all ${
            activeTab === 'SIMULATOR'
              ? 'bg-[#00878a] text-white shadow-sm font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>2. Simulador</span>
        </button>

        <button
          onClick={() => onSelectTab('IDE')}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-2 transition-all ${
            activeTab === 'IDE'
              ? 'bg-[#00878a] text-white shadow-sm font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <Code2 className="w-4 h-4" />
          <span>3. Código IDE</span>
        </button>

        <button
          onClick={() => onSelectTab('PINOUT')}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-2 transition-all ${
            activeTab === 'PINOUT'
              ? 'bg-[#00878a] text-white shadow-sm font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <ListOrdered className="w-4 h-4" />
          <span>4. Pinout</span>
        </button>
      </nav>

      {/* 3. Right Action Zone - Responsive on mobile */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        <button
          onClick={onDownloadZip}
          className="min-h-[38px] px-2.5 sm:px-3 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-all flex items-center gap-1.5"
          title="Descargar paquete ZIP"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Descargar ZIP</span>
        </button>

        <button
          onClick={onOpenDatasheet}
          className="min-h-[38px] px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-[#00878a] hover:bg-[#00878a]/10 bg-white border border-[#00878a]/60 rounded-lg shadow-xs transition-all flex items-center gap-1.5"
          title="Ver Ficha Técnica Oficial"
        >
          <FileText className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Ficha Técnica</span>
        </button>

        <button
          onClick={onOpenEmbed}
          className="min-h-[38px] px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 bg-white border border-slate-200 rounded-lg shadow-xs transition-all flex items-center gap-1.5"
          title="Obtener código para embeber en tu sitio web"
        >
          <Code className="w-3.5 h-3.5 text-[#00878a]" />
          <span className="hidden md:inline">Embeber</span>
        </button>

        {/* COM3 Indicator */}
        <div className="flex items-center gap-1 bg-slate-100 border border-slate-200 text-slate-700 px-2 py-1.5 rounded-lg text-xs font-mono font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-xs" />
          <span className="text-[11px] sm:text-xs">COM3</span>
        </div>

        {/* Reset button */}
        <button
          onClick={onResetBoard}
          className="min-h-[38px] min-w-[38px] p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border border-slate-200 transition-colors flex items-center justify-center"
          title="Reiniciar microcontrolador (EN)"
          aria-label="Reiniciar microcontrolador"
        >
          <RotateCcw className={`w-4 h-4 ${isResetting ? 'animate-spin text-red-500' : ''}`} />
        </button>
      </div>
    </header>
  );
};
