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
    if (!scope) {
      return undefined;
    }

    gsap.killTweensOf([
      scope,
      logoRef.current,
      tagRef.current,
      subRef.current,
      barRef.current,
      wordRef.current,
    ]);
    gsap.set(scope, { opacity: 1, display: "flex" });
    gsap.set(logoRef.current, { opacity: 0, y: 0 });
    gsap.set(tagRef.current, { opacity: 0, y: 0 });
    gsap.set(subRef.current, { opacity: 0, y: 0 });
    gsap.set(barRef.current, { width: 0 });
    gsap.set(wordRef.current, { yPercent: 110, opacity: 0 });

    const tl = gsap.timeline({ onComplete });

    tl.to(logoRef.current, { opacity: 1, duration: 0.8 }, 0.2)
      .to(tagRef.current, { opacity: 1, duration: 0.6 }, 0.3)
      .to(
        wordRef.current,
        { yPercent: 0, opacity: 1, duration: 1.2, ease: "power4.out" },
        0.5,
      )
      .to(subRef.current, { opacity: 1, duration: 0.6 }, 1.4)
      .to(
        barRef.current,
        { width: "100%", duration: 1.8, ease: "power2.inOut" },
        1.0,
      )
      .to(
        [wordRef.current, tagRef.current, subRef.current, logoRef.current],
        { y: -30, opacity: 0, duration: 0.6, stagger: 0.03, ease: "power3.in" },
        3.0,
      )
      .to(scope, { opacity: 0, duration: 0.5 }, 3.5)
      .set(scope, { display: "none" }, 3.8);

    return () => {
      tl.kill();
      gsap.killTweensOf([
        scope,
        logoRef.current,
        tagRef.current,
        subRef.current,
        barRef.current,
        wordRef.current,
      ]);
    };
  }, []);

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
