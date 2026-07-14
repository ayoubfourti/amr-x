import SiteFooter from "./SiteFooter";
import SiteHeader from "./SiteHeader";
import AmbientCard from "./AmbientCard";
import { localePath, translations } from "../lib/i18n";
import { showroomContent } from "../lib/showroomContent";

function Arrow() { return <span className="linkArrow" aria-hidden="true">↗</span>; }

function PageHero({ content, image, section }) {
  const [eyebrow, title, body] = content.pageHeroes[section];
  return <section className="pageHero showroomPageHero" id="top"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p className="intro">{body}</p></div><figure className="interactivePhoto"><img src={image} alt="" /></figure></section>;
}

function ProductPage({ content, root }) {
  return <><PageHero content={content} section="product" image="/images/placeholders/amr-x-base-cad.png" /><section className="sectionBlock"><div className="showroomProductGrid">{content.product.cards.map(([title, body, image, anchor], index) => <article className={`showroomProductCard productCard${index === 0 ? " featured" : ""}`} id={anchor} key={title}><div className="productImage"><img src={`/images/placeholders/${image}`} alt={title} /></div><div className="productBody"><span className="cardIndex">0{index + 1}</span><h3>{title}</h3><p>{body}</p></div></article>)}</div></section><section className="viewerSection sectionBlock"><div className="viewerCopy"><p className="eyebrow">Interactive product context</p><h2>Inspect a mobile manipulation configuration.</h2><p>Orbit and zoom an external industrial reference that demonstrates the relationship between a mobile base and task module. It is not AMR-X geometry.</p><a className="modelCredit" href="https://sketchfab.com/3d-models/ur--cobot-mir-amr-962b99df9b3842be97af1cb66520afc4" target="_blank" rel="noopener noreferrer">Model credit — CC Attribution<Arrow /></a></div><div className="modelFrame"><iframe allow="autoplay; fullscreen; xr-spatial-tracking" allowFullScreen loading="eager" src="https://sketchfab.com/models/962b99df9b3842be97af1cb66520afc4/embed?autostart=1&preload=1&ui_theme=dark&ui_hint=0&dnt=1" title="Interactive mobile manipulator reference" /><span className="modelLabel">EXTERNAL 3D REFERENCE / NOT AMR-X GEOMETRY</span></div></section><AmbientCard><p className="eyebrow">Continue the journey</p><h2>{content.solutions.title}</h2><p>{content.solutions.body}</p><div className="ctaActions"><a className="primary" href={`${root}solutions`}>{content.common.viewSolutions}</a><a className="quietButton" href={`${root}contact`} rel="noopener noreferrer" target="_blank">{content.common.contact}<Arrow /></a></div></AmbientCard></>;
}

function SolutionsPage({ content, root }) {
  const photos = ["pexels-automated-warehouse.jpg", "pexels-robotic-arm.jpg", "mobile-manipulator.png", "robot-workcell.png"];
  return <>
    <PageHero content={content} section="solutions" image="/images/showroom/mobile-manipulator.png" />
    <section className="sectionBlock solutionPageGrid">
      {content.solutions.items.map(([title, body], index) => <article className="solutionStory" id={`solution-${index + 1}`} key={title}><div className="interactivePhoto"><img src={`/images/showroom/${photos[index]}`} alt={title} loading="lazy" /></div><div><span>0{index + 1}</span><h2>{title}</h2><p>{body}</p><ul><li>Flexible mission configuration</li><li>Human-visible status and outcomes</li><li>Integration through stable platform boundaries</li></ul></div></article>)}
    </section>
    <section className="missionManagementSection sectionBlock" id="mission-management">
      <div className="sectionHeading"><div><p className="eyebrow">Mission management</p><h2>One mission, visible through every interface.</h2></div><p>Operators can supervise the same route, obstacles, progress, and hand-off state remotely through the Web Dashboard or locally through the Qt/QML HMI.</p></div>
      <div className="missionInterfaceGrid">
        <article className="hmiFeature" id="web-dashboard"><div className="hmiCopy"><p className="eyebrow">Web dashboard</p><h2>One operational picture.</h2><p>A future browser dashboard can combine live location, mission progress, battery, connectivity, safety, module state, camera context, and alerts in one focused workspace.</p></div><figure className="hmiScreen interactivePhoto"><img src="/images/showroom/web-dashboard-concept.png" alt="AMR-X web dashboard concept" /></figure></article>
        <article className="hmiFeature" id="operator-experience"><div className="hmiCopy"><p className="eyebrow">Local Qt/QML HMI</p><h2>Autonomy people can understand.</h2><p>The Qt/QML HMI concept gives operators a direct on-robot view of state, mission progress, and intervention controls.</p></div><figure className="hmiScreen interactivePhoto"><img src="/images/showroom/qt-qml-hmi.webp" alt="Qt/QML HMI concept" /></figure></article>
      </div>
      <AmbientCard><p className="eyebrow">Interactive mission</p><h2>Dispatch a new route.</h2><p>Click anywhere on the card to transmit a new mission, plan around obstacles and pedestrian movement, and follow the robot from station to station.</p><a className="primary" href={`${root}contact`}>{content.common.contact}</a></AmbientCard>
    </section>
  </>;
}

