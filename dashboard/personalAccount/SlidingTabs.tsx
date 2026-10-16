import React, { useRef, useEffect, useState, useCallback } from 'react';

export interface TabItem {
  id: string;
  label: string;
  badge?: number | string;
  icon?: React.ReactNode;
  isDanger?: boolean;
}

interface SlidingTabsProps {
  tabs: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
  orientation?: 'horizontal' | 'vertical';
  hoverEnabled?: boolean;
  hoverDelay?: number;
  className?: string;
}

export const SlidingTabs: React.FC<SlidingTabsProps> = ({
  tabs,
  activeId,
  onChange,
  orientation = 'horizontal',
  hoverEnabled = true,
  hoverDelay = 150,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const hoverTimerRef = useRef<any>(null);
  const [indicatorStyle, setIndicatorStyle] = useState<React.CSSProperties>({
    width: 0,
    height: 0,
    transform: 'translate(0px, 0px)',
    opacity: 0,
  });
  const [isReady, setIsReady] = useState(false);

  const isVertical = orientation === 'vertical';

  const updateIndicator = useCallback(() => {
    if (!containerRef.current) return;
    const activeBtn = containerRef.current.querySelector(
      `button[data-tab-id="${activeId}"]`
    ) as HTMLElement | null;

    if (!activeBtn) return;

    setIndicatorStyle({
      width: activeBtn.offsetWidth,
      height: activeBtn.offsetHeight,
      transform: `translate(${activeBtn.offsetLeft}px, ${activeBtn.offsetTop}px)`,
      opacity: 1,
    });
    setIsReady(true);
  }, [activeId]);

  useEffect(() => {
    updateIndicator();
    const handleResize = () => updateIndicator();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [updateIndicator]);

  const handlePointerEnter = (tabId: string) => {
    if (!hoverEnabled || tabId === activeId) return;
    clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(() => {
      onChange(tabId);
    }, hoverDelay);
  };

  const handlePointerLeave = () => {
    clearTimeout(hoverTimerRef.current);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const keys = isVertical
      ? { ArrowDown: 1, ArrowUp: -1 }
      : { ArrowRight: 1, ArrowLeft: -1 };

    const dir = (keys as any)[e.key];
    if (dir !== undefined) {
      e.preventDefault();
      const currentIndex = tabs.findIndex((t) => t.id === activeId);
      const nextIndex = (currentIndex + dir + tabs.length) % tabs.length;
      onChange(tabs[nextIndex].id);
    } else if (e.key === 'Home') {
      e.preventDefault();
      onChange(tabs[0].id);
    } else if (e.key === 'End') {
      e.preventDefault();
      onChange(tabs[tabs.length - 1].id);
    }
  };

  return (
    <div
      ref={containerRef}
      role="tablist"
      aria-orientation={orientation}
      onKeyDown={handleKeyDown}
      className={`relative p-1 bg-[var(--panel)] border border-[var(--line)] rounded-2xl flex ${
        isVertical ? 'flex-col w-full' : 'inline-flex flex-row max-w-full overflow-x-auto'
      } gap-1 ${className}`}
    >
      {/* Animated Sliding Background Indicator */}
      <div
        className={`absolute z-0 top-0 left-0 rounded-xl bg-[var(--raised2)] border border-[var(--line)] pointer-events-none ${
          isVertical ? 'border-l-2 border-l-[var(--brand)]' : 'border-b-2 border-b-[var(--brand)]'
        } ${isReady ? 'transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)]' : ''}`}
        style={indicatorStyle}
      />

      {/* Tab Buttons */}
      {tabs.map((tab) => {
        const isActive = tab.id === activeId;
        return (
          <button
            key={tab.id}
            role="tab"
            data-tab-id={tab.id}
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            onClick={() => {
              clearTimeout(hoverTimerRef.current);
              onChange(tab.id);
            }}
            onPointerEnter={() => handlePointerEnter(tab.id)}
            onPointerLeave={handlePointerLeave}
            className={`relative z-10 flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] ${
              tab.isDanger ? 'text-[var(--bad)]' : ''
            } ${
              isActive
                ? 'text-[var(--fg)] font-bold'
                : 'text-[var(--mut)] hover:text-[var(--fg)]'
            }`}
          >
            {tab.icon && <span className="flex-shrink-0">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.badge !== undefined && tab.badge !== 0 && (
              <span className="bg-[var(--brand)] text-white text-[11px] font-bold rounded-full px-2 py-0.5 leading-none">
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default SlidingTabs;
