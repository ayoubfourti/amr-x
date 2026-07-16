export const supportedLocales = ["en", "fr", "de", "ar"];

export const translations = {
  en: { languageName: "English", flag: "🇬🇧", direction: "ltr", metadataDescription: "Engineering-stage modular autonomous mobile robot platform with a reusable base, ROS 2 autonomy, digital-twin validation, and operator interfaces.", navigationLabel: "Primary navigation", languageSelector: "Language selector", switchToDark: "Switch to dark mode", switchToLight: "Switch to light mode", cadAlt: "AMR-X modular mobile robot concept illustration" },
  fr: { languageName: "Français", flag: "🇫🇷", direction: "ltr", metadataDescription: "Plateforme de robot mobile autonome modulaire en phase d’ingénierie, avec base réutilisable, autonomie ROS 2, jumeau numérique et interfaces opérateur.", navigationLabel: "Navigation principale", languageSelector: "Sélecteur de langue", switchToDark: "Passer au mode sombre", switchToLight: "Passer au mode clair", cadAlt: "Illustration du concept de robot mobile modulaire AMR-X" },
  de: { languageName: "Deutsch", flag: "🇩🇪", direction: "ltr", metadataDescription: "Modulare autonome mobile Roboterplattform in der Entwicklungsphase mit wiederverwendbarer Basis, ROS 2, digitalem Zwilling und Bedienoberflächen.", navigationLabel: "Hauptnavigation", languageSelector: "Sprachauswahl", switchToDark: "Zum dunklen Modus wechseln", switchToLight: "Zum hellen Modus wechseln", cadAlt: "Konzeptdarstellung des modularen mobilen AMR-X-Roboters" },
  ar: { languageName: "العربية", flag: "🇹🇳", direction: "rtl", metadataDescription: "منصة روبوت متنقل ذاتي ومعياري في مرحلة التطوير الهندسي، تجمع قاعدة قابلة لإعادة الاستخدام وROS 2 والتوأم الرقمي وواجهات التشغيل.", navigationLabel: "التنقل الرئيسي", languageSelector: "اختيار اللغة", switchToDark: "التبديل إلى الوضع الداكن", switchToLight: "التبديل إلى الوضع الفاتح", cadAlt: "رسم توضيحي لمفهوم روبوت AMR-X المتنقل المعياري" },
};

export function localePath(locale) {
  return locale === "en" ? "/" : `/${locale}/`;
}
