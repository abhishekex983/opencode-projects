import React from 'react';
import { categoryTabs } from '../data/mockData';

interface CategoryNavProps {
  readonly className?: string;
}

export const CategoryNav: React.FC<CategoryNavProps> = ({ className = '' }) => {
  return (
    <section className={`py-12 bg-canvas-white border-b border-whisper-border ${className}`}>
      <div className="max-w-container-max mx-auto px-8 overflow-x-auto">
        <div className="flex gap-4 min-w-max pb-2">
          {categoryTabs.map((tab) => (
            <button
              key={tab.label}
              className={`px-6 py-2 rounded-full border font-headline text-label-sm transition-colors ${
                tab.active
                  ? 'border-crimson-bold bg-crimson-bold text-on-primary'
                  : 'border-whisper-border text-charcoal-ink hover:border-crimson-bold hover:text-crimson-bold'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoryNav;
