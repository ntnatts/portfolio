# How to edit your site

Everything you'll want to change lives in the **`content/`** folder. You don't need to touch `index.html`, `css/` or `js/` to update text, projects, jobs or blog posts.

```
content/
  site.json          your name, hero text, typed phrases, Approach, toolkit, contact links
  projects.json      project cards + every case study page
  experience.json    the Experience timeline
  hobbies.json       the 9 emoji stickers and their blog pages
  posts/
    index.json       the list of blog posts that are "live"
    _template.md     copy this to start a new post
    cafe/ drawing/ travel/ markets/ daily/ reading/ health/ tech/ mind/
img/                 project images (and img/posts/<category>/ for blog photos)
videos/              hover videos for the project cards
```

**Two small rules for `.json` files** (most mistakes come from these):
1. Text goes inside "double quotes". If you need a quote inside the text, write `\"`.
2. Items in a list are separated by commas, but there is **no comma after the last one**.

If the page shows "Couldn't load the content files", one of these rules was broken. The browser console (right-click → Inspect → Console) says which file.

**Orange highlights:** in most text fields, put `**double stars**` around words to show them in orange, e.g. `"lifting retention to **70%**"`.

---

## 1. Preview the site on your computer

Double-clicking `index.html` won't work: browsers block pages from reading files directly. Run a tiny local server instead:

1. Open Terminal.
2. Go to the folder: `cd ~/Desktop/nat-portfolio`
3. Start the server: `python3 -m http.server 8000`
4. Open http://localhost:8000 in your browser.
5. After editing a file, just refresh the page. Press `Ctrl + C` in Terminal to stop the server.

---

## 2. Change text

| What | Where |
| --- | --- |
| Name, "Portfolio · 2026", the line under your name | `content/site.json` → `name`, `eyebrow`, `tagline` |
| The rotating orange phrases | `content/site.json` → `typedPhrases` |
| Approach heading, paragraphs, toolkit pills | `content/site.json` → `approach` |
| "Let's talk." and contact links | `content/site.json` → `contact` |
| Any project text | `content/projects.json` (find the project by its `"id"`) |
| A blog page's intro line | `content/hobbies.json` → that category's `"intro"` |

---

## 3. Add (or remove) a project

Open `content/projects.json`. Projects appear on the site in the order they are listed. To remove one, delete its whole `{ ... }` block (and the comma before it if it was the last one). To add one, paste this template into the list:

```json
{
  "id": "my-project",
  "name": "Project name on the card",
  "short": "Short name",
  "accent": "#3F7F78",
  "tags": ["Tag one", "Tag two", "Tag three"],
  "stat": "One key result shown when you hover the card.",
  "cover": "img/my-project-cover.webp",
  "video": null,
  "previews": ["img/my-project-1.webp", "img/my-project-2.webp"],
  "title": ["First line", "second line"],
  "label": "Type of project · Course or client",
  "intro": "Two or three sentences under the big title.",
  "problem": {
    "text": "One sentence describing the problem.",
    "highlight": "the key phrase from that sentence"
  },
  "highlights": [
    { "title": "What I did first", "text": "A short paragraph.", "media": { "img": "img/my-project-1.webp", "alt": "What the image shows" } },
    { "title": "What I did next", "text": "A short paragraph.", "media": { "pair": ["img/a.webp", "img/b.webp"], "alt": "What the images show" } },
    { "title": "The result", "text": "A short paragraph.", "media": { "img": "img/my-project-2.webp", "alt": "What the image shows" } }
  ],
  "stats": [
    { "number": 42, "suffix": "%", "title": "Stat title", "text": "One line of context." },
    { "number": 3.5, "decimals": 1, "prefix": "$", "suffix": "M", "title": "Stat title", "text": "One line of context." },
    { "number": 12, "title": "Stat title", "text": "One line of context." }
  ],
  "overview": [
    ["Course", "..."],
    ["My role", "..."],
    ["Tools", "..."],
    ["Methods", "..."]
  ],
  "deliverables": ["Deliverable one", "Deliverable two"],
  "tech": [
    ["Topic", "Detail shown under 'Technical details'."]
  ]
}
```

- `id` becomes the page address (`yoursite/#my-project`). Use lowercase letters and dashes.
- `accent` is the project's colour (arrow button, gradient, highlighted words).
- `title` is the huge two-line heading; the second line is in the accent colour.
- `stats` count up from 0. `decimals`, `prefix` and `suffix` are optional.
- `media` can be `{ "img": ... }`, `{ "pair": [two images] }`, or for the VaR project `{ "chart": "breaks" }` / `{ "dashboard": true }`.

