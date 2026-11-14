import "./style.css";
import { gameState, Screens } from "./state/GameState.js";
import { renderSplash } from "./screens/SplashScreen.js";
import { renderCharacterSelect } from "./screens/CharacterSelectScreen.js";
import { renderGameplay } from "./screens/GameplayScreen.js";
import { renderShowcase } from "./screens/ShowcaseScreen.js";

const root = document.getElementById("app");

const renderers = {
  [Screens.SPLASH]: renderSplash,
  [Screens.CHARACTER_SELECT]: renderCharacterSelect,
  [Screens.GAMEPLAY]: renderGameplay,
  [Screens.SHOWCASE]: renderShowcase,
};

function goTo(screen) {
  gameState.screen = screen;
  renderers[screen](root, goTo);
}

goTo(Screens.SPLASH);
