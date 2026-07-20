/**
 * Sky Interiors — presentation enhancements
 * --------------------------------------------------------------
 * Purely additive: this file does not read from or write to any
 * state owned by script.js (nav toggle, back-to-top click handler).
 * The reveal-on-scroll CSS only hides [data-reveal] elements once
 * this script adds .js-reveal to <html> — so if this file fails to
 * load for any reason, every element stays visible by default and
 * nothing on the page breaks.
 * -------------------------------------------------------------- */
(function () {
  "use strict";

  var prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  /* Only now do [data-reveal] elements start hidden (see style.css) —
     this line is the single source of truth that the reveal system is
     actually running end-to-end. */
  document.documentElement.classList.add("js-reveal");

  /* ----------------------------------------------------------
     1. Header: transparent-over-hero -> blurred-on-scroll
  ---------------------------------------------------------- */
  var header = document.getElementById("site-header");
  var hero = document.getElementById("home");

  if (header && hero) {
    document.body.classList.add("has-transparent-header");

    var scrollThreshold = 80;
    var ticking = false;

    var updateHeaderState = function () {
      var scrolled = window.scrollY > scrollThreshold;
      header.classList.toggle("is-scrolled", scrolled);
      document.body.classList.toggle("has-transparent-header", !scrolled);
      ticking = false;
    };

    var onScroll = function () {
      if (!ticking) {
        window.requestAnimationFrame(updateHeaderState);
        ticking = true;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    updateHeaderState();
  }

  /* ----------------------------------------------------------
     2. Scroll-triggered reveal for [data-reveal] / [data-reveal-group]
  ---------------------------------------------------------- */
  var revealTargets = document.querySelectorAll(
    "[data-reveal], [data-reveal-group]"
  );

  if (!("IntersectionObserver" in window) || prefersReducedMotion) {
    // No observer support, or the visitor asked for reduced motion:
    // just show everything immediately.
    revealTargets.forEach(function (el) {
      el.classList.add("is-visible");
      runCountUp(el, true);
    });
  } else {
    var revealObserver = new IntersectionObserver(
      function (entries, observer) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            runCountUp(entry.target, false);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2, rootMargin: "0px 0px -60px 0px" }
    );

    revealTargets.forEach(function (el) {
      revealObserver.observe(el);
    });
  }

  /* ----------------------------------------------------------
     3. Animated stat counters (250+, 180+, 8+, 20+ ...)
     Triggered once the element carrying [data-count] becomes
     visible, either directly or as a descendant of a revealed
     [data-reveal] container (e.g. .about__stats).
  ---------------------------------------------------------- */
  function runCountUp(container, instant) {
    var counters = container.hasAttribute("data-count")
      ? [container]
      : container.querySelectorAll("[data-count]");

    counters.forEach(function (el) {
      if (el.dataset.counted) return;
      el.dataset.counted = "true";

      var target = parseInt(el.getAttribute("data-count"), 10);
      var suffix = el.getAttribute("data-suffix") || "";

      if (isNaN(target)) return;

      if (instant) {
        el.textContent = target + suffix;
        return;
      }

      var duration = 1400;
      var startTime = null;

      var step = function (timestamp) {
        if (startTime === null) startTime = timestamp;
        var progress = Math.min((timestamp - startTime) / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
        el.textContent = Math.round(eased * target) + suffix;

        if (progress < 1) {
          window.requestAnimationFrame(step);
        }
      };

      window.requestAnimationFrame(step);
    });
  }
})();