// src/components/Preloader.jsx
import { useEffect, useRef } from "react";
import { gsap } from "gsap";

function Preloader({ onComplete }) {
  const preloaderRef = useRef(null);
  const logoRef = useRef(null);
  const tagRef = useRef(null);
  const wordRef = useRef(null);
  const subRef = useRef(null);
  const barRef = useRef(null);

  useEffect(() => {
    const scope = preloaderRef.current;
    const logo = logoRef.current;
    const tag = tagRef.current;
    const sub = subRef.current;
    const bar = barRef.current;
    const word = wordRef.current;

    if (!scope) {
      return undefined;
    }

    gsap.killTweensOf([scope, logo, tag, sub, bar, word]);
    gsap.set(scope, { opacity: 1, display: "flex" });
    gsap.set(logo, { opacity: 0, y: 0 });
    gsap.set(tag, { opacity: 0, y: 0 });
    gsap.set(sub, { opacity: 0, y: 0 });
    gsap.set(bar, { width: 0 });
    gsap.set(word, { yPercent: 110, opacity: 0 });

    const tl = gsap.timeline({ onComplete });

    tl.to(logo, { opacity: 1, duration: 0.8 }, 0.2)
      .to(tag, { opacity: 1, duration: 0.6 }, 0.3)
      .to(
        word,
        { yPercent: 0, opacity: 1, duration: 1.2, ease: "power4.out" },
        0.5,
      )
      .to(sub, { opacity: 1, duration: 0.6 }, 1.4)
      .to(
        bar,
        { width: "100%", duration: 1.8, ease: "power2.inOut" },
        1.0,
      )
      .to(
        [word, tag, sub, logo],
        { y: -30, opacity: 0, duration: 0.6, stagger: 0.03, ease: "power3.in" },
        3.0,
      )
      .to(scope, { opacity: 0, duration: 0.5 }, 3.5)
      .set(scope, { display: "none" }, 3.8);

    return () => {
      tl.kill();
      gsap.killTweensOf([scope, logo, tag, sub, bar, word]);
    };
  }, [onComplete]);

  return (
    <div className="preloader" ref={preloaderRef}>
      <div className="preloader-content">
        <div className="preload-tag" ref={tagRef}>
          DAV Holding Group
        </div>
        <img
          src="/images/logo.png"
          alt="DAV Holding"
          ref={logoRef}
          style={{
            height: 72,
            opacity: 0,
            display: "block",
            margin: "0 auto 32px",
          }}
        />
        <div className="preload-akwaba">
          <span className="preload-akwaba-word" ref={wordRef}>
            Akwaba
          </span>
        </div>
        <div className="preload-sub" ref={subRef}>
          <em>Bienvenue</em>
        </div>
        <div className="preload-bar">
          <div className="preload-bar-fill" ref={barRef}></div>
        </div>
      </div>
    </div>
  );
}

export default Preloader;
