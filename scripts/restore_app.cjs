const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /return \(\s*<FileUploader/m;
const replacement = `return (
    <div className="min-h-screen bg-[#0C0C0E] text-gray-100 p-6 font-sans">
      <div className="max-w-4xl mx-auto">
        <Header />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <FileUploader`;

content = content.replace(regex, replacement);

fs.writeFileSync('src/App.tsx', content);
