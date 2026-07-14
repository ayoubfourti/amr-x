import SiteFooter from "./SiteFooter";
import SiteHeader from "./SiteHeader";
import CapabilityShowcase from "./CapabilityShowcase";
import AmbientCard from "./AmbientCard";
import EcosystemMarquee from "./EcosystemMarquee";
import PlatformPrinciples from "./PlatformPrinciples";
import { localePath, translations } from "../lib/i18n";
import { showroomContent } from "../lib/showroomContent";

function Arrow() { return <span className="linkArrow" aria-hidden="true">↗</span>; }

export default function HomePage({ locale = "en" }) {
  const text = translations[locale];
  const content = showroomContent[locale];
  const root = localePath(locale);
  return (
    <div className="siteShell" lang={locale} dir={text.direction}>
      <SiteHeader locale={locale} section="home" />
      <main>
        <section className="hero showroomHero" id="top">
          <div className="heroCopy revealCopy"><p className="eyebrow">{content.hero.eyebrow}</p><h1>{content.hero.title}</h1><p className="intro">{content.hero.body}</p><div className="actions"><a className="primary" href={`${root}products`}>{content.hero.primary}</a><a className="quietButton" href={`${root}solutions`} rel="noopener noreferrer" target="_blank">{content.hero.secondary}<Arrow /></a></div></div>
          <figure className="heroVisual showroomHeroVisual"><div className="orbit orbitOne" /><div className="orbit orbitTwo" /><img src="/images/placeholders/reference-amr-x-concept-illustration.png" alt={text.cadAlt} /><span className="visualBadge">AMR-X / PRODUCT VISION</span></figure>
        </section>

        <PlatformPrinciples items={content.signals} />

        <CapabilityShowcase content={content.showcase} />

        <EcosystemMarquee locale={locale} />

        <section className="viewerSection homeViewer sectionBlock">
          <div className="viewerCopy"><p className="eyebrow">{content.web3d.eyebrow}</p><h2>{content.web3d.title}</h2><p>{content.web3d.body}</p><a className="modelCredit" href="https://sketchfab.com/3d-models/ur--cobot-mir-amr-962b99df9b3842be97af1cb66520afc4" target="_blank" rel="noreferrer">{content.web3d.credit}<Arrow /></a></div>
          <div className="modelFrame"><iframe allow="autoplay; fullscreen; xr-spatial-tracking" allowFullScreen loading="eager" src="https://sketchfab.com/models/962b99df9b3842be97af1cb66520afc4/embed?autostart=1&preload=1&ui_theme=dark&ui_hint=0&dnt=1" title={content.web3d.title} /><span className="modelLabel">INTERACTIVE 3D / CAD WORKFLOW PLACEHOLDER</span></div>
        </section>

        <section className="sectionBlock showroomSection" id="products"><div className="sectionHeading"><div><p className="eyebrow">{content.product.eyebrow}</p><h2>{content.product.title}</h2></div><p>{content.product.body}</p></div><div className="showroomProductGrid">{content.product.cards.map(([title, body, image, anchor], index) => <a className={`showroomProductCard productCard hoverReveal${index === 0 ? " featured" : ""}`} href={`${root}products#${anchor}`} key={title} rel="noopener noreferrer" target="_blank"><div className="productImage"><img src={`/images/placeholders/${image}`} alt={title} /></div><div className="productBody"><h3>{title}</h3><p className="revealDescription">{body}</p><span className="textLink">{content.common.learn}<Arrow /></span></div></a>)}</div></section>

        <section className="sectionBlock solutionShowcase" id="solutions"><div className="showroomPhoto interactivePhoto"><img src="/images/showroom/pexels-automated-warehouse.jpg" alt="Industrial robotic arm operating in an automated warehouse" loading="lazy" /></div><div className="solutionCopy"><p className="eyebrow">{content.solutions.eyebrow}</p><h2>{content.solutions.title}</h2><p>{content.solutions.body}</p><div className="solutionMiniGrid">{content.solutions.items.map(([title, body], index) => <a className="hoverReveal" href={`${root}solutions#solution-${index + 1}`} key={title}><strong>{title}</strong><small className="revealDescription">{body}</small></a>)}</div><a className="quietButton" href={`${root}solutions`} rel="noopener noreferrer" target="_blank">{content.common.viewSolutions}<Arrow /></a></div></section>

        <section className="sectionBlock visionBand"><div><p className="eyebrow">{content.vision.eyebrow}</p><h2>{content.vision.title}</h2><p>{content.vision.body}</p></div><div className="visionGoals">{content.vision.goals.map(([title, body]) => <article className="hoverReveal" key={title} tabIndex="0"><h3>{title}</h3><p className="revealDescription">{body}</p></article>)}</div></section>

        <section className="sectionBlock hmiFeature"><div className="hmiCopy"><p className="eyebrow">Local operator interface</p><h2>On-robot control should share the same system truth.</h2><p>The planned Qt/QML client is a focused local view for connection, mode, mission, energy, safety, module state, diagnostics, and bounded intervention. It is a design direction; no runnable Qt application is committed yet.</p><a className="quietButton" href={`${root}solutions#operator-experience`} rel="noopener noreferrer" target="_blank">{content.common.learn}<Arrow /></a></div><figure className="hmiScreen interactivePhoto"><img src="/images/showroom/qt-qml-hmi.webp" alt="Planned AMR-X Qt/QML local operator interface" loading="lazy" /></figure></section>

        <section className="sectionBlock"><div className="sectionHeading"><div><p className="eyebrow">{content.blog.eyebrow}</p><h2>{content.blog.title}</h2></div><p>{content.blog.body}</p></div><div className="insightGrid">{content.blog.posts.map(([tag, title, body], index) => <a className="insightCard hoverReveal" href={`${root}blogs#story-${index + 1}`} key={title} rel="noopener noreferrer" target="_blank"><div><span>{tag}</span></div><h3>{title}</h3><p className="revealDescription">{body}</p><span className="textLink">{content.blog.read}<Arrow /></span></a>)}</div></section>

        <AmbientCard><p className="eyebrow">{content.partners.eyebrow}</p><h2>{content.partners.title}</h2><p>{content.partners.body}</p><div className="ctaActions"><a className="primary" href={`${root}contact`}>{content.common.contact}</a><a className="quietButton" href="#ecosystem" rel="noopener noreferrer" target="_blank">{content.partners.ecosystem}<Arrow /></a></div></AmbientCard>
      </main>
      <SiteFooter locale={locale} />
    </div>
  );
}
