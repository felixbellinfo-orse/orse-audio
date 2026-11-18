// The source files can be ordinary colour photos. Only browser output is dithered.
const BAYER_8 = [
   0, 48, 12, 60,  3, 51, 15, 63,
  32, 16, 44, 28, 35, 19, 47, 31,
   8, 56,  4, 52, 11, 59,  7, 55,
  40, 24, 36, 20, 43, 27, 39, 23,
   2, 50, 14, 62,  1, 49, 13, 61,
  34, 18, 46, 30, 33, 17, 45, 29,
  10, 58,  6, 54,  9, 57,  5, 53,
  42, 26, 38, 22, 41, 25, 37, 21,
];

const DITHER_WIDTH = 300; // Lower for larger dots; higher for finer dots.

function addDither(original) {
  const source = new Image();
  source.crossOrigin = "anonymous";

  source.onload = () => {
    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;
      canvas.width = Math.min(DITHER_WIDTH, source.naturalWidth);
      canvas.height = Math.max(1, Math.round(canvas.width * source.naturalHeight / source.naturalWidth));
      ctx.fillStyle = getComputedStyle(original).color;
      ctx.fillRect(0, 0, 1, 1);
      const [red, green, blue] = ctx.getImageData(0, 0, 1, 1).data;
      ctx.clearRect(0, 0, 1, 1);
      ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
      const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = frame.data;

      for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
          const i = (y * canvas.width + x) * 4;
          const lightness = (0.2126 * pixels[i] + 0.7152 * pixels[i + 1] + 0.0722 * pixels[i + 2]) / 255;
          const ink = (1 - lightness ** 1.12) * (pixels[i + 3] / 255);
          const threshold = (BAYER_8[(y % 8) * 8 + x % 8] + 0.5) / 64;
          pixels[i] = red;
          pixels[i + 1] = green;
          pixels[i + 2] = blue;
          pixels[i + 3] = ink >= threshold ? 255 : 0;
        }
      }

      ctx.putImageData(frame, 0, 0);
      canvas.setAttribute("aria-hidden", "true");
      original.after(canvas);
      original.dataset.rendered = "";
    } catch {
      // If an image cannot be read by Canvas, keep the original visible.
    }
  };

  source.src = original.currentSrc || original.src;
}

document.querySelectorAll("img[data-dither]").forEach(addDither);
