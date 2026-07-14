"use client";

import { useState } from "react";

export default function CapabilityShowcase({ content }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = content.views[activeIndex];
  const selectFromKeyboard = (event, index) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const last = content.views.length - 1;
    const next = event.key === "Home" ? 0 : event.key === "End" ? last : event.key === "ArrowRight" ? (index + 1) % content.views.length : (index - 1 + content.views.length) % content.views.length;
    setActiveIndex(next);
    document.getElementById(`capability-tab-${next}`)?.focus();
  };

  return (
    <section className="capabilityShowcase sectionBlock" aria-labelledby="capability-showcase-title">
      <div className="capabilityIntro">
        <div>
          <p className="eyebrow">{content.eyebrow}</p>
          <h2 id="capability-showcase-title">{content.title}</h2>
        </div>
        <p>{content.body}</p>
      </div>

      <div className="capabilityTabs" role="tablist" aria-label={content.tabLabel}>
        {content.views.map((view, index) => (
          <button
            aria-controls={`capability-panel-${index}`}
            aria-selected={activeIndex === index}
            className={activeIndex === index ? "active" : undefined}
            id={`capability-tab-${index}`}
            key={view.label}
            onClick={() => setActiveIndex(index)}
            onKeyDown={(event) => selectFromKeyboard(event, index)}
            role="tab"
            tabIndex={activeIndex === index ? 0 : -1}
            type="button"
          >
            <span>0{index + 1}</span>
            <strong>{view.label}</strong>
            <small>{view.short}</small>
          </button>
        ))}
      </div>

      <div
        aria-labelledby={`capability-tab-${activeIndex}`}
        className={`capabilityPanel capabilityPanel--${active.kind}`}
        id={`capability-panel-${activeIndex}`}
        key={active.kind}
        role="tabpanel"
      >
        <div className="capabilityVisual">
          <img className={active.fit === "contain" ? "contain" : undefined} src={active.image} alt={active.alt} />
          <div className="capabilityVisualChrome" aria-hidden="true">
            <span><i /> AMR-X / {active.signal}</span>
            <span>{active.frameLabel}</span>
          </div>
        </div>
        <div className="capabilityCopy">
          <span className="capabilityStatus">{active.status}</span>
          <h3>{active.title}</h3>
          <p>{active.body}</p>
          <ul>
            {active.points.map((point) => <li key={point}>{point}</li>)}
          </ul>
        </div>
      </div>
    </section>
  );
}
