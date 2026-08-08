const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const oldFunc = "  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {";
const newFunc = `  const handleReferenceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setIsAnalyzingRef(true);
      try {
        const stats = await getReferenceTargets(file);
        setReferenceFile({ name: file.name, stats });
      } catch (err) {
        console.error("Failed to analyze reference track:", err);
      } finally {
        setIsAnalyzingRef(false);
      }
    }
    if (refInputRef.current) refInputRef.current.value = '';
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {`;

content = content.replace(oldFunc, newFunc);

fs.writeFileSync('src/App.tsx', content);
