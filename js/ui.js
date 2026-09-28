/* ==========================================================================
   Shared UI helpers: modal open/close, focus handling, scroll-reveal, and
   HTML escaping.

   This file did not exist in git history even though js/app.js and
   js/quiz.js have called window.UI.* since commit 0405a52 ("Gate quizzes in
   order and time each question", Sept 19) introduced the locked-quiz and
   confirm-close dialogs built on it. Every method here matches an existing
   call site exactly (see the window.UI.* call list in app.js/quiz.js) -
   nothing here is new behaviour, it is filling in what call sites already
   expect.
   ========================================================================== */
(function () {
  "use strict";

  var FOCUSABLE_SELECTOR =
    'a[href], button:not([disabled]), textarea:not([disabled]), ' +
    'input:not([disabled]):not([type="hidden"]), select:not([disabled]), ' +
    '[tabindex]:not([tabindex="-1"])';

  /* Modals close on a CSS transition (see .modal / .modal.is-open in
     css/style.css). This is how long that transition runs, so `hidden` is
     only reapplied once the fade-out has actually finished. */
  var CLOSE_TRANSITION_MS = 240;

  var lastFocused = null;

  /* ------------------------------------------------------------------------
     openModal(modalEl, options)
       options.focus - optional selector, focused inside the modal once open.
       Falls back to the modal panel's first focusable element, or the modal
       itself if nothing inside is focusable.
     ------------------------------------------------------------------------ */
  function openModal(modal, options) {
    if (!modal) return;
    options = options || {};

    lastFocused = document.activeElement;

    modal.hidden = false;
    // Read layout once so removing `hidden` and adding `is-open` land in
    // separate frames - otherwise the opacity transition is skipped because
    // the browser never paints the "closed" state in between.
    void modal.offsetWidth;
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");

    var target = null;
    if (options.focus) {
      target = modal.querySelector(options.focus);
    }
    if (!target) {
      target = modal.querySelector(FOCUSABLE_SELECTOR);
    }
    if (!target) {
      target = modal;
      if (!modal.hasAttribute("tabindex")) {
        modal.setAttribute("tabindex", "-1");
      }
    }
    // Deferred: the modal has to finish becoming visible/unhidden before a
    // browser will accept moving focus into it.
    window.requestAnimationFrame(function () {
      target.focus();
    });

    document.addEventListener("keydown", trapFocus, true);
  }

  /* ------------------------------------------------------------------------
     closeModal(modalEl)
     ------------------------------------------------------------------------ */
  function closeModal(modal) {
    if (!modal) return;

    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");

    window.setTimeout(function () {
      modal.hidden = true;
    }, CLOSE_TRANSITION_MS);

    document.removeEventListener("keydown", trapFocus, true);

    if (lastFocused && typeof lastFocused.focus === "function") {
      lastFocused.focus();
    }
    lastFocused = null;
  }

  /* Keeps Tab/Shift+Tab cycling within whichever modal is currently open,
     rather than escaping into the page behind it. */
  function trapFocus(event) {
    if (event.key !== "Tab") return;

    var openModalEl = document.querySelector(".modal.is-open");
    if (!openModalEl) return;

    var focusable = openModalEl.querySelectorAll(FOCUSABLE_SELECTOR);
    if (!focusable.length) return;

    var first = focusable[0];
    var last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  /* ------------------------------------------------------------------------
     bindBackdrop(modalEl, onClose)
       Clicking the dimmed backdrop (not the panel inside it) closes the
       modal. onClose is optional; defaults to closeModal(modal) so call
       sites that just want the default behaviour can omit it.
     ------------------------------------------------------------------------ */
  function bindBackdrop(modal, onClose) {
    if (!modal) return;
    modal.addEventListener("mousedown", function (event) {
      if (event.target === modal) {
        (onClose || function () { closeModal(modal); })();
      }
    });
  }

  /* ------------------------------------------------------------------------
     setEscapeHandler(modalEl, onClose)
       Escape closes the modal if it is the open one. onClose is optional;
       defaults to closeModal(modal).
     ------------------------------------------------------------------------ */
  function setEscapeHandler(modal, onClose) {
    if (!modal) return;
    document.addEventListener("keydown", function (event) {
      if (event.key !== "Escape") return;
      if (!modal.classList.contains("is-open")) return;
      (onClose || function () { closeModal(modal); })();
    });
  }

  /* ------------------------------------------------------------------------
     observeReveals()
       Adds .visible (see .reveal / .reveal.visible in css/animations.css)
       to any .reveal element once it scrolls into view. Called after every
       render, so it is safe to call repeatedly - already-visible or
       already-observed elements are skipped rather than re-triggered.
     ------------------------------------------------------------------------ */
  var revealObserver = null;
  var observedReveals =
    typeof WeakSet === "function" ? new WeakSet() : null;

  function observeReveals() {
    var items = document.querySelectorAll(".reveal:not(.visible)");
    if (!items.length) return;

    if (!("IntersectionObserver" in window)) {
      // No IO support: show everything immediately rather than leaving
      // content permanently hidden.
      items.forEach(function (item) {
        item.classList.add("visible");
      });
      return;
    }

    if (!revealObserver) {
      revealObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add("visible");
              revealObserver.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
      );
    }

    items.forEach(function (item) {
      if (observedReveals && observedReveals.has(item)) return;
      if (observedReveals) observedReveals.add(item);
      revealObserver.observe(item);
    });
  }

  /* ------------------------------------------------------------------------
     escapeHtml(value)
       Used everywhere quiz/lesson content is interpolated into innerHTML
       (see `var esc = window.UI.escapeHtml;` at the top of app.js and
       quiz.js), so this must be a plain function reference, not a method
       that depends on `this`.
     ------------------------------------------------------------------------ */
  function escapeHtml(value) {
    if (value === null || value === undefined) return "";
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  window.UI = {
    openModal: openModal,
    closeModal: closeModal,
    bindBackdrop: bindBackdrop,
    setEscapeHandler: setEscapeHandler,
    observeReveals: observeReveals,
    escapeHtml: escapeHtml
  };
})();
