import { useEffect, useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";

function forceScrollReset() {
  const scrollingElement = document.scrollingElement ?? document.documentElement;
  const root = document.documentElement;
  const body = document.body;

  root.style.scrollBehavior = "auto";
  body.style.scrollBehavior = "auto";

  scrollingElement.scrollTop = 0;
  root.scrollTop = 0;
  body.scrollTop = 0;
  window.scrollTo({ top: 0, left: 0, behavior: "auto" });
}

export default function ScrollToTop() {
  const { key, pathname, search } = useLocation();

  useEffect(() => {
    if (!window.history?.scrollRestoration) {
      return undefined;
    }

    const previousScrollRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";

    return () => {
      window.history.scrollRestoration = previousScrollRestoration;
    };
  }, []);

  useLayoutEffect(() => {
    forceScrollReset();

    const firstFrameId = window.requestAnimationFrame(() => {
      forceScrollReset();
    });
    const secondFrameId = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        forceScrollReset();
      });
    });
    const timeoutIds = [0, 120, 320, 700].map((delay) =>
      window.setTimeout(() => {
        forceScrollReset();
      }, delay),
    );

    return () => {
      document.documentElement.style.scrollBehavior = "";
      document.body.style.scrollBehavior = "";
      window.cancelAnimationFrame(firstFrameId);
      window.cancelAnimationFrame(secondFrameId);
      timeoutIds.forEach((timeoutId) => window.clearTimeout(timeoutId));
    };
  }, [key, pathname, search]);

  return null;
}
