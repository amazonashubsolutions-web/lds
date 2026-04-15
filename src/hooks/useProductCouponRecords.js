import { useCallback, useEffect, useState } from "react";

import {
  fetchProductCouponRecordsFromSupabase,
  importLegacyProductCouponsFromLocalStorage,
} from "../services/coupons/productCoupons";

export default function useProductCouponRecords({
  productId,
  publicOnly = false,
} = {}) {
  const [couponRecords, setCouponRecords] = useState([]);
  const [isLoadingCoupons, setIsLoadingCoupons] = useState(true);
  const [couponLoadError, setCouponLoadError] = useState("");

  const refreshCoupons = useCallback(async () => {
    setIsLoadingCoupons(true);
    setCouponLoadError("");

    try {
      if (!publicOnly) {
        await importLegacyProductCouponsFromLocalStorage();
      }

      const nextRecords = await fetchProductCouponRecordsFromSupabase({
        productId,
        publicOnly,
      });

      setCouponRecords(nextRecords);
      return nextRecords;
    } catch (error) {
      setCouponLoadError(
        error.message || "No fue posible cargar los cupones desde Supabase.",
      );
      setCouponRecords([]);
      return [];
    } finally {
      setIsLoadingCoupons(false);
    }
  }, [productId, publicOnly]);

  useEffect(() => {
    refreshCoupons();
  }, [refreshCoupons]);

  return {
    couponRecords,
    couponLoadError,
    isLoadingCoupons,
    refreshCoupons,
  };
}
