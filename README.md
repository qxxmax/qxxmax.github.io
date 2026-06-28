# qxxmax.github.io

Personal academic homepage of **Moxian Qian / 钱莫闲**, built on [al-folio](https://github.com/alshedivat/al-folio) (Jekyll, v1.x).

Bilingual (中 / EN) toggle in the top-right of the navbar — uses `localStorage` to remember the chosen language.

## Run locally

The first build needs Ruby ≥ 3.x; this repo was bootstrapped with Homebrew Ruby 4.0.

```bash
export PATH="/opt/homebrew/opt/ruby/bin:$PATH"
export LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 RUBYOPT="-E UTF-8"

# one-time
bundle install

# preview at http://127.0.0.1:4000
bundle exec jekyll serve --port 4000
```

The `RUBYOPT="-E UTF-8"` is required so the al-folio legacy-pattern scanner can read files containing Chinese characters.

## Where to edit what

| File / directory | What lives there |
|---|---|
| `_pages/about.md` | Front-page bio. Use `.en` / `.zh` blocks for bilingual text. |
| `_pages/publications.md` | Header / description for `/publications/`. |
| `_pages/cv.md` | Header / front-matter for `/cv/` (driven by `_data/cv.yml`). |
| `_pages/blog.md` | Header for `/blog/`. |
| `_bibliography/papers.bib` | All publications (BibTeX). Add new entries here. |
| `_news/*.md` | News timeline shown on the about page. One file per item. |
| `_posts/YYYY-MM-DD-slug.md` | Blog posts. |
| `_data/cv.yml` | CV content (rendered on `/cv/`). |
| `_data/socials.yml` | Email + InspireHEP + RSS shown next to the profile photo. Add `scholar_userid`, `orcid_id`, `github_username`, `arxiv_id` etc. when available. |
| `_config.yml` | Site title, blog name, dark-mode toggle, etc. |
| `assets/img/prof_pic.svg` | Current placeholder avatar (MQ initials). Replace with a real photo — drop e.g. `prof_pic.jpg` here and update the `image:` field in `_pages/about.md`. |
| `assets/css/i18n.css` + `assets/js/i18n.js` | Bilingual toggle. Edit only if you want to change toggle styling/behaviour. |
| `_includes/head.liquid` + `_includes/header.liquid` | Local overrides of gem-shipped templates. They only add the bilingual switcher; otherwise mirror the gem versions. After major al-folio upgrades, regenerate them by copying from `vendor/bundle/.../al_folio_core-*/`_includes/` and re-applying the bilingual additions. |

## Deploy

- **GitHub Pages**: rename the repo to `<github-username>.github.io`, push, enable Pages → "GitHub Actions". The al-folio v1 starter includes a workflow at `.github/workflows/`.
- **Cloudflare Pages**: connect the repo, set build command `bundle exec jekyll build` and publish directory `_site`. You may also need to set env `RUBYOPT=-E UTF-8` and `LC_ALL=en_US.UTF-8`.

## Todo before going public

- [ ] Replace `assets/img/prof_pic.svg` with a real photo
- [ ] Add CV PDF to `assets/pdf/cv.pdf` and uncomment `cv_pdf` in `_pages/cv.md` to enable the download button
- [ ] Fill in `scholar_userid`, `orcid_id`, `github_username`, `arxiv_id` in `_data/socials.yml`
- [ ] Update `url:` in `_config.yml` to the real production URL
- [ ] Decide whether to keep the InspireHEP author ID at `2553576` (current INSPIRE record for "Qian Moxian") — note that record currently only lists the 2020 Mercury paper; you may want to claim the two arXiv preprints there too.
