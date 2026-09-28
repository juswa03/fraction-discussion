(function () {
  const THEME_KEY = "fraction_flow_theme";
  let scrollObserver = null;
  let rippleBound = false;
  let loaderBound = false;

  function initLoader() {
    if (loaderBound) {
      return;
    }
    loaderBound = true;

    window.addEventListener("load", () => {
      const loader = document.getElementById("page-loader");
      setTimeout(() => {
        if (loader) {
          // css/style.css defines .page-loader.is-hidden (renamed from
          // .hidden in commit 0405a52, "Gate quizzes in order and time each
          // question"); this call site was never updated to match, so the
          // loader added a class the CSS did not look for and stayed on
          // screen forever.
          loader.classList.add("is-hidden");
        }
      }, 350);
    });
  }

  function initReveal() {
    const items = document.querySelectorAll(".reveal");
    if (!items.length) {
      return;
    }

    if (!("IntersectionObserver" in window)) {
      items.forEach((item) => item.classList.add("visible"));
      return;
    }

    if (scrollObserver) {
      scrollObserver.disconnect();
    }

    scrollObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -50px 0px" }
    );

    items.forEach((item, index) => {
      const delay = (index % 4) * 80;
      item.style.transitionDelay = `${delay}ms`;
      if (!item.classList.contains("visible")) {
        scrollObserver.observe(item);
      }
    });
  }

  function refreshReveal() {
    document.querySelectorAll(".reveal:not(.visible)").forEach((item) => {
      const rect = item.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.9) {
        item.classList.add("visible");
      }
    });
  }

  function setTheme(theme) {
    const btn = document.getElementById("theme-toggle");
    if (theme === "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
      if (btn) {
        btn.textContent = "☀️";
      }
    } else {
      document.documentElement.removeAttribute("data-theme");
      if (btn) {
        btn.textContent = "🌙";
      }
    }
    localStorage.setItem(THEME_KEY, theme);
  }

  function initThemeToggle() {
    const btn = document.getElementById("theme-toggle");
    if (!btn) {
      return;
    }

    const stored = localStorage.getItem(THEME_KEY);
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initialTheme = stored || (prefersDark ? "dark" : "light");
    setTheme(initialTheme);

    btn.addEventListener("click", () => {
      const current = document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
      setTheme(current === "dark" ? "light" : "dark");
    });
  }

  function initMobileMenu() {
    const toggle = document.getElementById("menu-toggle");
    const links = document.getElementById("nav-links");
    if (!toggle || !links) {
      return;
    }

    toggle.addEventListener("click", () => {
      const isOpen = links.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(isOpen));
    });

    links.querySelectorAll(".nav-link").forEach((link) => {
      link.addEventListener("click", () => {
        links.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  function initNavIndicator() {
    const navLinks = document.querySelectorAll(".nav-link");
    const indicator = document.getElementById("active-indicator");
    const sections = document.querySelectorAll("main .section, .site-header");
    if (!navLinks.length || !indicator || !sections.length || !("IntersectionObserver" in window)) {
      return;
    }

    function moveIndicatorTo(link) {
      if (!link || window.innerWidth <= 760) {
        indicator.style.opacity = "0";
        return;
      }
      indicator.style.opacity = "1";
      indicator.style.width = `${link.offsetWidth}px`;
      indicator.style.transform = `translateX(${link.offsetLeft}px)`;
    }

    function setActive(id) {
      navLinks.forEach((navLink) => navLink.classList.remove("active"));
      const match = document.querySelector(`.nav-link[href="#${id}"]`);
      if (match) {
        match.classList.add("active");
        moveIndicatorTo(match);
      }
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.target.id) {
            setActive(entry.target.id);
          }
        });
      },
      { rootMargin: "-40% 0px -50% 0px" }
    );

    sections.forEach((section) => observer.observe(section));
    window.addEventListener("resize", () => moveIndicatorTo(document.querySelector(".nav-link.active")));

    setTimeout(() => {
      moveIndicatorTo(document.querySelector(".nav-link.active"));
    }, 300);
  }

  function initSectionProgress() {
    const bar = document.getElementById("hero-progress-bar");
    if (!bar) {
      return;
    }

    function update() {
      const doc = document.documentElement;
      const denominator = doc.scrollHeight - doc.clientHeight || 1;
      const scrolled = doc.scrollTop / denominator;
      bar.style.width = `${Math.min(scrolled * 100, 100)}%`;
    }

    window.addEventListener("scroll", update, { passive: true });
    update();
  }

  function initTiltCards() {
    if (window.matchMedia("(pointer: coarse)").matches) {
      return;
    }

    document.querySelectorAll("[data-tilt]").forEach((card) => {
      card.addEventListener("mousemove", (event) => {
        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        card.style.transform = `perspective(900px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg) translateZ(6px)`;
      });

      card.addEventListener("mouseleave", () => {
        card.style.transform = "perspective(900px) rotateY(0) rotateX(0) translateZ(0)";
      });
    });
  }

  function initRipple() {
    if (rippleBound) {
      return;
    }
    rippleBound = true;

    document.addEventListener("click", (event) => {
      const target = event.target.closest(".ripple, .btn, .choice-btn");
      if (!target) {
        return;
      }

      const circle = document.createElement("span");
      circle.className = "ripple-span";

      const rect = target.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      circle.style.width = `${size}px`;
      circle.style.height = `${size}px`;
      circle.style.left = `${event.clientX - rect.left - size / 2}px`;
      circle.style.top = `${event.clientY - rect.top - size / 2}px`;

      target.appendChild(circle);
      setTimeout(() => circle.remove(), 650);
    });
  }

  function initBackToTop() {
    const btn = document.getElementById("back-to-top");
    if (!btn) {
      return;
    }

    window.addEventListener(
      "scroll",
      () => {
        btn.classList.toggle("show", window.scrollY > 480);
      },
      { passive: true }
    );
  }

  function sectionTransition(action, label) {
    const shell = document.getElementById("section-transition");
    const text = document.getElementById("section-transition-text");
    if (!shell) {
      return;
    }

    if (typeof label === "string" && text) {
      text.textContent = label;
    }

    if (action === "show") {
      shell.classList.add("show");
      return;
    }
    shell.classList.remove("show");
  }

  function initSectionTransition() {
    const overlay = document.getElementById("section-transition");
    const text = document.getElementById("section-transition-text");
    if (!overlay || !text) {
      return;
    }

    document.querySelectorAll('a[href^="#"]').forEach((link) => {
      link.addEventListener("click", () => {
        const id = (link.getAttribute("href") || "").replace("#", "");
        if (!id) {
          return;
        }
        const label = id.charAt(0).toUpperCase() + id.slice(1);
        text.textContent = `Loading ${label}...`;
        overlay.classList.add("show");
        setTimeout(() => overlay.classList.remove("show"), 420);
      });
    });
  }

  function fireConfetti() {
    const canvas = document.getElementById("confetti-canvas");
    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ["#ff3d81", "#ffcc00", "#2fe6e6", "#a6ff2f", "#8b5cf6"];
    const particles = Array.from({ length: 140 }, () => ({
      x: Math.random() * canvas.width,
      y: -20 - Math.random() * canvas.height * 0.3,
      size: 6 + Math.random() * 6,
      color: colors[Math.floor(Math.random() * colors.length)],
      speed: 2 + Math.random() * 3,
      drift: (Math.random() - 0.5) * 2,
      rotation: Math.random() * 360,
      spin: (Math.random() - 0.5) * 10,
    }));

    let frame = 0;
    const maxFrames = 150;

    function tick() {
      context.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((particle) => {
        particle.y += particle.speed;
        particle.x += particle.drift;
        particle.rotation += particle.spin;

        context.save();
        context.translate(particle.x, particle.y);
        context.rotate((particle.rotation * Math.PI) / 180);
        context.fillStyle = particle.color;
        context.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size * 0.6);
        context.restore();
      });

      frame += 1;
      if (frame < maxFrames) {
        requestAnimationFrame(tick);
      } else {
        context.clearRect(0, 0, canvas.width, canvas.height);
      }
    }

    tick();
  }

  function init() {
    initLoader();
    initReveal();
    // initThemeToggle() intentionally not called: js/app.js's setupTheme()
    // already owns #theme-toggle (it drives the CSS-based SVG icon swap the
    // current markup actually uses - see .icon-sun/.icon-moon in
    // css/style.css). Calling both bound a second click handler to the same
    // button, so every click toggled the theme twice (net no visible
    // change) and setTheme()'s `btn.textContent = "🌙"` wiped out the SVG
    // icons inside the button on top of that.
    initMobileMenu();
    initNavIndicator();
    initSectionProgress();
    initTiltCards();
    initRipple();
    initBackToTop();
    initSectionTransition();
    setTimeout(refreshReveal, 500);
  }

  const Motion = {
    init,
    initLoader,
    initReveal,
    refreshReveal,
    setTheme,
    initThemeToggle,
    initMobileMenu,
    initNavIndicator,
    initSectionProgress,
    initTiltCards,
    initRipple,
    initBackToTop,
    initSectionTransition,
    sectionTransition,
    fireConfetti,
    // Backward-compatible aliases used by app.js
    initScrollReveal: initReveal,
    setupRipple: initRipple,
    setupLoader: initLoader,
    confettiBurst: fireConfetti,
  };

  window.Motion = Motion;
  window.AnimationService = Motion;
})();
