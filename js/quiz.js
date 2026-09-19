/* ==========================================================================
   Quiz engine.

   The grading rules are unchanged from the original: questions and choices
   are shuffled per attempt, an answer counts as correct when it matches the
   recorded id OR is mathematically equivalent to the correct choice, and the
   pass mark is 70%. Only presentation and state handling changed.
   ========================================================================== */
(function () {
  "use strict";

  var PASS_PERCENT = 70;
  var SECONDS_PER_QUESTION = 180;
  var WARN_AT_SECONDS = 30;
  var esc = window.UI.escapeHtml;

  var state = {
    lessonId: null,
    lang: "en",
    quiz: null,
    index: 0,
    score: 0,
    selected: null,
    answers: [],
    finished: false,
    locked: false
  };

  /* ------------------------------------------------------------------------
     Per-question countdown. One interval lives at a time; every path that
     leaves a question (answering, going back, finishing, closing the modal)
     must call stopTimer, or a stale interval keeps running against the next
     question and expires it early.
     ------------------------------------------------------------------------ */
  var timer = { id: null, remaining: 0, onExpire: null };

  function stopTimer() {
    if (timer.id !== null) {
      window.clearInterval(timer.id);
      timer.id = null;
    }
  }

  function formatClock(seconds) {
    var m = Math.floor(seconds / 60);
    var s = seconds % 60;
    return m + ":" + (s < 10 ? "0" : "") + s;
  }

  function paintClock() {
    var el = body.querySelector("#quiz-timer");
    if (!el) return;
    el.textContent = formatClock(timer.remaining);
    el.classList.toggle("is-warning", timer.remaining <= WARN_AT_SECONDS);
    // Announce only at the warning threshold; a live region that speaks
    // every second would make the quiz unusable with a screen reader.
    el.setAttribute("aria-live", timer.remaining === WARN_AT_SECONDS ? "assertive" : "off");
  }

  function runTimer(seconds) {
    stopTimer();
    timer.remaining = seconds;
    paintClock();
    timer.id = window.setInterval(function () {
      timer.remaining--;
      paintClock();
      if (timer.remaining <= 0) {
        stopTimer();
        if (timer.onExpire) timer.onExpire();
      }
    }, 1000);
  }

  function startTimer(onExpire) {
    timer.onExpire = onExpire;
    runTimer(SECONDS_PER_QUESTION);
  }

  function resumeTimer(seconds) {
    runTimer(seconds);
  }

  var modal = document.getElementById("quiz-modal");
  var body = document.getElementById("quiz-modal-body");

  function t() {
    return window.LanguageService.LANGUAGES[state.lang].quizText;
  }

  /* ---------------------------------------------------------------------- */
  function shuffle(list) {
    var clone = list.slice();
    for (var i = clone.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = clone[i];
      clone[i] = clone[j];
      clone[j] = tmp;
    }
    return clone;
  }

  function gcd(a, b) {
    var x = Math.abs(a);
    var y = Math.abs(b);
    while (y !== 0) {
      var t = y;
      y = x % y;
      x = t;
    }
    return x || 1;
  }

  /* Parses "2 3/4", "3/4" or "5" into a normalised fraction so that two
     answers written differently but equal in value are still both accepted. */
  function parseFraction(text) {
    if (typeof text !== "string") return null;
    var trimmed = text.trim();

    var mixed = trimmed.match(/^(\d+)\s+(\d+)\/(\d+)/);
    if (mixed) {
      var whole = Number(mixed[1]);
      var num = Number(mixed[2]);
      var den = Number(mixed[3]);
      if (!den) return null;
      var numerator = whole * den + num;
      var divisor = gcd(numerator, den);
      return { n: numerator / divisor, d: den / divisor };
    }

    var simple = trimmed.match(/^(\d+)\/(\d+)/);
    if (simple) {
      var sn = Number(simple[1]);
      var sd = Number(simple[2]);
      if (!sd) return null;
      var g = gcd(sn, sd);
      return { n: sn / g, d: sd / g };
    }

    var integer = trimmed.match(/^(\d+)(?!\s*\/)/);
    if (integer) return { n: Number(integer[1]), d: 1 };

    return null;
  }

  function equivalent(a, b) {
    var left = parseFraction(a);
    var right = parseFraction(b);
    if (!left || !right) return false;
    return left.n * right.d === right.n * left.d;
  }

  /* Word problems read as prose and are set in the body face; pure
     expressions are set as maths. */
  function isProse(prompt) {
    return /[a-z]{4,}/i.test(String(prompt).replace(/\d+\/\d+/g, ""));
  }

  function buildHint(question) {
    if (typeof question.hint === "string" && question.hint.trim()) {
      return question.hint.trim();
    }
    return t().genericHint;
  }

  /* ---------------------------------------------------------------------- */
  function renderQuestion() {
    var q = state.quiz.questions[state.index];
    var total = state.quiz.questions.length;
    var isLast = state.index === total - 1;
    var strings = t();
    var hint = buildHint(q);

    var ticks = "";
    for (var i = 0; i < total; i++) {
      var cls = "q-tick";
      if (i < state.index) cls += " is-done";
      else if (i === state.index) cls += " is-current";
      ticks += '<div class="' + cls + '"></div>';
    }

    body.innerHTML =
      '<div class="quiz-head">' +
      '<h3 id="quiz-modal-title">' + esc(state.quiz.title) + "</h3>" +
      "<p>" + esc(state.quiz.description) + "</p>" +
      "</div>" +
      '<div class="quiz-progress">' +
      '<span class="q-counter">' +
      esc(strings.question) + " " + (state.index + 1) + " / " + total +
      "</span>" +
      '<span class="q-remaining">' +
      (total - state.index - 1) + " " + esc(strings.remaining) +
      "</span>" +
      '<span id="quiz-timer" class="q-timer" role="timer" aria-label="' +
      esc(strings.timeLeft) + '">' + formatClock(SECONDS_PER_QUESTION) + "</span>" +
      "</div>" +
      '<div class="q-ticks" role="progressbar" aria-valuemin="1" aria-valuemax="' +
      total + '" aria-valuenow="' + (state.index + 1) +
      '" aria-label="' + esc(strings.question) + '">' + ticks + "</div>" +
      '<p class="quiz-prompt' + (isProse(q.prompt) ? " is-prose" : "") + '">' +
      esc(q.prompt) +
      "</p>" +
      '<div class="quiz-hint">' +
      '<button id="hint-toggle" class="hint-toggle" type="button" aria-expanded="false" aria-controls="hint-panel">' +
      esc(strings.showHint) +
      "</button>" +
      '<div id="hint-panel" class="hint-panel" hidden>' +
      "<strong>" + esc(strings.hintLabel) + ":</strong> " + esc(hint) +
      "</div>" +
      "</div>" +
      '<div class="quiz-choices" role="group" aria-label="' + esc(strings.answerChoices) + '">' +
      q.choices
        .map(function (choice, index) {
          return (
            '<button class="choice-btn" data-index="' + index + '" type="button">' +
            '<span class="choice-key" aria-hidden="true">' + (index + 1) + "</span>" +
            "<span>" + esc(choice.text) + "</span>" +
            "</button>"
          );
        })
        .join("") +
      "</div>" +
      '<div class="quiz-foot">' +
      (state.index > 0
        ? '<button id="prev-btn" class="btn btn-quiet" type="button">' +
          esc(strings.prev) +
          "</button>"
        : '<span class="kbd-hint">' + esc(strings.keyboardHint) + "</span>") +
      '<button id="next-btn" class="btn btn-primary" type="button" disabled>' +
      esc(isLast ? strings.finish : strings.next) +
      "</button>" +
      "</div>";

    bindQuestion(q, isLast);
  }

  function bindQuestion(question, isLast) {
    var choices = body.querySelectorAll(".choice-btn");
    var nextBtn = body.querySelector("#next-btn");
    var prevBtn = body.querySelector("#prev-btn");
    var hintToggle = body.querySelector("#hint-toggle");
    var hintPanel = body.querySelector("#hint-panel");

    state.locked = false;

    if (hintToggle && hintPanel) {
      hintToggle.addEventListener("click", function () {
        var show = hintPanel.hidden;
        hintPanel.hidden = !show;
        hintToggle.textContent = show ? t().hideHint : t().showHint;
        hintToggle.setAttribute("aria-expanded", String(show));
      });
    }

    Array.prototype.forEach.call(choices, function (btn) {
      btn.addEventListener("click", function () {
        if (state.locked) return;
        Array.prototype.forEach.call(choices, function (other) {
          other.classList.remove("is-selected");
        });
        btn.classList.add("is-selected");
        state.selected = Number(btn.dataset.index);
        nextBtn.disabled = false;
      });
    });

    if (prevBtn) {
      prevBtn.addEventListener("click", function () {
        if (state.locked || state.index === 0) return;
        stopTimer();
        state.index--;
        // The answer being returned to is withdrawn so it cannot be counted
        // twice when it is answered again.
        var previous = state.answers.pop();
        if (previous && previous.correct) state.score--;
        state.selected = null;
        renderQuestion();
      });
    }

    // Shared by the Next button and by the timer running out, so a timeout
    // scores and advances through exactly the same path as a real answer.
    // timedOut === true means no choice was made: recorded as incorrect.
    function commit(timedOut) {
      if (state.locked) return;
      if (!timedOut && state.selected === null) return;
      state.locked = true;
      stopTimer();

      nextBtn.disabled = true;
      if (prevBtn) prevBtn.disabled = true;
      Array.prototype.forEach.call(choices, function (btn) {
        btn.disabled = true;
      });

      var canonical = question.choices.filter(function (choice) {
        return choice.id === question.correctChoiceId;
      })[0];
      var picked = timedOut ? null : question.choices[state.selected];

      var isCorrect =
        !timedOut &&
        (picked.id === question.correctChoiceId ||
          (canonical ? equivalent(picked.text, canonical.text) : false));

      // Only the student's own answer is marked. The correct choice is NOT
      // revealed here: quizzes can be retaken and the questions reshuffle,
      // so flashing the answer would let a student learn the key by
      // guessing. They see every correct answer in the solutions review
      // once the attempt is scored.
      if (isCorrect) {
        state.score++;
        choices[state.selected].classList.add("is-correct");
      } else if (!timedOut) {
        choices[state.selected].classList.add("is-wrong");
      }

      if (timedOut) {
        var note = body.querySelector("#quiz-timer");
        if (note) {
          note.textContent = t().timeUp;
          note.classList.add("is-expired");
        }
      }

      state.answers.push({
        questionId: question.id,
        selectedChoiceId: picked ? picked.id : null,
        correct: isCorrect,
        timedOut: !!timedOut
      });

      window.setTimeout(
        function () {
          state.selected = null;
          state.locked = false;
          if (isLast) {
            state.finished = true;
            renderResult();
          } else {
            state.index++;
            renderQuestion();
          }
        },
        // A moment longer on a timeout so "Time up!" registers before the
        // next question replaces it.
        timedOut ? 1200 : 850
      );
    }

    nextBtn.addEventListener("click", function () {
      commit(false);
    });

    startTimer(function () {
      commit(true);
    });
  }

  /* ---------------------------------------------------------------------- */
  function renderResult() {
    stopTimer();
    var strings = t();
    var total = state.quiz.questions.length;
    var percent = Math.round((state.score / total) * 100);
    var passed = percent >= PASS_PERCENT;
    var feedback =
      percent >= 90 ? strings.excellent : passed ? strings.good : strings.keep;

    var previousBest = window.StorageService.getLessonStats(state.lessonId).highestScore;
    var stats = window.StorageService.updateLessonStats(state.lessonId, state.score, total);

    // Stars for this attempt, shown big and first. A child reads three gold
    // stars instantly; "87%" needs a concept they have not been taught yet.
    // The percentages are still here, below, for the teacher.
    var earned =
      percent >= 100 ? 3 : percent >= 85 ? 2 : percent >= PASS_PERCENT ? 1 : 0;
    var starRow = "";
    for (var si = 0; si < 3; si++) {
      starRow +=
        '<span class="star' + (si < earned ? " is-earned" : "") + '"></span>';
    }

    body.innerHTML =
      '<section class="result">' +
      '<div class="stars stars-xl result-stars" role="img" aria-label="' +
      esc(earned + " " + (earned === 1 ? strings.starOne : strings.starMany)) +
      '">' + starRow + "</div>" +
      '<span class="result-verdict ' + (passed ? "is-pass" : "is-fail") + '">' +
      esc(passed ? strings.pass : strings.fail) +
      "</span>" +
      '<p class="result-score num">' + state.score +
      "<small>/" + total + "</small></p>" +
      '<p class="result-feedback">' + esc(feedback) + "</p>" +
      '<dl class="result-stats">' +
      '<div class="result-stat"><dt>' + esc(strings.thisAttempt) +
      "</dt><dd>" + percent + "%</dd></div>" +
      '<div class="result-stat"><dt>' + esc(strings.bestPercentage) +
      "</dt><dd>" + stats.bestPercent + "%</dd></div>" +
      '<div class="result-stat"><dt>' + esc(strings.attempts) +
      "</dt><dd>" + stats.attempts + "</dd></div>" +
      "</dl>" +
      '<div class="result-actions">' +
      '<button id="view-solutions" class="btn btn-secondary" type="button">' +
      esc(strings.viewSolutions) + "</button>" +
      '<button id="try-again" class="btn btn-primary" type="button">' +
      esc(strings.tryAgain) + "</button>" +
      '<button id="close-result" class="btn btn-quiet" type="button">' +
      esc(strings.backLessons) + "</button>" +
      "</div>" +
      "</section>";

    // Celebrate only a genuine new personal best at a high score, so the
    // effect keeps its meaning rather than firing on every pass.
    if (state.score > previousBest && percent >= 85) {
      window.Motion.confettiBurst();
    }

    if (window.AppService && typeof window.AppService.renderAll === "function") {
      window.AppService.renderAll();
    }

    body.querySelector("#view-solutions").addEventListener("click", renderSolutions);
    body.querySelector("#try-again").addEventListener("click", function () {
      startQuiz(state.lessonId, state.lang, true);
    });
    body.querySelector("#close-result").addEventListener("click", function () {
      window.UI.closeModal(modal);
      var lessons = document.getElementById("lessons");
      if (lessons) lessons.scrollIntoView({ behavior: "smooth" });
    });
  }

  /* ---------------------------------------------------------------------- */
  function renderSolutions() {
    stopTimer();
    var strings = t();

    var cards = state.quiz.questions
      .map(function (question, index) {
        var record = state.answers.filter(function (item) {
          return item.questionId === question.id;
        })[0];

        var picked = question.choices.filter(function (choice) {
          return record && choice.id === record.selectedChoiceId;
        })[0];

        var correct = question.choices.filter(function (choice) {
          return choice.id === question.correctChoiceId;
        })[0];

        var wasRight = record && record.correct;

        return (
          '<article class="solution ' + (wasRight ? "is-correct" : "is-wrong") + '">' +
          '<div class="solution-head">' +
          "<span>" + esc(strings.question) + " " + (index + 1) + "</span>" +
          '<span class="badge ' + (wasRight ? "is-ok" : "is-no") + '">' +
          esc(wasRight ? strings.correct : strings.incorrect) +
          "</span>" +
          "</div>" +
          '<p class="solution-prompt">' + esc(question.prompt) + "</p>" +
          '<dl class="solution-answers">' +
          "<div><dt>" + esc(strings.yourAnswer) + "</dt><dd>" +
          esc(picked ? picked.text : strings.noAnswer) + "</dd></div>" +
          "<div><dt>" + esc(strings.correctAnswer) + "</dt><dd>" +
          esc(correct ? correct.text : "") + "</dd></div>" +
          "</dl>" +
          '<div class="solution-steps"><strong>' + esc(strings.steps) + "</strong>" +
          esc(question.explanation) + "</div>" +
          "</article>"
        );
      })
      .join("");

    body.innerHTML =
      '<div class="quiz-head"><h3 id="quiz-modal-title">' +
      esc(strings.viewSolutions) +
      "</h3></div>" +
      '<div class="solution-list">' + cards + "</div>" +
      '<div class="result-actions">' +
      '<button id="back-to-result" class="btn btn-secondary" type="button">' +
      esc(strings.backToScore) +
      "</button>" +
      "</div>";

    body.querySelector("#back-to-result").addEventListener("click", renderResult);
    // A long review list would otherwise stay scrolled to where the result
    // panel left off.
    modal.querySelector(".modal-panel").scrollTop = 0;
  }

  /* ---------------------------------------------------------------------- */
  function renderSkeleton() {
    stopTimer();
    body.innerHTML =
      '<div class="quiz-head"><h3 id="quiz-modal-title">' +
      esc(t().loadingQuiz) +
      "</h3></div>" +
      '<div class="skeleton skeleton-prompt"></div>' +
      '<div class="skeleton skeleton-choice"></div>' +
      '<div class="skeleton skeleton-choice"></div>' +
      '<div class="skeleton skeleton-choice"></div>' +
      '<div class="skeleton skeleton-choice"></div>';
  }

  function renderError() {
    stopTimer();
    var strings = t();
    var isFileProtocol = window.location.protocol === "file:";

    body.innerHTML =
      '<div class="state-message is-error">' +
      "<h4>" + esc(strings.errorTitle) + "</h4>" +
      "<p>" +
      esc(isFileProtocol ? strings.errorFileProtocol : strings.errorGeneric) +
      "</p>" +
      (isFileProtocol
        ? "<p><code>python -m http.server 8000</code></p>"
        : "") +
      '<div class="result-actions">' +
      '<button id="retry-quiz" class="btn btn-primary" type="button">' +
      esc(strings.retry) +
      "</button>" +
      "</div>" +
      "</div>";

    body.querySelector("#retry-quiz").addEventListener("click", function () {
      startQuiz(state.lessonId, state.lang, true);
    });
  }

  /* ---------------------------------------------------------------------- */
  function startQuiz(lessonId, lang, forceRestart) {
    // Returning to an attempt already in progress resumes it rather than
    // discarding the student's answers.
    if (
      !forceRestart &&
      state.quiz &&
      state.lessonId === lessonId &&
      state.lang === lang &&
      !state.finished
    ) {
      window.UI.openModal(modal);
      return;
    }

    stopTimer();
    state.lessonId = lessonId;
    state.lang = lang;
    state.index = 0;
    state.score = 0;
    state.selected = null;
    state.answers = [];
    state.finished = false;
    state.locked = false;
    state.quiz = null;

    window.UI.openModal(modal);
    renderSkeleton();

    fetch("quizzes/json/" + lessonId + "-" + lang + ".json")
      .then(function (response) {
        if (!response.ok) throw new Error("HTTP " + response.status);
        return response.json();
      })
      .then(function (raw) {
        state.quiz = {
          title: raw.title,
          description: raw.description,
          questions: shuffle(raw.questions).map(function (question) {
            var copy = {};
            for (var key in question) {
              if (Object.prototype.hasOwnProperty.call(question, key)) {
                copy[key] = question[key];
              }
            }
            copy.choices = shuffle(question.choices);
            return copy;
          })
        };
        renderQuestion();
      })
      .catch(function (error) {
        console.error("Quiz load failed:", error);
        renderError();
      });
  }

  /* ------------------------------------------------------------------------
     Closing mid-attempt asks for confirmation through a real dialog rather
     than window.confirm(), which could not be translated or styled.
     ------------------------------------------------------------------------ */
  function requestClose() {
    var inProgress = state.quiz && !state.finished && state.answers.length > 0;
    if (!inProgress) {
      stopTimer();
      window.UI.closeModal(modal);
      return;
    }

    // Hold the clock while the student decides whether to quit, so the
    // question cannot expire behind the confirmation dialog.
    var heldAt = timer.remaining;
    stopTimer();

    var confirmModal = document.getElementById("confirm-modal");
    window.UI.openModal(confirmModal, { focus: "#confirm-cancel" });

    var ok = document.getElementById("confirm-ok");
    var cancel = document.getElementById("confirm-cancel");

    function cleanup() {
      ok.removeEventListener("click", onOk);
      cancel.removeEventListener("click", onCancel);
    }

    function onOk() {
      cleanup();
      window.UI.closeModal(confirmModal);
      window.UI.closeModal(modal);
    }

    function onCancel() {
      cleanup();
      window.UI.closeModal(confirmModal);
      // Resume from where it was held rather than granting a fresh 3 minutes.
      if (!state.finished && !state.locked && heldAt > 0) {
        resumeTimer(heldAt);
      }
    }

    ok.addEventListener("click", onOk);
    cancel.addEventListener("click", onCancel);
  }

  document
    .getElementById("close-quiz-modal")
    .addEventListener("click", requestClose);

  window.UI.bindBackdrop(modal, requestClose);
  window.UI.setEscapeHandler(modal, requestClose);

  /* Keyboard: 1-4 select an answer, Enter advances. Now discoverable,
     because the choice buttons show their number. */
  document.addEventListener("keydown", function (event) {
    if (!modal.classList.contains("is-open")) return;
    if (document.getElementById("confirm-modal").classList.contains("is-open")) return;

    var tag = document.activeElement && document.activeElement.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA") return;

    if (event.key >= "1" && event.key <= "9") {
      var choices = body.querySelectorAll(".choice-btn");
      var target = choices[Number(event.key) - 1];
      if (target && !target.disabled) {
        event.preventDefault();
        target.click();
      }
      return;
    }

    if (event.key === "Enter") {
      var next = body.querySelector("#next-btn");
      if (next && !next.disabled) {
        event.preventDefault();
        next.click();
      }
    }
  });

  window.QuizService = { startQuiz: startQuiz };
})();
