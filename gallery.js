const ARENA_CHANNELS = {
  events: "soundsystem-rental",
  speakers: "bespoke-speaker-design",
};
const REFRESH_AFTER_MS = 60_000;

function firstHttps(...values) {
  for (const value of values) {
    if (typeof value !== "string") continue;
    try {
      const url = new URL(value);
      if (url.protocol === "https:" && !url.username && !url.password) return url.href;
    } catch {
      // An image block does not always have every size.
    }
  }
  return "";
}

const textValue = value => typeof value === "string" ? value.trim() : "";

function arenaPhoto(block) {
  if (block?.type !== "Image" || !block.image) return null;
  const image = block.image;
  const src = firstHttps(image.large?.src, image.src, image.medium?.src, image.small?.src);
  if (!src) return null;
  const title = textValue(block.title);
  const caption = title && title !== image.filename && !/\.(jpe?g|png|webp|avif|gif|heic|heif|tiff?)$/i.test(title)
    ? title : "";
  return {
    type: "photo",
    src,
    thumb: firstHttps(image.small?.src, image.medium?.src, image.square?.src, src),
    original: firstHttps(image.src),
    caption,
    alt: textValue(image.alt_text) || textValue(block.description?.plain) || caption,
  };
}

function arenaEntry(block) {
  if (block?.type !== "Text") return arenaPhoto(block);
  const title = textValue(block.title);
  const content = textValue(block.content?.plain);
  if (!title && !content) return null;
  return { type: "text", title, content: content === title ? "" : content };
}

async function fetchChannelEntries(key) {
  const channel = ARENA_CHANNELS[key];
  if (!channel) throw new Error("Unknown gallery");
  const endpoint = new URL(`https://api.are.na/v3/channels/${encodeURIComponent(channel)}/contents`);
  endpoint.searchParams.set("per", "100");
  const entries = new Map();
  let page = 1;

  while (page !== null) {
    endpoint.searchParams.set("page", String(page));
    const response = await fetch(endpoint, { credentials: "omit" });
    if (!response.ok) throw new Error("Are.na gallery unavailable");
    const result = await response.json();
    if (!Array.isArray(result.data) || !result.meta) throw new Error("Invalid Are.na gallery");

    for (const block of result.data) {
      const entry = arenaEntry(block);
      if (!entry) continue;
      const id = block.id ?? (entry.type === "photo" ? entry.src : entry);
      if (!entries.has(id)) entries.set(id, entry);
    }

    const next = result.meta.next_page;
    if (next != null && (!Number.isSafeInteger(next) || next <= page)) throw new Error("Invalid Are.na pagination");
    page = next ?? null;
  }

  return [...entries.values()];
}

function closeOnOutside(box) {
  let backdropDown = false;
  const outside = event => {
    const r = box.getBoundingClientRect();
    return event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom;
  };
  box.addEventListener("pointerdown", event => { backdropDown = event.target === box && outside(event); });
  box.addEventListener("pointercancel", () => { backdropDown = false; });
  box.addEventListener("click", event => {
    if (backdropDown && event.target === box && outside(event)) box.close();
    backdropDown = false;
  });
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

  if (photos.length === 1) steps.forEach(button => { button.hidden = true; });

  function render(index) {
    active = (index + photos.length) % photos.length;
    const photo = photos[active];
    counter.textContent = `${active + 1} / ${photos.length}`;
    caption.textContent = photo.caption;
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
      if (photo.original && next.src !== photo.original) {
        next.src = photo.original;
        return;
      }
      message.textContent = "This photo couldn’t be loaded.";
    });
    image.replaceWith(next);
    image = next;
    next.src = photo.src;
  }

  steps.forEach(button => button.addEventListener("click", () => render(active + Number(button.dataset.step))));
  close.addEventListener("click", () => box.close());
  box.addEventListener("close", () => opener?.focus({ preventScroll: true }));

  closeOnOutside(box);
  box.addEventListener("keydown", event => {
    if (photos.length < 2 || !["ArrowLeft", "ArrowRight"].includes(event.key)) return;
    event.preventDefault();
    render(active + (event.key === "ArrowLeft" ? -1 : 1));
  });

  return {
    open(index, trigger) {
      opener = trigger;
      render(index);
      box.showModal();
    },
    dispose: () => box.remove(),
    isOpen: () => box.open,
  };
}

function addTextTile(entry, item) {
  const tile = document.createElement("div");
  tile.className = "gallery-tile gallery-text-tile";
  if (entry.title) {
    const title = document.createElement("p");
    title.className = "gallery-text-title";
    title.textContent = entry.title;
    tile.append(title);
  }
  if (entry.content) {
    const content = document.createElement("p");
    content.textContent = entry.content;
    tile.append(content);
  }
  item.append(tile);
}

