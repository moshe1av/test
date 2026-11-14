export function createRotationSlider(onChange) {
  const wrap = document.createElement("div");
  wrap.className = "rotation-control";

  const label = document.createElement("div");
  label.className = "rotation-label";
  label.textContent = "Rotate";

  const slider = document.createElement("input");
  slider.type = "range";
  slider.min = "0";
  slider.max = "360";
  slider.value = "0";
  slider.className = "rotation-slider";
  slider.addEventListener("input", () => onChange(parseFloat(slider.value)));

  wrap.appendChild(label);
  wrap.appendChild(slider);

  return {
    element: wrap,
    setValue(deg) {
      slider.value = String(((deg % 360) + 360) % 360);
    },
  };
}
