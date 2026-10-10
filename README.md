<div align="center">

# AionSeeker.dev

**A personal space for the things I build.**

Projects, a little about me, and a way to get in touch.<br>
Monochrome design. Handwritten details. A little motion.

[Visit the portfolio](https://aionseeker.github.io/ME/) &nbsp; · &nbsp; [Get in touch](https://aionseeker.github.io/ME/#contact)

</div>

---

## About

I'm Ammar Yasser, a web developer exploring JavaScript, Linux, and the software beyond the browser. This portfolio brings together my work and what I'm learning along the way.

Built with HTML, CSS, and JavaScript, with React for the hero and footer and a Cloudflare Worker for the contact form.

## The details

- **Light & dark** — a black-and-white palette with a theme preference that stays with you.
- **A handwritten hello** — an animated SVG signature at the top of the page.
- **Motion on scroll** — sections fade in as you return to them, with subtle background dots and navigation that follows your position.
- **Room for every screen** — responsive project cards, flexible layouts, and mobile navigation.
- **Less motion when you want it** — animations respect your reduced-motion preference.
- **A direct line** — the contact form sends messages through a Cloudflare Worker, with reCAPTCHA v3 verification and email delivery through Resend.

## Run locally

From the repository root, start a local server with Python 3:

```bash
python3 -m http.server 8080 --bind 127.0.0.1
```

Open [127.0.0.1:8080](http://127.0.0.1:8080). The built React assets are included in the repository, so you can preview the portfolio immediately.

### Work on the React widget

With Node.js and npm installed:

```bash
cd my-react-widget
npm ci
npm run dev
```

This starts the widget's development server. After editing the widget, rebuild it to see the changes in the full portfolio:

```bash
npm run build
npm run lint
```

The build also updates the widget asset versions in the root `index.html`. Commit that file alongside the rebuilt `my-react-widget/dist/` assets.

### Set up the contact form

The form uses a separately deployed Cloudflare Worker. See the [Worker setup guide](worker/README.md) for reCAPTCHA keys, Resend configuration, allowed origins, and deployment. Local submissions require the local origin and reCAPTCHA domain to be allowed.

## Around the repository

```text
index.html          Page structure and content
style.css           Themes, layout, and transitions
main.js             Navigation, scroll effects, and contact form
public/             Portfolio images and assets
my-react-widget/    React hero, footer, and production bundle
worker/             Contact form backend
```

The portfolio is hosted on [GitHub Pages](https://aionseeker.github.io/ME/). Worker changes are deployed separately; instructions are in the [Worker setup guide](worker/README.md#4-deploy).

## License

MIT.

---

<div align="center">

Made by **Ammar Yasser**<br>
[Portfolio](https://aionseeker.github.io/ME/) &nbsp; · &nbsp; [Email](mailto:ammaryasseryasser49@gmail.com)

</div>
