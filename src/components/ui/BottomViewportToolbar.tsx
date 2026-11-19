import React from 'react';
import {
  RotateCcw,
  RotateCw,
  Minus,
  Plus,
  Eye,
  Compass,
  Tag,
  Play,
  Pause,
  ListFilter,
} from 'lucide-react';

interface BottomViewportToolbarProps {
  onRotateStep: (dir: 'CCW' | 'CW') => void;
  onZoomStep: (dir: 'IN' | 'OUT') => void;
  onSetPreset: (preset: 'TOP' | 'ISO') => void;
  showBlueprintCards: boolean;
  onToggleBlueprintCards: () => void;
  isAutoRotating: boolean;
  onToggleAutoRotate: () => void;
  onOpenMobileSidebar?: () => void;
}

export const BottomViewportToolbar: React.FC<BottomViewportToolbarProps> = ({
  onRotateStep,
  onZoomStep,
  onSetPreset,
  showBlueprintCards,
  onToggleBlueprintCards,
  isAutoRotating,
  onToggleAutoRotate,
  onOpenMobileSidebar,
}) => {
  return (
    <div className="absolute bottom-20 lg:bottom-5 left-1/2 -translate-x-1/2 z-30 pointer-events-auto max-w-[95vw]">
      <div className="bg-white/95 border border-slate-200/90 shadow-lg rounded-2xl p-1 sm:p-1.5 flex items-center gap-1 sm:gap-1.5 backdrop-blur-md text-slate-700 text-xs font-semibold select-none">
        {/* Mobile Sidebar Drawer Trigger Button */}
        {onOpenMobileSidebar && (
          <>
            <button
              onClick={onOpenMobileSidebar}
              className="lg:hidden min-w-[38px] min-h-[38px] px-2.5 py-1.5 rounded-xl bg-[#00878a] text-white flex items-center gap-1.5 shadow-xs"
              title="Ver lista de componentes"
              aria-label="Abrir lista de componentes"
            >
              <ListFilter className="w-4 h-4" />
              <span className="text-[11px] font-bold">Piezas</span>
            </button>
            <div className="lg:hidden h-4 w-px bg-slate-200 mx-0.5" />
          </>
        )}

        {/* Rotate CCW */}
        <button
          onClick={() => onRotateStep('CCW')}
          className="min-w-[38px] min-h-[38px] p-2 rounded-xl hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors flex items-center justify-center"
          title="Girar 45° a la izquierda"
          aria-label="Girar a la izquierda"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Rotate CW */}
        <button
          onClick={() => onRotateStep('CW')}
          className="min-w-[38px] min-h-[38px] p-2 rounded-xl hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors flex items-center justify-center"
          title="Girar 45° a la derecha"
          aria-label="Girar a la derecha"
        >
          <RotateCw className="w-4 h-4" />
        </button>

        {/* Zoom Out */}
        <button
          onClick={() => onZoomStep('OUT')}
          className="min-w-[38px] min-h-[38px] p-2 rounded-xl hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors flex items-center justify-center"
          title="Alejar cámara (-)"
          aria-label="Alejar cámara"
        >
          <Minus className="w-4 h-4" />
        </button>

        {/* Zoom In */}
        <button
          onClick={() => onZoomStep('IN')}
          className="min-w-[38px] min-h-[38px] p-2 rounded-xl hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors flex items-center justify-center"
          title="Acercar cámara (+)"
          aria-label="Acercar cámara"
        >
          <Plus className="w-4 h-4" />
        </button>

        {/* Divider */}
        <div className="h-4 w-px bg-slate-200 mx-0.5 sm:mx-1" />

        {/* Cenital Top View */}
        <button
          onClick={() => onSetPreset('TOP')}
          className="min-w-[38px] min-h-[38px] px-2 sm:px-2.5 py-1.5 rounded-xl hover:bg-slate-100 text-slate-700 hover:text-slate-900 transition-colors flex items-center justify-center gap-1.5"
          title="Vista cenital plana"
          aria-label="Vista cenital plana"
        >
          <Eye className="w-4 h-4 text-[#00878a]" />
          <span className="hidden sm:inline">Cenital</span>
        </button>

        {/* Isometric View */}
        <button
          onClick={() => onSetPreset('ISO')}
          className="min-w-[38px] min-h-[38px] p-2 rounded-xl hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors flex items-center justify-center"
          title="Vista isométrica de laboratorio"
          aria-label="Vista isométrica"
        >
          <Compass className="w-4 h-4" />
        </button>

        {/* Blueprint Cards Toggle */}
        <button
          onClick={onToggleBlueprintCards}
          className={`min-w-[38px] min-h-[38px] px-2 sm:px-2.5 py-1.5 rounded-xl transition-colors flex items-center justify-center gap-1.5 ${
            showBlueprintCards
              ? 'bg-[#00878a]/10 text-[#00878a] border border-[#00878a]/30 font-bold'
              : 'hover:bg-slate-100 text-slate-600'
          }`}
          title="Mostrar / ocultar tarjetas blueprint 3D"
          aria-label="Alternar tarjetas blueprint"
        >
          <Tag className="w-4 h-4" />
          <span className="hidden sm:inline">Tarjetas</span>
        </button>

        {/* Auto Rotate Toggle */}
        <button
          onClick={onToggleAutoRotate}
          className={`min-w-[38px] min-h-[38px] px-2 sm:px-2.5 py-1.5 rounded-xl transition-colors flex items-center justify-center gap-1.5 ${
            isAutoRotating
              ? 'bg-[#00878a] text-white shadow-xs font-bold'
              : 'hover:bg-slate-100 text-slate-700'
          }`}
          title="Iniciar / pausar giro 360° continuo"
          aria-label="Alternar rotación automática"
        >
          {isAutoRotating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          <span className="hidden sm:inline">Girar</span>
        </button>
      </div>
    </div>
  );
};
