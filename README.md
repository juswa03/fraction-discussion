# Fraction Fusion: Subtraction Edition

An offline-capable web app teaching fraction subtraction in English, Tagalog,
and Bisaya. Four video lessons, a 15-question quiz per lesson, and a printable
certificate once all four are passed.

Plain HTML/CSS/JavaScript — no framework, no build step, no dependencies.

## Running it

The site **must be served over HTTP**. Opening `index.html` directly from the
file system will not work: quiz data is loaded with `fetch()`, which browsers
block on `file://`.

```bash
python -m http.server 8000
```

Then open <http://localhost:8000>.

## Adding the lesson videos

Videos are not stored in Git. Copy your 12 `.mp4` files into `assets/videos/`
using the exact filenames listed in [assets/videos/README.md](assets/videos/README.md).

Any video that is missing shows a "coming soon" card instead — the lesson and
its quiz still work. You can add the files one at a time, and no code needs to
change.

## Installing on an Android phone

The app installs as a Progressive Web App: a home-screen icon that opens
fullscreen and works with no internet connection.

### Why you cannot just use your Wi-Fi IP

Service workers — the thing that makes offline work — only run in a **secure
context**: `https://`, or `http://localhost`. Browsing to `http://192.168.x.x`
from your phone loads the page but *silently* refuses to install the service
worker, so nothing gets cached and there is no install prompt.

The fix is `adb reverse`, which maps the phone's own `localhost` to this PC.

### One-time setup

1. Download **SDK Platform-Tools** for Windows from
   <https://developer.android.com/tools/releases/platform-tools> — a ~10 MB zip.
   (This is *not* Android Studio.) Unzip it somewhere convenient.
2. On the phone: Settings → About phone → tap **Build number** seven times to
   unlock Developer options.
3. Settings → Developer options → enable **USB debugging**.
4. Connect the phone by USB and accept the "Allow USB debugging?" prompt.

### Each time you want to install or update

```bash
python -m http.server 8000      # from this folder
adb devices                     # confirm the phone is listed
adb reverse tcp:8000 tcp:8000
```

On the phone, open Chrome and go to **http://localhost:8000**.

Then Chrome menu (⋮) → **Install app**. If it says "Add to Home screen"
instead, the manifest is not being read — check for errors in
`chrome://inspect`.

### Verifying it really works offline

Turn on **airplane mode**, force-close the app, and reopen it from the home
screen icon. Everything should still work: lessons, all 12 quizzes, saved
scores, fonts, and images.

Videos are the exception — see below.

## Offline behavior

| Asset | Offline? |
|---|---|
| Pages, styles, scripts | Yes — precached |
| All 12 quiz files | Yes — precached |
| Fonts, icons, background image | Yes — precached |
| Background music | Yes, after it has played once |
| **Lesson videos** | **No** — served from the network |

Videos deliberately bypass the service worker. Video playback uses HTTP range
requests to seek, and the Cache API ignores range headers — serving video from
cache breaks seeking and can stop playback entirely. Letting the browser handle
video natively is correct; making it work offline needs a separate mechanism
(downloading to a blob), which is worth adding once the real videos exist and
their total size is known.

## Updating the app

**Whenever you change any file, bump `VERSION` in `sw.js`.**

```js
const VERSION = "v1";   // -> "v2", "v3", ...
```

There is no build step, so nothing renames files based on their contents. If
you skip this, browsers keep serving the old cached copy. Bumping the version
discards every old cache on the next load.

## A caution about the install address

An installed PWA is tied to the address it was installed from. If you install
from `http://localhost:8000` and later serve it somewhere else, Android treats
that as a completely different app with empty storage — **saved quiz scores and
student names are lost**.

Decide where the app will be served from before students install it.

## Project layout

```
index.html              the whole single-page app
manifest.json           PWA metadata (name, icons, colors)
sw.js                   service worker — offline caching
css/
  fonts.css             @font-face for the self-hosted fonts
  style.css             design system and components
  animations.css        keyframes and scroll reveals
  responsive.css        breakpoints
  sound-toggle-switch.css
js/
  storage.js            localStorage wrapper (scores, name, language)
  language.js           en/tl/bi strings + lesson video paths
  quiz.js               quiz engine (shuffling, grading, hints)
  animations.js         scroll reveals, tilt cards, confetti
  app.js                bootstrap, rendering, navigation, modals
quizzes/json/           12 quiz files: lesson{1-4}-{en,tl,bi}.json
assets/
  fonts/                self-hosted woff2 (no Google Fonts)
  icons/                PWA home-screen icons
  images/, music/, videos/
```

`js/quiz-data.js` is an unused legacy quiz bank; nothing loads it.
