import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";

import CategoryChips from "../components/resultados/CategoryChips";
import Footer from "../components/resultados/Footer";
import ResultadosHeader from "../components/resultados/ResultadosHeader";
import ResultsFiltersSidebar from "../components/resultados/ResultsFiltersSidebar";
import ResultsGrid from "../components/resultados/ResultsGrid";
import ResultsPagination from "../components/resultados/ResultsPagination";
import ResultsToolbar from "../components/resultados/ResultsToolbar";
import {
  ALL_RESULTS_CATEGORY_ID,
  footerData,
  getResultsCards,
  resultCategories,
  resultsFilters,
  resultsPagination,
  resultsSummary,
} from "../data/resultadosData";
import {
  getResolvedProductStatus,
  subscribeToProductStatusChanges,
} from "../utils/productStatusStorage";

const PRICE_ASC_SORT_OPTION = "Precio: menor a mayor";
const PRICE_DESC_SORT_OPTION = "Precio: mayor a menor";
const MOBILE_FILTERS_FADE_DURATION_MS = 90;
const RESULTS_HEADING_SCROLL_OFFSET_MOBILE = 96;

function buildCategoryChips(items) {
  const countByCategory = items.reduce((accumulator, item) => {
    accumulator[item.categoryId] = (accumulator[item.categoryId] ?? 0) + 1;
    return accumulator;
  }, {});

  return [
    {
      id: ALL_RESULTS_CATEGORY_ID,
      label: "Todos",
      icon: "apps",
      count: items.length,
    },
    ...resultCategories.map((category) => ({
      id: category.id,
      label: category.label,
      icon: category.icon,
      count: countByCategory[category.id] ?? 0,
    })),
  ];
}

function getAvailableSubcategoryOptions(items, activeCategoryId) {
  const usedSubcategoryIds = new Set(
    items
      .filter((item) =>
        activeCategoryId === ALL_RESULTS_CATEGORY_ID
          ? true
          : item.categoryId === activeCategoryId
      )
      .flatMap((item) => item.subcategoryIds)
  );

  return resultCategories.flatMap((category) => {
    if (
      activeCategoryId !== ALL_RESULTS_CATEGORY_ID &&
      category.id !== activeCategoryId
    ) {
      return [];
    }

    return category.subcategories.filter((subcategory) =>
      usedSubcategoryIds.has(subcategory.id)
    );
  });
}

function formatResultsCount(count) {
  return count === 1 ? "1 resultado" : `${count} resultados`;
}

function normalizeSearchText(value) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function getKeywordSearchTitle(activeCategoryId) {
  switch (activeCategoryId) {
    case "actividades":
      return "Busca una actividad";
    case "hospedaje":
      return "Busca un hospedaje";
    case "transporte":
      return "Busca un transporte";
    case "restaurantes":
      return "Busca un restaurante";
    case "planes":
      return "Busca un plan";
    case "excursiones":
      return "Busca una excursion";
    default:
      return "Busca un producto turistico";
  }
}

function formatCurrencyLabel(value) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);
}

function scrollToPageTop() {
  if (typeof window === "undefined") {
    return;
  }

  const resetScroll = (behavior = "auto") => {
    window.scrollTo({ top: 0, left: 0, behavior });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  };

  resetScroll("smooth");

  window.requestAnimationFrame(() => {
    resetScroll("auto");
  });

  window.setTimeout(() => {
    resetScroll("auto");
  }, 90);
}

