import { notFound } from "next/navigation";
import { supportedLocales, translations } from "../../lib/i18n";
import ThemeScript from "../../components/ThemeScript";
import "../globals.css";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const text = translations[locale];

  if (!text) return {};

  return {
    title: `AMR-X — Modular Autonomous Mobile Robot Platform · ${text.languageName}`,
    description: text.metadataDescription,
    icons: { icon: "/icon.svg" },
    alternates: {
      languages: {
        en: "/",
        fr: "/fr/",
        de: "/de/",
        ar: "/ar/",
      },
    },
  };
}

export default async function LocaleLayout({ children, params }) {
  const { locale } = await params;
  if (!supportedLocales.includes(locale) || locale === "en") notFound();

  return (
    <html lang={locale} dir={translations[locale].direction} suppressHydrationWarning>
      <head><ThemeScript /></head>
      <body>{children}</body>
    </html>
  );
}
