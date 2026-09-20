# How to run the app

A step-by-step guide to opening Fraction Fusion on your computer and
installing it on an Android phone.

For what the app *is* and how it is designed, see [README.md](README.md).

---

## Before you start

You need **Node.js**, which provides the `npx` command used to serve the
folder. Check by opening a terminal and typing:

```bash
node --version
```

If that prints a version number, you are ready. If it says the command is not
found, install Node from <https://nodejs.org/> (the LTS build).

Nothing else is needed. There is no `npm install`, no build step, and no
dependencies to download — `npx serve` fetches the server on first use and
caches it.

Prefer not to install Python, or want the full list of what is and is not
required? See [REQUIREMENTS.md](REQUIREMENTS.md).

---

## Running it on your computer

### 1. Open a terminal in the project folder

In File Explorer, open the `fraction_discussion` folder (the one containing
`index.html`), then type `cmd` in the address bar and press Enter.

### 2. Start the server

```bash
npx serve -l 8000
```

Leave this window open. The app is served for as long as it runs.

> **Use `npx serve`, not `python -m http.server`, now that the videos are in
> place.** Python's built-in server is single-threaded and stalls partway
> through large files — videos hang or refuse to play. `npx serve` handles them
> instantly and supports the range requests video seeking needs. Python is
> still fine if you are only working on the quizzes.

### 3. Open the app

Go to **<http://localhost:8000>** in Chrome.

That is it.

### Stopping the server

Press `Ctrl+C` in the terminal window, or just close it.

---

## Do not open index.html by double-clicking

It will load, but **every quiz will fail**.

Quizzes are stored as separate files that the page loads as it runs. Browsers
block that when a page is opened straight from the file system (a `file://`
address), as a security measure. The app detects this and shows an explanatory
message rather than failing silently.

Always go through `http://localhost:8000`.

---

## Use "localhost", not your Wi-Fi address

Offline support is handled by a *service worker*, a background script the
browser installs. Browsers only allow one to install on an address they
consider secure: `https://`, or `http://localhost`.

`http://127.0.0.1:8000` and `http://192.168.x.x:8000` will display the app but
**silently refuse to install the service worker**. There is no error message;
offline mode simply never works.

Stick to `http://localhost:8000`.

---

## Adding the lesson videos

Eleven of the twelve videos are in place. Only **lesson 4 Tagalog**
(`lesson4-tl.mp4`) is still missing, and that lesson shows a "Video coming
soon" card until the file is added. Its quiz works either way.

Copy new `.mp4` files into `assets/videos/` using the exact filenames listed in
[assets/videos/README.md](assets/videos/README.md):

```
assets/videos/lesson1-en.mp4     lesson1-tl.mp4     lesson1-bi.mp4
assets/videos/lesson2-en.mp4     ...
```

Reload the page and the video appears. No code changes, and no need to add all
twelve at once — each file starts working the moment it is in place, and the
rest keep showing the placeholder.

Videos must be **MP4 (H.264)**. Other formats such as `.mkv` or `.avi` will
keep showing the placeholder even though the file is there.

---

## Installing on an Android phone

This gives you an icon on the home screen that opens fullscreen and works with
no internet connection.

### Why a USB cable is needed

As explained above, offline support only installs on a secure address. Your
phone cannot reach the PC's `localhost` over Wi-Fi, and the PC's Wi-Fi address
is not considered secure.

`adb reverse` solves this: it connects the phone to the PC over USB and makes
the PC's server appear at the phone's *own* `localhost` address, which the
browser does trust.

### One-time setup

1. **Download Platform-Tools** from
   <https://developer.android.com/tools/releases/platform-tools> — a ~10 MB
   zip. This is *not* Android Studio. Unzip it somewhere you can find again.
2. **Unlock Developer options** on the phone: Settings → About phone → tap
   **Build number** seven times.
3. **Enable USB debugging**: Settings → Developer options → **USB debugging**.
4. **Connect the phone by USB** and tap **Allow** on the debugging prompt.

### Installing

With the phone connected, run this from the project folder:

```bash
npx serve -l 8000
```

Then in a second terminal, from the folder where you unzipped Platform-Tools:

```bash
adb devices                     # your phone should be listed
adb reverse tcp:8000 tcp:8000
```

On the phone, open **Chrome** and go to **http://localhost:8000**.

Then tap Chrome's **⋮** menu → **Install app**.

> If the menu says *"Add to Home screen"* rather than *"Install app"*, the
> phone is only offering a bookmark. Something is wrong — check that you used
> `localhost` and not an IP address.

### Saving the videos to the phone

Once installed, open **Settings → Videos for offline → Save videos** while the
phone is still connected. This downloads about 171 MB and takes a few minutes;
a progress bar shows how far it has got. It only needs doing once.

Skip this and everything still works offline except watching the videos.

### Checking that offline really works

