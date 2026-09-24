import React from 'react';
import { featuredArticle, sideArticles } from '../data/mockData';

interface FeaturedArticlesProps {
  readonly className?: string;
}

export const FeaturedArticles: React.FC<FeaturedArticlesProps> = ({ className = '' }) => {
  return (
    <section className={`py-section-padding px-8 max-w-container-max mx-auto ${className}`}>
      <div className="flex items-center gap-4 mb-12">
        <span className="text-crimson-bold font-label text-label-sm tracking-widest uppercase">
          Must Read
        </span>
        <div className="h-px bg-whisper-border flex-grow" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter">
        {/* Large Card */}
        <article className="md:col-span-8 group cursor-pointer">
          <div className="relative overflow-hidden rounded-xl aspect-[16/10] mb-6">
            <img
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              src={featuredArticle.imageUrl}
              alt={featuredArticle.title}
            />
            <span className="absolute top-4 left-4 bg-crimson-bold text-on-primary font-label text-label-sm px-3 py-1 rounded">
              {featuredArticle.category}
            </span>
          </div>
          <div>
            <div className="flex items-center gap-4 mb-4">
              <span className="text-muted-steel font-label text-label-sm">{featuredArticle.date}</span>
              <span className="text-muted-steel font-label text-label-sm">•</span>
              <span className="text-muted-steel font-label text-label-sm">{featuredArticle.author}</span>
            </div>
            <h2 className="text-headline-lg font-headline font-bold text-primary group-hover:text-crimson-bold transition-colors mb-4">
              {featuredArticle.title}
            </h2>
            <p className="text-muted-steel font-body text-body-md max-w-2xl">
              {featuredArticle.description}
            </p>
          </div>
        </article>

        {/* Stacked Side Cards */}
        <div className="md:col-span-4 flex flex-col gap-10">
          {sideArticles.map((article) => (
            <article key={article.title} className="group cursor-pointer">
              <div className="relative overflow-hidden rounded-xl aspect-[4/3] mb-4">
                <img
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  src={article.imageUrl}
                  alt={article.title}
                />
              </div>
              <span className="text-crimson-bold font-label text-label-sm block mb-2">
                {article.category}
              </span>
              <h3 className="text-headline-md font-headline font-semibold text-primary group-hover:text-crimson-bold transition-colors">
                {article.title}
              </h3>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedArticles;
