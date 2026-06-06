// src/pages/HoldingPage.jsx
import { useState } from "react";
import Preloader from "../components/Preloader";
import Navbar from "../components/Navbar";
import Carousel from "../components/Carousel";
import ContactModal from "../components/ContactModal";

function HoldingPage() {
  const [loaded, setLoaded] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      {!loaded && <Preloader onComplete={() => setLoaded(true)} />}
      {loaded && <Navbar onContactClick={() => setModalOpen(true)} />}
      <div className="page-waves" aria-hidden="true">
        <svg
          viewBox="0 0 1440 900"
          preserveAspectRatio="xMidYMid slice"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g
            className="wg1"
            stroke="rgba(196,20,32,.12)"
            strokeWidth="1.2"
            fill="none"
          >
            <path d="M-100 120 C200 80,400 160,600 110 S900 60,1100 120 S1350 180,1540 130" />
            <path d="M-100 220 C180 160,420 260,660 195 S980 120,1180 200 S1390 270,1540 230" />
            <path d="M-100 330 C200 255,460 365,710 292 S1025 205,1225 298 S1400 372,1540 320" />
          </g>
          <g
            className="wg2"
            stroke="rgba(255,255,255,.07)"
            strokeWidth="1"
            fill="none"
          >
            <path d="M-100 80  C250 40,500 130,760 72  S1090 8,  1290 80  S1442 148,1540 95" />
            <path d="M-100 185 C235 128,475 235,742 163 S1060 78, 1262 162 S1435 242,1540 185" />
          </g>
          <g
            className="wg3"
            stroke="rgba(196,20,32,.07)"
            strokeWidth="1"
            fill="none"
          >
            <path d="M-100 155 C305 102,565 198,832 138 S1148 62, 1345 148 S1446 218,1540 165" />
          </g>
        </svg>
      </div>
      <Carousel onContactSlide={() => setModalOpen(true)} />
      <ContactModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}

export default HoldingPage;
