/* ==========================================================================
   Sky INTERIORS — CONSULTATION PAGE SCRIPT
   Handles: mobile menu, scroll reveal, form validation, WhatsApp redirect.
   Works alongside script.js (loaded for navbar/back-to-top).
   ========================================================================== */

(() => {
    "use strict";

    /* ========================================================================
       CONFIGURATION
       Replace this with your actual WhatsApp business number.
       ======================================================================== */
    const WHATSAPP_NUMBER = "919703736555";

    /* ========================================================================
       MOBILE MENU
       Duplicates the toggle logic from script.js so the consultation page's
       navbar works independently (script.js targets index.html-specific IDs
       that may not fire correctly on a separate page).
       ======================================================================== */
    const initMobileMenu = () => {
        const toggleBtn = document.querySelector("#navToggle");
        const menu = document.querySelector("#navMenu");
        if (!toggleBtn || !menu) return;

        const closeMenu = () => {
            menu.classList.remove("is-open");
            toggleBtn.setAttribute("aria-expanded", "false");
        };

        toggleBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            const isOpen = menu.classList.contains("is-open");
            if (isOpen) {
                closeMenu();
            } else {
                menu.classList.add("is-open");
                toggleBtn.setAttribute("aria-expanded", "true");
            }
        });

        // Close on nav link click
        menu.querySelectorAll(".navbar__link").forEach((link) => {
            link.addEventListener("click", closeMenu);
        });

        // Close on outside click
        document.addEventListener("click", (e) => {
            if (!menu.contains(e.target) && !toggleBtn.contains(e.target)) {
                closeMenu();
            }
        });

        // Close on Escape
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape") closeMenu();
        });

        // Close on resize to desktop
        window.addEventListener("resize", () => {
            if (window.innerWidth > 860) closeMenu();
        });
    };

    /* ========================================================================
       SCROLL REVEAL (IntersectionObserver)
       Reveals each .form-section as it scrolls into view.
       ======================================================================== */
    const initScrollReveal = () => {
        const sections = document.querySelectorAll(".form-section[data-reveal]");
        if (!sections.length) return;

        const observer = new IntersectionObserver(
            (entries, obs) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add("revealed");
                        obs.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
        );

        sections.forEach((section) => observer.observe(section));
    };

    /* ========================================================================
       FORM VALIDATION
       ======================================================================== */
    const form = document.getElementById("consultationForm");
    const submitBtn = document.getElementById("submitBtn");
    let validationAttempted = false;

    // Validation rules for each required field
    const validators = {
        fullName: (value) => {
            if (!value.trim()) return "Please enter your full name";
            if (value.trim().length < 2) return "Name must be at least 2 characters";
            return "";
        },
        email: (value) => {
            if (!value.trim()) return "Please enter your email address";
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()))
                return "Please enter a valid email address";
            return "";
        },
        mobile: (value) => {
            if (!value.trim()) return "Please enter your mobile number";
            const digits = value.trim().replace(/\s/g, "");
            if (!/^\+?\d{8,15}$/.test(digits))
                return "Please enter a valid mobile number";
            return "";
        },
        city: (value) => {
            if (!value.trim()) return "Please enter your city";
            return "";
        },
        homeSize: () => {
            const checked = form.querySelector('input[name="homeSize"]:checked');
            if (!checked) return "Please select your home size";
            return "";
        },
        propertyType: () => {
            const checked = form.querySelector('input[name="propertyType"]:checked');
            if (!checked) return "Please select your property type";
            return "";
        },
    };

    // Show or clear an inline validation message
    const showFieldError = (fieldName, message) => {
        const group = form.querySelector(`[data-field="${fieldName}"]`);
        if (!group) return;
        const msgEl = group.querySelector(".validation-msg");
        if (message) {
            group.classList.add("has-error");
            if (msgEl) {
                msgEl.textContent = message;
                msgEl.classList.add("visible");
            }
        } else {
            group.classList.remove("has-error");
            if (msgEl) {
                msgEl.textContent = "";
                msgEl.classList.remove("visible");
            }
        }
    };

    // Validate one field, return true if valid
    const validateField = (fieldName) => {
        const validator = validators[fieldName];
        if (!validator) return true;
        const input =
            form.querySelector(`#${fieldName}`) ||
            form.querySelector(`[name="${fieldName}"]`);
        const value = input ? input.value : "";
        const error = validator(value);
        showFieldError(fieldName, error);
        return !error;
    };

    // Validate all required fields, scroll to first error
    const validateAll = () => {
        const fields = [
            "fullName",
            "email",
            "mobile",
            "city",
            "homeSize",
            "propertyType",
        ];
        let firstErrorField = null;
        let allValid = true;

        fields.forEach((field) => {
            if (!validateField(field)) {
                allValid = false;
                if (!firstErrorField) firstErrorField = field;
            }
        });

        if (firstErrorField) {
            const errorEl = form.querySelector(
                `[data-field="${firstErrorField}"]`
            );
            if (errorEl) {
                errorEl.scrollIntoView({ behavior: "smooth", block: "center" });
            }
        }

        return allValid;
    };

    // Live validation after first submission attempt
    const initLiveValidation = () => {
        ["fullName", "email", "mobile", "city"].forEach((field) => {
            const input = document.getElementById(field);
            if (!input) return;
            input.addEventListener("input", () => {
                if (validationAttempted) validateField(field);
            });
            input.addEventListener("blur", () => {
                if (validationAttempted) validateField(field);
            });
        });

        ["homeSize", "propertyType"].forEach((field) => {
            const radios = form.querySelectorAll(`input[name="${field}"]`);
            radios.forEach((radio) => {
                radio.addEventListener("change", () => {
                    if (validationAttempted) validateField(field);
                });
            });
        });
    };

    /* ========================================================================
       BUTTON RIPPLE EFFECT
       ======================================================================== */
    const initRipple = () => {
        if (!submitBtn) return;

        submitBtn.addEventListener("mousedown", (e) => {
            const ripple = document.createElement("span");
            ripple.classList.add("ripple");
            const rect = submitBtn.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height) * 2;
            ripple.style.width = ripple.style.height = size + "px";
            ripple.style.left =
                e.clientX - rect.left - size / 2 + "px";
            ripple.style.top =
                e.clientY - rect.top - size / 2 + "px";
            submitBtn.appendChild(ripple);
            setTimeout(() => ripple.remove(), 650);
        });
    };

    /* ========================================================================
       TOAST NOTIFICATION
       ======================================================================== */
    let toastEl = null;
    let toastTimer = null;

    const showToast = (message, duration = 3500) => {
        if (!toastEl) {
            toastEl = document.createElement("div");
            toastEl.className = "consult-toast";
            document.body.appendChild(toastEl);
        }
        toastEl.textContent = message;
        toastEl.classList.add("visible");
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => {
            toastEl.classList.remove("visible");
        }, duration);
    };

    /* ========================================================================
       WHATSAPP MESSAGE GENERATION
       ======================================================================== */
    const getFormData = () => {
        const services = [];
        form.querySelectorAll('input[name="services"]:checked').forEach((cb) => {
            services.push(cb.value);
        });

        return {
            fullName: document.getElementById("fullName").value.trim(),
            email: document.getElementById("email").value.trim(),
            mobile: document.getElementById("mobile").value.trim(),
            city: document.getElementById("city").value.trim(),
            homeSize:
                (
                    form.querySelector('input[name="homeSize"]:checked') || {}
                ).value || "",
            propertyType:
                (
                    form.querySelector('input[name="propertyType"]:checked') || {}
                ).value || "",
            services: services,
            timeline: document.getElementById("timeline").value || "",
            description:
                document.getElementById("projectDescription")?.value.trim() || "",
        };
    };

    const generateWhatsAppMessage = (data) => {
        const separator = "\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501";
        const servicesText =
            data.services.length > 0
                ? data.services.join(", ")
                : "Not specified";
        const timelineText = data.timeline || "Not specified";
        const descText = data.description || "Not provided";

        return (
            "Hello Sky Interiors,\n\n" +
            "I would like to book a consultation.\n\n" +
            separator +
            "\n\n" +
            "\uD83D\uDC64 Personal Details\n\n" +
            "Name: " +
            data.fullName +
            "\n" +
            "Email: " +
            data.email +
            "\n" +
            "Mobile: " +
            data.mobile +
            "\n" +
            "City: " +
            data.city +
            "\n\n" +
            "\uD83C\uDFE0 Home Details\n\n" +
            "Home Size: " +
            data.homeSize +
            "\n" +
            "Property Type: " +
            data.propertyType +
            "\n\n" +
            "Services Required: " +
            servicesText +
            "\n\n" +
            "Project Timeline: " +
            timelineText +
            "\n\n" +
            "Project Description: " +
            descText +
            "\n\n" +
            separator +
            "\n\n" +
            "Looking forward to discussing my project with your team."
        );
    };

    /* ========================================================================
       FORM SUBMISSION
       ======================================================================== */
    const initFormSubmit = () => {
        if (!form) return;

        form.addEventListener("submit", (e) => {
            e.preventDefault();
            validationAttempted = true;

            if (!validateAll()) {
                showToast(
                    "Please fill in all required fields correctly."
                );
                return;
            }

            // Loading state
            submitBtn.classList.add("loading");

            // Brief delay for premium feel
            setTimeout(() => {
                const data = getFormData();
                const message = generateWhatsAppMessage(data);
                const encodedMessage = encodeURIComponent(message);
                const whatsappURL =
                    "https://wa.me/" +
                    WHATSAPP_NUMBER +
                    "?text=" +
                    encodedMessage;

                window.location.href = whatsappURL;

                // Reset loading after redirect initiates
                setTimeout(() => {
                    submitBtn.classList.remove("loading");
                }, 2000);
            }, 1000);
        });
    };

    /* ========================================================================
       SUBTLE GLOW ON RADIO/CHECKBOX SELECTION
       ======================================================================== */
    const initSelectionGlow = () => {
        document
            .querySelectorAll(".radio-card input, .checkbox-tag input")
            .forEach((input) => {
                input.addEventListener("change", function () {
                    const content = this.nextElementSibling;
                    if (content && this.checked) {
                        content.style.boxShadow =
                            "0 0 24px rgba(184,147,91,0.18)";
                        setTimeout(() => {
                            content.style.boxShadow = "";
                        }, 500);
                    }
                });
            });
    };

    /* ========================================================================
       INIT
       ======================================================================== */
    const initConsultationPage = () => {
        initMobileMenu();
        initScrollReveal();
        initLiveValidation();
        initRipple();
        initFormSubmit();
        initSelectionGlow();
    };

    // Run when DOM is ready
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initConsultationPage);
    } else {
        initConsultationPage();
    }
})();