function BlogPage({ content, root }) {
  const images = ["/images/placeholders/amr-x-base-cad-side-view.png", "/images/showroom/pexels-automated-warehouse.jpg", "/images/showroom/qt-qml-hmi.webp"];
  return <><PageHero content={content} section="blog" image="/images/showroom/warehouse-aisle.png" /><section className="sectionBlock blogPageGrid">{content.blog.posts.map(([tag, title, body], index) => <article className="blogPreview" id={`story-${index + 1}`} key={title}><figure><img src={images[index]} alt="" loading="lazy" /></figure><div className="blogPreviewBody"><div><span>{tag}</span><small>CONCEPT NOTE / 0{index + 1}</small></div><h2>{title}</h2><p>{body}</p><span className="blogPlaceholder">Editorial preview</span></div></article>)}</section><AmbientCard><p className="eyebrow">From direction to evidence</p><h2>Follow the system, not only the headline.</h2><p>Explore how the mobile foundation, application modules, autonomy stack, and operator interfaces connect across the AMR-X platform.</p><div className="ctaActions"><a className="primary" href={`${root}products`}>Explore the platform</a><a className="quietButton" href={`${root}contact`} rel="noopener noreferrer" target="_blank">{content.common.contact}<Arrow /></a></div></AmbientCard></>;
}

function ContactPage({ content, root }) {
  return <><PageHero content={content} section="contact" image="/images/showroom/robot-workcell.png" /><section className="contactSection sectionBlock"><div><p className="eyebrow">{content.contact.eyebrow}</p><h2>{content.contact.title}</h2><p>{content.contact.body}</p><div className="contactTopics">{content.partners.items.map(([title]) => <span key={title}>{title}</span>)}</div></div><form className="contactForm"><label>{content.contact.fields.name}<input name="name" autoComplete="name" /></label><label>{content.contact.fields.email}<input type="email" name="email" autoComplete="email" /></label><label>{content.contact.fields.organization}<input name="organization" autoComplete="organization" /></label><label>{content.contact.fields.subject}<select name="subject"><option>Products and solutions</option><option>Technology partnership</option><option>Research collaboration</option><option>Pilot opportunity</option></select></label><label className="full">{content.contact.fields.message}<textarea name="message" rows="6" /></label><button className="primary full" type="button" aria-describedby="contact-note">{content.contact.fields.send}</button><small className="full" id="contact-note">{content.contact.note}</small></form></section><AmbientCard><p className="eyebrow">Explore before the conversation</p><h2>Start with the platform and the work it is designed to support.</h2><p>Review the shared mobile foundation, application directions, and operator experience before defining the next useful engineering discussion.</p><div className="ctaActions"><a className="primary" href={`${root}products`}>View the platform</a><a className="quietButton" href={`${root}solutions`} rel="noopener noreferrer" target="_blank">{content.common.viewSolutions}<Arrow /></a></div></AmbientCard></>;
}

export default function ShowroomPage({ locale = "en", section }) {
  const content = showroomContent[locale];
  const text = translations[locale];
  const root = localePath(locale);
  return <div className="siteShell" lang={locale} dir={text.direction}><SiteHeader locale={locale} section={section} /><main className="innerPage">{section === "products" && <ProductPage content={content} root={root} />}{section === "solutions" && <SolutionsPage content={content} root={root} />}{section === "blogs" && <BlogPage content={content} root={root} />}{section === "contact" && <ContactPage content={content} root={root} />}</main><SiteFooter locale={locale} /></div>;
}
