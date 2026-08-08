const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const headerOld = `          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-500 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.3)]">
                <Sliders className="text-white w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">MasterForge</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Neural Audio Restoration & Mastering Toolkit</p>
              </div>
            </div>
            <div className="text-xs font-mono text-gray-500 bg-white dark:bg-gray-900 px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-800">
              v{pkg.version}
            </div>
          </div>`;

const headerNew = `          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-500 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.3)]">
                <Sliders className="text-white w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">{t('app_title')}</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">{t('app_subtitle')}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => {
                  const newLang = i18n.language === 'en' ? 'fr' : 'en';
                  i18n.changeLanguage(newLang);
                }}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-indigo-500 transition-colors"
                aria-label={t('lang_toggle')}
                title={t('lang_toggle')}
              >
                <Globe className="w-5 h-5" />
              </button>
              <button 
                onClick={toggleTheme}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-indigo-500 transition-colors"
                aria-label={t('theme_toggle')}
                title={t('theme_toggle')}
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <div className="text-xs font-mono text-gray-500 bg-white dark:bg-gray-900 px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-800">
                v{pkg.version}
              </div>
            </div>
          </div>`;

content = content.replace(headerOld, headerNew);
fs.writeFileSync('src/App.tsx', content);
