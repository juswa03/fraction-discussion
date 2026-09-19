# What you need to install

**Short answer: for running the app on a computer, almost certainly nothing.**

This project has no packages, no dependencies and no build step. There is no
`npm install` to run, no `package.json`, no `requirements.txt`, and no
`node_modules` folder. Every file the app needs — fonts included — is already
in this repository.

You only need a way to serve the folder over HTTP, and most computers already
have one.

---

## For running the app

### Python — the recommended option

Check whether you already have it:

```bash
python --version
```

If it prints a version number (3.x), **you are done — install nothing**.

If it says the command is not found:

1. Download from <https://www.python.org/downloads/>
2. Run the installer
3. **Tick "Add Python to PATH"** on the first screen — easy to miss, and
   without it the `python` command will not work in a terminal
4. Close and reopen your terminal, then check the version again

Then serve the folder:

```bash
python -m http.server 8000
```

### If you would rather not install Python

Any static file server works. Pick whichever matches what you already have:

| You already have | Command |
|---|---|
| Node.js | `npx serve -l 8000` |
| PHP | `php -S localhost:8000` |
| Ruby | `ruby -run -e httpd . -p 8000` |
| VS Code | Install the **Live Server** extension, right-click `index.html` → *Open with Live Server* |

All of these do the same job. Whatever you use, open the app at
`http://localhost:8000` — see [RUNNING.md](RUNNING.md) for why the address
matters.

### Why a server is needed at all

Opening `index.html` by double-clicking will load the page, but every quiz will
fail. Quiz questions live in separate files that the page loads as it runs, and
browsers block that for pages opened from the file system. A server is the
whole fix.

---

## For installing on an Android phone

One extra download, needed **only** for putting the app on a phone. Skip this
if you are just running it on a computer.

### Android Platform-Tools

<https://developer.android.com/tools/releases/platform-tools>

A ~10 MB zip. **This is not Android Studio** — you do not need the 1 GB IDE,
just this zip. Unzip it somewhere you can find again; there is no installer,
and `adb.exe` runs directly from that folder.

Check it works:

```bash
adb version
```

You will also need a **USB cable** that carries data. Some charge-only cables
will not work, and the symptom is confusing: the phone charges but never
appears in `adb devices`. If the phone is not showing up, a different cable is
worth trying before anything else.

Full setup steps are in [RUNNING.md](RUNNING.md).

---

## Not required

Listed because people reasonably expect them:

- **Node.js / npm** — the app uses no JavaScript packages. Handy only as an
  alternative file server.
- **Android Studio** — only the small Platform-Tools zip above is needed.
- **A build step** — no bundler, compiler or transpiler. Edit a file, reload
  the page, done.
- **An internet connection** — after the first load. Fonts are stored in
  `assets/fonts/`, not fetched from Google.
- **ffmpeg** — only if you want to *re-encode* your lesson videos. Playing
  them needs nothing.

---

## Summary

| | Needed? |
|---|---|
| Python (or another file server) | **Yes** — to run the app at all |
| Android Platform-Tools | Only to install on a phone |
| USB data cable | Only to install on a phone |
| Everything else | No |
