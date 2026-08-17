import { useEffect } from "react";

export default function useScrollReveal(dependencies = []) {
  useEffect(() => {
    const revealElements = () => {
      const elements = document.querySelectorAll("[data-reveal]");

      // If IntersectionObserver is unavailable, reveal everything.
      if (typeof IntersectionObserver === "undefined") {
        elements.forEach((el) => el.classList.add("revealed"));
        return;
      }

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const delay = entry.target.dataset.delay || 0;

              setTimeout(() => {
                entry.target.classList.add("revealed");
              }, Number(delay));

              observer.unobserve(entry.target);
            }
          });
        },
        {
          threshold: 0.12,
        }
      );

      elements.forEach((el) => {
        // Already visible/revealed elements don't need observation.
        if (!el.classList.contains("revealed")) {
          observer.observe(el);
        }
      });

      return observer;
    };

    // Run after the current render so conditionally-rendered content
    // such as pricing cards has been inserted into the DOM.
    let observer;
    const frame = requestAnimationFrame(() => {
      observer = revealElements();
    });

    return () => {
      cancelAnimationFrame(frame);
      observer?.disconnect?.();
    };
  }, dependencies);
}