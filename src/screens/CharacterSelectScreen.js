import { Characters } from "../data/characters.js";
import { gameState, Screens, Modes } from "../state/GameState.js";
import { AudioEngine } from "../audio/AudioEngine.js";

export function renderCharacterSelect(root, goTo) {
  root.innerHTML = "";
  const el = document.createElement("div");
  el.className = "screen select-screen";

  const modeTabs = document.createElement("div");
  modeTabs.className = "mode-tabs";
  modeTabs.innerHTML = `
    <button class="mode-tab active" data-mode="${Modes.FREESTYLE}">Freestyle</button>
    <button class="mode-tab" data-mode="${Modes.CHALLENGE}">Challenge</button>
  `;
  el.appendChild(modeTabs);

  const grid = document.createElement("div");
  grid.className = "character-grid";
  el.appendChild(grid);

  let selectedMode = Modes.FREESTYLE;
  modeTabs.querySelectorAll(".mode-tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      selectedMode = btn.dataset.mode;
      modeTabs.querySelectorAll(".mode-tab").forEach((b) => b.classList.toggle("active", b === btn));
      AudioEngine.uiTap();
    });
  });

  for (const character of Characters) {
    const card = document.createElement("button");
    card.className = "character-card";
    card.innerHTML = `
      <div class="avatar" style="--skin:${character.skinTone};--hair:${character.hairColor}">
        <div class="avatar-hair avatar-hair-${character.hairType}"></div>
        <div class="avatar-face"></div>
      </div>
      <div class="character-name">${character.name}</div>
      <div class="character-tag">${character.hairType} hair</div>
    `;
    card.addEventListener("click", () => {
      AudioEngine.uiTap();
      gameState.character = character;
      gameState.mode = selectedMode;
      gameState.resetStats();
      goTo(Screens.GAMEPLAY);
    });
    grid.appendChild(card);
  }

  root.appendChild(el);
}
