const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const replacements = {
  '>Upload Audio<': '>{t("upload_title")}<',
  '>Drag and drop WAV files, or click to browse<': '>{t("upload_desc")}<',
  'Processing': 'Processing', // dynamic
  '>Done<': '>{t("done")}<',
  '>Error<': '>{t("error")}<',
  '>Ready<': '>{t("idle")}<',
  '>Download Master<': '>{t("download")}<',
  '>Downloading...<': '>{t("downloading")}<',
  '>Mastering Profile<': '>{t("settings")}<',
  '>Balanced / Streaming (Apple Music, Spotify)<': '>{t("profile_default")}<',
  '>Aggressive / Club (EDM, Hip-Hop)<': '>{t("profile_loud")}<',
  '>Dynamic / Audiophile (Jazz, Classical)<': '>{t("profile_dynamic")}<',
  '>Analog Warmth (Harmonic Exciter)<': '>{t("warmth")}<',
  '>Air / Brightness (High Shelf)<': '>{t("brightness")}<',
  '>Limiter Intensity (Transients)<': '>{t("intensity")}<',
  '>Process All<': '>{t("process_btn")}<',
  '>Processing...<': '>{t("processing_btn")}<',
  '>Add More Files<': '>{t("add_more")}<',
  '>Sonic Characteristics<': '>{t("characteristics")}<',
  '>Gain Staging & DC Offset<': '>{t("gain_staging")}<',
  '>Dynamic M/S EQ<': '>{t("dynamic_eq")}<',
  '>Saturation & Excitement<': '>{t("saturation")}<',
  '>Stereo Imaging<': '>{t("stereo_imaging")}<',
  '>Glue Comp & True Peak Limiter<': '>{t("glue_comp")}<',
  '>Dynamic M/S EQ Curve<': '>{t("eq_curve")}<',
  '>Processing Chain Log<': '>{t("chain_log")}<',
  '>Auto-process on upload<': '>{t("auto_process")}<',
  '>Integrated LUFS<': '>{t("integrated_lufs")}<',
  '>Loudness Range (LRA)<': '>{t("lra")}<',
  '>True Peak<': '>{t("true_peak")}<',
  '>Dynamic Range<': '>{t("dynamic_range")}<',
  '>Stereo Width<': '>{t("stereo_width")}<',
  'AI Artifact Prob': "{t('ai_artifact')}",
  '>Before<': '>{t("before")}<',
  '>After<': '>{t("after")}<'
};

for (const [oldStr, newStr] of Object.entries(replacements)) {
  content = content.split(oldStr).join(newStr);
}

fs.writeFileSync('src/App.tsx', content);
