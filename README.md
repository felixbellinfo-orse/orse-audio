# Orse Audio

A landing page with two pop-up galleries in plain HTML, CSS and JavaScript. No install or build needed.

## Change the text

Open `index.html` on GitHub and click the pencil icon. Search for `Edit the rental copy` or `Edit the bespoke copy`. Each paragraph goes in its own `<p>…</p>` inside the matching `.panel`. The box grows to fit the copy up to its height limit, then scrolls without moving the rest of the page. The contact links are in the footer of the same file.

## Change the landing-page images

1. Upload an ordinary JPG, PNG or WebP to `assets/`. You do not need to dither it first. For the cutout look, remove the background and upload a transparent PNG or WebP.
2. In `index.html`, update the corresponding `src` and `alt` text. Set `width` and `height` to the new file’s dimensions so the layout is stable while it loads.
3. The `data-dither` attribute tells `dither.js` to render it in the same ink colour as the text. Remove the attribute if you prefer to supply a finished image. Adjust `DITHER_WIDTH` in `dither.js` to change the dot size.

The horse and wordmark are loaded from `assets/horse.png` and `assets/orse-wordmark.png`. The swing is set by `--swing` in `style.css`. The title font is Almendra, with its license in `assets/almendra-license.txt`.

## Add photos to the galleries

Upload directly to Are.na, not to the repo:

- **Gallery of events:** [Soundsystem rental](https://www.are.na/felix-bell/soundsystem-rental)
- **Gallery of speakers:** [Bespoke speaker design](https://www.are.na/felix-bell/bespoke-speaker-design)

Use image blocks in these channels. A descriptive block title becomes the caption; filename-only titles are hidden. Non-image blocks (including links and connected channels) are skipped. The galleries use the order returned by the [Are.na channel API](https://www.are.na/developers/explore/channel.md). The old `galleries.json` file is no longer used. No API key or GitHub update is needed when you add or remove a photo. Changes can take a few minutes to appear because the Are.na feed is cached.

Keep the channels **Closed** so only collaborators can add images while website visitors can still see them. Both galleries open over the landing page. Close a gallery with the X, by clicking outside, or with Escape. The square thumbnails are cropped, but the lightbox shows the whole photo in full colour.

## Put it online

This repository is ready for GitHub Pages. In repository **Settings → Pages**, publish from the `main` branch and `/ (root)`. Public repositories support Pages on GitHub Free; a private repository requires a plan that supports private-repository Pages. The public website and repository visibility are separate settings.

Before pointing `www.orseaudio.com` at GitHub Pages, verify the domain on GitHub, then set the custom domain in the repository’s Pages settings and add the DNS records at the domain provider. Preserve mail records if changing DNS, and enable HTTPS after GitHub has issued the certificate. See [GitHub’s custom-domain instructions](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site).
