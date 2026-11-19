import React, { useRef, useEffect, useState } from 'react';
import { ESP32_BLUEPRINT_CALLOUTS, BlueprintCallout } from '../../data/esp32Data';
import { ProjectedHotspot } from '../3d/Viewport3D';
import {
  RotateCcw,
  Usb,
  Cpu,
  Shield,
  Radio,
  Zap,
  Power,
  ChevronRight,
  ChevronLeft,
  ListFilter,
  Eye,
} from 'lucide-react';

interface BlueprintCalloutsOverlayProps {
  projectedHotspots: ProjectedHotspot[];
  showCards: boolean;
  onOpenPartDetails: (partId: string) => void;
  selectedPartId?: string | null;
}

export const BlueprintCalloutsOverlay: React.FC<BlueprintCalloutsOverlayProps> = ({
  projectedHotspots,
  showCards,
  onOpenPartDetails,
  selectedPartId,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [mobileActiveIndex, setMobileActiveIndex] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;
    const updateSize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  if (!showCards) return null;

  const isMobile = dimensions.width > 0 && dimensions.width < 768;

  const getCalloutIcon = (type: BlueprintCallout['iconType']) => {
    switch (type) {
      case 'reset':
        return <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />;
      case 'usb':
        return <Usb className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />;
      case 'shield':
        return <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-600" />;
      case 'antenna':
        return <Radio className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />;
      case 'cp2102':
        return <Cpu className="w-4 h-4 sm:w-5 sm:h-5 text-teal-600" />;
      case 'power':
        return <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />;
      case 'pin':
        return <ListFilter className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />;
      default:
        return <Power className="w-4 h-4 sm:w-5 sm:h-5 text-slate-500" />;
    }
  };

  const getCardLayoutCoordinates = (hint: BlueprintCallout['positionHint']) => {
    const w = dimensions.width || 1000;
    const h = dimensions.height || 700;

    switch (hint) {
      case 'top-left':
        return { x: Math.max(16, w * 0.04), y: Math.max(16, h * 0.04) };
      case 'top-center':
        return { x: Math.max(16, w * 0.38), y: Math.max(16, h * 0.04) };
      case 'top-right':
        return { x: Math.max(16, w * 0.68), y: Math.max(16, h * 0.04) };
      case 'mid-left':
        return { x: Math.max(16, w * 0.03), y: Math.max(80, h * 0.38) };
      case 'mid-right':
        return { x: Math.max(16, w * 0.70), y: Math.max(80, h * 0.36) };
      case 'bottom-center':
        return { x: Math.max(16, w * 0.38), y: Math.max(140, h * 0.72) };
      case 'bottom-left':
        return { x: Math.max(16, w * 0.04), y: Math.max(140, h * 0.74) };
      case 'bottom-right':
        return { x: Math.max(16, w * 0.68), y: Math.max(140, h * 0.74) };
      default:
        return { x: 50, y: 50 };
    }
  };

  // MOBILE VIEW (<768px): Sleek touch carousel card pinned near bottom
  if (isMobile) {
    const activeCallout = ESP32_BLUEPRINT_CALLOUTS[mobileActiveIndex];
    const hotspot = projectedHotspots.find((h) => h.id === activeCallout.id);

    return (
      <div
        ref={containerRef}
        className="absolute inset-0 pointer-events-none overflow-hidden z-20"
      >
        {/* Leader line from active mobile card to hotspot */}
        {hotspot && hotspot.visible && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            <line
              x1={dimensions.width / 2}
              y1={dimensions.height - 150}
              x2={hotspot.screenX}
              y2={hotspot.screenY}
              stroke="#00878a"
              strokeWidth="2"
              strokeDasharray="4 4"
              opacity="0.85"
            />
            <circle
              cx={hotspot.screenX}
              cy={hotspot.screenY}
              r="4.5"
              fill="#00878a"
              stroke="#ffffff"
              strokeWidth="2"
            />
          </svg>
        )}

        {/* Floating Mobile Card */}
        <div className="absolute bottom-28 left-4 right-4 max-w-sm mx-auto bg-white/95 border border-slate-200/90 rounded-2xl p-3 shadow-xl backdrop-blur-md pointer-events-auto flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${activeCallout.iconBg}`}
              >
                {getCalloutIcon(activeCallout.iconType)}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-slate-900 truncate uppercase">
                  {activeCallout.title}
                </span>
                <span className="text-[10px] text-slate-500 truncate">
                  {activeCallout.subtitle}
                </span>
              </div>
            </div>

            {/* Stepper buttons */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() =>
                  setMobileActiveIndex((prev) =>
                    prev > 0 ? prev - 1 : ESP32_BLUEPRINT_CALLOUTS.length - 1
                  )
                }
                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center"
                aria-label="Componente anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-[10px] font-mono font-bold text-slate-400 px-1">
                {mobileActiveIndex + 1}/{ESP32_BLUEPRINT_CALLOUTS.length}
              </span>
              <button
                onClick={() =>
                  setMobileActiveIndex((prev) =>
                    prev < ESP32_BLUEPRINT_CALLOUTS.length - 1 ? prev + 1 : 0
                  )
                }
                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center"
                aria-label="Siguiente componente"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <button
            onClick={() => onOpenPartDetails(activeCallout.targetHotspotId)}
            className="w-full py-1.5 px-3 bg-[#00878a]/10 hover:bg-[#00878a]/20 text-[#00878a] rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors min-h-[38px]"
          >
            <span>Ver Especificaciones Técnicas</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  // TABLET & DESKTOP VIEW (>=768px): Full perimeter layout with connecting dashed lines
  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none overflow-hidden z-10"
    >
      {/* SVG Connecting Dashed Leader Lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        {ESP32_BLUEPRINT_CALLOUTS.map((callout) => {
          const hotspot = projectedHotspots.find((h) => h.id === callout.id);
          if (!hotspot || !hotspot.visible) return null;

          const cardPos = getCardLayoutCoordinates(callout.positionHint);
          const cardWidth = 220;
          const cardHeight = 80;

          const startX = cardPos.x + cardWidth / 2;
          const startY =
            cardPos.y < hotspot.screenY
              ? cardPos.y + cardHeight
              : cardPos.y;

          return (
            <g key={`line_${callout.id}`}>
              <line
                x1={startX}
                y1={startY}
                x2={hotspot.screenX}
                y2={hotspot.screenY}
                stroke="#00878a"
                strokeWidth="1.5"
                strokeDasharray="4 4"
                opacity="0.75"
              />
              <circle
                cx={hotspot.screenX}
                cy={hotspot.screenY}
                r="3.5"
                fill="#00878a"
                stroke="#ffffff"
                strokeWidth="1.5"
              />
            </g>
          );
        })}
      </svg>

      {/* Floating Blueprint Cards */}
      {ESP32_BLUEPRINT_CALLOUTS.map((callout) => {
        const cardPos = getCardLayoutCoordinates(callout.positionHint);

        return (
          <div
            key={callout.id}
            style={{
              left: `${cardPos.x}px`,
              top: `${cardPos.y}px`,
            }}
            className="absolute w-52 lg:w-58 bg-white/95 border border-slate-200/90 rounded-2xl p-2.5 lg:p-3 shadow-md backdrop-blur-xs pointer-events-auto flex flex-col gap-1 transition-all hover:shadow-lg hover:border-[#00878a]/50 group"
          >
            <div className="flex items-center gap-2">
              <div
                className={`w-7 h-7 lg:w-8 lg:h-8 rounded-lg border flex items-center justify-center shrink-0 ${callout.iconBg}`}
              >
                {getCalloutIcon(callout.iconType)}
              </div>

              <div className="flex flex-col min-w-0">
                <span className="text-[11px] lg:text-xs font-bold text-slate-900 truncate uppercase tracking-tight">
                  {callout.title}
                </span>
                <span className="text-[9px] lg:text-[10px] text-slate-500 truncate leading-tight">
                  {callout.subtitle}
                </span>
              </div>
            </div>

            <button
              onClick={() => onOpenPartDetails(callout.targetHotspotId)}
              className="mt-0.5 text-[10px] lg:text-[11px] font-bold text-[#00878a] hover:text-[#007073] flex items-center gap-0.5 transition-colors group-hover:underline text-left self-start"
            >
              <span>Ver especificaciones</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
