import { useEffect, useMemo, useRef, useState } from "react";

import DestinationActivities from "../components/destino/DestinationActivities";
import DestinationHero from "../components/destino/DestinationHero";
import DestinationJourneySection from "../components/destino/DestinationJourneySection";
import DestinationLogistics from "../components/destino/DestinationLogistics";
import DestinationMediaSection from "../components/destino/DestinationMediaSection";
import DestinationPlanningSection from "../components/destino/DestinationPlanningSection";
import DestinationStaySection from "../components/destino/DestinationStaySection";
import Footer from "../components/resultados/Footer";
import ResultadosHeader from "../components/resultados/ResultadosHeader";
import {
  destinationActivities,
  destinationBudgetOptions,
  destinationClimateCards,
  destinationCuisineHighlights,
  destinationExpertQuote,
  destinationFaqs,
  destinationGallery,
  destinationHero,
  destinationItineraries,
  destinationLogistics,
  destinationStayOptions,
  destinationTips,
  destinationTransportOptions,
} from "../data/destinoData";
import { footerData } from "../data/resultadosData";

export default function DestinoPage() {
  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false);
  const [activeGalleryImageIndex, setActiveGalleryImageIndex] = useState(0);
  const [activeSectionId, setActiveSectionId] = useState("hero");
  const heroSectionRef = useRef(null);
  const logisticsSectionRef = useRef(null);
  const climateSectionRef = useRef(null);
  const activitiesSectionRef = useRef(null);
  const staySectionRef = useRef(null);
  const cuisineSectionRef = useRef(null);
  const planningSectionRef = useRef(null);
  const tipsSectionRef = useRef(null);
  const mediaSectionRef = useRef(null);
  const journeySectionRef = useRef(null);
  const faqSectionRef = useRef(null);

  const handleOpenGallery = (index = 0) => {
    setActiveGalleryImageIndex(index);
    setIsGalleryModalOpen(true);
  };

  const sectionItems = useMemo(
    () => [
      { id: "hero", label: "La Ciudad", ref: heroSectionRef },
      { id: "logistics", label: "Como llegar", ref: logisticsSectionRef },
      { id: "climate", label: "Clima y cuando viajar", ref: climateSectionRef },
      { id: "activities", label: "Que hacer", ref: activitiesSectionRef },
      { id: "stay", label: "Donde hospedarse", ref: staySectionRef },
      { id: "cuisine", label: "Gastronomia", ref: cuisineSectionRef },
      { id: "planning", label: "Transporte y Presupuesto Diario", ref: planningSectionRef },
      { id: "tips", label: "Consejos de experto", ref: tipsSectionRef },
      { id: "gallery", label: "Galeria", ref: mediaSectionRef },
      { id: "journey", label: "Disena tu ruta", ref: journeySectionRef },
      { id: "faq", label: "Preguntas frecuentes", ref: faqSectionRef },
    ],
    [],
  );

  useEffect(() => {
    const updateActiveSection = () => {
      const headerHeight =
        document.querySelector(".primary-header")?.offsetHeight ?? 0;
      const threshold = headerHeight + 28;
      let currentSectionId = sectionItems[0].id;

      sectionItems.forEach((item) => {
        if (!item.ref.current) {
          return;
        }

        const sectionTop =
          item.ref.current.getBoundingClientRect().top + window.scrollY;

        if (window.scrollY + threshold >= sectionTop) {
          currentSectionId = item.id;
        }
      });

      setActiveSectionId((previousSectionId) =>
        previousSectionId === currentSectionId
          ? previousSectionId
          : currentSectionId,
      );
    };

    updateActiveSection();
    window.addEventListener("scroll", updateActiveSection, { passive: true });
    window.addEventListener("resize", updateActiveSection);

    return () => {
      window.removeEventListener("scroll", updateActiveSection);
      window.removeEventListener("resize", updateActiveSection);
    };
  }, [sectionItems]);

  const handleScrollToSection = (sectionItem) => {
    if (!sectionItem.ref.current) {
      return;
    }

    const headerHeight =
      document.querySelector(".primary-header")?.offsetHeight ?? 0;
    const sectionTop =
      sectionItem.ref.current.getBoundingClientRect().top + window.scrollY;

    window.scrollTo({
      top: Math.max(sectionTop - headerHeight - 16, 0),
      behavior: "smooth",
    });
  };

  return (
    <div className="destino-page">
      <ResultadosHeader />

      <main className="destino-main">
        <div className="destino-main-layout">
          <aside className="destino-section-nav">
            <div className="destino-section-nav-shell">
              {sectionItems.map((item) => (
                <button
                  key={item.id}
                  className={
                    item.id === activeSectionId
                      ? "destino-section-nav-button destino-section-nav-button--active"
                      : "destino-section-nav-button"
                  }
                  onClick={() => handleScrollToSection(item)}
                  type="button"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </aside>

          <div className="destino-main-content">
            <DestinationHero
              hero={destinationHero}
              onOpenGallery={handleOpenGallery}
              sectionRef={heroSectionRef}
            />
            <DestinationLogistics
              climateSectionRef={climateSectionRef}
              climateCards={destinationClimateCards}
              destinationName={destinationHero.title}
              logistics={destinationLogistics}
              logisticsSectionRef={logisticsSectionRef}
            />
            <DestinationActivities
              activities={destinationActivities}
              destinationName={destinationHero.title}
              sectionRef={activitiesSectionRef}
            />
            <DestinationStaySection
              cuisine={destinationCuisineHighlights}
              cuisineSectionRef={cuisineSectionRef}
              destinationName={destinationHero.title}
              staySectionRef={staySectionRef}
              stayOptions={destinationStayOptions}
            />
            <DestinationPlanningSection
              budgetOptions={destinationBudgetOptions}
              expertQuote={destinationExpertQuote}
              planningSectionRef={planningSectionRef}
              tips={destinationTips}
              tipsSectionRef={tipsSectionRef}
              transportOptions={destinationTransportOptions}
            />
            <DestinationMediaSection
              activeImageIndex={activeGalleryImageIndex}
              gallery={destinationGallery}
              isGalleryModalOpen={isGalleryModalOpen}
              onCloseGallery={() => setIsGalleryModalOpen(false)}
              onOpenGallery={handleOpenGallery}
              onSetActiveImageIndex={setActiveGalleryImageIndex}
              sectionRef={mediaSectionRef}
            />
            <DestinationJourneySection
              faqs={destinationFaqs}
              faqSectionRef={faqSectionRef}
              itineraries={destinationItineraries}
              journeySectionRef={journeySectionRef}
            />
          </div>
        </div>
      </main>

      <Footer data={footerData} />
    </div>
  );
}
