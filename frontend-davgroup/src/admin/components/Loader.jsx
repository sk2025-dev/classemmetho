import { useEffect } from "react";
import "../styles/admin.css";

const Loader = ({ onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      const loader = document.getElementById("adminLoader");
      if (loader) {
        loader.classList.add("loader-out");
        const handleAnimationEnd = () => {
          onComplete();
          loader.removeEventListener("animationend", handleAnimationEnd);
        };
        loader.addEventListener("animationend", handleAnimationEnd);
      }
    }, 2600);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div id="adminLoader" className="loader">
      <img src="/images/logo.png" alt="DAVGROUP" className="loader-logo" />
      <div className="loader-label">Espace Administration</div>
      <div className="loader-bar-wrap">
        <div className="loader-bar-fill"></div>
      </div>
    </div>
  );
};

export default Loader;
