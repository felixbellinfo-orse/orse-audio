# Orse Audio

A landing page with two pop-up galleries in plain HTML, CSS and JavaScript. No install or build needed.

## Change the text

Open `index.html` on GitHub and click the pencil icon. Search for `Edit the rental copy` or `Edit the bespoke copy`. Each paragraph goes in its own `<p>…</p>` inside the matching `.panel`. The box grows to fit the copy. The contact links are in the footer of the same file.

## Change the landing-page images

1. Upload an ordinary JPG, PNG or WebP to `assets/`. You do not need to dither it first. For the cutout look, remove the background and upload a transparent PNG or WebP.
2. In `index.html`, update the corresponding `src` and `alt` text. Set `width` and `height` to the new file’s dimensions so the layout is stable while it loads.
3. The `data-dither` attribute tells `dither.js` to render it in the same ink colour as the text. Remove the attribute if you prefer to supply a finished image. Adjust `DITHER_WIDTH` in `dither.js` to change the dot size.

The current horse and both photos are extracted from the supplied mockup. Both service photos deliberately use the same source until separate originals are available. For a sharper horse, replace `assets/horse.png` with the original transparent artwork (or change the file path to an SVG in `index.html`). The swing is set by `--swing` in `style.css`. The title font is Almendra, with its license in `assets/almendra-license.txt`.

## Add photos to the galleries

1. Upload full-colour JPG, PNG, WebP or AVIF files to `assets/events/` or `assets/speakers/`.
2. Open `galleries.json` on GitHub and click the pencil icon. Add one entry per photo inside the corresponding list. Match the filename exactly. `alt` describes the photo for people who can’t see it; `caption` is optional and appears in both the grid and the lightbox.
3. The array order is the gallery order. When adding multiple entries, separate them with commas, but don’t add a trailing comma after the last one.

```json
{
  "events": [
    {
      "file": "my-event.jpg",
      "alt": "Describe what is visible in the photo here",
      "caption": "Event name and venue"
    }
  ],
  "speakers": []
}
```

Both gallery links open over the landing page. The X in the top-left corner, a click outside the window, or Escape closes the gallery. Photos are not dithered in either gallery. The square thumbnails are cropped, but the lightbox shows each entire photo. For large galleries, an optional `"thumb": "my-event-small.webp"` can point to a smaller image in the same folder, while `file` stays the full-size version.

## Put it online

This repository is ready for GitHub Pages. In repository **Settings → Pages**, publish from the `main` branch and `/ (root)`. Public repositories support Pages on GitHub Free; a private repository requires a plan that supports private-repository Pages. The public website and repository visibility are separate settings.

Before pointing `www.orseaudio.com` at GitHub Pages, verify the domain on GitHub, then set the custom domain in the repository’s Pages settings and add the DNS records at the domain provider. Preserve mail records if changing DNS, and enable HTTPS after GitHub has issued the certificate. See [GitHub’s custom-domain instructions](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site).
