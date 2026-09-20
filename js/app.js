/* ==========================================================================
   Application shell: rendering, navigation, theme, language, progress.
   ========================================================================== */
(function () {
  "use strict";

  var LESSONS = ["lesson1", "lesson2", "lesson3", "lesson4"];
  var PASS_PERCENT = 70;
  var QUESTIONS_PER_QUIZ = 15;
  var THEME_KEY = "fraction_flow_theme";

  /* Which diagram from the shared artwork sheet illustrates each lesson.
     All four show a real object cut into parts, which is the idea every one
     of these lessons rests on. */
  var FIGURES = ["fig-pizza", "fig-chocolate", "fig-jug", "fig-cupcake"];

  /* Stars earned for a given best score. Percentages are still stored and
     still shown on the scoreboard; stars are simply the version a 7-year-old
     can read without having been taught what a percentage is. */
  function starCount(percent) {
    if (percent >= 100) return 3;
    if (percent >= 85) return 2;
    if (percent >= PASS_PERCENT) return 1;
    return 0;
  }

  function starsMarkup(percent, t) {
    var earned = starCount(percent);
    var stars = "";
    for (var i = 0; i < 3; i++) {
      stars +=
        '<span class="star' + (i < earned ? " is-earned" : "") + '"></span>';
    }
    return (
      '<span class="stars" role="img" aria-label="' +
      esc(earned + " " + (earned === 1 ? t.starOne : t.starMany)) +
      '">' +
      stars +
      "</span>"
    );
  }

  var esc = window.UI.escapeHtml;
  var currentLang = "en";
  var pendingQuiz = null;

  /* One place decides how a quiz button reads, so the card, the video
     overlay and the scoreboard can never disagree about the lock. */
  function quizButtonMarkup(lessonId, classes, label) {
    var t = pack().quizText;
    var locked =
      window.StorageService.lockedBy(LESSONS, lessonId, PASS_PERCENT) > 0;
    return (
      '<button class="btn ' + (locked ? "btn-secondary is-locked" : classes) +
      ' js-start-quiz" data-lesson="' + esc(lessonId) + '" type="button">' +
      (locked
        ? '<span class="lock-glyph" aria-hidden="true">&#128274;</span> ' + esc(t.lockedChip)
        : esc(label)) +
      "</button>"
    );
  }

  function pack() {
    return window.LanguageService.LANGUAGES[currentLang];
  }

  /* ------------------------------------------------------------------------
     Theme. Bound once, here. index.html applies the stored value before
     first paint; this only handles the toggle afterwards.
     ------------------------------------------------------------------------ */
  function currentTheme() {
    return document.documentElement.getAttribute("data-theme") === "dark"
      ? "dark"
      : "light";
  }

  function applyTheme(theme) {
    var btn = document.getElementById("theme-toggle");
    var isDark = theme === "dark";

    if (isDark) {
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }

    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch (e) {
      /* Private mode: the theme simply will not persist. */
    }

    if (btn) {
      btn.setAttribute(
        "aria-label",
        isDark ? "Switch to light theme" : "Switch to dark theme"
      );
    }

    // Tints the Android status bar of the installed PWA.
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", isDark ? "#15130f" : "#fbf9f4");
  }

  function setupTheme() {
    var btn = document.getElementById("theme-toggle");
    if (!btn) return;

    applyTheme(currentTheme());

    btn.addEventListener("click", function () {
      applyTheme(currentTheme() === "dark" ? "light" : "dark");
    });

    // Follows the OS only while the student has never chosen for themselves.
    var media = window.matchMedia("(prefers-color-scheme: dark)");
    var onChange = function (event) {
      var stored = null;
      try {
        stored = localStorage.getItem(THEME_KEY);
      } catch (e) {
        /* ignore */
      }
      if (!stored) applyTheme(event.matches ? "dark" : "light");
    };

    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", onChange);
    } else if (typeof media.addListener === "function") {
      media.addListener(onChange);
    }
  }

  /* ------------------------------------------------------------------------
     Navigation. One observer decides the current section; there is no
     second implementation to disagree with it.
     ------------------------------------------------------------------------ */
  function setupNav() {
    var links = Array.prototype.slice.call(document.querySelectorAll(".nav-link"));
    var toggle = document.getElementById("menu-toggle");
    var menu = document.getElementById("nav-menu");
    if (!links.length) return;

    function setCurrent(id) {
      links.forEach(function (link) {
        if (link.dataset.nav === id) {
          link.setAttribute("aria-current", "true");
        } else {
          link.removeAttribute("aria-current");
        }
      });
    }

    var sections = links
      .map(function (link) {
        return document.getElementById(link.dataset.nav);
      })
      .filter(Boolean);

    if ("IntersectionObserver" in window && sections.length) {
      var observer = new IntersectionObserver(
        function (entries) {
          // The section closest to the top of the viewport wins, so two
          // simultaneously-visible sections can never fight.
          var best = null;
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            if (!best || entry.boundingClientRect.top < best.boundingClientRect.top) {
              best = entry;
            }
          });
          if (best) setCurrent(best.target.id);
        },
        { rootMargin: "-20% 0px -70% 0px", threshold: 0 }
      );
      sections.forEach(function (section) {
        observer.observe(section);
      });
    }

    setCurrent("top");

    function closeMenu() {
      if (!menu) return;
      menu.classList.remove("is-open");
      if (toggle) toggle.setAttribute("aria-expanded", "false");
    }

    if (toggle && menu) {
      toggle.addEventListener("click", function () {
        var open = menu.classList.toggle("is-open");
        toggle.setAttribute("aria-expanded", String(open));
      });
    }

    links.forEach(function (link) {
      link.addEventListener("click", closeMenu);
    });

    document.addEventListener("click", function (event) {
      if (!menu || !menu.classList.contains("is-open")) return;
      if (menu.contains(event.target) || (toggle && toggle.contains(event.target))) return;
      closeMenu();
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 760) closeMenu();
    });
  }

  /* ------------------------------------------------------------------------
     Progress. This is the single writer of #progress-fill. It reflects quiz
     completion, which is what the label claims.
     ------------------------------------------------------------------------ */
  function renderProgress() {
    var t = pack().quizText;
    var passed = 0;
    var attempted = 0;

    LESSONS.forEach(function (id) {
      var stats = window.StorageService.getLessonStats(id);
      if (stats.bestPercent >= PASS_PERCENT) passed++;
      if (stats.attempts > 0) attempted++;
    });

    var percent = Math.round((passed / LESSONS.length) * 100);

    var fill = document.getElementById("progress-fill");
    if (fill) fill.style.width = percent + "%";

    // Total stars is the headline figure: it counts up as they work, and
    // unlike a percentage it never goes down or reads as a grade.
    var totalStars = 0;
    LESSONS.forEach(function (id) {
      totalStars += starCount(window.StorageService.getLessonStats(id).bestPercent);
    });

    // A row of actual stars in the panel header, rather than a percentage.
    // "0%" on a first visit reads as a mark out of 100 and is discouraging;
    // three empty star outlines read as "these are yours to collect".
    var label = document.getElementById("progress-percent");
    if (label) {
      label.classList.add("stars", "stars-lg");
      label.setAttribute("role", "img");
      label.setAttribute(
        "aria-label",
        totalStars + " " + (totalStars === 1 ? t.starOne : t.starMany)
      );
      var dots = "";
      for (var i = 0; i < LESSONS.length; i++) {
        dots +=
          '<span class="star' +
          (i < passed ? " is-earned" : "") +
          '"></span>';
      }
      label.innerHTML = dots;
    }

    var stats = document.getElementById("progress-stats");
    if (!stats) return;

    stats.innerHTML =
      '<div class="stat-row stat-row-stars">' +
      '<dt class="stat-label">' + esc(t.starsEarned) + "</dt>" +
      '<dd class="stat-value num">' + totalStars + " / " + LESSONS.length * 3 + "</dd>" +
      "</div>" +
      row(t.lessonsPassed, passed + " / " + LESSONS.length) +
      row(t.quizzesAttempted, attempted + " / " + LESSONS.length);

    function row(label, value) {
      return (
        '<div class="stat-row">' +
        '<dt class="stat-label">' + esc(label) + "</dt>" +
        '<dd class="stat-value num">' + esc(value) + "</dd>" +
        "</div>"
      );
    }
  }

  /* ------------------------------------------------------------------------
     Lessons
     ------------------------------------------------------------------------ */
  function videoMarkup(lessonId, lessonTitle) {
    var raw = window.LanguageService.LESSON_VIDEO_MAP[lessonId][currentLang];
    var isYouTube = raw.indexOf("youtube.com") !== -1 || raw.indexOf("youtu.be") !== -1;

    if (isYouTube) {
      var id = youTubeId(raw);
      return (
        '<div class="video-frame">' +
        '<iframe class="lesson-video" src="https://www.youtube.com/embed/' +
        esc(id) +
        '?rel=0" title="' +
        esc(lessonTitle) +
        '" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe>' +
        "</div>"
      );
    }

    var t = pack().quizText;
    return (
      '<div class="video-frame">' +
      '<video class="lesson-video" controls preload="metadata" playsinline poster="assets/videos/posters/' +
      esc(lessonId) +
      '.jpg" aria-label="' +
      esc(lessonTitle) +
      '">' +
      '<source class="lesson-video-source" data-lesson="' +
      esc(lessonId) +
      '" src="' +
      esc(encodeURI(raw)) +
      '" type="video/mp4" />' +
      "</video>" +
      '<div class="video-overlay" data-overlay="' + esc(lessonId) + '">' +
      "<p>" + esc(t.readyForQuiz) + "</p>" +
      quizButtonMarkup(lessonId, "btn-primary", t.takeQuiz) +
      "</div>" +
      "</div>"
    );
  }

  function youTubeId(url) {
    try {
      var parsed = new URL(url);
      if (parsed.hostname.indexOf("youtu.be") !== -1) {
        return parsed.pathname.slice(1);
      }
      if (parsed.pathname.indexOf("/embed/") !== -1) {
        return parsed.pathname.split("/embed/")[1].split("/")[0];
      }
      return parsed.searchParams.get("v") || "";
    } catch (e) {
      var match = url.match(/(?:youtu\.be\/|\/embed\/|watch\?v=)([^?&/]+)/);
      return match ? match[1] : "";
    }
  }

  function renderLessons() {
    var p = pack();
    var t = p.quizText;
    var list = document.getElementById("lesson-list");
    if (!list) return;

    list.innerHTML = LESSONS.map(function (lessonId, index) {
      var lesson = p.lessonsData[lessonId];
      var stats = window.StorageService.getLessonStats(lessonId);
      var isPassed = stats.bestPercent >= PASS_PERCENT;
      var blocker = window.StorageService.lockedBy(LESSONS, lessonId, PASS_PERCENT);
      var isLocked = blocker > 0;

      // Empty state: a student who has not tried this yet is told so
      // plainly, rather than being shown a score of 0 that reads as failure.
      var chip =
        stats.attempts === 0
          ? '<span class="chip chip-empty">' + esc(t.notStarted) + "</span>"
          : '<span class="chip' +
            (isPassed ? " chip-passed" : "") +
            '">' +
            esc(t.best) +
            ' <span class="num">' +
            stats.highestScore +
            "/" +
            QUESTIONS_PER_QUIZ +
            "</span></span>";

      var attemptChip =
        stats.attempts > 0
          ? '<span class="chip">' +
            esc(t.attempts) +
            ' <span class="num">' +
            stats.attempts +
            "</span></span>"
          : "";

      return (
        '<article class="lesson reveal lesson-' +
        (index + 1) +
        (isPassed ? " is-passed" : "") +
        '" id="' +
        esc(lessonId) +
        '">' +
        '<div class="lesson-index" aria-hidden="true">' + (index + 1) + "</div>" +
        '<div class="lesson-body">' +
        '<div class="lesson-head">' +
        '<div class="lesson-figure ' +
        FIGURES[index] +
        '" role="img" aria-label="' +
        esc(t.figureLabel) +
        '"></div>' +
        "<div>" +
        "<h3>" + esc(lesson.title) + "</h3>" +
        // The formal maths name is kept, quietly, so a teacher can still tell
        // which lesson is which. The child reads the plain title above it.
        (lesson.formalTitle
          ? '<p class="lesson-formal">' + esc(lesson.formalTitle) + "</p>"
          : "") +
        '<p class="lesson-desc">' + esc(lesson.description) + "</p>" +
        "</div>" +
        "</div>" +
        '<div class="lesson-meta">' +
        starsMarkup(stats.bestPercent, t) +
        chip +
        attemptChip +
        "</div>" +
        '<ul class="objectives">' +
        lesson.objectives
          .map(function (objective) {
            return "<li>" + esc(objective) + "</li>";
          })
          .join("") +
        "</ul>" +
        '<button class="btn ' +
        (isLocked ? "btn-secondary is-locked" : "btn-primary") +
        ' js-start-quiz" data-lesson="' +
        esc(lessonId) +
        '" type="button"' +
        (isLocked
          ? ' aria-describedby="lock-note-' + esc(lessonId) + '">' +
            '<span class="lock-glyph" aria-hidden="true">&#128274;</span> ' +
            esc(t.lockedChip)
          : ">" + esc(isPassed ? t.retakeQuiz : t.takeQuiz)) +
        "</button>" +
        (isLocked
          ? '<p class="lock-note" id="lock-note-' + esc(lessonId) + '">' +
            esc(interpolate(t.lockedBody, { n: blocker, p: PASS_PERCENT })) +
            "</p>"
          : "") +
        "</div>" +
        '<div class="lesson-aside">' +
        videoMarkup(lessonId, lesson.title) +
        "</div>" +
        "</article>"
      );
    }).join("");

    bindVideos();
  }

  function bindVideos() {
    var t = pack().quizText;
    var music = document.getElementById("bgMusic");
    var musicToggle = document.getElementById("music-toggle");
    var videos = document.querySelectorAll("video.lesson-video");

    Array.prototype.forEach.call(videos, function (video) {
      video.addEventListener("play", function () {
        // A lesson has audio of its own, so the background track stops and
        // the settings switch is updated to match reality.
        if (music && !music.paused) {
          music.pause();
          if (musicToggle) musicToggle.checked = false;
          try {
            localStorage.setItem("musicEnabled", "false");
          } catch (e) {
            /* ignore */
          }
        }

        var overlay = video.parentElement.querySelector(".video-overlay");
        if (overlay) overlay.classList.remove("is-visible");

        Array.prototype.forEach.call(videos, function (other) {
          if (other !== video) other.pause();
        });
      });

      video.addEventListener("ended", function () {
        var overlay = video.parentElement.querySelector(".video-overlay");
        if (overlay) overlay.classList.add("is-visible");
      });
    });

    // <source> fires error, and does not bubble, when the file is absent.
    Array.prototype.forEach.call(
      document.querySelectorAll("source.lesson-video-source"),
      function (source) {
        source.addEventListener("error", function () {
          var frame = source.closest(".video-frame");
          if (!frame) return;
          var lessonId = source.dataset.lesson;

          var missing = document.createElement("div");
          missing.className = "video-missing";
          missing.innerHTML =
            '<p class="video-missing-title">' + esc(t.videoSoonTitle) + "</p>" +
            '<p class="video-missing-body">' + esc(t.videoSoonBody) + "</p>" +
            quizButtonMarkup(lessonId, "btn-secondary", t.takeQuiz);

          frame.replaceWith(missing);
        });
      }
    );
  }

  /* ------------------------------------------------------------------------
     Scoreboard
     ------------------------------------------------------------------------ */
  function renderDashboard() {
    var p = pack();
    var t = p.quizText;
    var container = document.getElementById("quiz-dashboard");
    if (!container) return;

    var rows = LESSONS.map(function (lessonId, index) {
      var stats = window.StorageService.getLessonStats(lessonId);
      var isPassed = stats.bestPercent >= PASS_PERCENT;
      var untouched = stats.attempts === 0;
      var isLocked =
        window.StorageService.lockedBy(LESSONS, lessonId, PASS_PERCENT) > 0;

      return (
        '<tr' + (isLocked ? ' class="is-locked-row"' : "") + ">" +
        '<td class="score-title">' +
        esc(t.quiz) + " " + (index + 1) +
        "<small>" + esc(p.lessonsData[lessonId].title) + "</small>" +
        "</td>" +
        '<td class="col-stars" data-label="' + esc(t.stars) + '">' +
        starsMarkup(stats.bestPercent, t) +
        "</td>" +
        '<td class="col-num" data-label="' + esc(t.highestScore) + '">' +
        (untouched
          ? '<span class="score-empty">&mdash;</span>'
          : '<span class="num">' + stats.highestScore + "/" + QUESTIONS_PER_QUIZ + "</span>") +
        "</td>" +
        '<td class="col-num" data-label="' + esc(t.bestPercentage) + '">' +
        (untouched
          ? '<span class="score-empty">&mdash;</span>'
          : '<span class="num">' + stats.bestPercent + "%</span>") +
        "</td>" +
        '<td class="col-num" data-label="' + esc(t.attempts) + '">' +
        '<span class="num">' + stats.attempts + "</span>" +
        "</td>" +
        '<td class="col-action">' +
        '<button class="btn ' +
        (isLocked ? "btn-secondary is-locked" : untouched ? "btn-primary" : "btn-secondary") +
        ' js-start-quiz" data-lesson="' +
        esc(lessonId) +
        '" type="button">' +
        (isLocked
          ? '<span class="lock-glyph" aria-hidden="true">&#128274;</span> ' + esc(t.lockedChip)
          : esc(untouched ? t.start : isPassed ? t.retake : t.tryAgain)) +
        "</button>" +
        "</td>" +
        "</tr>"
      );
    }).join("");

    var unlocked = window.StorageService.allPassed(LESSONS, PASS_PERCENT);

    container.innerHTML =
      '<div class="scoreboard">' +
      "<table>" +
      "<caption class=\"visually-hidden\">" + esc(t.scoreboardCaption) + "</caption>" +
      "<thead><tr>" +
      "<th scope=\"col\">" + esc(t.quiz) + "</th>" +
      "<th scope=\"col\">" + esc(t.stars) + "</th>" +
      "<th scope=\"col\" class=\"col-num\">" + esc(t.highestScore) + "</th>" +
      "<th scope=\"col\" class=\"col-num\">" + esc(t.bestPercentage) + "</th>" +
      "<th scope=\"col\" class=\"col-num\">" + esc(t.attempts) + "</th>" +
      "<th scope=\"col\"><span class=\"visually-hidden\">" + esc(t.action) + "</span></th>" +
      "</tr></thead>" +
      "<tbody>" + rows + "</tbody>" +
      "</table>" +
      "</div>" +
      '<div class="certificate-cta' + (unlocked ? " is-unlocked" : "") + '">' +
      '<div class="certificate-cta-text">' +
      "<h3>" + esc(t.certTitle) + "</h3>" +
      "<p>" + esc(unlocked ? t.unlocked : t.unlockHint) + "</p>" +
      "</div>" +
      '<button class="btn btn-primary" id="print-certificate-btn" type="button"' +
      (unlocked ? "" : " disabled") +
      ">" +
      esc(t.printCertificate) +
      "</button>" +
      "</div>";

    if (unlocked) {
      var btn = document.getElementById("print-certificate-btn");
      if (btn) btn.addEventListener("click", openCertificate);
    }
  }

  /* ------------------------------------------------------------------------
     Certificate
     ------------------------------------------------------------------------ */
  function openCertificate() {
    var t = pack().quizText;
    var modal = document.getElementById("certificate-modal");
    var body = document.getElementById("certificate-body");
    if (!modal || !body) return;

    var total = 0;
    var totalStars = 0;
    LESSONS.forEach(function (id) {
      var lessonStats = window.StorageService.getLessonStats(id);
      total += lessonStats.bestPercent;
      totalStars += starCount(lessonStats.bestPercent);
    });
    var average = Math.round(total / LESSONS.length);

    // One star per lesson on the award, filled for each lesson passed, so the
    // row reads as "these are the four lessons you finished".
    var certStars = "";
    LESSONS.forEach(function (id) {
      var earned =
        window.StorageService.getLessonStats(id).bestPercent >= PASS_PERCENT;
      certStars +=
        '<span class="star' + (earned ? " is-earned" : "") + '"></span>';
    });

    var date = new Date().toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric"
    });

    body.innerHTML =
      '<article class="certificate">' +
      '<div class="certificate-seal" aria-hidden="true"><span>3</span><span>4</span></div>' +
      '<h2 id="certificate-title">' + esc(t.certTitle) + "</h2>" +
      // The stars the child actually collected, printed on the award. This is
      // the thing they will want to show someone.
      '<div class="stars stars-lg certificate-stars" role="img" aria-label="' +
      esc(totalStars + " " + (totalStars === 1 ? t.starOne : t.starMany)) +
      '">' + certStars + "</div>" +
      '<p class="certificate-awarded">' + esc(t.certAwarded) + "</p>" +
      '<p class="certificate-name">' +
      esc(window.StorageService.getUserName() || t.defaultLearner) +
      "</p>" +
      '<p class="certificate-body">' + esc(t.certBody) + "</p>" +
      '<dl class="certificate-meta">' +
      "<div><dt>" + esc(t.certDate) + "</dt><dd>" + esc(date) + "</dd></div>" +
      "<div><dt>" + esc(t.bestPercentage) + "</dt><dd>" + average + "%</dd></div>" +
      "<div><dt>" + esc(t.lessonsPassed) + "</dt><dd>" +
      LESSONS.length + "/" + LESSONS.length + "</dd></div>" +
      "</dl>" +
      '<div class="certificate-actions">' +
      '<button id="close-certificate" class="btn btn-secondary" type="button">' +
      esc(t.certClose) +
      "</button>" +
      '<button id="print-certificate-now" class="btn btn-primary" type="button">' +
      esc(t.certPrint) +
      "</button>" +
      "</div>" +
      "</article>";

    window.UI.openModal(modal);

    document
      .getElementById("close-certificate")
      .addEventListener("click", function () {
        window.UI.closeModal(modal);
      });
    document
      .getElementById("print-certificate-now")
      .addEventListener("click", function () {
        window.print();
      });
  }

  /* ------------------------------------------------------------------------
     Locked quiz notice
     ------------------------------------------------------------------------ */
  function interpolate(template, values) {
    return String(template).replace(/\{(\w+)\}/g, function (match, key) {
      return Object.prototype.hasOwnProperty.call(values, key) ? values[key] : match;
    });
  }

  function showLockedNotice(blockerNumber) {
    var t = pack().quizText;
    var modal = document.getElementById("locked-modal");
    if (!modal) return;

    var values = { n: blockerNumber, p: PASS_PERCENT };
    document.getElementById("locked-title").textContent = interpolate(t.lockedTitle, values);
    document.getElementById("locked-body").textContent = interpolate(t.lockedBody, values);

    var goBtn = document.getElementById("locked-go");
    goBtn.textContent = interpolate(t.lockedGo, values);

    var dismissBtn = document.getElementById("locked-dismiss");
    dismissBtn.textContent = t.certClose;

    function cleanup() {
      goBtn.removeEventListener("click", onGo);
      dismissBtn.removeEventListener("click", onDismiss);
    }

    function onGo() {
      cleanup();
      window.UI.closeModal(modal);
      // Send them to the quiz that is actually blocking progress.
      window.setTimeout(function () {
        requestQuiz(LESSONS[blockerNumber - 1]);
      }, 180);
    }

    function onDismiss() {
      cleanup();
      window.UI.closeModal(modal);
    }

    goBtn.addEventListener("click", onGo);
    dismissBtn.addEventListener("click", onDismiss);

    window.UI.openModal(modal, { focus: "#locked-go" });
    window.UI.bindBackdrop(modal);
    window.UI.setEscapeHandler(modal);
  }

  /* ------------------------------------------------------------------------
     Name gate
     ------------------------------------------------------------------------ */
  function requestQuiz(lessonId) {
    // Quizzes open in order. Enforced here rather than only on the buttons,
    // so a stale card or a keyboard shortcut cannot slip past the lock.
    var blocker = window.StorageService.lockedBy(LESSONS, lessonId, PASS_PERCENT);
    if (blocker > 0) {
      showLockedNotice(blocker);
      return;
    }

    if (window.StorageService.getUserName()) {
      window.QuizService.startQuiz(lessonId, currentLang);
      return;
    }

    pendingQuiz = lessonId;
    var modal = document.getElementById("name-modal");
    var input = document.getElementById("user-name-input");
    var error = document.getElementById("name-error");

    if (input) {
      input.value = "";
      input.removeAttribute("aria-invalid");
    }
    if (error) error.textContent = "";

    window.UI.openModal(modal, { focus: "#user-name-input" });
  }

  function setupNameModal() {
    var modal = document.getElementById("name-modal");
    var form = document.getElementById("name-form");
    var input = document.getElementById("user-name-input");
    var error = document.getElementById("name-error");
    var closeBtn = document.getElementById("close-name-modal");
    if (!modal || !form) return;

    closeBtn.addEventListener("click", function () {
      window.UI.closeModal(modal);
    });
    window.UI.bindBackdrop(modal);

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var name = input.value.trim();

      // Inline validation. Previously an empty name silently did nothing,
      // which left the student pressing a button that appeared broken.
      if (!name) {
        input.setAttribute("aria-invalid", "true");
        error.textContent = pack().quizText.nameRequired;
        input.focus();
        return;
      }

      input.removeAttribute("aria-invalid");
      error.textContent = "";
      window.StorageService.saveUserName(name);
      window.UI.closeModal(modal);

      if (pendingQuiz) {
        var lessonId = pendingQuiz;
        pendingQuiz = null;
        window.setTimeout(function () {
          window.QuizService.startQuiz(lessonId, currentLang);
        }, 180);
      }
    });

    input.addEventListener("input", function () {
      if (input.value.trim()) {
        input.removeAttribute("aria-invalid");
        error.textContent = "";
      }
    });
  }

  /* ------------------------------------------------------------------------
     Settings
     ------------------------------------------------------------------------ */
  function setupSettings() {
    var modal = document.getElementById("settings-modal");
    var open = document.getElementById("settings-toggle");
    var close = document.getElementById("close-settings-modal");
    if (!modal || !open) return;

    open.addEventListener("click", function () {
      window.UI.openModal(modal);
    });
    close.addEventListener("click", function () {
      window.UI.closeModal(modal);
    });
    window.UI.bindBackdrop(modal);

    var select = document.getElementById("language-select");
    if (select) {
      select.addEventListener("change", function () {
        applyLanguage(select.value);
      });
    }
  }

  /* ------------------------------------------------------------------------
     Saving videos for offline use.

     The service worker serves videos out of the MEDIA cache once they are
     here, and streams them from the network until then, so this is the only
     thing standing between the app and working in airplane mode.
     ------------------------------------------------------------------------ */
  var VIDEO_CACHE = "ff-media";

  function videoUrls() {
    var urls = [];
    LESSONS.forEach(function (id) {
      var byLang = window.LanguageService.LESSON_VIDEO_MAP[id];
      for (var lang in byLang) {
        if (Object.prototype.hasOwnProperty.call(byLang, lang)) urls.push(byLang[lang]);
      }
    });
    return urls;
  }

  var refreshOfflineLabel = null;

  function setupOfflineVideos() {
    var btn = document.getElementById("offline-download");
    var wrap = document.getElementById("offline-progress");
    var bar = document.getElementById("offline-bar-fill");
    var status = document.getElementById("offline-status");
    if (!btn || !("caches" in window)) {
      if (btn) btn.hidden = true;
      return;
    }

    var urls = videoUrls();
    // How many of those URLs actually exist; known only after a run.
    var available = urls.length;

    function label(saved) {
      var t = pack().quizText;
      var complete = saved > 0 && saved >= available;
      btn.textContent = complete ? t.videosSaved : t.saveVideos;
      btn.disabled = complete;
    }

    async function savedCount() {
      try {
        var cache = await caches.open(VIDEO_CACHE);
        var keys = await cache.keys();
        return keys.length;
      } catch (e) {
        return 0;
      }
    }

    refreshOfflineLabel = function () {
      savedCount().then(function (n) {
        // A previous session already proved how many exist.
        if (n > 0 && n < available) available = n;
        label(n);
      });
    };
    refreshOfflineLabel();

    btn.addEventListener("click", async function () {
      var t = pack().quizText;
      btn.disabled = true;
      wrap.hidden = false;
      bar.style.width = "0%";

      var cache = await caches.open(VIDEO_CACHE);
      var done = 0;
      var missing = 0;
      var failed = 0;

      for (var i = 0; i < urls.length; i++) {
        status.textContent = interpolate(t.savingVideos, { a: i + 1, b: urls.length });
        try {
          // Files this large are fetched one at a time on purpose: a phone on
          // a weak connection handles a single stream far better than twelve.
          var res = await fetch(urls[i], { cache: "reload" });
          if (res.ok) {
            await cache.put(urls[i], res);
            done++;
          } else if (res.status === 404) {
            // Not yet produced (a lesson still being filmed). Not a failure:
            // that lesson shows its "coming soon" card either way.
            missing++;
          } else {
            failed++;
          }
        } catch (e) {
          failed++;
        }
        bar.style.width = Math.round(((i + 1) / urls.length) * 100) + "%";
      }

      // Only files that exist can be saved, so success is measured against
      // those. Counting toward a video that has not been made yet would nag
      // forever about a total that is unreachable.
      available = done + failed;
      status.textContent = failed
        ? interpolate(t.videosPartial, { a: done, b: available })
        : t.videosReady;
      label(done);

      // Ask Android not to evict this under storage pressure. Usually granted
      // to an installed app; harmless when it is not.
      if (navigator.storage && navigator.storage.persist) {
        navigator.storage.persist().catch(function () {});
      }
    });
  }

  function setupCertificateModal() {
    var modal = document.getElementById("certificate-modal");
    if (!modal) return;
    document
      .getElementById("close-certificate-modal")
      .addEventListener("click", function () {
        window.UI.closeModal(modal);
      });
    window.UI.bindBackdrop(modal);
  }

  /* ------------------------------------------------------------------------
     Background music
     ------------------------------------------------------------------------ */
  function setupMusic() {
    var audio = document.getElementById("bgMusic");
    var toggle = document.getElementById("music-toggle");
    if (!audio || !toggle) return;

    var enabled = false;
    try {
      enabled = localStorage.getItem("musicEnabled") === "true";
    } catch (e) {
      /* ignore */
    }
    toggle.checked = enabled;

    if (enabled) {
      // Browsers block autoplay until the page has been interacted with, so
      // the first gesture starts it instead of failing silently.
      audio.play().catch(function () {
        var resume = function () {
          if (toggle.checked) audio.play().catch(function () {});
          document.removeEventListener("pointerdown", resume);
        };
        document.addEventListener("pointerdown", resume, { once: true });
      });
    }

    toggle.addEventListener("change", function () {
      try {
        localStorage.setItem("musicEnabled", String(toggle.checked));
      } catch (e) {
        /* ignore */
      }
      if (toggle.checked) {
        audio.play().catch(function () {});
      } else {
        audio.pause();
        audio.currentTime = 0;
      }
    });
  }

  /* ------------------------------------------------------------------------
     Language. Applies every translated string on the page in one pass via
     the data-i18n attributes, so adding a string to language.js no longer
     requires a matching querySelector here.
     ------------------------------------------------------------------------ */
  function lookup(path) {
    return path.split(".").reduce(function (node, key) {
      return node && node[key] !== undefined ? node[key] : undefined;
    }, pack());
  }

  function applyLanguage(lang) {
    if (!window.LanguageService.LANGUAGES[lang]) return;
    currentLang = lang;
    window.StorageService.saveLanguage(lang);
    document.documentElement.lang = lang === "bi" ? "ceb" : lang;

    var select = document.getElementById("language-select");
    if (select) select.value = lang;

    Array.prototype.forEach.call(
      document.querySelectorAll("[data-i18n]"),
      function (el) {
        var value = lookup(el.dataset.i18n);
        if (typeof value === "string") el.textContent = value;
      }
    );

    Array.prototype.forEach.call(
      document.querySelectorAll("[data-i18n-placeholder]"),
      function (el) {
        var value = lookup(el.dataset.i18nPlaceholder);
        if (typeof value === "string") el.placeholder = value;
      }
    );

    // The offline button's label depends on cache state, not just the
    // language pack, so it is refreshed by its own module.
    if (typeof refreshOfflineLabel === "function") refreshOfflineLabel();

    // Nav labels come from the ordered `nav` array in the language pack.
    var navLabels = pack().nav;
    Array.prototype.forEach.call(
      document.querySelectorAll(".nav-link"),
      function (link, index) {
        if (navLabels[index]) link.textContent = navLabels[index];
      }
    );

    renderAll();
  }

  function renderAll() {
    renderLessons();
    renderDashboard();
    renderProgress();
    window.UI.observeReveals();
  }

  /* ------------------------------------------------------------------------
     One delegated handler for every "start quiz" button on the page. These
     buttons are re-rendered constantly, so delegation avoids rebinding and
     the listener leaks that came with it.
     ------------------------------------------------------------------------ */
  function setupQuizLaunchers() {
    document.addEventListener("click", function (event) {
      var btn = event.target.closest(".js-start-quiz");
      if (!btn) return;
      event.preventDefault();
      requestQuiz(btn.dataset.lesson);
    });
  }

  function init() {
    var saved = window.StorageService.getLanguage();
    if (window.LanguageService.LANGUAGES[saved]) currentLang = saved;

    var year = document.getElementById("year");
    if (year) year.textContent = new Date().getFullYear();

    setupTheme();
    setupNav();
    setupSettings();
    setupOfflineVideos();
    setupNameModal();
    setupCertificateModal();
    setupMusic();
    setupQuizLaunchers();

    applyLanguage(currentLang);
    window.Motion.init();
  }

  window.AppService = {
    renderAll: renderAll,
    getLanguage: function () {
      return currentLang;
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
