# Lesson videos

Lesson videos are hosted on YouTube (unlisted), not shipped as files in this
repo — 12 videos at a few hundred MB total was too large for GitHub. The
video IDs live in `js/language.js`'s `LESSON_VIDEO_MAP`, one
`https://www.youtube.com/embed/<id>` URL per lesson per language.
`videoMarkup()` in `js/app.js` detects a youtube.com URL and renders an
`<iframe>` instead of a `<video>` tag.

## Changing a video

Edit the relevant URL in `LESSON_VIDEO_MAP` (`js/language.js`). No other code
changes are needed.

## Offline video is not available

The "Save videos for offline use" feature only works for local `.mp4` files
the Cache API can fetch and store — it cannot cache a YouTube iframe's
stream. `setupOfflineVideos()` in `js/app.js` hides that control entirely
now that every lesson is YouTube-hosted. Quizzes, lesson text and the rest
of the app still work offline; only the videos need a connection.

## Falling back to local files

`videoMarkup()` still supports a plain `assets/videos/<file>.mp4` path as a
`LESSON_VIDEO_MAP` value (renders a native `<video>` with range-request
support from the service worker) if you ever need to self-host a lesson
again instead of using YouTube.
