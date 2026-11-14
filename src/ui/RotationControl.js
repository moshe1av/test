import { ANGLES } from "../render/Portrait.js";

const LABELS = { front: "Front", right: "Right", back: "Back", left: "Left" };

export function createRotationSlider(onChange) {
  const wrap = document.createElement("div");
  wrap.className = "rotation-control";

  const label = document.createElement("div");
  label.className = "rotation-label";
  label.textContent = "Front";

  const slider = document.createElement("input");
  slider.type = "range";
  slider.min = "0";
  slider.max = String(ANGLES.length - 1);
  slider.step = "1";
  slider.value = "0";
  slider.className = "rotation-slider";
  slider.addEventListener("input", () => {
    const idx = parseInt(slider.value, 10);
    label.textContent = LABELS[ANGLES[idx]];
    onChange(idx);
  });

  wrap.appendChild(label);
  wrap.appendChild(slider);

  return {
    element: wrap,
    setIndex(idx) {
      slider.value = String(idx);
      label.textContent = LABELS[ANGLES[idx]];
    },
  };
}
