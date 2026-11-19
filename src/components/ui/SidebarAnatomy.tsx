import React, { useState } from 'react';
import { AnatomyPart } from '../../types/esp32';
import { AnatomyQuiz } from './AnatomyQuiz';
import {
  RotateCcw,
  Usb,
  Cpu,
  Shield,
  Radio,
  Zap,
  Power,
  ToggleLeft,
  ListFilter,
  Layers,
  HelpCircle,
  X,
} from 'lucide-react';

interface SidebarAnatomyProps {
  parts: AnatomyPart[];
  selectedPart: AnatomyPart | null;
  onSelectPart: (part: AnatomyPart) => void;
  showBlueprintCards: boolean;
  onToggleBlueprintCards: (enabled: boolean) => void;
  onResetView: () => void;
  explodedProgress: number;
  onExplodedChange: (val: number) => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const SidebarAnatomy: React.FC<SidebarAnatomyProps> = ({
  parts,
  selectedPart,
  onSelectPart,
  showBlueprintCards,
  onToggleBlueprintCards,
  onResetView,
  explodedProgress,
  onExplodedChange,
  isOpenMobile = false,
  onCloseMobile,
}) => {
  const [sidebarTab, setSidebarTab] = useState<'PARTS' | 'QUIZ'>('PARTS');

  const getPartIcon = (id: string) => {
    switch (id) {
      case 'btn_en':
        return <RotateCcw className="w-5 h-5 text-red-500" />;
      case 'usb_port':
        return <Usb className="w-5 h-5 text-blue-500" />;
      case 'esp_wroom_32':
        return <Cpu className="w-5 h-5 text-[#00878a]" />;
      case 'rf_shield':
        return <Shield className="w-5 h-5 text-cyan-600" />;
      case 'pcb_antenna':
        return <Radio className="w-5 h-5 text-emerald-600" />;
      case 'cp2102':
        return <Cpu className="w-5 h-5 text-teal-600" />;
      case 'ams1117':
        return <Zap className="w-5 h-5 text-purple-600" />;
      case 'btn_boot':
        return <ToggleLeft className="w-5 h-5 text-amber-600" />;
      case 'led_user':
        return <Power className="w-5 h-5 text-blue-600" />;
      default:
        return <ListFilter className="w-5 h-5 text-slate-500" />;
    }
  };

  const getPartBg = (id: string) => {
    switch (id) {
      case 'btn_en':
        return 'bg-red-50 border-red-100';
      case 'usb_port':
        return 'bg-blue-50 border-blue-100';
      case 'esp_wroom_32':
        return 'bg-teal-50 border-teal-100';
      case 'rf_shield':
        return 'bg-cyan-50 border-cyan-100';
      case 'pcb_antenna':
        return 'bg-emerald-50 border-emerald-100';
      case 'cp2102':
        return 'bg-teal-50 border-teal-100';
      case 'ams1117':
        return 'bg-purple-50 border-purple-100';
      case 'btn_boot':
        return 'bg-amber-50 border-amber-100';
      case 'led_user':
        return 'bg-blue-50 border-blue-100';
      default:
        return 'bg-slate-100 border-slate-200';
    }
  };

  const content = (
    <div className="flex flex-col h-full bg-white select-none overflow-hidden">
      {/* Top Segmented Tab Switcher: [ Piezas (10) | Quiz (10) ] */}
      <div className="shrink-0 p-3 border-b border-slate-100 bg-slate-50/70">
        <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-xl border border-slate-200">
          <button
            onClick={() => setSidebarTab('PARTS')}
            className={`flex-1 min-h-[36px] py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              sidebarTab === 'PARTS'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-[#00878a]" />
            <span>Piezas (10)</span>
          </button>

          <button
            onClick={() => setSidebarTab('QUIZ')}
            className={`flex-1 min-h-[36px] py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              sidebarTab === 'QUIZ'
                ? 'bg-[#00878a] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Quiz (10)</span>
          </button>
        </div>
      </div>

      {/* View 1: Quiz Mode */}
      {sidebarTab === 'QUIZ' ? (
        <AnatomyQuiz
          onFocusPart={(partId) => {
            const part = parts.find((p) => p.id === partId);
            if (part) {
              onSelectPart(part);
              if (onCloseMobile && window.innerWidth < 1024) {
                onCloseMobile();
              }
            }
          }}
          onExitQuiz={() => setSidebarTab('PARTS')}
        />
      ) : (
        /* View 2: Standard Anatomy Parts Mode */
        <>
          {/* Header */}
          <div className="p-4 border-b border-slate-100 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#00878a]">
                  MÓDULO 01 • ANATOMÍA
                </div>
                <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                  Resumen de Placa
                </h2>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={onResetView}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors min-h-[36px]"
                >
                  Vista General
                </button>
                {onCloseMobile && (
                  <button
                    onClick={onCloseMobile}
                    className="lg:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                    aria-label="Cerrar panel de componentes"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>

            {/* Switch toggle: Tarjetas Blueprint 3D */}
            <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl">
              <span className="text-xs font-bold text-slate-700">
                Tarjetas Blueprint 3D
              </span>

              <button
                onClick={() => onToggleBlueprintCards(!showBlueprintCards)}
                className={`w-12 h-7 rounded-full transition-colors relative flex items-center px-1 min-h-[36px] ${
                  showBlueprintCards ? 'bg-[#00878a]' : 'bg-slate-300'
                }`}
                title="Activar/desactivar tarjetas flotantes sobre la placa"
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                    showBlueprintCards ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Exploded View Slider */}
            <div className="flex flex-col gap-1.5 pt-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600 font-medium flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-[#00878a]" />
                  Despiece Explosionado:
                </span>
                <span className="font-mono text-[#00878a] font-bold">
                  {Math.round(explodedProgress * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.02}
                value={explodedProgress}
                aria-label="Despiece explosionado"
                onChange={(e) => onExplodedChange(Number(e.target.value))}
                className="w-full accent-[#00878a] cursor-pointer h-2 bg-slate-200 rounded-lg touch-none"
              />
            </div>

            <p className="text-[11px] text-slate-500 leading-snug pt-0.5">
              Toca o haz clic en cualquier componente para enfocarlo en 3D o consultar sus especificaciones:
            </p>
          </div>

          {/* Scrollable Component Cards List */}
          <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
            {parts.map((part) => {
              const isSelected = selectedPart?.id === part.id;
              return (
                <div
                  key={part.id}
                  onClick={() => {
                    onSelectPart(part);
                    if (onCloseMobile && window.innerWidth < 1024) {
                      onCloseMobile();
                    }
                  }}
                  className={`min-h-[54px] p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-teal-50/80 border-[#00878a] shadow-xs'
                      : 'bg-white border-slate-200/80 hover:border-slate-300 hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${getPartBg(
                        part.id
                      )}`}
                    >
                      {getPartIcon(part.id)}
                    </div>

                    <div className="flex flex-col min-w-0">
                      <div className="text-xs font-bold text-slate-900 truncate uppercase">
                        {part.name}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">
                        {part.subtitle}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectPart(part);
                      if (onCloseMobile && window.innerWidth < 1024) {
                        onCloseMobile();
                      }
                    }}
                    className={`min-h-[36px] px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-all shrink-0 flex items-center justify-center ${
                      isSelected
                        ? 'bg-[#00878a] text-white border-[#00878a]'
                        : 'bg-white text-[#00878a] border-[#00878a]/40 hover:bg-[#00878a]/10'
                    }`}
                  >
                    Detalle +
                  </button>
                </div>
              );
            })}
          </div>

          {/* Footer status indicator */}
          <div className="h-10 border-t border-slate-200/90 px-4 flex items-center justify-between text-[11px] text-slate-500 font-medium bg-slate-50/50">
            <div className="flex items-center gap-1.5">
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span>Arrastra para rotar la placa 3D</span>
            </div>
            <span className="font-mono text-slate-400">WebGL PBR</span>
          </div>
        </>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:flex w-80 lg:w-[350px] border-r border-slate-200/90 h-full z-20 shadow-xs shrink-0">
        {content}
      </aside>

      {/* Mobile & Tablet Slide-Over Drawer with Backdrop */}
      {isOpenMobile && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            onClick={onCloseMobile}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
          />
          <div className="relative w-80 max-w-[85vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-250">
            {content}
          </div>
        </div>
      )}
    </>
  );
};