function renderGallery(entries, grid, status) {
  const key = grid.dataset.gallery;
  if (!entries.length) {
    grid.replaceChildren();
    status.hidden = false;
    status.textContent = key === "events" ? "No event photos yet." : "No speaker photos yet.";
    return null;
  }
  const photos = entries.filter(entry => entry.type === "photo").map((photo, index) => ({
    ...photo,
    alt: photo.alt || `Photo ${index + 1}`,
  }));
  const lightbox = photos.length ? addLightbox(photos) : null;
  const items = document.createDocumentFragment();
  let photoIndex = 0;
  let sectionNumber = 0;

  for (const entry of entries) {
    const item = document.createElement("li");
    items.append(item);
    if (entry.type === "text") {
      addTextTile(entry, item);
      sectionNumber = 0;
      continue;
    }
    const index = photoIndex++;
    const photo = photos[index];
    const tile = document.createElement("a");
    const number = document.createElement("span");
    const thumbnail = document.createElement("img");
    const caption = document.createElement("span");

    tile.className = "gallery-tile";
    tile.href = photo.original || photo.src;
    tile.setAttribute("aria-label", `Open photo ${index + 1}: ${photo.alt}`);
    number.textContent = String(++sectionNumber).padStart(3, "0");
    thumbnail.alt = photo.alt;
    thumbnail.loading = "lazy";
    thumbnail.decoding = "async";
    if (photo.thumb !== photo.src) {
      thumbnail.addEventListener("error", () => { thumbnail.src = photo.src; }, { once: true });
    }
    thumbnail.src = photo.thumb;
    caption.className = "gallery-caption";
    caption.textContent = photo.caption;
    caption.hidden = !photo.caption;
    tile.append(number, thumbnail, caption);
    item.append(tile);

    if (lightbox) {
      tile.setAttribute("aria-haspopup", "dialog");
      tile.addEventListener("click", event => {
        if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
        event.preventDefault();
        lightbox.open(index, tile);
      });
    }
  }
  grid.replaceChildren(items);
  status.hidden = true;
  return lightbox;
}

async function loadGallery(grid, status, previous) {
  try {
    const entries = await fetchChannelEntries(grid.dataset.gallery);
    // Keep the current thumbnail targets intact if a refresh hasn't changed them.
    const fingerprint = JSON.stringify(entries);
    if (previous?.fingerprint === fingerprint) return { ...previous, loadedAt: Date.now() };
    if (previous?.lightbox?.isOpen()) return previous;
    const lightbox = renderGallery(entries, grid, status);
    previous?.lightbox?.dispose();
    return { fingerprint, lightbox, loadedAt: Date.now() };
  } catch {
    if (!previous) status.textContent = "The gallery couldn’t be loaded from Are.na. Try again in a moment.";
    return previous;
  }
}

function prepareGalleryPopup(trigger, template) {
  const key = trigger.dataset.openGallery;
  const popup = template.content.firstElementChild.cloneNode(true);
  const heading = popup.querySelector("h2");
  const grid = popup.querySelector("[data-gallery]");
  const status = popup.querySelector(".gallery-status");
  const title = key === "events" ? "gallery of events" : "gallery of speakers";
  heading.id = `gallery-popup-${key}-title`;
  heading.textContent = title;
  grid.dataset.gallery = key;
  grid.setAttribute("aria-label", key === "events" ? "Event gallery entries" : "Speaker gallery entries");
  popup.setAttribute("aria-labelledby", heading.id);
  popup.querySelector(".gallery-popup-close").addEventListener("click", () => popup.close());
  popup.addEventListener("close", () => trigger.focus({ preventScroll: true }));
  closeOnOutside(popup);
  document.body.append(popup);
  let current;
  let pending = false;

  return async () => {
    popup.showModal();
    if (pending || (current && Date.now() - current.loadedAt < REFRESH_AFTER_MS)) return;
    pending = true;
    if (!current) status.textContent = "Loading gallery…";
    current = await loadGallery(grid, status, current);
    pending = false;
  };
}

const standaloneGrid = document.querySelector("main [data-gallery]");
if (standaloneGrid) loadGallery(standaloneGrid, document.querySelector(".gallery-status"));

const popupTemplate = document.querySelector("#gallery-popup-template");
if (popupTemplate && typeof popupTemplate.content.firstElementChild.showModal === "function") {
  document.querySelectorAll("[data-open-gallery]").forEach(trigger => {
    trigger.setAttribute("aria-haspopup", "dialog");
    let open;
    trigger.addEventListener("click", event => {
      if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
      event.preventDefault();
      open ??= prepareGalleryPopup(trigger, popupTemplate);
      open();
    });
  });
}
