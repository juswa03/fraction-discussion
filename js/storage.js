(function () {
  const KEY = "fraction_flow_stats_v1";
  const LANGUAGE_KEY = "fraction_flow_language_v1";

  function readAllStats() {
    try {
      return JSON.parse(localStorage.getItem(KEY)) || {};
    } catch (error) {
      return {};
    }
  }

  function writeAllStats(data) {
    localStorage.setItem(KEY, JSON.stringify(data));
  }

  function getLessonStats(lessonId) {
    const all = readAllStats();
    return (
      all[lessonId] || {
        highestScore: 0,
        bestPercent: 0,
        attempts: 0,
        lastScore: 0,
        lastPercent: 0,
      }
    );
  }

  function updateLessonStats(lessonId, score, total) {
    const all = readAllStats();
    const oldStats = getLessonStats(lessonId);
    const percent = Math.round((score / total) * 100);

    const next = {
      highestScore: Math.max(oldStats.highestScore, score),
      bestPercent: Math.max(oldStats.bestPercent, percent),
      attempts: oldStats.attempts + 1,
      lastScore: score,
      lastPercent: percent,
    };

    all[lessonId] = next;
    writeAllStats(all);
    return next;
  }

  function overallCompletionPercent(totalLessons) {
    const all = readAllStats();
    const keys = Object.keys(all);
    if (!keys.length || totalLessons <= 0) {
      return 0;
    }
    const completed = keys.filter((key) => (all[key].attempts || 0) > 0).length;
    return Math.round((completed / totalLessons) * 100);
  }

  /* Quizzes open in order: each one needs the previous quiz passed. The
     first is always open. Returns the 1-based number of the quiz that is
     blocking, or 0 when this one is unlocked. */
  function lockedBy(lessonIds, lessonId, passPercent) {
    const position = lessonIds.indexOf(lessonId);
    if (position <= 0) return 0;

    const all = readAllStats();
    for (let i = 0; i < position; i++) {
      const stats = all[lessonIds[i]];
      if (!stats || (stats.bestPercent || 0) < passPercent) return i + 1;
    }
    return 0;
  }

  function allPassed(lessonIds, passPercent) {
    const all = readAllStats();
    return lessonIds.every((lessonId) => {
      const stats = all[lessonId];
      return stats && (stats.bestPercent || 0) >= passPercent;
    });
  }

  function getUserName() {
    return localStorage.getItem("fraction_flow_username_v1") || "";
  }

  function saveUserName(name) {
    localStorage.setItem("fraction_flow_username_v1", name);
  }

  function getLanguage() {
    return localStorage.getItem(LANGUAGE_KEY) || "en";
  }

  function saveLanguage(lang) {
    localStorage.setItem(LANGUAGE_KEY, lang);
  }

  window.StorageService = {
    getLessonStats,
    updateLessonStats,
    overallCompletionPercent,
    lockedBy,
    allPassed,
    getUserName,
    saveUserName,
    getLanguage,
    saveLanguage,
  };
})();
