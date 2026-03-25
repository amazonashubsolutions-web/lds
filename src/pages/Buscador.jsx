import BuscadorHeader from "../components/buscador/BuscadorHeader";
import PopularDestinations from "../components/buscador/PopularDestinations";
import SearchPanel from "../components/buscador/SearchPanel";
import { buscadorNavLinks, popularDestinations } from "../data/buscadorData";

const heroBackground = "images/home/9.jpg";

export default function BuscadorPage() {
  return (
    <div className="buscador-page">
      <BuscadorHeader links={buscadorNavLinks} />

      <main className="buscador-hero">
        <div className="buscador-hero-media">
          <img alt="LDS Portada" src={heroBackground} />
          <div className="buscador-hero-overlay" aria-hidden="true"></div>
        </div>

        <div className="buscador-hero-content">
          <h1>Dale vida a tu próxima gran aventura</h1>
          <span className="buscador-eyebrow">
            AMAZONAS | TU PROXIMA | AVENTURA
          </span>
          <SearchPanel />

          <PopularDestinations items={popularDestinations} />
        </div>
      </main>
    </div>
  );
}
