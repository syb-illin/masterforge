const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const stateHookStr = "const [expandedEq, setExpandedEq] = useState<Record<string, boolean>>({});";
const newStateHooks = `const [expandedEq, setExpandedEq] = useState<Record<string, boolean>>({});
  const [referenceFile, setReferenceFile] = useState<{name: string, stats: any} | null>(null);
  const refInputRef = useRef<HTMLInputElement>(null);
  const [isAnalyzingRef, setIsAnalyzingRef] = useState(false);`;

content = content.replace(stateHookStr, newStateHooks);

const importStr = "import { processAudio } from './lib/audio';";
const newImportStr = "import { processAudio, getReferenceTargets } from './lib/audio';";

content = content.replace(importStr, newImportStr);

fs.writeFileSync('src/App.tsx', content);
