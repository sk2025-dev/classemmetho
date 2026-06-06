import BeauteFooter from "./BeauteFooter";
import BeauteHeader from "./BeauteHeader";
import { sectionTabs } from "./beauteData";
import "../../styles/BeautePage.css";
import "../../styles/BeauteHeader.css";

function BeauteLayout({ children, cartCount = 0, onCartClick }) {
  return (
    <main className="beauty-page">
      <BeauteHeader
        sectionTabs={sectionTabs}
        cartCount={cartCount}
        onCartClick={onCartClick}
      />
      {children}
      <BeauteFooter />
    </main>
  );
}

export default BeauteLayout;
