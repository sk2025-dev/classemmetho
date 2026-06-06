import { NavLink } from "react-router-dom";
import RendezvousButton from "./RendezvousButton";
import "../../styles/BeauteMainNav.css";

function BeauteMainNav({ tabs }) {
  return (
    <nav className="main-nav" id="mainNav" aria-label="Navigation Beauté">
      {tabs.map((tab) =>
        tab.to === "/beaute/rendezvous" ? (
          <RendezvousButton key={tab.to} to={tab.to} label={tab.label} />
        ) : (
          <NavLink
            key={tab.to}
            to={tab.to}
            end
            className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}
          >
            {tab.label}
          </NavLink>
        )
      )}
    </nav>
  );
}

export default BeauteMainNav;
