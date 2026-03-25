import { useParams } from "react-router-dom";

import ProductBookingCard from "../components/detalle-producto/ProductBookingCard";
import ProductGallery from "../components/detalle-producto/ProductGallery";
import ProductHeroInfo from "../components/detalle-producto/ProductHeroInfo";
import ProductIncludes from "../components/detalle-producto/ProductIncludes";
import ProductItinerary from "../components/detalle-producto/ProductItinerary";
import ProductOverview from "../components/detalle-producto/ProductOverview";
import ProductReviews from "../components/detalle-producto/ProductReviews";
import RelatedProductsSection from "../components/detalle-producto/RelatedProductsSection";
import Footer from "../components/resultados/Footer";
import ResultadosHeader from "../components/resultados/ResultadosHeader";
import {
  footerData,
  getDetalleProducto,
  getRelatedProducts,
} from "../data/detalleProductoData";

export default function DetalleProductoPage() {
  const { productId } = useParams();
  const detail = getDetalleProducto(productId);
  const relatedItems = getRelatedProducts(detail.id);

  return (
    <div className="detalle-producto-page">
      <ResultadosHeader />

      <main className="detalle-producto-main">
        <div className="detalle-producto-shell">
          <div className="detalle-producto-gallery-wrap">
            <ProductGallery images={detail.galleryImages} title={detail.title} />
          </div>

          <div className="detalle-producto-content-wrap">
            <div className="detalle-producto-layout">
              <div className="detalle-producto-content">
                <ProductHeroInfo detail={detail} />
                <ProductOverview paragraphs={detail.overview} />
                <ProductIncludes items={detail.includes} />
                <ProductItinerary items={detail.itinerary} />
                <ProductReviews items={detail.reviews} />
              </div>

              <div className="detalle-producto-sidebar">
                <ProductBookingCard booking={detail.booking} />
              </div>
            </div>
          </div>
        </div>

        <RelatedProductsSection items={relatedItems} />
      </main>

      <Footer data={footerData} />
    </div>
  );
}
