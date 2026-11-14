import { AudioEngine } from "../audio/AudioEngine.js";
import { Screens } from "../state/GameState.js";

export function renderSplash(root, goTo) {
  root.innerHTML = "";
  const el = document.createElement("div");
  el.className = "screen splash-screen";
  el.innerHTML = `
    <div class="splash-logo">
      <div class="splash-scissors">✂️</div>
      <h1>Snip &amp; Style</h1>
      <p class="splash-sub">Hair Salon &amp; Barbershop</p>
    </div>
    <button class="btn-primary btn-play">Play</button>
  `;
  root.appendChild(el);

  el.querySelector(".btn-play").addEventListener("click", () => {
    AudioEngine.init();
    AudioEngine.startMusic();
    AudioEngine.uiTap();
    goTo(Screens.CHARACTER_SELECT);
  });
}
