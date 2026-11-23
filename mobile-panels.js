const servicePopup = document.querySelector(".service-popup");

if (typeof servicePopup?.showModal === "function") {
  const phoneLayout = window.matchMedia("(max-width: 600px)");
  const content = servicePopup.querySelector(".gallery-popup-content");
  const title = servicePopup.querySelector("h2");
  const closeButton = servicePopup.querySelector("button");
  const disclosures = [...document.querySelectorAll(".disclosure")];
  let active;

  function syncTriggers() {
    for (const box of disclosures) {
      const summary = box.querySelector("summary");
      if (phoneLayout.matches) {
        summary.setAttribute("aria-haspopup", "dialog");
        box.open = false;
      } else {
        summary.removeAttribute("aria-haspopup");
      }
    }
    if (!phoneLayout.matches && servicePopup.open) servicePopup.close();
  }

  disclosures.forEach(box => {
    const summary = box.querySelector("summary");
    const panel = box.querySelector(".panel");

    summary.addEventListener("click", event => {
      if (!phoneLayout.matches) return;
      event.preventDefault();
      if (active) return;

      // Move the existing copy so desktop and mobile share one editable text box.
      active = { box, panel, summary };
      title.textContent = summary.textContent;
      content.append(panel);
      servicePopup.showModal();
      content.scrollTop = 0;
    });
  });

  closeButton.addEventListener("click", () => servicePopup.close());
  servicePopup.addEventListener("close", () => {
    if (!active) return;
    const { box, panel, summary } = active;
    box.append(panel);
    active = undefined;
    summary.focus({ preventScroll: true });
  });

  phoneLayout.addEventListener("change", syncTriggers);
  syncTriggers();
}
