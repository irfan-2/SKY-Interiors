/* ==========================================================================
   Sky INTERIORS — MAIN SCRIPT
   Vanilla JavaScript (ES6+), no external libraries.

   Contents:
   01. Utilities (query helpers, debounce/throttle)
   02. Sticky navbar shadow on scroll
   03. Smooth scrolling navigation
   04. Mobile hamburger menu
   05. Active navigation highlight (scroll spy)
   06. Counter animation for statistics
   07. Intersection Observer fade-up animation
   08. Project card hover / tilt animation
   09. Auto-sliding testimonials
   10. FAQ accordion (single-open behaviour)
   11. Back To Top button
   12. Floating WhatsApp button functionality
   13. Lazy loading support
   14. Smooth button ripple animation
   15. Init — bootstraps every module on DOMContentLoaded
   ========================================================================== */

(() => {
  "use strict";

  /* ========================================================================
     01. UTILITIES
     Small reusable helpers used across multiple modules. Centralising DOM
     queries and timing helpers here avoids duplicate lookups and keeps
     scroll/resize handlers cheap.
     ==================================================================== */

  /** Shorthand for a single querySelector, optionally scoped to a parent. */
  const qs = (selector, scope = document) => scope.querySelector(selector);

  /** Shorthand for querySelectorAll returned as a real array. */
  const qsa = (selector, scope = document) =>
    Array.from(scope.querySelectorAll(selector));

  /**
   * Limits how often a function can fire — used on scroll/resize listeners
   * so layout-heavy work doesn't run on every single event tick.
   * @param {Function} fn - function to throttle
   * @param {number} wait - minimum ms between calls
   */
  const throttle = (fn, wait = 100) => {
    let isWaiting = false;
    return (...args) => {
      if (isWaiting) return;
      isWaiting = true;
      fn(...args);
      window.setTimeout(() => {
        isWaiting = false;
      }, wait);
    };
  };

  /** Reads the sticky header height from CSS so JS offsets stay in sync. */
  const getHeaderHeight = () => {
    const header = qs(".site-header");
    return header ? header.offsetHeight : 84;
  };

  /* ========================================================================
     02. STICKY NAVBAR SHADOW ON SCROLL
     Adds a "scrolled" state to the header once the page moves past a small
     threshold, giving the sticky nav a visible shadow/elevation.
     ==================================================================== */
  const initStickyNavbar = () => {
    const header = qs(".site-header");
    if (!header) return;

    const SCROLL_THRESHOLD = 12;

    const handleScroll = () => {
      const isScrolled = window.scrollY > SCROLL_THRESHOLD;
      header.classList.toggle("site-header--scrolled", isScrolled);
      // Inline fallback so the elevation shows even without a matching
      // CSS rule for the class above.
      header.style.boxShadow = isScrolled
        ? "0 8px 24px rgba(31, 31, 31, 0.10)"
        : "none";
    };

    window.addEventListener("scroll", throttle(handleScroll, 50), {
      passive: true,
    });
    handleScroll(); // run once on load in case the page opens pre-scrolled
  };

  /* ========================================================================
     03. SMOOTH SCROLLING NAVIGATION
     Intercepts in-page anchor links and scrolls to the target with an
     offset equal to the sticky header's height so headings aren't hidden
     underneath it.
     ==================================================================== */
  const initSmoothScroll = () => {
    const anchorLinks = qsa('a[href^="#"]').filter(
      (link) => link.getAttribute("href").length > 1
    );

    anchorLinks.forEach((link) => {
      link.addEventListener("click", (event) => {
        const targetId = link.getAttribute("href");
        const target = qs(targetId);
        if (!target) return;

        event.preventDefault();

        const offsetTop =
          target.getBoundingClientRect().top +
          window.pageYOffset -
          getHeaderHeight() +
          1;

        window.scrollTo({
          top: offsetTop,
          behavior: "smooth",
        });

        // Move focus for keyboard/screen-reader users once scrolling settles.
        window.setTimeout(() => target.setAttribute("tabindex", "-1"), 400);
        window.setTimeout(() => target.focus({ preventScroll: true }), 450);
      });
    });
  };

  /* ========================================================================
     04. MOBILE HAMBURGER MENU
     Toggles the off-canvas/mobile nav menu, keeps aria-expanded in sync for
     accessibility, and closes the menu when a link is clicked or the user
     taps outside of it.
     ==================================================================== */
  const initMobileMenu = () => {
    const toggleBtn = qs("#navToggle");
    const menu = qs("#navMenu");
    if (!toggleBtn || !menu) return;

    const closeMenu = () => {
      menu.classList.remove("is-open");
      toggleBtn.setAttribute("aria-expanded", "false");
    };

    const openMenu = () => {
      menu.classList.add("is-open");
      toggleBtn.setAttribute("aria-expanded", "true");
    };

    const toggleMenu = () => {
      const isOpen = menu.classList.contains("is-open");
      isOpen ? closeMenu() : openMenu();
    };

    toggleBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      toggleMenu();
    });

    // Close the menu automatically once a nav link is chosen (mobile UX).
    qsa(".navbar__link", menu).forEach((link) => {
      link.addEventListener("click", closeMenu);
    });

    // Close when the user taps/clicks anywhere outside the open menu.
    document.addEventListener("click", (event) => {
      const isClickInsideMenu = menu.contains(event.target);
      const isClickOnToggle = toggleBtn.contains(event.target);
      if (!isClickInsideMenu && !isClickOnToggle) closeMenu();
    });

    // Close on Escape for keyboard users.
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeMenu();
    });

    // Reset menu state if the viewport grows back to desktop size.
    window.addEventListener(
      "resize",
      throttle(() => {
        if (window.innerWidth > 992) closeMenu();
      }, 150)
    );
  };

  /* ========================================================================
     05. ACTIVE NAVIGATION HIGHLIGHT (SCROLL SPY)
     Watches each top-level section and highlights the matching nav link
     as it enters the viewport.
     ==================================================================== */
  const initActiveNavHighlight = () => {
    const navLinks = qsa(".navbar__link");
    if (!navLinks.length) return;

    // Build a map of sectionId -> link element for O(1) lookups.
    const linkMap = new Map();
    navLinks.forEach((link) => {
      const href = link.getAttribute("href");
      if (href && href.startsWith("#")) {
        linkMap.set(href.slice(1), link);
      }
    });

    const sections = Array.from(linkMap.keys())
      .map((id) => qs(`#${id}`))
      .filter(Boolean);

    if (!sections.length) return;

    const setActiveLink = (id) => {
      navLinks.forEach((link) =>
        link.classList.remove("navbar__link--active")
      );
      const activeLink = linkMap.get(id);
      if (activeLink) activeLink.classList.add("navbar__link--active");
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveLink(entry.target.id);
          }
        });
      },
      {
        // Treat a section as "current" once it occupies the middle band
        // of the viewport, accounting for the sticky header height.
        rootMargin: `-${getHeaderHeight() + 10}px 0px -60% 0px`,
        threshold: 0,
      }
    );

    sections.forEach((section) => observer.observe(section));
  };

  /* ========================================================================
     06. COUNTER ANIMATION FOR STATISTICS
     Animates each statistic (e.g. "250+") counting up from zero the first
     time it scrolls into view, preserving any non-numeric suffix like "+".
     ==================================================================== */
  const initCounterAnimation = () => {
    const counters = qsa(".stat-item__number");
    if (!counters.length) return;

    const animateCounter = (el) => {
      const rawText = el.textContent.trim();
      const numericValue = parseInt(rawText.replace(/[^\d]/g, ""), 10);
      const suffix = rawText.replace(/[\d,]/g, ""); // e.g. "+"

      if (Number.isNaN(numericValue)) return;

      const DURATION = 1600; // ms
      const startTime = performance.now();

      const tick = (now) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / DURATION, 1);
        // Ease-out cubic for a smooth deceleration toward the final value.
        const eased = 1 - Math.pow(1 - progress, 3);
        const currentValue = Math.floor(eased * numericValue);

        el.textContent = `${currentValue}${suffix}`;

        if (progress < 1) {
          requestAnimationFrame(tick);
        } else {
          el.textContent = `${numericValue}${suffix}`;
        }
      };

      requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            obs.unobserve(entry.target); // animate once only
          }
        });
      },
      { threshold: 0.6 }
    );

    counters.forEach((counter) => observer.observe(counter));
  };

  /* ========================================================================
     07. INTERSECTION OBSERVER FADE-UP ANIMATION
     Applies a gentle fade + rise-in effect to key content blocks as they
     enter the viewport. Styles are set directly via JS so the effect works
     without depending on a matching CSS class.

     NOTE: ".cta .btn" was intentionally REMOVED from this list. Animating
     opacity/transform on the CTA button via an IntersectionObserver was
     causing the button to be untappable on some mobile browsers if the
     observer fired late (or not at all before the user tried to tap it).
     The button now renders immediately visible and interactive; the
     heading/text above it still animate in normally.
     ==================================================================== */
  const initFadeUpAnimation = () => {
    const selectors = [
      ".section-header",
      ".service-card",
      ".project-card",
      ".feature-card",
      ".testimonial-card",
      ".process__step",
      ".faq-item",
      ".about__media",
      ".about__content",
      ".hero__content",
      ".hero__media",
      ".cta__heading",
      ".cta__text",
    ];

    const targets = qsa(selectors.join(","));
    if (!targets.length) return;

    // Set the initial "hidden" state and stagger each element slightly
    // based on its position within its own parent for a natural cascade.
    targets.forEach((el, index) => {
      const delay = (index % 4) * 90; // ms, cascades in groups of 4
      el.style.opacity = "0";
      el.style.transform = "translateY(28px)";
      el.style.transition = `opacity 0.7s ease ${delay}ms, transform 0.7s cubic-bezier(0.25, 0.8, 0.25, 1) ${delay}ms`;
      el.style.willChange = "opacity, transform";
    });

    const revealElement = (el) => {
      el.style.opacity = "1";
      el.style.transform = "translateY(0)";
    };

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            revealElement(entry.target);
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );

    targets.forEach((el) => observer.observe(el));
  };

  /* ========================================================================
     08. PROJECT CARD HOVER / TILT ANIMATION
     Adds a subtle pointer-following tilt to each featured project card for
     a premium, tactile feel. Falls back to nothing on touch devices.
     ==================================================================== */
  const initProjectCardHover = () => {
    const isTouchDevice = window.matchMedia("(hover: none)").matches;
    if (isTouchDevice) return;

    const cards = qsa(".project-card");
    if (!cards.length) return;

    const MAX_TILT = 4; // degrees, kept subtle for an elegant feel

    cards.forEach((card) => {
      card.style.transformStyle = "preserve-3d";
      card.style.willChange = "transform";

      const handleMouseMove = (event) => {
        const bounds = card.getBoundingClientRect();
        const relativeX = (event.clientX - bounds.left) / bounds.width - 0.5;
        const relativeY = (event.clientY - bounds.top) / bounds.height - 0.5;

        const rotateX = (-relativeY * MAX_TILT).toFixed(2);
        const rotateY = (relativeX * MAX_TILT).toFixed(2);

        card.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px)`;
      };

      const resetTilt = () => {
        card.style.transform = "";
      };

      card.addEventListener("mousemove", handleMouseMove);
      card.addEventListener("mouseleave", resetTilt);
    });
  };

  /* ========================================================================
     09. AUTO-SLIDING TESTIMONIALS
     Cycles a subtle "spotlight" state through the testimonial cards on a
     timer, pausing on hover/focus so visitors can read at their own pace.
     ==================================================================== */
  const initTestimonialSlider = () => {
    const cards = qsa(".testimonial-card");
    if (cards.length < 2) return;

    const AUTO_PLAY_INTERVAL = 4000; // ms
    let activeIndex = 0;
    let timerId = null;

    const setActiveCard = (index) => {
      cards.forEach((card, i) => {
        const isActive = i === index;
        card.style.transition =
          "transform 0.5s ease, box-shadow 0.5s ease, opacity 0.5s ease";
        card.style.transform = isActive
          ? "translateY(-10px) scale(1.03)"
          : "translateY(0) scale(1)";
        card.style.opacity = isActive ? "1" : "0.85";
        card.classList.toggle("testimonial-card--active", isActive);
      });
    };

    const goToNext = () => {
      activeIndex = (activeIndex + 1) % cards.length;
      setActiveCard(activeIndex);
    };

    const startAutoPlay = () => {
      stopAutoPlay();
      timerId = window.setInterval(goToNext, AUTO_PLAY_INTERVAL);
    };

    const stopAutoPlay = () => {
      if (timerId) window.clearInterval(timerId);
    };

    const track = qs(".testimonials__grid");
    if (track) {
      track.addEventListener("mouseenter", stopAutoPlay);
      track.addEventListener("mouseleave", startAutoPlay);
      track.addEventListener("focusin", stopAutoPlay);
      track.addEventListener("focusout", startAutoPlay);
    }

    setActiveCard(activeIndex);
    startAutoPlay();
  };

  /* ========================================================================
     10. FAQ ACCORDION
     The FAQ items use native <details>/<summary> for built-in accordion
     behaviour and accessibility. This module simply ensures only one
     answer is open at a time for a cleaner, more premium reading flow.
     ==================================================================== */
  const initFaqAccordion = () => {
    const faqItems = qsa(".faq-item");
    if (!faqItems.length) return;

    faqItems.forEach((item) => {
      item.addEventListener("toggle", () => {
        if (!item.open) return;
        faqItems.forEach((otherItem) => {
          if (otherItem !== item) otherItem.removeAttribute("open");
        });
      });
    });
  };

  /* ========================================================================
     11. BACK TO TOP BUTTON
     Shows the button once the visitor scrolls past the hero, and scrolls
     smoothly back to the top of the page when clicked.
     ==================================================================== */
  const initBackToTop = () => {
    const backToTopBtn = qs("#backToTop");
    if (!backToTopBtn) return;

    const SHOW_AFTER_PX = 480;

    const toggleVisibility = () => {
      backToTopBtn.classList.toggle(
        "is-visible",
        window.scrollY > SHOW_AFTER_PX
      );
    };

    backToTopBtn.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    window.addEventListener("scroll", throttle(toggleVisibility, 100), {
      passive: true,
    });
    toggleVisibility(); // run once in case page loads mid-scroll
  };

  /* ========================================================================
     12. FLOATING WHATSAPP BUTTON FUNCTIONALITY
     The button already links to a wa.me chat URL in the HTML; this module
     layers in a small entrance animation and a gentle attention-grabbing
     pulse after the page has settled.
     ==================================================================== */
  const initWhatsAppButton = () => {
    const whatsappBtn = qs(".whatsapp-float");
    if (!whatsappBtn) return;

    // Entrance animation once the page has loaded.
    whatsappBtn.style.opacity = "0";
    whatsappBtn.style.transform = "scale(0.6) translateY(20px)";
    whatsappBtn.style.transition =
      "opacity 0.5s ease, transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)";

    window.setTimeout(() => {
      whatsappBtn.style.opacity = "1";
      whatsappBtn.style.transform = "scale(1) translateY(0)";
    }, 800);

    // Periodic gentle pulse to draw the eye without being obnoxious.
    window.setInterval(() => {
      whatsappBtn.animate(
        [
          { transform: "scale(1)" },
          { transform: "scale(1.12)" },
          { transform: "scale(1)" },
        ],
        { duration: 700, easing: "ease-in-out" }
      );
    }, 8000);
  };

  /* ========================================================================
     13. LAZY LOADING SUPPORT
     Modern browsers already honour the native loading="lazy" attribute set
     in the HTML. This module adds an Intersection Observer fallback for
     any browser without native support, and for any image that may use a
     data-src pattern in the future.
     ==================================================================== */
  const initLazyLoad = () => {
    const supportsNativeLazyLoad = "loading" in HTMLImageElement.prototype;
    const lazyImages = qsa("img[data-src]");

    if (supportsNativeLazyLoad) {
      // Native support already covers loading="lazy" images; just resolve
      // any explicit data-src images immediately for consistency.
      lazyImages.forEach((img) => {
        img.src = img.dataset.src;
        img.removeAttribute("data-src");
      });
      return;
    }

    if (!lazyImages.length) return;

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src;
            img.removeAttribute("data-src");
            obs.unobserve(img);
          }
        });
      },
      { rootMargin: "200px 0px" }
    );

    lazyImages.forEach((img) => observer.observe(img));
  };

  /* ========================================================================
     14. SMOOTH BUTTON RIPPLE ANIMATION
     Adds a soft expanding ripple from the click point on every .btn,
     implemented with the Web Animations API so no extra CSS is required.
     ==================================================================== */
  const initButtonRipple = () => {
    const buttons = qsa(".btn");
    if (!buttons.length) return;

    buttons.forEach((button) => {
      // Ensure the ripple is visually clipped within the button's bounds.
      const computedPosition = window.getComputedStyle(button).position;
      if (computedPosition === "static") {
        button.style.position = "relative";
      }
      button.style.overflow = "hidden";

      button.addEventListener("click", (event) => {
        const bounds = button.getBoundingClientRect();
        const ripple = document.createElement("span");

        const size = Math.max(bounds.width, bounds.height);
        const x = event.clientX - bounds.left - size / 2;
        const y = event.clientY - bounds.top - size / 2;

        Object.assign(ripple.style, {
          position: "absolute",
          left: `${x}px`,
          top: `${y}px`,
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: "50%",
          background: "rgba(255, 255, 255, 0.45)",
          pointerEvents: "none",
        });

        button.appendChild(ripple);

        const animation = ripple.animate(
          [
            { transform: "scale(0)", opacity: 1 },
            { transform: "scale(2.2)", opacity: 0 },
          ],
          { duration: 550, easing: "ease-out" }
        );

        animation.onfinish = () => ripple.remove();
      });
    });
  };

  /* ========================================================================
     15. INIT
     Bootstraps every module once the DOM is fully parsed. Wrapping each
     call independently means one failing module can't block the rest.
     ==================================================================== */
  const initApp = () => {
    const modules = [
      initStickyNavbar,
      initSmoothScroll,
      initMobileMenu,
      initActiveNavHighlight,
      initCounterAnimation,
      initFadeUpAnimation,
      initProjectCardHover,
      initTestimonialSlider,
      initFaqAccordion,
      initBackToTop,
      initWhatsAppButton,
      initLazyLoad,
      initButtonRipple,
    ];

    modules.forEach((moduleFn) => {
      try {
        moduleFn();
      } catch (error) {
        // Fail gracefully — a single broken module should never take
        // down the rest of the page's interactivity.
        console.error(`[Sky Interiors] "${moduleFn.name}" failed:`, error);
      }
    });
  };

  document.addEventListener("DOMContentLoaded", initApp);
})();