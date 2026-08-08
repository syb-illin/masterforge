import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      "app_title": "MasterForge",
      "app_subtitle": "Browser-based Professional Audio Mastering",
      "upload_title": "Upload Audio",
      "upload_desc": "Drag and drop WAV files, or click to browse",
      "processing": "Processing",
      "done": "Done",
      "error": "Error",
      "idle": "Ready",
      "download": "Download Master",
      "downloading": "Downloading...",
      "settings": "Mastering Profile",
      "profile_default": "Balanced / Streaming (Apple Music, Spotify)",
      "profile_loud": "Aggressive / Club (EDM, Hip-Hop)",
      "profile_dynamic": "Dynamic / Audiophile (Jazz, Classical)",
      "warmth": "Analog Warmth (Harmonic Exciter)",
      "brightness": "Air / Brightness (High Shelf)",
      "intensity": "Limiter Intensity (Transients)",
      "process_btn": "Process All",
      "processing_btn": "Processing...",
      "add_more": "Add More Files",
      "characteristics": "Sonic Characteristics",
      "gain_staging": "Gain Staging & DC Offset",
      "dynamic_eq": "Dynamic M/S EQ",
      "saturation": "Saturation & Excitement",
      "stereo_imaging": "Stereo Imaging",
      "glue_comp": "Glue Comp & True Peak Limiter",
      "eq_curve": "Dynamic M/S EQ Curve",
      "chain_log": "Processing Chain Log",
      "auto_process": "Auto-process on upload",
      "theme_toggle": "Toggle Theme",
      "lang_toggle": "Change Language",
      "integrated_lufs": "Integrated LUFS",
      "lra": "Loudness Range (LRA)",
      "true_peak": "True Peak",
      "dynamic_range": "Dynamic Range",
      "stereo_width": "Stereo Width",
      "ai_artifact": "AI Artifact Prob",
      "before": "Before",
      "after": "After",

      "profile_default_desc": "Target -14 LUFS, True Peak -1.0dB (Spotify, Apple Music)",
      "profile_tiktok_desc": "Aggressive leveling, mono compatibility, punchy presence",
      "profile_youtube_desc": "Target -14 LUFS, optimized for dialogue & music balance",
      "target_14_lufs": "Target -14 LUFS"
    }
  },
  fr: {
    translation: {
      "app_title": "MasterForge",
      "app_subtitle": "Mastering Audio Professionnel sur Navigateur",
      "upload_title": "Importer un fichier audio",
      "upload_desc": "Glissez-déposez des fichiers WAV, ou cliquez pour parcourir",
      "processing": "Traitement en cours",
      "done": "Terminé",
      "error": "Erreur",
      "idle": "Prêt",
      "download": "Télécharger le Master",
      "downloading": "Téléchargement...",
      "settings": "Profil de Mastering",
      "profile_default": "Équilibré / Streaming (Apple Music, Spotify)",
      "profile_loud": "Agressif / Club (EDM, Hip-Hop)",
      "profile_dynamic": "Dynamique / Audiophile (Jazz, Classique)",
      "warmth": "Chaleur Analogique (Excitateur Harmonique)",
      "brightness": "Air / Brillance (High Shelf)",
      "intensity": "Intensité du Limiteur (Transitoires)",
      "process_btn": "Tout traiter",
      "processing_btn": "Traitement...",
      "add_more": "Ajouter des fichiers",
      "characteristics": "Caractéristiques Sonores",
      "gain_staging": "Étagement de gain & Suppression d'Offset DC",
      "dynamic_eq": "EQ M/S Dynamique",
      "saturation": "Saturation & Excitation",
      "stereo_imaging": "Imagerie Stéréo",
      "glue_comp": "Compression Glue & Limiteur True Peak",
      "eq_curve": "Courbe EQ M/S Dynamique",
      "chain_log": "Journal de traitement",
      "auto_process": "Traitement automatique à l'import",
      "theme_toggle": "Changer le thème",
      "lang_toggle": "Changer la langue",
      "integrated_lufs": "LUFS Intégré",
      "lra": "Plage de Sonie (LRA)",
      "true_peak": "True Peak",
      "dynamic_range": "Plage Dynamique",
      "stereo_width": "Largeur Stéréo",
      "ai_artifact": "Prob. d'Artefact IA",
      "before": "Avant",
      "after": "Après",

      "profile_default_desc": "Cible -14 LUFS, True Peak -1.0dB (Spotify, Apple Music)",
      "profile_tiktok_desc": "Nivellement agressif, compatibilité mono, présence percutante",
      "profile_youtube_desc": "Cible -14 LUFS, optimisé pour l'équilibre dialogue/musique",
      "target_14_lufs": "Cible -14 LUFS"
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
