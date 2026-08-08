const fs = require('fs');
let content = fs.readFileSync('src/setupTests.ts', 'utf8');

content = content.replace(
  '  public length: number;\nclass MockOfflineAudioContext extends MockAudioContext {\n  constructor(channels, length, sampleRate) {',
  'class MockOfflineAudioContext extends MockAudioContext {\n  public length: number;\n  constructor(channels: any, length: any, sampleRate: any) {'
);

fs.writeFileSync('src/setupTests.ts', content);
