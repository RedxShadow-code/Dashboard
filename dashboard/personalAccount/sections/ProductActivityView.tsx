import React from 'react';
import { ago } from '../utils';

interface ProductActivityViewProps {
  logs?: Array<{ title: string; time?: string; ts?: number }>;
}

export const ProductActivityView: React.FC<ProductActivityViewProps> = ({ logs = [] }) => {
  return (
    <div className="space-y-3">
      {logs.length ? (
        <div className="divide-y divide-[var(--line)]">
          {logs.map((log, idx) => (
            <div key={idx} className="py-2.5 flex items-center justify-between text-sm">
              <span className="font-semibold text-[var(--fg)]">{log.title}</span>
              <small className="text-xs text-[var(--mut2)]">
                {log.time || (log.ts ? ago(log.ts) : 'Recently')}
              </small>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-[var(--mut2)] py-4 text-center">
          No product logs recorded yet.
        </p>
      )}
    </div>
  );
};

export default ProductActivityView;
