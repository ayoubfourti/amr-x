import { notFound, redirect } from "next/navigation";
import ShowroomPage from "../../../components/ShowroomPage";
import { supportedLocales } from "../../../lib/i18n";

const sections = ["products", "solutions", "blogs", "contact"];
const legacy = { product: "products", blog: "blogs", research: "solutions", insights: "blogs" };

export function generateStaticParams() {
  return supportedLocales.filter((locale) => locale !== "en").flatMap((locale) => sections.map((section) => ({ locale, section })));
}

export default async function LocalizedSectionPage({ params }) {
  const { locale, section } = await params;
  if (!supportedLocales.includes(locale) || locale === "en") notFound();
  if (section === "partners" || section === "about") redirect(`/${locale}/#ecosystem`);
  if (legacy[section]) redirect(`/${locale}/${legacy[section]}`);
  if (!sections.includes(section)) notFound();
  return <ShowroomPage locale={locale} section={section} />;
}
