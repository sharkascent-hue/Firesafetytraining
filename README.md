# Kirby Fire Safety: Website

The website for Kirby Fire Safety (firesafetraining.ie): fire safety training and fire risk assessments across Ireland.

## Pages
| File | Page |
|---|---|
| `index.html` | Home: opening animation, services, interactive fire triangle, team, testimonials |
| `online-course.html` | Online fire safety course (€25): intro video, modules, individual and group registration |
| `onsite-training.html` | Onsite courses, interactive extinguisher guide, legislation and HIQA compliance |
| `fire-risk-assessment.html` | Fire risk assessments and inspections |
| `about.html` | Company story, timeline, Pat & Enda Kirby, offices, testimonials |
| `contact.html` | Contact details and enquiry form |

## Files
- `assets/css/style.css`: all styles
- `assets/js/main.js`: animations and interactions (opening animation, embers, page transitions, counters, fire triangle, extinguisher guide, enquiry form)
- `assets/`: logo, team photos, course video, favicon

The opening animation on the home page plays once per browser session and can be skipped. Animations are turned off for visitors who have "reduce motion" switched on.

## Running it
It's a static site with no build step. Open `index.html` in a browser, or host the folder anywhere (GitHub Pages, Netlify, cPanel and so on).

To publish with GitHub Pages: **Settings → Pages → Deploy from a branch → `main` / root**.

## Contact form
Every page has a contact form. Enquiries are emailed to **enda@firesafetraining.ie** through [FormSubmit](https://formsubmit.co), a free service that needs no account.

**One-time setup:** the first time someone submits the form, FormSubmit emails enda@firesafetraining.ie asking to activate the form. Click **Activate Form** in that email, and every enquiry after that arrives straight in the inbox. To send enquiries to a different address, change `FORM_ENDPOINT` at the top of the form section in `assets/js/main.js`.
