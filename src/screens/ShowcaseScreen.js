import { Portrait, ANGLES } from "../render/Portrait.js";
import { gameState, Screens, Modes } from "../state/GameState.js";
import { AudioEngine } from "../audio/AudioEngine.js";

export function renderShowcase(root, goTo) {
  root.innerHTML = "";
  const character = gameState.character;
  const result = gameState.result;

  const el = document.createElement("div");
  el.className = "screen showcase-screen";
  el.innerHTML = `
    <div class="showcase-canvas-host">
      <div class="portrait-stage showcase-stage">
        <div class="shop-backdrop light"></div>
        <div class="portrait-mount"></div>
      </div>
    </div>
    <div class="showcase-panel">
      <h2>${character.name} is ready!</h2>
      <div class="star-row"></div>
      <div class="showcase-actions">
        <button class="btn-secondary photo-btn">📸 Snapshot</button>
        <button class="btn-secondary again-btn">New Client</button>
        <button class="btn-primary replay-btn">Style Again</button>
      </div>
    </div>
  `;
  root.appendChild(el);

  const mount = el.querySelector(".portrait-mount");
  const portrait = new Portrait(mount);

  const state = {
    tier: result.finalTier,
    angle: ANGLES[0],
    color: result.finalColor,
    wet: false,
    styleHold: true,
    curlBoost: false,
    thinned: false,
    accessories: result.accessories,
  };
  portrait.render(character, state);

  let angleIndex = 0;
  const spinTimer = setInterval(() => {
    angleIndex = (angleIndex + 1) % ANGLES.length;
    portrait.setAngle(character, { ...state, angle: ANGLES[angleIndex] });
  }, 900);

  const stars = computeStars(character, result, gameState.mode);
  const starRow = el.querySelector(".star-row");
  starRow.innerHTML = Array.from({ length: 5 }, (_, i) => `<span class="star ${i < stars ? "filled" : ""}">★</span>`).join("");

  AudioEngine.finishFanfare();

  el.querySelector(".photo-btn").addEventListener("click", () => {
    AudioEngine.uiTap();
    const svgMarkup = mount.querySelector("svg").outerHTML;
    exportSnapshot(svgMarkup, `${character.name.toLowerCase().replace(/\s+/g, "-")}-haircut.png`);
  });

  el.querySelector(".again-btn").addEventListener("click", () => {
    clearInterval(spinTimer);
    AudioEngine.uiTap();
    goTo(Screens.CHARACTER_SELECT);
  });

  el.querySelector(".replay-btn").addEventListener("click", () => {
    clearInterval(spinTimer);
    AudioEngine.uiTap();
    gameState.resetStats();
    goTo(Screens.GAMEPLAY);
  });
}

function exportSnapshot(svgMarkup, filename) {
  const blob = new Blob([svgMarkup], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 600;
    canvas.height = 880;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#fff3e6";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };
  img.src = url;
}

function computeStars(character, result, mode) {
  if (mode === Modes.CHALLENGE) {
    const diff = Math.abs(result.finalTier - character.challenge.targetTier);
    return Math.max(1, 5 - diff * 2);
  }
  const engagement =
    result.stats.toolsUsed.length * 0.6 +
    result.stats.cutsMade * 0.25 +
    result.stats.dyesApplied * 0.5 +
    result.accessories.length * 0.4;
  return Math.max(2, Math.min(5, Math.round(1 + engagement / 2.5)));
}
