(function () {
  const LANGUAGES = {
    en: {
      name: "English",
      nav: ["Home", "Lessons", "Quizzes", "About", "Credits"],
      hero: {
        title: "Master Fraction Subtraction with Confidence",
        intro:
          "Explore multilingual video lessons, take dynamic quizzes, and review step-by-step solutions. Designed to make fraction subtraction clear, visual, and fun.",
        start: "Start Learning",
        quiz: "Take a Quiz",
      },
      lessons: {
        heading: "Choose a Lesson and Language",
      },
      settings: {
        button: "Settings",
        title: "Settings",
        languageLabel: "Language",
      },
      quizText: {
        takeQuiz: "Take Quiz",
        videoSoonTitle: "Lesson video coming soon",
        videoSoonBody: "This video has not been added yet. You can still take the quiz.",
        highestScore: "Highest Score",
        bestPercentage: "Best Percentage",
        attempts: "Attempts",
        question: "Question",
        of: "of",
        remaining: "remaining",
        prev: "Previous Question",
        next: "Next Question",
        finish: "Finish Quiz",
        pass: "Pass",
        fail: "Needs Practice",
        excellent: "Excellent work!",
        good: "Great effort!",
        keep: "Keep practicing, you are improving.",
        viewSolutions: "View Complete Solutions",
        tryAgain: "Try Again",
        anotherQuiz: "Choose Another Quiz",
        backLessons: "Back to Lessons",
        yourAnswer: "Your answer",
        correctAnswer: "Correct answer",
        showHint: "Show Hint",
        hideHint: "Hide Hint",
        hintLabel: "Hint",
        steps: "Step-by-step explanation",
        correct: "Correct",
        incorrect: "Incorrect",
        unlockHint: "Pass all 4 quizzes (70% or higher) to unlock your certificate.",
        unlocked: "Certificate unlocked",
        locked: "Locked",
        printCertificate: "Print Certificate",
        certTitle: "Certificate of Fraction Mastery",
        certAwarded: "Awarded to",
        certBody: "For successfully passing all fraction subtraction quizzes in Fraction Flow Academy.",
        certDate: "Date",
        certCompletion: "Completed all 4 lesson quizzes",
        certClose: "Close",
        certPrint: "Print Now",
        transitionLoading: "Loading section...",
        namePromptTitle: "Enter Your Name",
        namePromptDesc: "Please enter your full name as you would like it to appear on your certificate.",
        saveAndContinue: "Save and Continue",
        yourNameHolder: "Your Full Name",
      },
      lessonsData: {
        lesson1: {
          title: "Lesson 1: Subtracting a Mixed Number from a Whole Number",
          description:
            "Learn regrouping and fraction conversion when subtracting a mixed number from a whole number.",
          objectives: [
            "Convert whole numbers for subtraction with mixed numbers.",
            "Use regrouping correctly.",
            "Simplify final answers.",
          ],
        },
        lesson2: {
          title: "Lesson 2: Subtracting a Mixed Number from a Proper Fraction",
          description:
            "Understand common denominators and regrouping when the first number is a proper fraction.",
          objectives: [
            "Rename mixed and proper fractions.",
            "Find least common denominators.",
            "Subtract and simplify confidently.",
          ],
        },
        lesson3: {
          title: "Lesson 3: Subtracting a Proper Fraction from a Whole Number",
          description:
            "Practice borrowing from whole numbers and subtracting proper fractions in simplest form.",
          objectives: [
            "Borrow from whole numbers correctly.",
            "Subtract fractions step-by-step.",
            "Solve story problems.",
          ],
        },
        lesson4: {
          title: "Lesson 4: Subtracting Two Mixed Numbers",
          description:
            "Subtract mixed numbers with unlike denominators and apply the process in real-life situations.",
          objectives: [
            "Convert to common denominators.",
            "Regroup mixed numbers properly.",
            "Check and simplify your result.",
          ],
        },
      },
    },
    tl: {
      name: "Tagalog",
      nav: ["Home", "Aralin", "Pagsusulit", "Tungkol", "Kredito"],
      hero: {
        title: "Matutong Magbawas ng Fraction nang May Kumpiyansa",
        intro:
          "Galugarin ang mga aralin sa video sa iba-ibang wika, kumuha ng dynamic na quiz, at tingnan ang step-by-step na solusyon.",
        start: "Simulan ang Pag-aaral",
        quiz: "Kumuha ng Quiz",
      },
      lessons: {
        heading: "Pumili ng Aralin at Wika",
      },
      settings: {
        button: "Mga Setting",
        title: "Mga Setting",
        languageLabel: "Wika",
      },
      quizText: {
        takeQuiz: "Kumuha ng Quiz",
        videoSoonTitle: "Malapit nang mailagay ang video",
        videoSoonBody: "Wala pa ang video na ito. Maaari ka pa ring kumuha ng quiz.",
        highestScore: "Pinakamataas na Iskor",
        bestPercentage: "Pinakamagandang Porsyento",
        attempts: "Bilang ng Pagsubok",
        question: "Tanong",
        of: "ng",
        remaining: "natitira",
        prev: "Nakaraang Tanong",
        next: "Susunod na Tanong",
        finish: "Tapusin ang Quiz",
        pass: "Pasado",
        fail: "Kailangan Pang Magpraktis",
        excellent: "Napakahusay!",
        good: "Magaling!",
        keep: "Magpraktis pa, gumagaling ka.",
        viewSolutions: "Tingnan ang Buong Solusyon",
        tryAgain: "Subukan Muli",
        anotherQuiz: "Pumili ng Ibang Quiz",
        backLessons: "Balik sa Aralin",
        yourAnswer: "Sagot mo",
        correctAnswer: "Tamang sagot",
        showHint: "Ipakita ang Pahiwatig",
        hideHint: "Itago ang Pahiwatig",
        hintLabel: "Pahiwatig",
        steps: "Paliwanag na hakbang-hakbang",
        correct: "Tama",
        incorrect: "Mali",
        unlockHint: "Ipasa ang lahat ng 4 quiz (70% pataas) para ma-unlock ang sertipiko.",
        unlocked: "Naka-unlock na ang sertipiko",
        locked: "Naka-lock",
        printCertificate: "I-print ang Sertipiko",
        certTitle: "Sertipiko ng Kahusayan sa Fraction",
        certAwarded: "Iginawad kay",
        certBody: "Para sa matagumpay na pagpasa sa lahat ng fraction subtraction quiz sa Fraction Flow Academy.",
        certDate: "Petsa",
        certCompletion: "Natapos ang lahat ng 4 na lesson quiz",
        certClose: "Isara",
        certPrint: "I-print Ngayon",
        transitionLoading: "Naglo-load ng seksyon...",
        namePromptTitle: "Ilagay ang Iyong Pangalan",
        namePromptDesc: "Mangyaring ilagay ang iyong buong pangalan na lalabas sa sertipiko.",
        saveAndContinue: "I-save at Magpatuloy",
        yourNameHolder: "Buong Pangalan",
      },
      lessonsData: {
        lesson1: {
          title: "Aralin 1: Pagbabawas ng Mixed Number mula sa Buong Bilang",
          description:
            "Alamin ang regrouping at conversion ng fraction kapag mixed number ang ibinabawas sa whole number.",
          objectives: [
            "I-convert ang whole number para sa subtraction.",
            "Gamitin ang regrouping nang tama.",
            "I-simplify ang huling sagot.",
          ],
        },
        lesson2: {
          title: "Aralin 2: Pagbabawas ng Mixed Number mula sa Proper Fraction",
          description:
            "Unawain ang LCD at regrouping kapag proper fraction ang unang numero.",
          objectives: [
            "I-rename ang mixed at proper fraction.",
            "Hanapin ang least common denominator.",
            "Magbawas at mag-simplify nang tama.",
          ],
        },
        lesson3: {
          title: "Aralin 3: Pagbabawas ng Proper Fraction mula sa Buong Bilang",
          description:
            "Sanayin ang panghihiram sa whole number at pagbabawas ng proper fraction sa pinakasimpleng anyo.",
          objectives: [
            "Manghiram mula sa whole number nang tama.",
            "Magbawas ng fraction hakbang-hakbang.",
            "Lutasin ang word problems.",
          ],
        },
        lesson4: {
          title: "Aralin 4: Pagbabawas ng Dalawang Mixed Numbers",
          description:
            "Magbawas ng mixed numbers na may magkaibang denominator at i-apply sa totoong sitwasyon.",
          objectives: [
            "Gumamit ng common denominator.",
            "Mag-regroup nang tama.",
            "Suriin at i-simplify ang sagot.",
          ],
        },
      },
    },
    bi: {
      name: "Bisaya",
      nav: ["Home", "Mga Leksyon", "Quiz", "About", "Credits"],
      hero: {
        title: "Makat-on og Fraction Subtraction nga Masaligon",
        intro:
          "Tan-awa ang mga leksyon sa video sa lain-laing pinulongan, pag-quiz, ug susiha ang step-by-step nga solusyon.",
        start: "Sugdi ang Pagtuon",
        quiz: "Pag-Quiz",
      },
      lessons: {
        heading: "Pilia ang Leksyon ug Pinulongan",
      },
      settings: {
        button: "Settings",
        title: "Settings",
        languageLabel: "Pinulongan",
      },
      quizText: {
        takeQuiz: "Pag-Quiz",
        videoSoonTitle: "Hapit na ang video sa leksyon",
        videoSoonBody: "Wala pa ni nga video. Makahimo ka gihapon ug quiz.",
        highestScore: "Pinakataas nga Iskor",
        bestPercentage: "Pinakamaayo nga Porsyento",
        attempts: "Kadaghanon sa Pagsulay",
        question: "Pangutana",
        of: "sa",
        remaining: "nahibilin",
        prev: "Niaging Pangutana",
        next: "Sunod nga Pangutana",
        finish: "Humanon ang Quiz",
        pass: "Pasar",
        fail: "Kinahanglan pa Praktis",
        excellent: "Nindot kaayo!",
        good: "Maayo kaayo!",
        keep: "Padayon sa praktis, nag-uswag ka.",
        viewSolutions: "Tan-awa ang Kumpletong Solusyon",
        tryAgain: "Sulayi Pag-usab",
        anotherQuiz: "Pili ug Laing Quiz",
        backLessons: "Balik sa Leksyon",
        yourAnswer: "Imong tubag",
        correctAnswer: "Husto nga tubag",
        showHint: "Ipakita ang Hint",
        hideHint: "Itago ang Hint",
        hintLabel: "Hint",
        steps: "Step-by-step nga pasabot",
        correct: "Sakto",
        incorrect: "Sayop",
        unlockHint: "Ipasar ang tanang 4 ka quiz (70% pataas) aron ma-unlock ang sertipiko.",
        unlocked: "Na-unlock na ang sertipiko",
        locked: "Naka-lock",
        printCertificate: "I-print ang Sertipiko",
        certTitle: "Sertipiko sa Fraction Mastery",
        certAwarded: "Gihatag kang",
        certBody: "Tungod sa malampusong pagpasa sa tanang fraction subtraction quiz sa Fraction Flow Academy.",
        certDate: "Petsa",
        certCompletion: "Nahuman ang tanang 4 ka lesson quiz",
        certClose: "Sirado",
        certPrint: "I-print Karon",
        transitionLoading: "Nag-load sa seksyon...",
        namePromptTitle: "Isulat ang Imong Ngalan",
        namePromptDesc: "Palihug isulat ang imong tibuok ngalan nga mogawas sa imong sertipiko.",
        saveAndContinue: "I-save ug Ipadayon",
        yourNameHolder: "Tibuok Ngalan",
      },
      lessonsData: {
        lesson1: {
          title: "Leksyon 1: Pagbawas og Mixed Number gikan sa Whole Number",
          description:
            "Kat-oni ang regrouping ug conversion sa fraction kung mixed number ang ibawas gikan sa whole number.",
          objectives: [
            "I-convert ang whole number para subtraction.",
            "Hustong paggamit sa regrouping.",
            "I-simplify ang final answer.",
          ],
        },
        lesson2: {
          title: "Leksyon 2: Pagbawas og Mixed Number gikan sa Proper Fraction",
          description:
            "Sabta ang LCD ug regrouping kung proper fraction ang unang numero.",
          objectives: [
            "I-rename ang mixed ug proper fraction.",
            "Pangitaa ang least common denominator.",
            "Pagbawas ug pagsimplify sakto.",
          ],
        },
        lesson3: {
          title: "Leksyon 3: Pagbawas og Proper Fraction gikan sa Whole Number",
          description:
            "Praktisi ang pagpanghulam sa whole number ug pagbawas sa proper fraction sa pinakasayon nga porma.",
          objectives: [
            "Manghulam sa whole number sakto.",
            "Pagbawas step-by-step.",
            "Sulbara ang word problems.",
          ],
        },
        lesson4: {
          title: "Leksyon 4: Pagbawas sa Duha ka Mixed Numbers",
          description:
            "Pagbawas sa mixed numbers nga lahi og denominator ug i-apply sa kinabuhi adlaw-adlaw.",
          objectives: [
            "Gamita ang common denominator.",
            "Hustong regrouping sa mixed numbers.",
            "Susiha ug i-simplify ang result.",
          ],
        },
      },
    },
  };

  // Local files so the app works offline. See assets/videos/README.md for the
  // expected filenames; a missing file falls back to a "coming soon" card.
  const LESSON_VIDEO_MAP = {
    lesson1: {
      en: "assets/videos/lesson1-en.mp4",
      tl: "assets/videos/lesson1-tl.mp4",
      bi: "assets/videos/lesson1-bi.mp4",
    },
    lesson2: {
      en: "assets/videos/lesson2-en.mp4",
      tl: "assets/videos/lesson2-tl.mp4",
      bi: "assets/videos/lesson2-bi.mp4",
    },
    lesson3: {
      en: "assets/videos/lesson3-en.mp4",
      tl: "assets/videos/lesson3-tl.mp4",
      bi: "assets/videos/lesson3-bi.mp4",
    },
    lesson4: {
      en: "assets/videos/lesson4-en.mp4",
      tl: "assets/videos/lesson4-tl.mp4",
      bi: "assets/videos/lesson4-bi.mp4",
    },
  };

  window.LanguageService = {
    LANGUAGES,
    LESSON_VIDEO_MAP,
  };
})();
