import { notFound } from "next/navigation";
import HomePage from "../../components/HomePage";
import { supportedLocales } from "../../lib/i18n";

export function generateStaticParams() {
  return supportedLocales
    .filter((locale) => locale !== "en")
    .map((locale) => ({ locale }));
}

export default async function LocalizedHome({ params }) {
  const { locale } = await params;
  if (!supportedLocales.includes(locale) || locale === "en") notFound();

  return <HomePage locale={locale} />;
}
