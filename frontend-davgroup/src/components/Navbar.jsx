// src/components/Navbar.jsx
function Navbar({ onContactClick }) {
  return (
    <nav className="nav ready" style={{ opacity: 1 }}>
      <div className="nav-logo">
        <img src="/images/logo.png" alt="DAV Holding Group" />
      </div>
      <div className="nav-links">
        <a href="#" onClick={(e) => { e.preventDefault(); onContactClick(); }}>
          Contact
        </a>
      </div>
    </nav>
  );
}

export default Navbar;