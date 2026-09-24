import React from 'react';
import { footerTreatments, footerCompany, footerLegal } from '../data/mockData';

interface FooterProps {
  readonly className?: string;
}

export const Footer: React.FC<FooterProps> = ({ className = '' }) => {
  return (
    <footer className={`bg-primary text-on-primary ${className}`}>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-gutter px-8 py-section-padding max-w-container-max mx-auto">
        {/* Brand Column */}
        <div className="col-span-1 md:col-span-1">
          <div className="flex items-center gap-3 mb-6">
            <img src="https://thinhairgrowthguide.com/wp-content/uploads/2026/08/Thin-Hair-Growth-Guide.png" alt="Hair Restoration Logo" className="h-10 w-auto" />
            <span className="text-headline-md font-headline font-bold text-on-primary">
              Hair Restoration
            </span>
          </div>
          <p className="text-on-primary opacity-70 font-body text-body-md mb-6 leading-relaxed">
            Premium hair restoration guidance and medical excellence for the modern
            man. Regain your look, reclaim your life.
          </p>
          <div className="flex gap-4">
            <a
              href="https://www.youtube.com/@ThinHairGrowthGuide"
              target="_blank"
              rel="noopener noreferrer"
              className="material-symbols-outlined opacity-70 cursor-pointer hover:opacity-100 transition-opacity"
            >
              smart_display
            </a>
            <a
              href="mailto:thinhairgrowthguide@gmail.com"
              className="material-symbols-outlined opacity-70 cursor-pointer hover:opacity-100 transition-opacity"
            >
              mail
            </a>
            <a
              href="https://ca.pinterest.com/thinhairgrowthguide/"
              target="_blank"
              rel="noopener noreferrer"
              className="opacity-70 cursor-pointer hover:opacity-100 transition-opacity"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z"/>
              </svg>
            </a>
          </div>
        </div>

        {/* Treatments */}
        <div>
          <h4 className="text-headline-md font-headline font-semibold text-on-primary mb-6">
            Treatments
          </h4>
          <ul className="space-y-4">
            {footerTreatments.map((item) => (
              <li key={item}>
                <a
                  className="font-headline text-body-md text-on-primary opacity-70 hover:opacity-100 transition-opacity"
                  href="#"
                >
                  {item}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Company */}
        <div>
          <h4 className="text-headline-md font-headline font-semibold text-on-primary mb-6">
            Company
          </h4>
          <ul className="space-y-4">
            {footerCompany.map((item) => (
              <li key={item}>
                <a
                  className="font-headline text-body-md text-on-primary opacity-70 hover:opacity-100 transition-opacity"
                  href="#"
                >
                  {item}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Legal */}
        <div>
          <h4 className="text-headline-md font-headline font-semibold text-on-primary mb-6">
            Legal
          </h4>
          <ul className="space-y-4">
            {footerLegal.map((item) => (
              <li key={item}>
                <a
                  className="font-headline text-body-md text-on-primary opacity-70 hover:opacity-100 transition-opacity"
                  href="#"
                >
                  {item}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10 py-8 px-8 max-w-container-max mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <span className="text-on-primary opacity-70 font-label text-label-sm">
            © 2025 Hair Restoration. All rights reserved.
          </span>
          <div className="flex gap-8">
            <a
              className="text-on-primary opacity-70 font-label text-label-sm hover:opacity-100 transition-opacity"
              href="#"
            >
              Privacy Policy
            </a>
            <a
              className="text-on-primary opacity-70 font-label text-label-sm hover:opacity-100 transition-opacity"
              href="#"
            >
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
