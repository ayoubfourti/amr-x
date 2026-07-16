"use client";

export default function PlatformPrinciples({ items }) {
  function trackPointer(event) {
    const bounds = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty("--signal-x", `${event.clientX - bounds.left}px`);
    event.currentTarget.style.setProperty("--signal-y", `${event.clientY - bounds.top}px`);
  }

  return (
    <section className="signalRail" aria-label="Platform principles">
      {items.map(([number, label, body]) => (
        <article data-number={number} key={number} onPointerMove={trackPointer} tabIndex="0">
          <div className="signalHeader" data-number={number}>
            <span className="signalIndex">{number}</span>
            <strong>{label}</strong>
            <span className="signalReveal" aria-hidden="true">↗</span>
          </div>
          <p>{body}</p>
          <div className="signalTrace" aria-hidden="true"><i /><i /><i /></div>
        </article>
      ))}
    </section>
  );
}
