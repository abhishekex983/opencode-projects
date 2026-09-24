import React from 'react';
import { latestArticles } from '../data/mockData';

interface LatestInsightsProps {
  readonly className?: string;
}

export const LatestInsights: React.FC<LatestInsightsProps> = ({ className = '' }) => {
  return (
    <section className={`py-section-padding bg-surface-container-low ${className}`}>
      <div className="max-w-container-max mx-auto px-8">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2 className="text-headline-lg font-headline font-bold text-primary mb-2">
              Latest Insights
            </h2>
            <p className="text-muted-steel font-body text-body-md">
              Stay updated with the latest research and restoration tips.
            </p>
          </div>
            <a
            className="text-crimson-bold font-label text-label-sm flex items-center gap-2 hover:underline"
            href="https://thinhairgrowthguide.com/read-blogs/"
          >
            View All Posts
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
          {latestArticles.map((article) => (
            <div
              key={article.title}
              className="bg-canvas-white rounded-xl overflow-hidden soft-shadow transition-shadow hover:shadow-lg"
            >
              <div className="aspect-video relative overflow-hidden">
                <img
                  className="w-full h-full object-cover"
                  src={article.imageUrl}
                  alt={article.title}
                />
              </div>
              <div className="p-8">
                <span className="text-crimson-bold font-label text-label-sm mb-3 block">
                  {article.category}
                </span>
                <h3 className="text-headline-md font-headline font-semibold text-primary mb-4">
                  {article.title}
                </h3>
                <div className="flex justify-between items-center">
                  <span className="text-muted-steel font-label text-label-sm">{article.date}</span>
                  <span className="material-symbols-outlined text-primary">bookmark</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LatestInsights;
