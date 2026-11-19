import React, { useState } from 'react';
import {
  Code,
  Copy,
  Check,
  X,
  Globe,
  Maximize2,
  Smartphone,
  ExternalLink,
  Laptop,
} from 'lucide-react';

interface EmbedModalProps {
  isOpen: boolean;
  onClose: () => void;
  embedUrl?: string;
}

export const EmbedModal: React.FC<EmbedModalProps> = ({
  isOpen,
  onClose,
  embedUrl = 'https://ais-pre-fv2bbal26il3kyrqci3llk-506382110146.us-west1.run.app',
}) => {
  const [selectedFormat, setSelectedFormat] = useState<'RESPONSIVE' | 'FIXED' | 'REACT' | 'WORDPRESS'>('RESPONSIVE');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const getCodeSnippet = () => {
    switch (selectedFormat) {
      case 'RESPONSIVE':
        return `<!-- Contenedor Responsive 16:9 para ESP32Lab 3D -->
<div style="position: relative; width: 100%; padding-bottom: 56.25%; height: 0; overflow: hidden; border-radius: 12px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1); border: 1px solid #e2e8f0;">
  <iframe
    src="${embedUrl}"
    title="ESP32Lab 3D - Simulador y Laboratorio Interactivo"
    style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0;"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
    allowfullscreen
    loading="lazy">
  </iframe>
</div>`;

      case 'FIXED':
        return `<!-- ESP32Lab 3D con Altura Fija (Ideal para paneles educativos) -->
<iframe
  src="${embedUrl}"
  title="ESP32Lab 3D"
  width="100%"
  height="700px"
  style="border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.08);"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
  allowfullscreen
  loading="lazy">
</iframe>`;

      case 'REACT':
        return `// Componente React / Next.js para embeber ESP32Lab 3D
export default function ESP32LabEmbed() {
  return (
    <div className="w-full h-[650px] lg:h-[750px] rounded-2xl overflow-hidden border border-slate-200 shadow-lg">
      <iframe
        src="${embedUrl}"
        title="ESP32Lab 3D Interactive Simulator"
        className="w-full h-full border-0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        loading="lazy"
      />
    </div>
  );
}`;

      case 'WORDPRESS':
        return `<!-- Para WordPress / Moodle / Canvas LMS / Notion (Bloque HTML personalizado) -->
<div align="center" style="margin: 20px 0;">
  <iframe
    src="${embedUrl}"
    width="100%"
    height="720px"
    frameborder="0"
    scrolling="no"
    allowfullscreen="true"
    style="border: none; max-width: 1200px; border-radius: 10px;">
  </iframe>
</div>`;
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getCodeSnippet());
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/90 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#00878a]/10 text-[#00878a] flex items-center justify-center">
              <Code className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Embeber ESP32Lab 3D en tu Sitio Web
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Inserta el simulador 3D interactivo en cualquier página, LMS o blog
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex flex-col gap-4 text-xs">
          {/* Public App URL display */}
          <div className="p-3 bg-teal-50/80 border border-teal-200 rounded-xl flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Globe className="w-4 h-4 text-[#00878a] shrink-0" />
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] font-bold uppercase text-[#00878a] tracking-wider">
                  URL Pública de la Aplicación
                </span>
                <span className="font-mono text-[11px] text-slate-800 truncate">
                  {embedUrl}
                </span>
              </div>
            </div>
            <a
              href={embedUrl}
              target="_blank"
              rel="noreferrer"
              className="px-2.5 py-1 bg-white hover:bg-teal-100 text-[#00878a] border border-teal-300 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors shrink-0"
            >
              <span>Abrir</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Format Selector Pills */}
          <div>
            <label className="font-bold text-slate-700 block mb-1.5 text-xs">
              Selecciona el tipo de integración:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                onClick={() => setSelectedFormat('RESPONSIVE')}
                className={`py-2 px-2.5 rounded-xl border flex flex-col items-center gap-1 text-center font-semibold transition-all ${
                  selectedFormat === 'RESPONSIVE'
                    ? 'bg-[#00878a] text-white border-[#00878a] shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                <span className="text-[11px]">Responsive 16:9</span>
              </button>

              <button
                onClick={() => setSelectedFormat('FIXED')}
                className={`py-2 px-2.5 rounded-xl border flex flex-col items-center gap-1 text-center font-semibold transition-all ${
                  selectedFormat === 'FIXED'
                    ? 'bg-[#00878a] text-white border-[#00878a] shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Laptop className="w-4 h-4" />
                <span className="text-[11px]">Altura Fija (700px)</span>
              </button>

              <button
                onClick={() => setSelectedFormat('WORDPRESS')}
                className={`py-2 px-2.5 rounded-xl border flex flex-col items-center gap-1 text-center font-semibold transition-all ${
                  selectedFormat === 'WORDPRESS'
                    ? 'bg-[#00878a] text-white border-[#00878a] shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Globe className="w-4 h-4" />
                <span className="text-[11px]">WordPress / LMS</span>
              </button>

              <button
                onClick={() => setSelectedFormat('REACT')}
                className={`py-2 px-2.5 rounded-xl border flex flex-col items-center gap-1 text-center font-semibold transition-all ${
                  selectedFormat === 'REACT'
                    ? 'bg-[#00878a] text-white border-[#00878a] shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Code className="w-4 h-4" />
                <span className="text-[11px]">React / Next.js</span>
              </button>
            </div>
          </div>

          {/* Code display with copy button */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-700 text-xs">
                Código para pegar en tu sitio:
              </span>
              <button
                onClick={handleCopy}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                  copied
                    ? 'bg-emerald-600 text-white'
                    : 'bg-[#00878a] hover:bg-[#007073] text-white shadow-xs'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>¡Copiado al portapapeles!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar Código</span>
                  </>
                )}
              </button>
            </div>

            <pre className="p-3.5 bg-slate-900 text-emerald-400 font-mono text-[11px] leading-relaxed rounded-xl overflow-x-auto border border-slate-800 shadow-inner">
              {getCodeSnippet()}
            </pre>
          </div>

          {/* Helpful Tips */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col gap-1.5 text-slate-600 text-[11px] leading-relaxed">
            <span className="font-bold text-slate-800 flex items-center gap-1">
              <Maximize2 className="w-3.5 h-3.5 text-[#00878a]" />
              Recomendaciones técnicas:
            </span>
            <ul className="list-disc list-inside space-y-1">
              <li>El atributo <code>allowfullscreen</code> permite que los estudiantes expandan el visor 3D a toda pantalla.</li>
              <li>El visor utiliza <strong>WebGL acelerado por GPU</strong>, compatible nativamente en Chrome, Safari, Firefox y Edge tanto en escritorio como en móviles y tablets.</li>
              <li>En WordPress o Blogger, pega el código en un bloque de <strong>«HTML Personalizado»</strong>.</li>
            </ul>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