export default function ResultadosPage() {
  const [searchParams] = useSearchParams();
  const [statusRefreshVersion, setStatusRefreshVersion] = useState(0);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [mobileFiltersMounted, setMobileFiltersMounted] = useState(false);
  const [activeCategoryId, setActiveCategoryId] = useState(ALL_RESULTS_CATEGORY_ID);
  const [selectedSubcategoryIds, setSelectedSubcategoryIds] = useState([]);
  const [keywordQuery, setKeywordQuery] = useState("");
  const [selectedSortOption, setSelectedSortOption] = useState(
    resultsSummary.sortOptions[0]
  );
  const hasCategorySelectionStartedRef = useRef(false);
  const closeMobileFiltersTimeoutRef = useRef(null);
  const mobileFiltersPanelRef = useRef(null);
  const filtersButtonRef = useRef(null);
  const resultsHeadingRef = useRef(null);
  const currentLocale =
    typeof navigator !== "undefined" ? navigator.language : undefined;
  const searchedDestination =
    searchParams.get("destino")?.trim() || "Leticia, Colombia";
  const searchedDate = searchParams.get("fecha");

  useEffect(() => {
    return subscribeToProductStatusChanges(() => {
      setStatusRefreshVersion((current) => current + 1);
    });
  }, []);

  const activeResultsCards = useMemo(
    () =>
      getResultsCards().filter(
        (item) => getResolvedProductStatus(item.id, item.status) === "active"
      ),
    [statusRefreshVersion],
  );
  const resultsPriceValues = activeResultsCards.map((item) => item.price);
  const resultsMinPrice =
    resultsPriceValues.length > 0 ? Math.min(...resultsPriceValues) : 0;
  const resultsMaxPrice =
    resultsPriceValues.length > 0 ? Math.max(...resultsPriceValues) : 0;
  const [selectedPriceLimit, setSelectedPriceLimit] = useState(resultsMaxPrice);
  const effectiveSelectedPriceLimit =
    resultsMaxPrice > 0 ? Math.min(selectedPriceLimit, resultsMaxPrice) : 0;
  const formattedSearchedDate = searchedDate
    ? new Intl.DateTimeFormat(currentLocale, {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(new Date(`${searchedDate}T00:00:00`))
    : null;
  const categoryChips = buildCategoryChips(activeResultsCards);
  const activeCategory = resultCategories.find(
    (category) => category.id === activeCategoryId
  );
  const availableSubcategoryOptions = getAvailableSubcategoryOptions(
    activeResultsCards,
    activeCategoryId
  );
  const normalizedKeywordQuery = normalizeSearchText(keywordQuery);
  const keywordSearchTitle = getKeywordSearchTitle(activeCategoryId);
  const filteredResults = activeResultsCards.filter((item) => {
    const matchesCategory =
      activeCategoryId === ALL_RESULTS_CATEGORY_ID ||
      item.categoryId === activeCategoryId;
    const matchesSubcategory =
      selectedSubcategoryIds.length === 0 ||
      selectedSubcategoryIds.some((subcategoryId) =>
        item.subcategoryIds.includes(subcategoryId)
      );
    const searchableText = normalizeSearchText(`${item.title} ${item.location}`);
    const matchesKeyword =
      normalizedKeywordQuery.length === 0 ||
      searchableText.includes(normalizedKeywordQuery);
    const matchesPrice = item.price <= effectiveSelectedPriceLimit;

    return matchesCategory && matchesSubcategory && matchesKeyword && matchesPrice;
  });
  const orderedResults =
    selectedSortOption === PRICE_ASC_SORT_OPTION
      ? [...filteredResults].sort((firstItem, secondItem) => firstItem.price - secondItem.price)
      : selectedSortOption === PRICE_DESC_SORT_OPTION
        ? [...filteredResults].sort(
            (firstItem, secondItem) => secondItem.price - firstItem.price
          )
        : filteredResults;
  const resultCountLabel = formatResultsCount(filteredResults.length);
  const categoryContextSuffix = activeCategory
    ? ` en ${activeCategory.label.toLowerCase()}`
    : "";
  const summary = {
    ...resultsSummary,
    title: `Resultados para: ${searchedDestination}`,
    titlePrefix: "Resultados para:",
    destinationLabel: searchedDestination,
    countLabel: formattedSearchedDate
      ? `${resultCountLabel}${categoryContextSuffix} para la fecha ${formattedSearchedDate}`
      : `${resultCountLabel}${categoryContextSuffix} disponibles`,
  };
  const priceRangeLabels = {
    min: formatCurrencyLabel(resultsMinPrice),
    max: formatCurrencyLabel(effectiveSelectedPriceLimit),
  };

  useEffect(() => {
    if (mobileFiltersOpen) {
      if (closeMobileFiltersTimeoutRef.current) {
        window.clearTimeout(closeMobileFiltersTimeoutRef.current);
        closeMobileFiltersTimeoutRef.current = null;
      }

      setMobileFiltersMounted(true);
      return undefined;
    }

    if (!mobileFiltersMounted) {
      return undefined;
    }

    closeMobileFiltersTimeoutRef.current = window.setTimeout(() => {
      setMobileFiltersMounted(false);
      closeMobileFiltersTimeoutRef.current = null;
    }, MOBILE_FILTERS_FADE_DURATION_MS);

    return () => {
      if (closeMobileFiltersTimeoutRef.current) {
        window.clearTimeout(closeMobileFiltersTimeoutRef.current);
        closeMobileFiltersTimeoutRef.current = null;
      }
    };
  }, [mobileFiltersMounted, mobileFiltersOpen]);

  useEffect(() => {
    return () => {
      if (closeMobileFiltersTimeoutRef.current) {
        window.clearTimeout(closeMobileFiltersTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!mobileFiltersOpen) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (window.innerWidth > 1080) {
        return;
      }

      const target = event.target;

      if (mobileFiltersPanelRef.current?.contains(target)) {
        return;
      }

      if (filtersButtonRef.current?.contains(target)) {
        return;
      }

      closeMobileFilters();
    };

    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [mobileFiltersOpen]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 1080) {
        closeMobileFilters();
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    const validSubcategoryIds = new Set(
      availableSubcategoryOptions.map((subcategory) => subcategory.id)
    );

    setSelectedSubcategoryIds((current) => {
      const nextSelectedSubcategoryIds = current.filter((subcategoryId) =>
        validSubcategoryIds.has(subcategoryId)
      );

      if (nextSelectedSubcategoryIds.length === current.length) {
        return current;
      }

      return nextSelectedSubcategoryIds;
    });
  }, [activeCategoryId]);

  useEffect(() => {
    if (!hasCategorySelectionStartedRef.current) {
      return;
    }

    scrollToPageTop();
  }, [activeCategoryId]);

  const handleToggleSubcategory = (subcategoryId) => {
    setSelectedSubcategoryIds((current) =>
      current.includes(subcategoryId)
        ? current.filter((item) => item !== subcategoryId)
        : [...current, subcategoryId]
    );
  };

  const scrollToResultsHeading = () => {
    if (!resultsHeadingRef.current || typeof window === "undefined") {
      scrollToPageTop();
      return;
    }

    const headingTop =
      resultsHeadingRef.current.getBoundingClientRect().top + window.scrollY;

    window.scrollTo({
      top: Math.max(0, headingTop - RESULTS_HEADING_SCROLL_OFFSET_MOBILE),
      left: 0,
      behavior: "smooth",
    });
  };

  const openMobileFilters = () => {
    if (closeMobileFiltersTimeoutRef.current) {
      window.clearTimeout(closeMobileFiltersTimeoutRef.current);
      closeMobileFiltersTimeoutRef.current = null;
    }

    setMobileFiltersMounted(true);
    setMobileFiltersOpen(true);
  };

  const closeMobileFilters = () => {
    setMobileFiltersOpen(false);
  };

  const handleMobileFilterOptionSelect = () => {
    closeMobileFilters();
    window.setTimeout(() => {
      scrollToResultsHeading();
    }, MOBILE_FILTERS_FADE_DURATION_MS);
  };

  const handleDesktopFilterOptionSelect = () => {
    window.requestAnimationFrame(() => {
      scrollToResultsHeading();
    });
  };

  const toggleMobileFilters = () => {
    if (mobileFiltersOpen) {
      closeMobileFilters();
      return;
    }

    openMobileFilters();
  };

  const handleSelectCategory = (categoryId) => {
    hasCategorySelectionStartedRef.current = true;
    document.activeElement?.blur?.();
    setKeywordQuery("");
    scrollToPageTop();
    setActiveCategoryId(categoryId);
  };

  const subcategoryContextLabel =
    activeCategoryId === ALL_RESULTS_CATEGORY_ID
      ? "Mostrando subcategorias disponibles entre todas las categorias."
      : `Mostrando subcategorias de ${activeCategory?.label ?? "la categoria seleccionada"}.`;

  return (
    <div className="resultados-page">
      <ResultadosHeader />

      <main className="resultados-main">
        <CategoryChips
          activeCategoryId={activeCategoryId}
          items={categoryChips}
          onSelectCategory={handleSelectCategory}
        />

        <div className="resultados-layout">
          <ResultsFiltersSidebar
            filters={resultsFilters}
            onFilterOptionSelect={handleDesktopFilterOptionSelect}
            keywordQuery={keywordQuery}
            keywordSearchTitle={keywordSearchTitle}
            onKeywordQueryChange={setKeywordQuery}
            onPriceLimitChange={setSelectedPriceLimit}
            onToggleSubcategory={handleToggleSubcategory}
            priceRangeLabels={priceRangeLabels}
            priceRangeMax={resultsMaxPrice}
            priceRangeMin={resultsMinPrice}
            selectedPriceLimit={effectiveSelectedPriceLimit}
            selectedSubcategoryIds={selectedSubcategoryIds}
            subcategoryContextLabel={subcategoryContextLabel}
            subcategoryOptions={availableSubcategoryOptions}
          />

          <div className="resultados-content">
            <ResultsToolbar
              filtersButtonRef={filtersButtonRef}
              isFiltersOpen={mobileFiltersOpen}
              onToggleFilters={toggleMobileFilters}
              onSortOptionChange={setSelectedSortOption}
              resultsHeadingRef={resultsHeadingRef}
              searchedDate={searchedDate ?? ""}
              searchedDestination={searchedDestination}
              selectedSortOption={selectedSortOption}
              summary={summary}
            />
            {mobileFiltersMounted ? (
              <div
                className={
                  mobileFiltersOpen
                    ? "resultados-mobile-filters-panel resultados-mobile-filters-panel--open"
                    : "resultados-mobile-filters-panel resultados-mobile-filters-panel--closing"
                }
                ref={mobileFiltersPanelRef}
              >
                <ResultsFiltersSidebar
                  className="resultados-sidebar--mobile-open"
                  filters={resultsFilters}
                  onFilterOptionSelect={handleMobileFilterOptionSelect}
                  keywordQuery={keywordQuery}
                  keywordSearchTitle={keywordSearchTitle}
                  onKeywordQueryChange={setKeywordQuery}
                  onPriceLimitChange={setSelectedPriceLimit}
                  onToggleSubcategory={handleToggleSubcategory}
                  priceRangeLabels={priceRangeLabels}
                  priceRangeMax={resultsMaxPrice}
                  priceRangeMin={resultsMinPrice}
                  selectedPriceLimit={effectiveSelectedPriceLimit}
                  selectedSubcategoryIds={selectedSubcategoryIds}
                  subcategoryContextLabel={subcategoryContextLabel}
                  subcategoryOptions={availableSubcategoryOptions}
                />
              </div>
            ) : null}
            <ResultsGrid items={orderedResults} searchedDate={searchedDate ?? ""} />
            <ResultsPagination currentPage={1} pages={resultsPagination} />
          </div>
        </div>
      </main>

      <Footer data={footerData} />
    </div>
  );
}
