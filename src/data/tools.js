export const ToolCategories = {
  CUT: "cut",
  STYLE: "style",
  COLOR: "color",
  UTILITY: "utility",
};

export const Tools = [
  { id: "clippers", name: "Clippers", category: ToolCategories.CUT, color: "#8fa6c9", guards: [0.04, 0.12, 0.2, 0.3, 0.42] },
  { id: "scissors", name: "Scissors", category: ToolCategories.CUT, color: "#c9d6e4" },
  { id: "thinning", name: "Thinning", category: ToolCategories.CUT, color: "#aebdce" },
  { id: "razor", name: "Razor", category: ToolCategories.CUT, color: "#d8c27a" },
  { id: "comb", name: "Comb", category: ToolCategories.STYLE, color: "#4a4a4a" },
  { id: "brush", name: "Brush", category: ToolCategories.STYLE, color: "#7a4e2d" },
  { id: "water", name: "Water", category: ToolCategories.UTILITY, color: "#4fa3d1" },
  { id: "dryer", name: "Dryer", category: ToolCategories.STYLE, color: "#e0557a" },
  { id: "straightener", name: "Straightener", category: ToolCategories.STYLE, color: "#444e6e" },
  { id: "curler", name: "Curler", category: ToolCategories.STYLE, color: "#9b4f6e" },
  { id: "potion", name: "Potion", category: ToolCategories.UTILITY, color: "#b77ce0" },
  { id: "dye", name: "Dye", category: ToolCategories.COLOR, color: "#e0557a" },
  { id: "gel", name: "Gel", category: ToolCategories.STYLE, color: "#9fd6c9" },
  { id: "hairspray", name: "Spray", category: ToolCategories.STYLE, color: "#d1b84f" },
  { id: "glasses", name: "Glasses", category: ToolCategories.UTILITY, color: "#333333" },
  { id: "hat", name: "Hat", category: ToolCategories.UTILITY, color: "#774422" },
  { id: "headband", name: "Headband", category: ToolCategories.UTILITY, color: "#e07a9b" },
];
