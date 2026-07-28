import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Responsive } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

import { useDashboardStore } from '../../store/useDashboardStore';
import { TREASURY_WIDGETS } from '../../config/treasuryRegistry';
import { INTERACTIVE_WIDGETS } from '../../config/interactiveRegistry';
import { MAX_WIDGETS_PER_TAB } from '../../config/dashboard.config';
import { X, LayoutGrid } from 'lucide-react';

// Merge both registries so the canvas knows how to render any dropped ID
const ALL_WIDGETS = { ...TREASURY_WIDGETS, ...INTERACTIVE_WIDGETS };

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
          transformScale={scale}
          {...props}
        />
      </div>
    </div>
  );
};

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

  const currentSubmenu = useMemo(() => {
    return submenus.find((s) => s.isActive) || submenus.find((s) => s.id === 'insights');
  }, [submenus]);

  const activeTabId = currentSubmenu ? currentSubmenu.id : 'insights';

  const currentLayout = useMemo(() => {
    if (isEditingLayout) {
      return Array.isArray(draftLayout[activeTabId]) ? draftLayout[activeTabId] : [];
    }
    return Array.isArray(savedLayout[activeTabId]) ? savedLayout[activeTabId] : [];
  }, [isEditingLayout, draftLayout, savedLayout, activeTabId]);

  const handleRemoveWidget = (widgetKey) => {
    const updated = currentLayout.filter((item) => item.i !== widgetKey);
    updateDraftLayout(activeTabId, updated);
    saveDraftToProduction(true);
  };

  const handleLayoutChange = (newLayout) => {
    if (ignoreLayoutChangeRef.current) return;
    if (isLoading) return;

    const cleanedLayout = newLayout
      .filter((item) => item.i !== 'dropping' && !item.i.includes('__dropping-elem__'))
      .map((item) => {
        const baseId = item.i.split('-')[0];
        const originalDef = ALL_WIDGETS[baseId]?.layout || ALL_WIDGETS[item.i]?.layout || {};
        return {
          i: item.i,
          x: item.x,
          y: item.y,
          w: item.w,
          h: item.h,
          minW: originalDef.minW || item.minW || 2,
          maxW: originalDef.maxW || item.maxW || 12,
          minH: originalDef.minH || item.minH || 2,
          maxH: originalDef.maxH || item.maxH || 6,
        };
      });

    if (cleanedLayout.length > MAX_WIDGETS_PER_TAB) return;
    updateDraftLayout(activeTabId, cleanedLayout);
  };

  const breakpoints = { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 };
  const cols = { lg: 12, md: 10, sm: 6, xs: 4, xxs: 1 };

  if (isLoading) {
    return (
      <div className="flex-grow p-6 flex flex-col h-full min-h-[600px] gap-6 animate-pulse select-none bg-[#e8dcb8]" />
    );
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
    >
      {currentLayout.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center pointer-events-none z-0">
          <LayoutGrid className="text-[#8b4513]/40 w-16 h-16 stroke-[1] mb-3 animate-pulse" />
          <h3 className="font-serif text-sm font-bold text-[#4b2c20] uppercase tracking-wider">
            Empty Workspace Grid
          </h3>
          <p className="text-xs text-[#5d4037] max-w-sm mt-1 leading-normal font-serif">
            {isEditingLayout
              ? "Click the '+' icon in the sidebar manifest to deploy widgets onto this canvas."
              : "Reforge layout in Workspace Configs to deploy visual analytical widgets."}
          </p>
        </div>
      )}

      <div className={`flex-1 w-full ${isEditingLayout ? 'border-[2px] border-dashed border-[#8b4513]/40 rounded-xl p-2 h-full min-h-[600px] relative z-10' : 'h-full min-h-[600px] relative z-10'}`}>
        <ResponsiveGridLayout
          key={`${activeTabId}-${currentLayout.length}`}
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
          draggableCancel=".cancel-drag"
          onLayoutChange={handleLayoutChange}
          onDragStop={() => saveDraftToProduction(true)}
          onResizeStop={() => saveDraftToProduction(true)}
          margin={[16, 16]}
          containerPadding={[0, 0]}
        >
          {currentLayout.map((item) => {
            const baseId = item.i.split('-')[0];
            const widget = ALL_WIDGETS[baseId] || ALL_WIDGETS[item.i];

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
                      e.preventDefault();
                      e.stopPropagation();
                      handleRemoveWidget(item.i);
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    className="cancel-drag absolute top-2.5 right-2.5 z-10 p-1.5 rounded-full bg-[#4b2c20] border border-[#2a1711] text-[#f4e4bc] hover:bg-[#8b4513] hover:scale-105 shadow-md cursor-pointer pointer-events-auto transition-all"
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