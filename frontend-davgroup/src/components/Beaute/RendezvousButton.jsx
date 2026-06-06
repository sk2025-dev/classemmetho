import { NavLink } from "react-router-dom";
import "../../styles/RendezvousButton.css";

function RendezvousButton({ to, label }) {
  const hasIcon = label.startsWith("📅");
  const text = hasIcon ? label.replace(/^📅\s*/, "") : label;

  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        `nav-item nav-item--rendezvous${isActive ? " active" : ""}`
      }
    >
      <span className="rendezvous-icon" aria-hidden="true">
        📅
      </span>
      <span className="rendezvous-label">{text}</span>
    </NavLink>
  );
}

export default RendezvousButton;
