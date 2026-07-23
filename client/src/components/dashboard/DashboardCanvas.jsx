import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Responsive } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

import { useDashboardStore } from '../../store/useDashboardStore';
import { TREASURY_WIDGETS } from './treasuryRegistry';
import { MAX_WIDGETS_PER_TAB } from '../../config/dashboard.config';
import { X, LayoutGrid } from 'lucide-react';

const ResponsiveGridLayout = (props) => {
  const [scale, setScale] = useState(1);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      const newWidth = entries[0].contentRect.width;
      if (newWidth > 0) {
        const calculatedScale = Math.min(newWidth / 1200, 1.0);
        setScale(calculatedScale);
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="w-full h-full relative min-h-[600px] overflow-hidden">
      <div 
        style={{ 
          transform: `scale(${scale})`, 
          transformOrigin: 'top left', 
          width: '1200px',
          height: `${100 / scale}%` 
        }}
        className="absolute top-0 left-0"
      >
        <Responsive 
          width={1200} 
          style={{ minHeight: '600px', minWidth: '100%', height: '100%' }} 
          {...props} 
        />
      </div>
    </div>
  );
};

// Parchment-themed skeleton for loading states
function DashboardSkeleton() {
  return (
    <div 
      className="flex-grow p-6 flex flex-col h-full min-h-[600px] gap-6 animate-pulse select-none"
      style={{ backgroundColor: '#e8dcb8' }}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 flex-grow">
        {[1, 2, 3].map((idx) => (
          <div
            key={idx}
            className="rounded-xl border border-[#8b4513]/20 bg-[#faf4e5]/60 p-4 flex flex-col justify-between h-[240px]"
          >
            <div className="flex items-center justify-between border-b border-[#8b4513]/10 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#8b4513]/30 animate-ping" />
                <div className="h-3 w-28 bg-[#d1c0a8] rounded" />
              </div>
              <div className="h-4 w-12 bg-[#d1c0a8] rounded" />
            </div>
            <div className="flex-grow flex items-end gap-3 mt-4 mb-2 justify-center px-4">
              <div className="h-[25%] w-full bg-[#d1c0a8]/50 rounded border-t border-[#8b4513]/10" />
              <div className="h-[45%] w-full bg-[#d1c0a8]/50 rounded border-t border-[#8b4513]/10" />
              <div className="h-[60%] w-full bg-[#d1c0a8]/50 rounded border-t border-[#8b4513]/10" />
              <div className="h-[75%] w-full bg-[#d1c0a8]/50 rounded border-t border-[#8b4513]/10" />
              <div className="h-[40%] w-full bg-[#d1c0a8]/50 rounded border-t border-[#8b4513]/10" />
            </div>
            <div className="h-2 w-20 bg-[#d1c0a8]/80 rounded mt-2" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DashboardCanvas() {
  const {
    isEditingLayout,
    savedLayout,
    draftLayout,
    submenus,
    updateDraftLayout,
    isLoading,
    saveDraftToProduction,
  } = useDashboardStore();

  const ignoreLayoutChangeRef = useRef(false);

  const activeTab = submenus.find((sub) => sub.isActive);
  const activeTabId = activeTab ? activeTab.id : 'tab_1';

  const currentLayout = useMemo(() => {
    return isEditingLayout
      ? draftLayout[activeTabId] || []
      : savedLayout[activeTabId] || [];
  }, [isEditingLayout, draftLayout, savedLayout, activeTabId]);

  const handleRemoveWidget = (widgetKey) => {
    const updated = currentLayout.filter((item) => item.i !== widgetKey);
    updateDraftLayout(activeTabId, updated);
  };

  const handleLayoutChange = (newLayout) => {
    if (ignoreLayoutChangeRef.current) return;
    if (isLoading) return;

    const cleanedLayout = newLayout
      .filter((item) => item.i !== 'dropping' && !item.i.includes('__dropping-elem__'))
      .map((item) => {
        const baseId = item.i.split('-')[0];
        const originalDef = TREASURY_WIDGETS[baseId]?.layout || {};
        return {
          i: item.i,
          x: item.x,
          y: item.y,
          w: item.w,
          h: item.h,
          minW: originalDef.minW || item.minW,
          maxW: originalDef.maxW || item.maxW,
          minH: originalDef.minH || item.minH,
          maxH: originalDef.maxH || item.maxH,
        };
      });

    if (cleanedLayout.length > MAX_WIDGETS_PER_TAB) return;
    updateDraftLayout(activeTabId, cleanedLayout);
  };

  const breakpoints = { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 };
  const cols = { lg: 12, md: 10, sm: 6, xs: 4, xxs: 1 };

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div
      className="flex-1 p-6 relative overflow-y-auto flex flex-col scrollbar-thin scrollbar-thumb-[#8b4513]/60 scrollbar-track-[#e8dcb8]"
      style={{
        backgroundColor: '#e8dcb8',
        backgroundImage: `
          radial-gradient(circle at 50% 50%, transparent 30%, rgba(139, 69, 19, 0.15) 80%, rgba(75, 44, 32, 0.4) 100%),
          linear-gradient(to right, rgba(75, 44, 32, 0.15) 0%, transparent 4%, transparent 96%, rgba(75, 44, 32, 0.15) 100%)
        `,
        boxShadow: 'inset 0 0 60px rgba(75, 44, 32, 0.4), inset 0 0 15px rgba(0,0,0,0.3)'
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
      }}
      onDragEnter={(e) => {
        e.preventDefault();
      }}
    >
      {currentLayout.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center pointer-events-none z-0">
          <LayoutGrid className="text-[#8b4513]/40 w-16 h-16 stroke-[1] mb-3 animate-pulse" />
          <h3 className="font-serif text-sm font-bold text-[#4b2c20] uppercase tracking-wider">
            Empty Workspace Grid
          </h3>
          <p className="text-xs text-[#5d4037] max-w-sm mt-1 leading-normal font-serif">
            {isEditingLayout
              ? "Drag and drop components from the manifest on the right onto this canvas to place widgets."
              : "Reforge layout in Workspace Configs to deploy visual analytical widgets."}
          </p>
        </div>
      )}

      <div className={`flex-1 w-full ${isEditingLayout ? 'border-[2px] border-dashed border-[#8b4513]/40 rounded-xl p-2 h-full min-h-[600px] relative z-10' : 'h-full min-h-[600px] relative z-10'}`}>
        <ResponsiveGridLayout
          className="layout"
          layouts={{
            lg: currentLayout,
            md: currentLayout,
            sm: currentLayout,
            xs: currentLayout,
            xxs: currentLayout
          }}
          breakpoints={breakpoints}
          cols={cols}
          rowHeight={80}
          isDraggable={true}
          isResizable={true}
          isDroppable={false}
          onLayoutChange={handleLayoutChange}
          onDragStop={() => saveDraftToProduction(true)}
          onResizeStop={() => saveDraftToProduction(true)}
          margin={[16, 16]}
          containerPadding={[0, 0]}
        >
          {currentLayout.map((item) => {
            const baseId = item.i.split('-')[0];
            const widget = TREASURY_WIDGETS[baseId];

            if (!widget) return <div key={item.i} className="hidden" />;

            const WidgetComponent = widget.component;

            return (
              <div
                key={item.i}
                className={`group relative rounded-xl overflow-hidden transition-all duration-200 flex flex-col ${isEditingLayout
                    ? 'border-2 border-[#8b4513]/50 hover:border-[#5d4037] hover:shadow-[0_0_15px_rgba(139,69,19,0.2)] bg-[#faf4e5]/90 cursor-grab active:cursor-grabbing'
                    : 'bg-[#faf4e5] border border-[#8b4513]/30 shadow-[0_8px_15px_rgba(75,44,32,0.1)]'
                  }`}
              >
                <div className={`w-full h-full ${isEditingLayout ? 'pointer-events-none select-none' : ''}`}>
                  <WidgetComponent />
                </div>

                {isEditingLayout && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveWidget(item.i);
                    }}
                    className="absolute top-2.5 right-2.5 z-10 p-1.5 rounded-full bg-[#4b2c20] border border-[#2a1711] text-[#f4e4bc] hover:bg-[#8b4513] hover:scale-105 shadow-md cursor-pointer pointer-events-auto transition-all"
                    title="Dismantle Structure"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            );
          })}
        </ResponsiveGridLayout>
      </div>
    </div>
  );
}