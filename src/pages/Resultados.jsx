import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";

import CategoryChips from "../components/resultados/CategoryChips";
import Footer from "../components/resultados/Footer";
import ResultadosHeader from "../components/resultados/ResultadosHeader";
import ResultsFiltersSidebar from "../components/resultados/ResultsFiltersSidebar";
import ResultsGrid from "../components/resultados/ResultsGrid";
import ResultsPagination from "../components/resultados/ResultsPagination";
import ResultsToolbar from "../components/resultados/ResultsToolbar";
import {
  footerData,
  resultCategoryChips,
  resultsCards,
  resultsFilters,
  resultsPagination,
  resultsSummary,
} from "../data/resultadosData";

export default function ResultadosPage() {
  const [searchParams] = useSearchParams();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const mobileFiltersPanelRef = useRef(null);
  const filtersButtonRef = useRef(null);
  const currentLocale =
    typeof navigator !== "undefined" ? navigator.language : undefined;
  const searchedDestination = searchParams.get("destino")?.trim() || "Leticia, Colombia";
  const searchedDate = searchParams.get("fecha");
  const formattedSearchedDate = searchedDate
    ? new Intl.DateTimeFormat(currentLocale, {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(new Date(`${searchedDate}T00:00:00`))
    : null;
  const summary = {
    ...resultsSummary,
    title: `Resultados para: ${searchedDestination}`,
    countLabel: formattedSearchedDate
      ? `342 resultados para la fecha ${formattedSearchedDate}`
      : resultsSummary.countLabel,
  };

  useEffect(() => {
    if (!mobileFiltersOpen) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (window.innerWidth > 720) {
        return;
      }

      const target = event.target;

      if (mobileFiltersPanelRef.current?.contains(target)) {
        return;
      }

      if (filtersButtonRef.current?.contains(target)) {
        return;
      }

      setMobileFiltersOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [mobileFiltersOpen]);

  return (
    <div className="resultados-page">
      <ResultadosHeader />

      <main className="resultados-main">
        <CategoryChips items={resultCategoryChips} />

        <div className="resultados-layout">
          <ResultsFiltersSidebar filters={resultsFilters} />

          <div className="resultados-content">
            <ResultsToolbar
              filtersButtonRef={filtersButtonRef}
              isFiltersOpen={mobileFiltersOpen}
              onToggleFilters={() => setMobileFiltersOpen((current) => !current)}
              summary={summary}
            />
            {mobileFiltersOpen ? (
              <div className="resultados-mobile-filters-panel" ref={mobileFiltersPanelRef}>
                <ResultsFiltersSidebar
                  className="resultados-sidebar--mobile-open"
                  filters={resultsFilters}
                />
              </div>
            ) : null}
            <ResultsGrid items={resultsCards} />
            <ResultsPagination currentPage={1} pages={resultsPagination} />
          </div>
        </div>
      </main>

      <Footer data={footerData} />
    </div>
  );
}
