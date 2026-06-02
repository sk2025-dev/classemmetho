import { NavLink } from "react-router-dom";
import "../../Styles/BeauteMainNav.css";

function BeauteMainNav({ tabs }) {
  return (
    <nav className="main-nav" id="mainNav" aria-label="Navigation Beauté">
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end
          className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}
        >
          {tab.label}
        </NavLink>
      ))}
    </nav>
  );
}

export default BeauteMainNav;
