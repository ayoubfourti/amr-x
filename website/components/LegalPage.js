import SiteFooter from "./SiteFooter";
import SiteHeader from "./SiteHeader";

const pages = {
  impressum: {
    eyebrow: "Legal information",
    title: "Impressum",
    intro: "Information about the organization responsible for this website and the AMR-X project presentation.",
    sections: [
      ["Website operator", <><strong>CYBERMECH SYSTEMS</strong><br /><a href="https://www.cybermech.systems" target="_blank" rel="noopener noreferrer">www.cybermech.systems</a></>],
      ["Project", "AMR-X — Modular Autonomous Mobile Robot Platform"],
      ["Contact", <>For website, partnership, or project inquiries, use the <a href="/contact">AMR-X contact page</a> or the company website above.</>],
      ["Required company particulars", "Registered office, postal address, authorized representative, commercial registration number, and tax identification details must be added here by CYBERMECH SYSTEMS before a commercial public launch."],
      ["Content responsibility", "CYBERMECH SYSTEMS is responsible for the editorial content of this website. Engineering concepts, planned capabilities, external references, and preliminary work are identified where presented."],
      ["External links", "This website links to third-party services and resources. Their operators are responsible for their own content, availability, and privacy practices."],
      ["Copyright", "Unless otherwise identified, the website design, original text, graphics, and AMR-X project materials are protected by copyright. Reproduction or commercial use requires prior written permission from CYBERMECH SYSTEMS."],
    ],
  },
  privacy: {
    eyebrow: "Legal information",
    title: "Privacy notice",
    intro: "This notice explains how information may be handled when you visit the AMR-X website.",
    sections: [
      ["Responsible organization", <><strong>CYBERMECH SYSTEMS</strong><br /><a href="https://www.cybermech.systems" target="_blank" rel="noopener noreferrer">www.cybermech.systems</a></>],
      ["Information processed", "The website may process basic technical request data such as IP address, browser information, requested page, timestamps, and security logs. Information you voluntarily provide through a future contact or dashboard service may also be processed."],
      ["Local storage", "The website stores your selected light or dark theme in your browser so that your preference is retained. This preference is not used to identify you."],
      ["Purposes", "Information is used to deliver and secure the website, remember interface preferences, respond to inquiries, diagnose technical problems, and improve the AMR-X experience."],
      ["Third-party content", "Embedded or linked services, including Sketchfab and GitHub, may receive technical connection data when opened or loaded. Their own privacy notices apply."],
      ["Retention and sharing", "Information is retained only as long as necessary for its stated purpose, security, or applicable legal obligations. It is not sold. Service providers receive information only where needed to operate the website."],
      ["Your choices and rights", "Depending on applicable law, you may request access, correction, deletion, restriction, or objection concerning your personal information. You can remove the saved theme preference through your browser storage settings."],
      ["Contact and updates", <>Privacy questions can be sent through the <a href="/contact">contact page</a>. This notice may be updated as public contact forms, analytics, authentication, or dashboard services are introduced.</>],
    ],
  },
  terms: {
    eyebrow: "Legal information",
    title: "Terms of use",
    intro: "These terms describe the conditions for using the AMR-X website and its published project materials.",
    sections: [
      ["Website operator", <><strong>CYBERMECH SYSTEMS</strong><br /><a href="https://www.cybermech.systems" target="_blank" rel="noopener noreferrer">www.cybermech.systems</a></>],
      ["Informational purpose", "The website presents an engineering-stage project. Concepts, specifications, simulations, visualizations, timelines, and planned capabilities are provided for information and may change without notice."],
      ["No operational reliance", "Website content is not a safety certification, binding product specification, professional engineering instruction, or guarantee of availability or performance. Do not rely on it to operate machinery or make safety-critical decisions."],
      ["Acceptable use", "You may browse and link to public pages for lawful purposes. You must not attempt unauthorized access, disrupt the service, introduce malicious code, scrape protected areas, impersonate the company, or misuse project materials."],
      ["Intellectual property", "CYBERMECH SYSTEMS and its licensors retain rights in original website content, branding, code, graphics, and AMR-X materials. Third-party names, images, models, and trademarks remain the property of their respective owners."],
      ["External services", "Third-party websites and embedded services are governed by their own terms. CYBERMECH SYSTEMS does not control and is not responsible for their content or availability."],
      ["Availability and liability", "The website is provided on an as-available basis. To the extent permitted by applicable law, CYBERMECH SYSTEMS does not warrant uninterrupted access or accept liability for losses caused solely by reliance on preliminary website content."],
      ["Changes and contact", <>These terms may be revised as the platform and public services evolve. Questions can be submitted through the <a href="/contact">contact page</a>.</>],
    ],
  },
};

export default function LegalPage({ type }) {
  const page = pages[type];
  return <div className="siteShell"><SiteHeader locale="en" /><main className="legalMain"><header className="legalHero"><div><p className="eyebrow">{page.eyebrow}</p><h1>{page.title}</h1><p className="intro">{page.intro}</p></div><a className="legalCompanyMark" href="https://www.cybermech.systems" target="_blank" rel="noopener noreferrer"><img src="/images/cybermech-systems-logo.webp" alt="CYBERMECH SYSTEMS website" /></a></header><div className="legalSections">{page.sections.map(([title, body]) => <section key={title}><h2>{title}</h2><p>{body}</p></section>)}</div></main><SiteFooter locale="en" /></div>;
}
