function SlideHolding() {
  return (
    <>
      <div className="uni-slide is-visible" data-index="0" id="slide0">
        <div
          className="slide-bg"
          id="bg0"
          style={{ backgroundImage: 'url("/images/DG.jpeg")' }}
        ></div>
        <div className="slide-overlay slide-overlay--holding"></div>
        <div className="slide-streak"></div>
        <div className="slide-particles" id="particleContainer"></div>

        <div className="slide-content">
          <div className="slide-glass" id="glass0">
            <div className="slide-logo-wrap">
              <img
                src="/images/dav1.png"
                alt="DAV Holding Group"
                className="slide-logo"
              />
            </div>
            <p className="slide-desc">
              Une seule vision.
              <br />
              <em>L'excellence</em> au service de l'innovation et de la beauté.
            </p>
          </div>
        </div>
        <div className="slide-ghost-text">DAV</div>
      </div>
    </>
  );
}

export default SlideHolding;
