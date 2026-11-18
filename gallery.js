const grid = document.querySelector("[data-gallery]");
const status = document.querySelector(".gallery-status");

function assetPath(filename) {
  return `./assets/${grid.dataset.gallery}/${encodeURIComponent(filename)}`;
}

function isImage(filename) {
  return typeof filename === "string" && /^[^/\\]+\.(jpe?g|png|webp|avif)$/i.test(filename);
}

function addLightbox(photos) {
  const box = document.createElement("dialog");
  if (typeof box.showModal !== "function") return null;
  box.className = "lightbox";
  box.setAttribute("aria-label", "Photo viewer");
  box.innerHTML = `
    <div class="lightbox-controls">
      <nav aria-label="Photo controls">
        <button type="button" data-step="-1">‹ Previous</button>
        <output aria-live="polite"></output>
        <button type="button" data-step="1">Next ›</button>
      </nav>
      <button type="button" data-close autofocus>Close ×</button>
    </div>
    <figure>
      <div class="lightbox-media">
        <img alt="" hidden>
        <p class="lightbox-message" role="status" hidden></p>
      </div>
      <figcaption></figcaption>
    </figure>`;
  document.body.append(box);

  const media = box.querySelector(".lightbox-media");
  let image = media.querySelector("img");
  const message = media.querySelector(".lightbox-message");
  const caption = box.querySelector("figcaption");
  const counter = box.querySelector("output");
  const close = box.querySelector("[data-close]");
  const steps = [...box.querySelectorAll("[data-step]")];
  let active = 0;
  let opener;
  let backdropDown = false;

  if (photos.length === 1) steps.forEach(button => { button.hidden = true; });

  function render(index) {
    active = (index + photos.length) % photos.length;
    const photo = photos[active];
    counter.textContent = `${active + 1} / ${photos.length}`;
    caption.textContent = photo.caption || "";
    caption.hidden = !photo.caption;
    message.hidden = false;
    message.textContent = "Loading photo…";

    const next = document.createElement("img");
    next.alt = photo.alt;
    next.hidden = true;
    next.addEventListener("load", () => {
      if (image !== next) return;
      message.hidden = true;
      next.hidden = false;
    });
    next.addEventListener("error", () => {
      if (image !== next) return;
      message.textContent = "This photo couldn’t be loaded.";
    });
    image.replaceWith(next);
    image = next;
    next.src = assetPath(photo.file);
  }

  steps.forEach(button => button.addEventListener("click", () => render(active + Number(button.dataset.step))));
  close.addEventListener("click", () => box.close());
  box.addEventListener("close", () => opener?.focus({ preventScroll: true }));

  const outside = event => {
    const r = box.getBoundingClientRect();
    return event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom;
  };
  box.addEventListener("pointerdown", event => { backdropDown = event.target === box && outside(event); });
  box.addEventListener("click", event => {
    if (backdropDown && event.target === box && outside(event)) box.close();
    backdropDown = false;
  });
  box.addEventListener("keydown", event => {
    if (photos.length < 2 || !["ArrowLeft", "ArrowRight"].includes(event.key)) return;
    event.preventDefault();
    render(active + (event.key === "ArrowLeft" ? -1 : 1));
  });

  return (index, trigger) => {
    opener = trigger;
    render(index);
    box.showModal();
  };
}

function renderGallery(entries) {
  const photos = entries.filter(entry => isImage(entry?.file)).map((entry, index) => ({
    file: entry.file,
    thumb: isImage(entry.thumb) ? entry.thumb : entry.file,
    alt: typeof entry.alt === "string" && entry.alt.trim() ? entry.alt.trim() : `Photo ${index + 1}`,
    caption: typeof entry.caption === "string" ? entry.caption.trim() : "",
  }));
  if (!photos.length) return;
  const openLightbox = addLightbox(photos);

  photos.forEach((photo, index) => {
    const item = document.createElement("li");
    const tile = document.createElement("a");
    const number = document.createElement("span");
    const thumbnail = document.createElement("img");
    const caption = document.createElement("span");

    tile.className = "gallery-tile";
    tile.href = assetPath(photo.file);
    tile.setAttribute("aria-label", `Open photo ${index + 1}: ${photo.alt}`);
    number.textContent = String(index + 1).padStart(3, "0");
    thumbnail.alt = photo.alt;
    thumbnail.loading = "lazy";
    thumbnail.decoding = "async";
    thumbnail.src = assetPath(photo.thumb);
    caption.className = "gallery-caption";
    caption.textContent = photo.caption;
    caption.hidden = !photo.caption;
    tile.append(number, thumbnail, caption);
    item.append(tile);
    grid.append(item);

    if (openLightbox) {
      tile.setAttribute("aria-haspopup", "dialog");
      tile.addEventListener("click", event => {
        if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
        event.preventDefault();
        openLightbox(index, tile);
      });
    }
  });
  status.hidden = true;
}

fetch("./galleries.json")
  .then(response => {
    if (!response.ok) throw new Error("Gallery unavailable");
    return response.json();
  })
  .then(galleries => {
    const entries = galleries[grid.dataset.gallery];
    if (!Array.isArray(entries)) throw new Error("Invalid gallery");
    renderGallery(entries);
  })
  .catch(() => { status.textContent = "Photos couldn’t be loaded. Try refreshing the page."; });
