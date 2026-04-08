import ProductExcursionPriceCard from "../detalle-producto/ProductExcursionPriceCard";
import ProductPlanPriceCard from "../detalle-producto/ProductPlanPriceCard";
import ProductPriceCard from "../detalle-producto/ProductPriceCard";
import ProductRestaurantPriceCard from "../detalle-producto/ProductRestaurantPriceCard";
import ProductTransportPriceCard from "../detalle-producto/ProductTransportPriceCard";

export default function ProductCreateSidebar({
  activeBlock,
  booking,
  categoryId,
  draft,
  onActivateBlock,
  onAddPeriod,
  onBasePriceChange,
  onGridPriceChange,
  onRemovePeriod,
  onUpdatePeriod,
}) {
  if (categoryId === "transporte") {
    return (
      <ProductTransportPriceCard
        booking={booking}
        isEditingEnabled={true}
        activeBlock={activeBlock}
        onActivateBlock={onActivateBlock}
        onBasePriceChange={onBasePriceChange}
        onHighSeasonPeriodChange={onUpdatePeriod}
        onAddHighSeasonPeriod={onAddPeriod}
        onRemoveHighSeasonPeriod={onRemovePeriod}
      />
    );
  }

  if (categoryId === "excursiones") {
    return (
      <ProductExcursionPriceCard
        draft={draft}
        isEditingEnabled={true}
        activeBlock={activeBlock}
        onActivateBlock={onActivateBlock}
        onBasePriceChange={onBasePriceChange}
        onGridPriceChange={onGridPriceChange}
        onUpdatePeriod={onUpdatePeriod}
        onAddPeriod={onAddPeriod}
        onRemovePeriod={onRemovePeriod}
      />
    );
  }

  if (categoryId === "planes") {
    return (
      <ProductPlanPriceCard
        draft={draft}
        isEditingEnabled={true}
        activeBlock={activeBlock}
        onActivateBlock={onActivateBlock}
        onBasePriceChange={onBasePriceChange}
        onGridPriceChange={onGridPriceChange}
        onUpdatePeriod={onUpdatePeriod}
        onAddPeriod={onAddPeriod}
        onRemovePeriod={onRemovePeriod}
      />
    );
  }

  if (categoryId === "restaurantes") {
    return (
      <ProductRestaurantPriceCard
        draft={draft}
        isEditingEnabled={true}
        activeBlock={activeBlock}
        onActivateBlock={onActivateBlock}
        onBasePriceChange={onBasePriceChange}
        onGridPriceChange={onGridPriceChange}
        onUpdatePeriod={onUpdatePeriod}
        onAddPeriod={onAddPeriod}
        onRemovePeriod={onRemovePeriod}
      />
    );
  }

  return (
    <ProductPriceCard
      booking={booking}
      isEditingEnabled={true}
      activeBlock={activeBlock}
      onActivateBlock={onActivateBlock}
      onBasePriceChange={onBasePriceChange}
      onHighSeasonPeriodChange={onUpdatePeriod}
      onAddHighSeasonPeriod={onAddPeriod}
      onRemoveHighSeasonPeriod={onRemovePeriod}
    />
  );
}
