const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const initOld = `export default function App() {
  const [files, setFiles] = useState<AudioFile[]>([]);`;

const initNew = `export default function App() {
  const { t, i18n } = useTranslation();
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    }
    return 'dark';
  });
  
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const [files, setFiles] = useState<AudioFile[]>([]);`;

content = content.replace(initOld, initNew);
fs.writeFileSync('src/App.tsx', content);
