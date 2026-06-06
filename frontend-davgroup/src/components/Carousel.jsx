import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import SlideHolding from "../slides/SlideHolding";
import SlideBeaute from "../slides/SlideBeaute";
import SlideConsulting from "../slides/SlideConsulting";
import SlideContact from "../slides/SlideContact";

const AUTO_DURATION = 6500;

function Carousel({ onContactSlide }) {
  const slides = useMemo(
    () => [
      { id: 0, label: "DAV Holding", node: <SlideHolding /> },
      { id: 1, label: "Dav' Beauté", node: <SlideBeaute /> },
      { id: 2, label: "DAV Consulting", node: <SlideConsulting /> },
      {
        id: 3,
        label: "Contact",
        node: <SlideContact onOpen={onContactSlide} />,
      },
    ],
    [onContactSlide],
  );

  const [index, setIndex] = useState(0);
  const autoplayRef = useRef(null);

  const restartAutoplay = useCallback(() => {
    clearInterval(autoplayRef.current);
    autoplayRef.current = setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, AUTO_DURATION);
  }, [slides.length]);

  useEffect(() => {
    restartAutoplay();
    return () => clearInterval(autoplayRef.current);
  }, [restartAutoplay]);

  // Note: opening the contact modal is triggered by user action (button)
  // rather than automatically when the slide becomes visible.

  function go(prev = false) {
    setIndex((i) => {
      if (prev) return (i - 1 + slides.length) % slides.length;
      return (i + 1) % slides.length;
    });
  }

  return (
    <section className="universe-carousel" aria-roledescription="carousel">
      <div className="falling-element" id="fallingElement" />

      <div className="carousel-track">
        {slides.map((s, i) => (
          <div
            key={s.id}
            className={`carousel-slide ${i === index ? "is-visible" : ""}`}
            aria-hidden={i === index ? "false" : "true"}
          >
            {s.node}
          </div>
        ))}
      </div>

      <button
        className="carousel-nav carousel-nav--prev"
        aria-label="Précédent"
        onClick={() => {
          go(true);
          restartAutoplay();
        }}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>
      <button
        className="carousel-nav carousel-nav--next"
        aria-label="Suivant"
        onClick={() => {
          go(false);
          restartAutoplay();
        }}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>

      <div
        className="carousel-indicators"
        id="carouselIndicators"
        role="tablist"
      >
        {slides.map((s, i) => (
          <button
            key={s.id}
            className={`ci-item ${i === index ? "active" : ""}`}
            aria-selected={i === index}
            aria-label={`Aller à la diapositive ${i + 1}`}
            onClick={() => {
              setIndex(i);
              restartAutoplay();
            }}
          >
            <span className="ci-label">{s.label}</span>
            <div className="ci-bar">
              <div
                className="ci-fill"
                style={{ width: i === index ? "100%" : "0%" }}
              />
            </div>
          </button>
        ))}
      </div>

      <div className="slide-counter">
        <span className="sc-current">{String(index + 1).padStart(2, "0")}</span>
        <span className="sc-sep">/</span>
        <span className="sc-total">04</span>
      </div>

      <div className="slide-hint">Choisissez votre univers</div>
    </section>
  );
}

export default Carousel;
