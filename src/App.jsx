// src/App.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import HoldingPage from "./Pages/HoldingPage";
import BeautePage from "./Pages/BeautePage";
import BeauteRealisationsPage from "./Pages/BeauteRealisationsPage";
import BeauteCapillairesPage from "./Pages/BeauteCapillairesPage";
import BeauteCoiffuresPage from "./Pages/BeauteCoiffuresPage";
import BeauteCosmetiquesPage from "./Pages/BeauteCosmetiquesPage";
import BeauteSpaPage from "./Pages/BeauteSpaPage";
import BeauteRdvPage from "./Pages/BeauteRdvPage";
import BeauteAboutPage from "./Pages/BeauteAboutPage";
import ConsultingPage from "./Pages/ConsultingPage";
import "./Styles/Variables.css";
import "./Styles/Holding.css";
import "./Styles/Carrousel.css";
import "./Styles/Modal.css";
import "./Styles/BeautePage.css";
import "./Styles/BeauteHeader.css";
import "./Styles/BeauteMainNav.css";
import "./Styles/BeauteFooter.css";
import "./Styles/BeauteCapillaires.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HoldingPage />} />
        <Route path="/beaute" element={<BeautePage />} />
        <Route
          path="/beaute/realisations"
          element={<BeauteRealisationsPage />}
        />
        <Route path="/beaute/capillaires" element={<BeauteCapillairesPage />} />
        <Route path="/beaute/coiffures" element={<BeauteCoiffuresPage />} />
        <Route path="/beaute/cosmetiques" element={<BeauteCosmetiquesPage />} />
        <Route path="/beaute/spa" element={<BeauteSpaPage />} />
        <Route path="/beaute/rendezvous" element={<BeauteRdvPage />} />
        <Route path="/beaute/about" element={<BeauteAboutPage />} />
        <Route path="/consulting" element={<ConsultingPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
