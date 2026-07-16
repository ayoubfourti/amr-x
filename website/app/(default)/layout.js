import "../globals.css";
import ThemeScript from "../../components/ThemeScript";

export const metadata = {
  title: "AMR-X — Modular Autonomous Mobile Robot Platform",
  description: "AMR-X is an engineering-stage modular mobile robot platform integrating a reusable base, ROS 2 autonomy, digital-twin validation, mission architecture, and operator interfaces.",
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

export default function EnglishLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head><ThemeScript /></head>
      <body>{children}</body>
    </html>
  );
}
