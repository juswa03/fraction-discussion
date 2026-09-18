(function () {
  const lessonOrder = ["lesson1", "lesson2", "lesson3", "lesson4"];
  const PASS_PERCENT = 70;
  let currentLang = "en";

  const certificateModal = document.getElementById("certificate-modal");
  const certificateBody = document.getElementById("certificate-body");

  function encodePath(path) {
    return encodeURI(path);
  }

  function moveIndicator() {
    const nav = document.querySelector(".nav-links");
    const navInner = document.querySelector(".nav-inner");
    const indicator = document.getElementById("active-indicator");
    if (!nav || !navInner || !indicator) {
      return;
    }
    const active = nav.querySelector(".nav-link.active");
    if (!active || window.innerWidth <= 760) {
      indicator.style.opacity = "0";
      return;
    }
    const activeRect = active.getBoundingClientRect();
    const navInnerRect = navInner.getBoundingClientRect();

    indicator.style.opacity = "1";
    indicator.style.width = `${activeRect.width}px`;
    indicator.style.height = `${activeRect.height}px`;
    indicator.style.left = `${activeRect.left - navInnerRect.left}px`;
    indicator.style.top = `${activeRect.top - navInnerRect.top}px`;
    indicator.style.transform = "none";
  }

  function setupNav() {
    const links = document.querySelectorAll(".nav-link");
    const sections = [...links]
      .map((link) => document.querySelector(link.getAttribute("href")))
      .filter(Boolean);
    const backToTop = document.getElementById("back-to-top");
    const menuToggle = document.getElementById("menu-toggle");
    const navLinks = document.getElementById("nav-links");

    if (!links.length || !menuToggle || !navLinks) {
      return;
    }

    function setActive(id) {
      links.forEach((link) => {
        link.classList.toggle("active", link.getAttribute("href") === `#${id}`);
      });
      moveIndicator();
    }

    function updateBackToTop() {
      if (!backToTop) {
        return;
      }
      backToTop.classList.toggle("show", window.scrollY > 400);
    }

    function syncActiveFromScroll() {
      if (!sections.length) {
        return;
      }

      const anchorY = window.innerHeight * 0.38;
      let activeId = sections[0].id;
      let nearestDistance = Number.POSITIVE_INFINITY;

      sections.forEach((section) => {
        const rect = section.getBoundingClientRect();
        const topDistance = Math.abs(rect.top - anchorY);

        // Prefer sections whose visible region crosses the anchor line.
        if (rect.top <= anchorY && rect.bottom >= anchorY) {
          activeId = section.id;
          nearestDistance = -1;
          return;
        }

        if (nearestDistance !== -1 && topDistance < nearestDistance) {
          nearestDistance = topDistance;
          activeId = section.id;
        }
      });

      setActive(activeId);
    }

    let ticking = false;
    function onScroll() {
      if (ticking) {
        return;
      }
      ticking = true;
      window.requestAnimationFrame(() => {
        syncActiveFromScroll();
        updateBackToTop();
        ticking = false;
      });
    }

    window.addEventListener("scroll", onScroll, { passive: true });

    links.forEach((link) => {
      link.addEventListener("click", () => {
        window.AnimationService.sectionTransition("show");
        setTimeout(() => window.AnimationService.sectionTransition("hide"), 280);
        if (window.innerWidth <= 760) {
          navLinks.classList.remove("open");
          menuToggle.setAttribute("aria-expanded", "false");
        }
      });
    });

    menuToggle.addEventListener("click", () => {
      const open = navLinks.classList.toggle("open");
      menuToggle.setAttribute("aria-expanded", String(open));
    });

    window.addEventListener("resize", () => {
      syncActiveFromScroll();
      moveIndicator();
    });
    syncActiveFromScroll();
    updateBackToTop();
    moveIndicator();
  }

  function navText(lang) {
    const labels = window.LanguageService.LANGUAGES[lang].nav;
    document.querySelectorAll(".nav-link").forEach((link, index) => {
      link.textContent = labels[index];
    });
  }

  function getTrophyIcon(percentage) {
    if (percentage === 100) return "🥇";
    if (percentage >= 85) return "🥈";
    if (percentage >= 70) return "🥉";
    return "";
  }

  function renderLessons() {
    const langPack = window.LanguageService.LANGUAGES[currentLang];
    const lessonGrid = document.getElementById("lesson-grid");

    lessonGrid.innerHTML = lessonOrder
      .map((lessonId, index) => {
        const lesson = langPack.lessonsData[lessonId];
        const stats = window.StorageService.getLessonStats(lessonId);
        const rawVideoPath = window.LanguageService.LESSON_VIDEO_MAP[lessonId][currentLang];
        const isYouTube = rawVideoPath.includes("youtube.com") || rawVideoPath.includes("youtu.be");
        const video = isYouTube ? rawVideoPath : encodePath(rawVideoPath);
        const trophy = getTrophyIcon(stats.bestPercent);

        let videoElement = "";
        if (isYouTube) {
          let videoId = "";
          try {
            const parsed = new URL(video);
            if (parsed.hostname.includes("youtu.be")) {
              videoId = parsed.pathname.slice(1);
            } else if (parsed.pathname.includes("/embed/")) {
              videoId = parsed.pathname.split("/embed/")[1].split("/")[0];
            } else {
              videoId = parsed.searchParams.get("v") || "";
            }
          } catch (error) {
            if (video.includes("youtu.be/")) {
              videoId = video.split("youtu.be/")[1].split("?")[0];
            } else if (video.includes("/embed/")) {
              videoId = video.split("/embed/")[1].split("?")[0].split("/")[0];
            } else if (video.includes("watch?v=")) {
              videoId = video.split("watch?v=")[1].split("&")[0];
            }
          }
          const embedUrl = `https://www.youtube.com/embed/${videoId}`;
          videoElement = `<iframe class="lesson-video" src="${embedUrl}?rel=0" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="width: 100%; aspect-ratio: 16/9; border-radius: var(--radius-sm); margin: 1rem 0;"></iframe>`;
        } else {
          videoElement = `
              <video class="lesson-video" controls preload="metadata" poster="assets/videos/posters/${lessonId}.jpg" aria-label="Lesson video for ${lesson.title}">
                <source class="lesson-video-source" data-lesson="${lessonId}" src="${video}" type="video/mp4" />
                Your browser does not support video playback.
              </video>`;
        }

        return `
          <article class="lesson-card reveal fade-up" id="${lessonId}" style="display: flex; flex-direction: column;">
            <p class="progress-chip" style="display: flex; align-items: center; justify-content: space-between;">
              <span>Lesson ${index + 1} • Attempts ${stats.attempts}</span>
              ${trophy ? `<span class="trophy" title="Highest Score Trophy" style="font-size: 1.5rem; line-height: 1;">${trophy}</span>` : ""}
            </p>
            <h3>${lesson.title}</h3>
            <p style="flex-grow: 1;">${lesson.description}</p>
            
            <div class="video-container" style="position: relative;">
              ${videoElement}
              <div class="video-overlay" style="display: none; position: absolute; inset: 0; background: rgba(15, 23, 42, 0.8); backdrop-filter: blur(4px); border-radius: var(--radius-sm);  align-items: center; justify-content: center; flex-direction: column; gap: 1rem; color: white; margin: 1rem 0;">
                <p style="font-weight: 700; font-size: 1.2rem;">Ready for the Quiz?</p>
                <button class="btn btn-primary overlay-quiz-btn" data-lesson="${lessonId}" type="button">Take Quiz Now</button>
              </div>
            </div>

            <ul class="objectives" style="margin-bottom: 1.5rem;">
              ${lesson.objectives.map((objective) => `<li>${objective}</li>`).join("")}
            </ul>
            <div class="card-actions" style="margin-top: auto;">
              <button class="btn btn-primary lesson-quiz-btn" data-lesson="${lessonId}" style="width: 100%;" type="button">${langPack.quizText.takeQuiz}</button>
            </div>
          </article>
        `;
      })
      .join("");

    document.querySelectorAll(".lesson-quiz-btn, .overlay-quiz-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        handleQuizStart(btn.dataset.lesson, currentLang);
      });
    });
    const bgMusic = document.getElementById("bgMusic");
    const musicToggle = document.getElementById("music-toggle");
    const videos = document.querySelectorAll("video.lesson-video");
    videos.forEach((video) => {
      video.addEventListener("play", () => {
        bgMusic.pause();
        musicToggle.checked = false;
        localStorage.setItem("musicEnabled", "false");
        const overlay = video.parentElement.querySelector(".video-overlay");
        if (overlay) overlay.style.display = "none";
        
        videos.forEach((v) => {
          if (v !== video) v.pause();
        });
      });

      video.addEventListener("ended", () => {
        const overlay = video.parentElement.querySelector(".video-overlay");
        if (overlay) overlay.style.display = "flex";
      });
    });

    // <source> fires error (and does not bubble) when the file is missing.
    document.querySelectorAll("source.lesson-video-source").forEach((source) => {
      source.addEventListener("error", () => {
        const container = source.closest(".video-container");
        if (!container) return;
        const lessonId = source.dataset.lesson;
        container.innerHTML = `
          <div class="video-missing">
            <span class="video-missing-icon" aria-hidden="true">🎬</span>
            <p class="video-missing-title">${langPack.quizText.videoSoonTitle}</p>
            <p class="video-missing-body">${langPack.quizText.videoSoonBody}</p>
            <button class="btn btn-primary" data-lesson="${lessonId}" type="button">${langPack.quizText.takeQuiz}</button>
          </div>`;
        container.querySelector("button").addEventListener("click", () => {
          handleQuizStart(lessonId, currentLang);
        });
      });
    });
  }

  function renderQuizDashboard() {
    const langPack = window.LanguageService.LANGUAGES[currentLang];
    const container = document.getElementById("quiz-dashboard");

    container.innerHTML = lessonOrder
      .map((lessonId, idx) => {
        const stats = window.StorageService.getLessonStats(lessonId);
        const best = `${stats.highestScore}/15`;
        const trophy = getTrophyIcon(stats.bestPercent);

        return `
          <article class="quiz-card reveal fade-up" style="display: flex; flex-direction: column;">
            <h3 style="display: flex; align-items: center; justify-content: space-between;">
              Quiz ${idx + 1}
              ${trophy ? `<span title="Highest Score Trophy" style="font-size: 1.5rem; line-height: 1;">${trophy}</span>` : ""}
            </h3>
            <p style="margin-bottom: 0.8rem; flex-grow: 1;">${langPack.lessonsData[lessonId].title}</p>
            <div style="margin-bottom: 1.2rem;">
              <p><strong>${langPack.quizText.highestScore}:</strong> ${best}</p>
              <p><strong>${langPack.quizText.bestPercentage}:</strong> ${stats.bestPercent}%</p>
              <p><strong>${langPack.quizText.attempts}:</strong> ${stats.attempts}</p>
            </div>
            <button class="btn btn-ghost dashboard-start" style="margin-top: auto;" data-lesson="${lessonId}" type="button">${langPack.quizText.takeQuiz}</button>
          </article>
        `;
      })
      .join("");

    const unlocked = window.StorageService.allPassed(lessonOrder, PASS_PERCENT);
    const certCard = document.createElement("article");
    certCard.className = "quiz-card certificate-unlock reveal fade-up";
    certCard.style.cssText = "display: flex; flex-direction: column;";
    certCard.innerHTML = `
      <h3>${langPack.quizText.printCertificate}</h3>
      <p style="margin-bottom: 0.8rem; flex-grow: 1;">${langPack.quizText.unlockHint}</p>
      <div style="margin-bottom: 1.2rem;">
        <p><strong>${unlocked ? langPack.quizText.unlocked : langPack.quizText.locked}</strong></p>
      </div>
      <button class="btn btn-primary" id="print-certificate-btn" style="margin-top: auto;" type="button" ${unlocked ? "" : "disabled"}>
        ${langPack.quizText.printCertificate}
      </button>
    `;
    container.appendChild(certCard);

    document.querySelectorAll(".dashboard-start").forEach((btn) => {
      btn.addEventListener("click", () => {
        handleQuizStart(btn.dataset.lesson, currentLang);
      });
    });

    const printButton = document.getElementById("print-certificate-btn");
    if (printButton && unlocked) {
      printButton.addEventListener("click", () => openCertificateModal(currentLang));
    }
  }

  function openCertificateModal(lang) {
    const t = window.LanguageService.LANGUAGES[lang].quizText;
    const today = new Date();
    const dateText = today.toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const percent = window.StorageService.overallCompletionPercent(lessonOrder.length);

    certificateBody.innerHTML = `
      <article class="certificate-card">
        <h2 id="certificate-title">${t.certTitle}</h2>
        <p>${t.certAwarded}</p>
        <p class="certificate-name">${window.StorageService.getUserName() || "Fraction Flow Learner"}</p>
        <p>${t.certBody}</p>
        <div class="certificate-meta">
          <p><strong>${t.certDate}:</strong> ${dateText}</p>
          <p><strong>${t.bestPercentage}:</strong> ${percent}%</p>
          <p><strong>${t.attempts}:</strong> ${t.certCompletion}</p>
        </div>
        <div class="certificate-actions">
          <button id="close-certificate" class="btn btn-ghost" type="button">${t.certClose}</button>
          <button id="print-certificate-now" class="btn btn-primary" type="button">${t.certPrint}</button>
        </div>
      </article>
    `;

    certificateModal.classList.add("open");
    certificateModal.setAttribute("aria-hidden", "false");

    document.getElementById("close-certificate").addEventListener("click", closeCertificateModal);
    document.getElementById("print-certificate-now").addEventListener("click", () => window.print());
  }

  function closeCertificateModal() {
    certificateModal.classList.remove("open");
    certificateModal.setAttribute("aria-hidden", "true");
  }

  function setupCertificateModal() {
    document.getElementById("close-certificate-modal").addEventListener("click", closeCertificateModal);
    certificateModal.addEventListener("click", (event) => {
      if (event.target === certificateModal) {
        closeCertificateModal();
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && certificateModal.classList.contains("open")) {
        closeCertificateModal();
      }
    });
  }

  function handleQuizStart(lessonId, lang) {
    if (!window.StorageService.getUserName()) {
      window.AppService.pendingQuiz = { lessonId, lang };
      const pack = window.LanguageService.LANGUAGES[currentLang];
      
      document.getElementById("name-modal-title").textContent = pack.quizText.namePromptTitle;
      document.getElementById("name-modal-desc").textContent = pack.quizText.namePromptDesc;
      document.getElementById("save-name-btn").textContent = pack.quizText.saveAndContinue;
      document.getElementById("user-name-input").placeholder = pack.quizText.yourNameHolder;
      document.getElementById("user-name-input").value = "";
      
      const nameModal = document.getElementById("name-modal");
      nameModal.classList.add("open");
      nameModal.setAttribute("aria-hidden", "false");
      document.getElementById("user-name-input").focus();
    } else {
      window.QuizService.startQuiz(lessonId, lang);
    }
  }

  function setupNameModal() {
    const modal = document.getElementById("name-modal");
    const closeBtn = document.getElementById("close-name-modal");
    const saveBtn = document.getElementById("save-name-btn");
    const input = document.getElementById("user-name-input");

    function closeNameModal() {
      modal.classList.remove("open");
      modal.setAttribute("aria-hidden", "true");
    }

    closeBtn.addEventListener("click", closeNameModal);
    modal.addEventListener("click", (event) => {
      if (event.target === modal) closeNameModal();
    });

    saveBtn.addEventListener("click", () => {
      const name = input.value.trim();
      if (name) {
        window.StorageService.saveUserName(name);
        closeNameModal();
        if (window.AppService.pendingQuiz) {
          window.QuizService.startQuiz(window.AppService.pendingQuiz.lessonId, window.AppService.pendingQuiz.lang);
          window.AppService.pendingQuiz = null;
        }
      }
    });

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") saveBtn.click();
    });
  }

  function renderHeroProgress() {
    const percent = window.StorageService.overallCompletionPercent(lessonOrder.length);
    document.getElementById("hero-progress-bar").style.width = `${percent}%`;
  }

  function applyLanguage(lang) {
    currentLang = lang;
    const pack = window.LanguageService.LANGUAGES[lang];
    const selector = document.getElementById("language-select");
    if (selector) {
      selector.value = lang;
    }
    window.StorageService.saveLanguage(lang);

    navText(lang);
    document.querySelector(".hero h1").textContent = pack.hero.title;
    document.querySelector(".hero-content > p:nth-of-type(2)").textContent = pack.hero.intro;
    document.querySelector(".hero-actions .btn-primary").textContent = pack.hero.start;
    document.querySelector(".hero-actions .btn-ghost").textContent = pack.hero.quiz;
    document.getElementById("settings-toggle").textContent = pack.settings.button;
    document.getElementById("settings-modal-title").textContent = pack.settings.title;
    document.getElementById("settings-language-label").textContent = pack.settings.languageLabel;
    document.getElementById("section-transition-text").textContent = pack.quizText.transitionLoading;

    document.querySelector("#lessons .section-head h2").textContent = pack.lessons.heading;

    renderLessons();
    renderQuizDashboard();
    renderHeroProgress();
    moveIndicator();
    window.AnimationService.initScrollReveal();
  }

  function setupLanguageControl() {
    const selector = document.getElementById("language-select");
    selector.addEventListener("change", () => applyLanguage(selector.value));
  }

  function setupSettingsModal() {
    const modal = document.getElementById("settings-modal");
    const openBtn = document.getElementById("settings-toggle");
    const closeBtn = document.getElementById("close-settings-modal");

    function closeSettingsModal() {
      modal.classList.remove("open");
      modal.setAttribute("aria-hidden", "true");
    }

    openBtn.addEventListener("click", () => {
      modal.classList.add("open");
      modal.setAttribute("aria-hidden", "false");
      if (window.innerWidth <= 760) {
        document.getElementById("nav-links").classList.remove("open");
        document.getElementById("menu-toggle").setAttribute("aria-expanded", "false");
      }
    });

    closeBtn.addEventListener("click", closeSettingsModal);
    modal.addEventListener("click", (event) => {
      if (event.target === modal) {
        closeSettingsModal();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && modal.classList.contains("open")) {
        closeSettingsModal();
      }
    });
  }

  function setupSectionTransitions() {
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener("click", () => {
        window.AnimationService.sectionTransition("show");
        setTimeout(() => window.AnimationService.sectionTransition("hide"), 280);
      });
    });
  }

  function setupThemeControl() {
    const toggleBtn = document.getElementById("theme-toggle");
    const currentTheme = localStorage.getItem("fraction_flow_theme") || "light";
    
    if (currentTheme === "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
      toggleBtn.textContent = "☀️";
    }

    toggleBtn.addEventListener("click", () => {
      const isDark = document.documentElement.getAttribute("data-theme") === "dark";
      if (isDark) {
        document.documentElement.removeAttribute("data-theme");
        localStorage.setItem("fraction_flow_theme", "light");
        toggleBtn.textContent = "🌙";
      } else {
        document.documentElement.setAttribute("data-theme", "dark");
        localStorage.setItem("fraction_flow_theme", "dark");
        toggleBtn.textContent = "☀️";
      }
    });
  }

  function init() {
    const savedLanguage = window.StorageService.getLanguage();
    if (window.LanguageService.LANGUAGES[savedLanguage]) {
      currentLang = savedLanguage;
    }

    document.getElementById("year").textContent = new Date().getFullYear();
    setupNav();
    setupSettingsModal();
    setupLanguageControl();
    setupThemeControl();
    setupSectionTransitions();
    setupCertificateModal();
    setupNameModal();

    applyLanguage(currentLang);
    window.AnimationService.setupLoader();
    window.AnimationService.setupRipple();
    window.AnimationService.initScrollReveal();
  }

  window.AppService = {
    renderAll: () => {
      renderLessons();
      renderQuizDashboard();
      renderHeroProgress();
      window.AnimationService.initScrollReveal();
    },
  };

  init();
})();