1. Open the app from its home screen icon and browse around for a few seconds,
   so it can save everything it needs.
2. Turn on **airplane mode**.
3. Force-close the app and reopen it from the icon.

Lessons, videos, all twelve quizzes, saved scores, fonts and images should all
work normally.

The USB cable is only needed to install and to update. Day to day, the app runs
entirely from the phone.

---

## How the quizzes work

**Quizzes open in order.** Quiz 2 stays locked until Quiz 1 is passed with 70%
or more, and so on. A locked quiz shows a padlock; tapping it explains what to
finish first and offers to jump straight there, rather than doing nothing.

To change the pass mark, edit `PASS_PERCENT` in both `js/quiz.js` and
`js/app.js` — they must agree.

**Each question has a 3-minute timer.** The countdown sits beside the question
counter and turns red for the last 30 seconds. If it runs out, the question is
marked as "No answer" and the quiz moves on by itself.

**Answered questions cannot be changed.** The Back button shows a previous
question as it was left — the student's own choice marked, everything
disabled — and Next returns them to where they stopped. Letting a question be
re-answered would tell a student their first pick was wrong, which leaks the
answer key one choice at a time across retakes.

**Correct answers are not revealed during the quiz.** Answering shows only
whether *your own* choice was right or wrong. Because quizzes can be retaken
and the questions reshuffle each time, showing the right answer mid-quiz would
let a student learn the key by guessing. Every correct answer is listed in the
solutions review once the attempt is scored.

The clock pauses if a student opens the quit dialog, and restarts fresh for
each question, including when going back with the Back button.

To change the limit, edit `SECONDS_PER_QUESTION` at the top of `js/quiz.js`
(the value is in seconds, so 180 = 3 minutes).

---

## What works offline

| | Offline? |
|---|---|
| Pages, styles, scripts | Yes |
| All 12 quizzes | Yes |
| Fonts, icons, images | Yes |
| Saved scores and certificate | Yes |
| Background music | Yes, after playing once |
| **Lesson videos** | Yes, **after tapping "Save videos"** |

Everything except the videos is stored automatically on first visit. The
videos are about 171 MB, which is too much to download without asking, so they
are opt-in: **Settings → Videos for offline → Save videos**.

The download runs one file at a time with a progress bar, and can be resumed by
tapping again if it is interrupted. Once finished, the whole app — lessons,
videos, quizzes, scores and the certificate — works in airplane mode.

Videos are kept in a cache that is deliberately *not* tied to the app version,
so updating the app does not throw away a 171 MB download.

---

## After you change any file

**Bump `VERSION` at the top of `sw.js`.**

```js
const VERSION = "v7";   // -> "v8"
```

Because the app stores copies of its own files for offline use, browsers keep
serving the old copies until the version changes. Bump it and every stale copy
is discarded on the next load.

Forgetting this is the single most common cause of "I changed the file but
nothing happened."

---

## Important: where you install from matters

An installed app is tied to the exact address it was installed from. If you
install from `http://localhost:8000` and later serve it somewhere else, Android
treats it as a **completely different app with no saved data** — every saved
quiz score and name is gone.

Decide where the app will be served from before handing it to students.

---

## Troubleshooting

**Quizzes say they cannot load.**
The page was opened by double-clicking `index.html`. Use
`http://localhost:8000` instead.

**"Address already in use" when starting the server.**
Port 8000 is taken by another program, possibly an old server left open. Use a
different port — `npx serve -l 8080` — and open
`http://localhost:8080`.

**Changes to a file are not showing up.**
Bump `VERSION` in `sw.js` (see above), then reload with `Ctrl+Shift+R`.

If it still sticks: press `F12` → **Application** tab → **Service Workers** →
**Unregister**, then reload. During development, tick **Update on reload** in
that panel to avoid the problem entirely.

**No install option in Chrome on the phone.**
Confirm the address is `http://localhost:8000`, not an IP address. Then check
`adb devices` still lists the phone — unplugging the cable breaks the
connection and `adb reverse` must be run again.

**A student is stuck: they cannot reach Quiz 2.**
They need 70% or more on Quiz 1 first. This is deliberate. To let them past
for testing, open the browser console (`F12`) and run:

```js
localStorage.removeItem("fraction_flow_stats_v1");  // clears all progress
```

Or lower `PASS_PERCENT` in `js/quiz.js` and `js/app.js` if 70% is too high for
your class.

**Videos show "coming soon" even though the file is there.**
Check the filename matches exactly, including the language code
(`lesson1-en.mp4`, not `lesson1_en.mp4` or `Lesson1-EN.mp4`). Then confirm the
file really is MP4/H.264 and not a renamed `.mkv` or `.avi`.

**The page loads but looks unstyled.**
Usually a half-finished cached copy. Press `Ctrl+Shift+R`, or clear it via
`F12` → **Application** → **Clear storage** → **Clear site data**.
