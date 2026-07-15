"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import ThemeSwitch from "./ThemeSwitch";
import { localePath, supportedLocales, translations } from "../lib/i18n";
import { showroomContent } from "../lib/showroomContent";

const sections = [
  ["home", "home"],
  ["products", "product"],
  ["solutions", "solutions"],
  ["blogs", "blog"],
  ["contact", "contact"],
];

export default function SiteHeader({ locale, section = "home" }) {
  const [dashboardOpen, setDashboardOpen] = useState(false);
  const loginButtonRef = useRef(null);
  const closeButtonRef = useRef(null);
  const text = translations[locale];
  const content = showroomContent[locale];
  const root = localePath(locale);
  const docs = locale === "en" ? "/docs/" : `/docs/${locale}/`;
  const hrefFor = (route) => route === "home" ? root : `${root}${route}`;

  function closeDashboard() {
    setDashboardOpen(false);
    requestAnimationFrame(() => loginButtonRef.current?.focus({ preventScroll: true }));
  }

  useEffect(() => {
    if (!dashboardOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus({ preventScroll: true });

    function handleKeyDown(event) {
      if (event.key === "Escape") closeDashboard();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [dashboardOpen]);

  return (
    <>
      <header className="siteHeader">
        <nav className="nav showroomNav" aria-label={text.navigationLabel}>
        <a className="brand" href={root} aria-label="AMR-X home"><span className="brandMark" aria-hidden="true">AX</span><span>AMR-X</span></a>
        <div className="showroomNavLinks">
          {sections.map(([route, label]) => <a className={`showroomNavLink${section === route ? " active" : ""}`} href={hrefFor(route)} key={route}>{content.nav[label]}</a>)}
        </div>
          <div className="navControls">
            <ThemeSwitch darkLabel={text.switchToDark} lightLabel={text.switchToLight} />
            <details className="languageMenu">
            <summary aria-label={text.languageSelector}><span aria-hidden="true">{text.flag}</span><span className="languageMenuChevron" aria-hidden="true">▾</span></summary>
            <div className="languageMenuList">
              {supportedLocales.map((candidate) => {
                const candidateText = translations[candidate];
                const candidateRoot = localePath(candidate);
                const href = section === "home" ? candidateRoot : `${candidateRoot}${section}`;
                return <a aria-current={candidate === locale ? "page" : undefined} aria-label={candidateText.languageName} className={candidate === locale ? "active" : undefined} href={href} hrefLang={candidate} key={candidate} lang={candidate} title={candidateText.languageName}><span aria-hidden="true">{candidateText.flag}</span></a>;
              })}
            </div>
            </details>
            <a className="headerDocsLink" href={docs} target="_blank" rel="noreferrer">{content.nav.documentation}</a>
            <button className="dashboardLogin" onClick={() => setDashboardOpen(true)} ref={loginButtonRef} type="button">
              <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M8 10V8a4 4 0 0 1 8 0v2m-9 0h10a2 2 0 0 1 2 2v7H5v-7a2 2 0 0 1 2-2Zm5 4v2" /></svg>
              <span className="dashboardLoginText">{content.dashboardAccess.button}</span>
            </button>
            <a className={`navContact${section === "contact" ? " active" : ""}`} href={`${root}contact`}>{content.nav.contact}</a>
          </div>
        </nav>
      </header>
      {dashboardOpen && typeof document !== "undefined" && createPortal(
        <div className="dashboardModalBackdrop" onMouseDown={(event) => event.target === event.currentTarget && closeDashboard()}>
          <section aria-labelledby="dashboard-modal-title" aria-modal="true" className="dashboardModal" role="dialog">
            <button aria-label={content.dashboardAccess.close} className="dashboardModalClose" onClick={closeDashboard} ref={closeButtonRef} type="button">×</button>
            <div className="dashboardModalGlow" aria-hidden="true" />
            <div className="dashboardModalIcon" aria-hidden="true">
              <span /><span /><span />
              <svg viewBox="0 0 24 24"><path d="M4 18V9m5 9V5m6 13v-7m5 7V3" /></svg>
            </div>
            <p className="dashboardModalEyebrow"><span aria-hidden="true" />{content.dashboardAccess.eyebrow}</p>
            <h2 id="dashboard-modal-title">{content.dashboardAccess.title}<span className="dashboardModalDot">.</span></h2>
            <p className="dashboardModalBody">{content.dashboardAccess.body}</p>
            <div className="dashboardModalFeatures">
              {content.dashboardAccess.features.map((feature, index) => <span key={feature}><b>0{index + 1}</b>{feature}</span>)}
            </div>
            <p className="dashboardModalNote"><span aria-hidden="true">◆</span>{content.dashboardAccess.note}</p>
          </section>
        </div>,
        document.body
      )}
    </>
  );
}
