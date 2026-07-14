const ecosystem = [
  ["NVIDIA", "Accelerated compute", "nvidia.svg"],
  ["Intel", "Edge computing", "intel.svg"],
  ["Siemens", "Industrial automation", "siemens.svg"],
  ["Bosch", "Sensors and industry", "bosch.svg"],
  ["AMD", "Embedded compute", "amd.svg"],
  ["Ubuntu", "Robotics software base", "ubuntu.svg"],
];

const copy = {
  en: { eyebrow: "Technology ecosystem", title: "Designed to connect, not operate in isolation.", body: "AMR-X is structured around interfaces that can connect robotics compute, industrial automation, sensing, and open software foundations.", note: "Illustrative technology landscape only. Logos do not indicate endorsement or an established partnership.", label: "Illustrative robotics technology ecosystem" },
  fr: { eyebrow: "Écosystème technologique", title: "Conçu pour se connecter, pas pour fonctionner en isolation.", body: "AMR-X s’appuie sur des interfaces capables de relier le calcul robotique, l’automatisation industrielle, les capteurs et des fondations logicielles ouvertes.", note: "Paysage technologique illustratif uniquement. Ces logos n’indiquent ni approbation ni partenariat établi.", label: "Écosystème technologique robotique illustratif" },
  de: { eyebrow: "Technologie-Ökosystem", title: "Für Integration entwickelt, nicht für den isolierten Betrieb.", body: "AMR-X nutzt Schnittstellen, die Robotik-Rechner, Industrieautomation, Sensorik und offene Softwaregrundlagen verbinden können.", note: "Nur eine illustrative Technologielandschaft. Die Logos bedeuten keine Empfehlung oder bestehende Partnerschaft.", label: "Illustratives Robotik-Technologie-Ökosystem" },
  ar: { eyebrow: "المنظومة التقنية", title: "مصممة للتكامل، لا للعمل بمعزل عن غيرها.", body: "يعتمد AMR-X على واجهات يمكنها ربط حوسبة الروبوتات والأتمتة الصناعية والحساسات والأسس البرمجية المفتوحة.", note: "مشهد تقني توضيحي فقط. لا تعني الشعارات تأييداً أو شراكة قائمة.", label: "منظومة تقنية توضيحية للروبوتات" },
};

function LogoGroup({ hidden = false }) {
  return (
    <div className="ecosystemGroup" aria-hidden={hidden || undefined}>
      {ecosystem.map(([name, role, image]) => (
        <article className="ecosystemLogo" key={`${name}-${hidden ? "copy" : "primary"}`} tabIndex={hidden ? undefined : 0}>
          <img src={`/images/ecosystem/${image}`} alt={hidden ? "" : `${name} logo`} />
          <div><strong>{name}</strong><small>{role}</small></div>
        </article>
      ))}
    </div>
  );
}

export default function EcosystemMarquee({ locale = "en" }) {
  const text = copy[locale] || copy.en;
  return (
    <section className="ecosystemSection sectionBlock" id="ecosystem" aria-labelledby="ecosystem-title">
      <div className="ecosystemHeading">
        <div><p className="eyebrow">{text.eyebrow}</p><h2 id="ecosystem-title">{text.title}</h2></div>
        <div><p>{text.body}</p><small>{text.note}</small></div>
      </div>
      <div className="ecosystemViewport" aria-label={text.label}>
        <div className="ecosystemTrack"><LogoGroup /><LogoGroup hidden /></div>
      </div>
    </section>
  );
}
