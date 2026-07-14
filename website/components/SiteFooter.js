import { localePath } from "../lib/i18n";
import { showroomContent } from "../lib/showroomContent";

export default function SiteFooter({ locale }) {
  const content = showroomContent[locale];
  const root = localePath(locale);
  const docs = locale === "en" ? "/docs/" : `/docs/${locale}/`;
  return (
    <footer className="siteFooter">
      <div className="footerInner showroomFooter">
        <div className="footerBrand"><a className="brand" href={root}><span className="brandMark">AX</span><span>AMR-X</span></a><p>{content.footer.summary}</p></div>
        <div className="footerColumn"><strong>{content.footer.explore}</strong><a href={`${root}products`}>{content.footer.product}</a><a href={`${root}solutions`}>{content.footer.solutions}</a><a href={`${root}blogs`}>{content.footer.blog}</a></div>
        <div className="footerColumn"><strong>{content.footer.connect}</strong><a href={`${root}contact`}>{content.footer.contact}</a><a href={docs} target="_blank" rel="noreferrer">{content.nav.documentation}</a></div>
        <div className="footerColumn"><strong>{content.footer.legal}</strong><a href="/impressum">{content.footer.impressum}</a><a href="/privacy">{content.footer.privacy}</a><a href="/terms">{content.footer.terms}</a></div>
        <div className="footerColumn footerSocialColumn"><strong>{content.footer.social}</strong><div className="socialLinks" aria-label={content.footer.follow}>
          <a href="https://www.linkedin.com/company/cybermech-systems" target="_blank" rel="noopener noreferrer" aria-label="CYBERMECH SYSTEMS on LinkedIn" title="LinkedIn"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 8.5V18M6.5 5.7v.1M10.5 18v-5.4c0-2.2 3.1-2.8 4.2-1.1.3.5.3 1.1.3 1.7V18M4 3h16a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" /></svg></a>
          <a href="https://github.com/cybermech-hub/amr-x" target="_blank" rel="noopener noreferrer" aria-label="AMR-X on GitHub" title="GitHub"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 19c-4.5 1.4-4.5-2.5-6-3m12 6v-3.5c0-1 .1-1.5-.5-2 3-.3 6.1-1.5 6.1-6.7 0-1.5-.5-2.7-1.4-3.7.1-.4.6-1.8-.2-3.6 0 0-1.1-.4-3.7 1.4a12.8 12.8 0 0 0-6.6 0C6.1 2.1 5 2.5 5 2.5c-.8 1.8-.3 3.2-.2 3.6a5.3 5.3 0 0 0-1.4 3.7c0 5.2 3.1 6.4 6.1 6.7-.5.4-.6 1-.5 2V22" /></svg></a>
          <a href="https://www.cybermech.systems" target="_blank" rel="noopener noreferrer" aria-label="CYBERMECH SYSTEMS website" title="Website"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.4 2.5 3.6 5.5 3.6 9S14.4 18.5 12 21c-2.4-2.5-3.6-5.5-3.6-9S9.6 5.5 12 3Z" /></svg></a>
          <span className="socialComingSoon" aria-label={content.footer.instagramSoon} title={content.footer.instagramSoon}><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><path d="M17.5 6.5h.01" /></svg></span>
        </div></div>
      </div>
      <div className="footerBottom"><span className="footerCopyright"><img src="/images/cybermech-footer-logo.webp" alt="" />© 2026 <a className="footerCompany" href="https://www.cybermech.systems" target="_blank" rel="noopener noreferrer">CYBERMECH SYSTEMS</a>. {content.footer.copyright}</span><span>{content.footer.rights}</span><a className="footerTopLink" href="#top" aria-label="Back to top">↑</a></div>
    </footer>
  );
}
