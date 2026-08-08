import React from 'react';
import { Sliders } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import pkg from '../../../package.json';

export function Header() {
  const { t, i18n } = useTranslation();

  return (
    <header className="flex flex-col mb-12 py-4 border-b border-gray-800">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-500 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.3)]">
            <Sliders className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t('app_title')}</h1>
            <p className="text-sm text-gray-400 font-medium">{t('app_subtitle')}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => {
              const newLang = i18n.language === 'en' ? 'fr' : 'en';
              i18n.changeLanguage(newLang);
            }}
            className="p-2 text-gray-400 hover:text-indigo-500 transition-colors"
            aria-label={t('lang_toggle')}
            title={t('lang_toggle')}
          >
            <span className="font-bold text-sm tracking-wide">{i18n.language === 'en' ? 'FR' : 'EN'}</span>
          </button>
          <div className="text-xs font-mono text-gray-500 bg-gray-900 px-3 py-1.5 rounded-full border border-gray-800">
            v{pkg.version}
          </div>
        </div>
      </div>
    </header>
  );
}
