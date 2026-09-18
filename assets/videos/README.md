# Lesson videos

Drop your 12 lesson videos into this folder using **exactly** the filenames below.
No code changes are needed — the app picks them up on the next page reload.

Any file that is missing shows a "Lesson video coming soon" card instead. The
lesson and its quiz still work fully without the video, so you can add the files
one at a time.

## Filenames

| File | Lesson | Language |
|---|---|---|
| `lesson1-en.mp4` | Subtracting a Mixed Number from a Whole Number | English |
| `lesson1-tl.mp4` | Subtracting a Mixed Number from a Whole Number | Tagalog |
| `lesson1-bi.mp4` | Subtracting a Mixed Number from a Whole Number | Bisaya |
| `lesson2-en.mp4` | Subtracting a Mixed Number from a Proper Fraction | English |
| `lesson2-tl.mp4` | Subtracting a Mixed Number from a Proper Fraction | Tagalog |
| `lesson2-bi.mp4` | Subtracting a Mixed Number from a Proper Fraction | Bisaya |
| `lesson3-en.mp4` | Subtracting a Proper Fraction from a Whole Number | English |
| `lesson3-tl.mp4` | Subtracting a Proper Fraction from a Whole Number | Tagalog |
| `lesson3-bi.mp4` | Subtracting a Proper Fraction from a Whole Number | Bisaya |
| `lesson4-en.mp4` | Subtracting Two Mixed Numbers | English |
| `lesson4-tl.mp4` | Subtracting Two Mixed Numbers | Tagalog |
| `lesson4-bi.mp4` | Subtracting Two Mixed Numbers | Bisaya |

Language codes: `en` = English, `tl` = Tagalog, `bi` = Bisaya.

## Format

Use **MP4 (H.264 video + AAC audio)**. This is the only format guaranteed to
play in Chrome on Android. Other containers (`.mkv`, `.avi`, `.mov`) will show
the "coming soon" card even though the file is present.

Smaller files load faster and use less storage on the phone. 720p is plenty for
screen-recorded lessons.

## Posters (optional)

`posters/lesson1.jpg` … `posters/lesson4.jpg` are shown as the still image
before a video is played. They are shared across all three languages of a
lesson. If absent, the player shows a black frame — harmless.

## Why these files are not in Git

They are large, so `.gitignore` excludes `*.mp4` here. Copy them in by hand
(USB, Drive, etc.) on each machine that serves the site. Everything else in this
folder is tracked.
