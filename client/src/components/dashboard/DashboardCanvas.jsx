import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Responsive } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

import { useDashboardStore } from '../../store/useDashboardStore';
import { WIDGET_REGISTRY } from './widgetRegistry';
import { MAX_WIDGETS_PER_TAB } from '../../config/dashboard.config';
import { X, LayoutGrid } from 'lucide-react';

// Custom modern wrapper that replaces the buggy 'WidthProvider'
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
      {/* THE FIX: Stretch the grid naturally so the forbidden dead zone disappears! */}
      <Responsive width={width} style={{ minHeight: '600px', minWidth: '100%', height: '100%' }} {...props} />
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
  } = useDashboardStore();

  const ignoreLayoutChangeRef = useRef(false);

  // Determine current active workspace tab
  const activeTab = submenus.find((sub) => sub.isActive);
  const activeTabId = activeTab ? activeTab.id : 'tab_1';

  // Pull correct active data layout
  const currentLayout = useMemo(() => {
    return isEditingLayout
      ? draftLayout[activeTabId] || []
      : savedLayout[activeTabId] || [];
  }, [isEditingLayout, draftLayout, savedLayout, activeTabId]);

  // Remove a widget from the layout configuration
  const handleRemoveWidget = (widgetKey) => {
    const updated = currentLayout.filter((item) => item.i !== widgetKey);
    updateDraftLayout(activeTabId, updated);
  };



  // Sync changes safely with the draft store
  const handleLayoutChange = (newLayout) => {
    if (!isEditingLayout) return;
    if (ignoreLayoutChangeRef.current) return;

    const cleanedLayout = newLayout
      // Scrub any ghost dropping elements RGL leaves behind
      .filter((item) => item.i !== 'dropping' && !item.i.includes('__dropping-elem__'))
      .map((item) => {
        // Look up limits using the base ID
        const baseId = item.i.split('-')[0];
        const originalDef = WIDGET_REGISTRY[baseId]?.layout || {};
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

  // Layout responsiveness configuration breakpoints
  const breakpoints = { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 };
  const cols = { lg: 12, md: 10, sm: 6, xs: 4, xxs: 1 };

  return (
    <div className="flex-1 bg-stone-900/30 p-6 relative overflow-y-auto flex flex-col scrollbar-thin scrollbar-thumb-amber-950 scrollbar-track-stone-950">
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
            // THE FIX: Strip the timestamp suffix to locate the correct chart in the registry
            const baseId = item.i.split('-')[0];
            const widget = WIDGET_REGISTRY[baseId];
            
            if (!widget) return <div key={item.i} className="hidden" />;

            const WidgetComponent = widget.component;

            return (
              <div
                key={item.i}
                className={`group relative rounded-xl overflow-hidden transition-shadow duration-200 ${
                  isEditingLayout
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