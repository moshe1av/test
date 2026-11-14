import { Tools } from "../data/tools.js";

export function createToolDock(onSelect) {
  const dock = document.createElement("div");
  dock.className = "tool-dock";
  const buttons = {};
  for (const tool of Tools) {
    const btn = document.createElement("button");
    btn.className = "tool-btn";
    btn.style.setProperty("--tool-color", tool.color);
    btn.dataset.tool = tool.id;
    btn.innerHTML = `<span class="tool-dot"></span><span class="tool-label">${tool.name}</span>`;
    btn.addEventListener("click", () => onSelect(tool.id));
    dock.appendChild(btn);
    buttons[tool.id] = btn;
  }
  return {
    element: dock,
    setActive(toolId) {
      for (const id of Object.keys(buttons)) buttons[id].classList.toggle("active", id === toolId);
    },
  };
}
