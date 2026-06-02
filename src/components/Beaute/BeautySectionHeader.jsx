function BeautySectionHeader({
  eyebrow,
  title,
  emphasis,
  className = "",
  stack = false,
  showBooking = false,
}) {
  return (
    <div
      className={`beauty-section-heading${stack ? " beauty-section-heading--stack" : ""}${className ? ` ${className}` : ""}`}
    >
      <div className="beauty-section-heading__text">
        <p>{eyebrow}</p>
        <h2>
          {title} {emphasis ? <span>{emphasis}</span> : null}
        </h2>
      </div>
      {showBooking ? (
        <a href="/beaute/rendezvous" className="beauty-cta-book">
          Prendre rendez-vous
        </a>
      ) : null}
    </div>
  );
}

export default BeautySectionHeader;
