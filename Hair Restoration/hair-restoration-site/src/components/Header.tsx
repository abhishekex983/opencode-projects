import React from 'react';
import { navigationLinks } from '../data/mockData';

interface HeaderProps {
  readonly className?: string;
}

export const Header: React.FC<HeaderProps> = ({ className = '' }) => {
  return (
    <nav className={`bg-primary sticky top-0 z-50 shadow-sm ${className}`}>
      <div className="flex justify-between items-center w-full px-8 py-4 max-w-container-max mx-auto">
        <div className="flex items-center gap-4">
          <img src="https://thinhairgrowthguide.com/wp-content/uploads/2026/08/Thin-Hair-Growth-Guide.png" alt="Hair Restoration Logo" className="h-10 w-auto" />
          <span className="text-headline-md font-headline font-bold text-on-primary">
            Hair Restoration
          </span>
        </div>

        <div className="hidden md:flex gap-8 items-center">
          {navigationLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className={`text-label-sm font-headline transition-opacity ${
                link.active
                  ? 'text-on-primary border-b-2 border-crimson-bold pb-1'
                  : 'text-on-primary opacity-80 hover:opacity-100'
              }`}
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-6">
          <a
            href="https://www.youtube.com/@ThinHairGrowthGuide"
            target="_blank"
            rel="noopener noreferrer"
            className="text-on-primary material-symbols-outlined opacity-70 hover:opacity-100 transition-opacity"
          >
            smart_display
          </a>
          <a
            href="https://ca.pinterest.com/thinhairgrowthguide/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-on-primary opacity-70 hover:opacity-100 transition-opacity"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z"/>
            </svg>
          </a>
          <button className="text-on-primary material-symbols-outlined">search</button>
          <button className="bg-crimson-bold text-on-primary px-6 py-2 rounded font-headline text-label-sm transition-transform active:-translate-y-px">
            Consultation
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Header;
