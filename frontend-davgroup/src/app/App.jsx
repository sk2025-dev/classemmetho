// src/app/App.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import HoldingPage from "../pages/HoldingPage";
import BeautePage from "../pages/BeautePage";
import BeauteRealisationsPage from "../pages/BeauteRealisationsPage";
import BeauteCapillairesPage from "../pages/BeauteCapillairesPage";
import BeauteCoiffuresPage from "../pages/BeauteCoiffuresPage";
import BeauteCosmetiquesPage from "../pages/BeauteCosmetiquesPage";
import BeauteSpaPage from "../pages/BeauteSpaPage";
import BeauteRdvPage from "../pages/BeauteRdvPage";
import BeauteAboutPage from "../pages/BeauteAboutPage";
import ConsultingPage from "../pages/ConsultingPage";
import Admin from "../admin/Admin";
import "../styles/Variables.css";
import "../styles/Holding.css";
import "../styles/Carrousel.css";
import "../styles/Modal.css";
import "../styles/BeautePage.css";
import "../styles/BeauteHeader.css";
import "../styles/BeauteMainNav.css";
import "../styles/BeauteFooter.css";
import "../styles/BeauteCapillaires.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
          <Route path="/" element={<HoldingPage />} />
          <Route path="/admin" element={<Admin />} />
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
