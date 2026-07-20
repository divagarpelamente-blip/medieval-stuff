import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Responsive } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

import { useDashboardStore } from '../../store/useDashboardStore';
import { TREASURY_WIDGETS } from './treasuryRegistry';
import { MAX_WIDGETS_PER_TAB } from '../../config/dashboard.config';
import { X, LayoutGrid } from 'lucide-react';

// Custom wrapper that manages responsive dimensions
const ResponsiveGridLayout = (props) => {
  const [width, setWidth] = useState(1200);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      const newWidth = entries[0].contentRect.width;
      if (newWidth > 0) setWidth(newWidth);
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="w-full h-full relative min-h-[600px]">
      <Responsive width={width} style={{ minHeight: '600px', minWidth: '100%', height: '100%' }} {...props} />
    </div>
  );
};

// High-fidelity dark fantasy skeleton grid displayed during database hydration
function DashboardSkeleton() {
  return (
    <div className="flex-grow bg-stone-900/30 p-6 flex flex-col h-full min-h-[600px] gap-6 animate-pulse select-none">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 flex-grow">
        {[1, 2, 3].map((idx) => (
          <div
            key={idx}
            className="rounded-xl border border-amber-900/10 bg-stone-950/40 p-4 flex flex-col justify-between h-[240px]"
          >
            {/* Header Skeleton */}
            <div className="flex items-center justify-between border-b border-amber-900/10 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-900/40 animate-ping" />
                <div className="h-3 w-28 bg-stone-800 rounded" />
              </div>
              <div className="h-4 w-12 bg-stone-800/85 rounded" />
            </div>
            {/* Simulated Line Chart / Metric Plot */}
            <div className="flex-grow flex items-end gap-3 mt-4 mb-2 justify-center px-4">
              <div className="h-[25%] w-full bg-stone-900/60 rounded border-t border-amber-900/10" />
              <div className="h-[45%] w-full bg-stone-900/60 rounded border-t border-amber-900/10" />
              <div className="h-[60%] w-full bg-stone-900/60 rounded border-t border-amber-900/10" />
              <div className="h-[75%] w-full bg-stone-900/60 rounded border-t border-amber-900/10" />
              <div className="h-[40%] w-full bg-stone-900/60 rounded border-t border-amber-900/10" />
            </div>
            {/* Card Footer */}
            <div className="h-2 w-20 bg-stone-800/60 rounded mt-2" />
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
    if (!isEditingLayout) return;
    if (ignoreLayoutChangeRef.current) return;

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

  // Render medieval loading simulation skeleton during active hydration cycles
  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div
      className="flex-1 bg-stone-900/30 p-6 relative overflow-y-auto flex flex-col scrollbar-thin scrollbar-thumb-amber-950 scrollbar-track-stone-950"
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
          <LayoutGrid className="text-stone-700 w-16 h-16 stroke-[1] mb-3 animate-pulse" />
          <h3 className="font-serif text-sm font-bold text-stone-400 uppercase tracking-wider">
            Empty Workspace Grid
          </h3>
          <p className="text-xs text-stone-600 max-w-sm mt-1 leading-normal">
            {isEditingLayout
              ? "Drag and drop components from the manifest on the right onto this canvas to place widgets."
              : "Reforge layout in Workspace Configs to deploy visual analytical widgets."}
          </p>
        </div>
      )}

      <div className={`flex-1 w-full ${isEditingLayout ? 'border border-dashed border-amber-500/20 rounded-xl p-2 h-full min-h-[600px] relative z-10' : 'h-full min-h-[600px] relative z-10'}`}>
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
          isDraggable={isEditingLayout}
          isResizable={isEditingLayout}
          isDroppable={false}
          onLayoutChange={handleLayoutChange}
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
                className={`group relative rounded-xl overflow-hidden transition-shadow duration-200 ${isEditingLayout
                    ? 'border-2 border-amber-500/30 hover:border-amber-500 hover:shadow-[0_0_15px_rgba(245,158,11,0.15)] bg-stone-950/80 cursor-grab active:cursor-grabbing'
                    : 'bg-transparent'
                  }`}
              >
                {/* Embedded Active Widget */}
                <div className="w-full h-full pointer-events-none select-none">
                  <WidgetComponent />
                </div>

                {/* Edit Controls HUD Overlay */}
                {isEditingLayout && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveWidget(item.i);
                    }}
                    className="absolute top-2.5 right-2.5 z-10 p-1.5 rounded-full bg-rose-950/80 border border-rose-900/60 text-rose-400 hover:text-stone-100 hover:bg-rose-900 hover:scale-105 shadow-md cursor-pointer pointer-events-auto transition-all"
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