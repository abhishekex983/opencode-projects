import React from 'react';
import { BeforeAfterSlider } from './BeforeAfterSlider';
import { heroBeforeAfter } from '../data/mockData';

interface HeroProps {
  readonly className?: string;
}

export const Hero: React.FC<HeroProps> = ({ className = '' }) => {
  return (
    <section className={`relative min-h-[80dvh] flex items-center overflow-hidden bg-primary ${className}`}>
      <div className="relative z-10 max-w-container-max mx-auto px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left: Text Content */}
          <div className="max-w-2xl">
            <h1 className="text-headline-xl font-headline font-bold text-on-primary mb-6 leading-tight">
              Restore Your<br />Confidence
            </h1>
            <p className="text-body-lg font-body text-on-primary-container mb-10 max-w-lg">
              Expert hair restoration solutions backed by science. Discover tailored
              treatments designed to revitalize your appearance and self-esteem.
            </p>
            <button className="bg-crimson-bold text-on-primary px-8 py-4 text-headline-md font-headline rounded-lg shadow-lg active:-translate-y-px transition-transform">
              Read Blogs
            </button>
          </div>

          {/* Right: Before/After Slider */}
          <div className="hidden lg:block">
            <BeforeAfterSlider
              beforeUrl={heroBeforeAfter.beforeUrl}
              afterUrl={heroBeforeAfter.afterUrl}
              beforeAlt={heroBeforeAfter.beforeAlt}
              afterAlt={heroBeforeAfter.afterAlt}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