---

## 4. Add a job to Experience

Open `content/experience.json` and paste this into `"jobs"` (newest first):

```json
{
  "when": "Jan – Apr 2027",
  "type": "Internship",
  "role": "Your role",
  "company": "Company name",
  "place": "City, Country",
  "about": "One line about what the company does.",
  "results": [
    "What you did, with the key number in **orange**",
    "Second result",
    "Third result"
  ]
}
```

`type` is the small pill (Internship, Family business, Research, Full-time…). Leave `"results": []` for no bullets.

---

## 5. Write a blog post

1. **Copy** `content/posts/_template.md` into the right category folder and give it a short name with dashes, e.g. `content/posts/cafe/olimpico-mile-end.md`.
2. **Edit the header** at the top:
   ```
   ---
   title: Olimpico on a rainy Tuesday
   date: 2026-11-20
   cover: img/posts/cafe/olimpico-cover.webp
   excerpt: The one café I keep going back to, and why.
   ---
   ```
   `cover` is optional (the emoji shows instead). You can add `read: 4 min`; otherwise it's worked out from the length.
3. **Write the post** below the header in Markdown:
   ```
   A normal paragraph.

   ## A section heading

   **bold**, *italic*, [a link](https://example.com)

   ![What the photo shows](img/posts/cafe/latte.webp)

   ![Photo one](img/posts/cafe/a.webp) ![Photo two](img/posts/cafe/b.webp)
   ← two images on one line become a side-by-side gallery

   > A pull quote.
   ```
   Delete the template's `<!-- ... -->` notes and the `<div class="gallery">` placeholder line.
4. **Publish it on the site** by adding its path to `content/posts/index.json`:
   ```json
   {
     "posts": [
       "cafe/olimpico-mile-end.md"
     ]
   }
   ```
   Only files listed here appear. That lets you keep drafts in the folder without showing them. Posts are sorted by date automatically.

**Why a list file?** A plain website can't "look inside" a folder to see what's there; it can only open files it knows the name of. `index.json` is that list. It's one line per post.

---

## 6. Swap a photo or a video

**Photos:** save as `.webp`, about **1280 px wide** (smaller files load faster). Put project images in `img/` and blog images in `img/posts/<category>/`. Then point to the new file name in the JSON or Markdown. To convert on a Mac: open in Preview → File → Export → Format: WebP (or use squoosh.app).

**Hover videos for project cards:** 16:9, 5–10 seconds, seamless loop, MP4 (H.264), no audio, under about 5 MB. Put them in `videos/` and set the project's `"video"` in `content/projects.json`:

```json
"video": "videos/var-dashboard.mp4",
```

The video plays (muted, looping) when someone hovers the card, or when the card is centred on a phone. It only downloads when the card is close to the screen. People who turn on "reduce motion" see the still cover image instead. With `"video": null` the card shows the image slideshow from `"previews"`.

---

## 7. Change colours or fonts

Open `css/style.css`. The first section, **DESIGN TOKENS**, lists every colour with a comment, light theme first and dark theme below it. Change a hex code and refresh. Fonts are loaded in `index.html` (the Google Fonts line) and used in section 2 of the CSS.

---

## 8. Check your content

Before publishing, you can run the same check GitHub runs. In Terminal, from the site folder:

```
node scripts/check-content.mjs
```

- **✅ Content looks good** means you're fine.
- **❌ problems** lists each one with the file and, for JSON mistakes, the line number. Note: a missing comma is usually reported on the line *after* the one that needs it.
- **⚠️ notes** are reminders (a post with no excerpt, a draft that isn't in `index.json`). They don't stop publishing.

---

## 9. Publish

The site lives at **https://ntnatts.github.io/portfolio/** and the code at **https://github.com/ntnatts/portfolio**.

To publish, commit and push to `main`, either in Terminal:

```
cd ~/Desktop/nat-portfolio
git add -A
git commit -m "Add café post"
git push
```

or on github.com: open a file, click the pencil icon, edit, then **Commit changes**.

Each push does this automatically:
1. GitHub runs the content check.
2. **If the check passes**, the site is published, usually within about 2 minutes.
3. **If it fails**, nothing is published, so the live site stays on the last working version, and GitHub emails you. To see what's wrong, open the repo's **Actions** tab, click the failed run, then **Check content**. It shows the same list as step 8. Fix it and push again.
