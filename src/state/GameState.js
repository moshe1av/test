export const Screens = {
  SPLASH: "splash",
  CHARACTER_SELECT: "characterSelect",
  GAMEPLAY: "gameplay",
  SHOWCASE: "showcase",
};

export const Modes = {
  FREESTYLE: "freestyle",
  CHALLENGE: "challenge",
};

class GameState {
  constructor() {
    this.screen = Screens.SPLASH;
    this.mode = Modes.FREESTYLE;
    this.character = null;
    this.result = null;
    this.resetStats();
  }

  resetStats() {
    this.stats = {
      cutsMade: 0,
      toolsUsed: new Set(),
      dyesApplied: 0,
      accessoriesWorn: 0,
    };
  }
}

export const gameState = new GameState();
