import React from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { CategoryNav } from './components/CategoryNav';
import { FeaturedArticles } from './components/FeaturedArticles';
import { LatestInsights } from './components/LatestInsights';
import { Footer } from './components/Footer';

const App: React.FC = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <Hero />
        <CategoryNav />
        <FeaturedArticles />
        <LatestInsights />
      </main>
      <Footer />
    </div>
  );
};

export default App;
