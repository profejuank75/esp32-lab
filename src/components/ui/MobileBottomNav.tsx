import React from 'react';
import { Box, Zap, Code2, ListOrdered } from 'lucide-react';
import { AppTab } from './Topbar';

interface MobileBottomNavProps {
  activeTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onSelectTab,
}) => {
  const tabs = [
    { id: 'ANATOMY' as AppTab, label: 'Anatomía', icon: Box },
    { id: 'SIMULATOR' as AppTab, label: 'Simulador', icon: Zap },
    { id: 'IDE' as AppTab, label: 'Código IDE', icon: Code2 },
    { id: 'PINOUT' as AppTab, label: 'Pinout', icon: ListOrdered },
  ];

  return (
    <nav
      aria-label="Navegación móvil"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 border-t border-slate-200/90 shadow-lg backdrop-blur-md select-none"
    >
      <div className="grid grid-cols-4 items-center h-16 max-w-lg mx-auto px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`min-h-[48px] flex flex-col items-center justify-center gap-1 transition-all rounded-xl py-1 ${
                isActive
                  ? 'text-[#00878a] font-bold'
                  : 'text-slate-500 hover:text-slate-800 font-medium'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                  isActive ? 'bg-[#00878a]/15 text-[#00878a]' : 'text-slate-500'
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-[10px] tracking-tight leading-none">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
