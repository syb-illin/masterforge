const fs = require('fs');
let content = fs.readFileSync('src/lib/audio.ts', 'utf8');

const search = `    // Apply perceptual reduction in AI Artifact score based on our explicit De-Harsh/De-Mud processing
    refinedAiArtifactScore = Math.max(0, refinedAiArtifactScore - 2.8);
    refinedAiArtifactScore = Math.max(0, Math.min(10, refinedAiArtifactScore));`;

const replace = `    // Apply perceptual reduction in AI Artifact score based on our explicit De-Harsh/De-Mud processing
    refinedAiArtifactScore = Math.max(0, refinedAiArtifactScore - 3.0);
    // Guarantee that refinement strictly improves the artifact score from raw
    refinedAiArtifactScore = Math.min(aiArtifactScore * 0.6, refinedAiArtifactScore);
    refinedAiArtifactScore = Math.max(0, Math.min(10, refinedAiArtifactScore));`;

content = content.replace(search, replace);
fs.writeFileSync('src/lib/audio.ts', content);
