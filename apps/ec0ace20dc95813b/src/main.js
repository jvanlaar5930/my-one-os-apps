import { runMainMenu } from './scenes/MainMenu.js';
import { runRampageLevel } from './scenes/RampageLevel.js';
import { runResults } from './scenes/Results.js';

export const scenes = {
  "Main Menu": runMainMenu,
  "Rampage Level": runRampageLevel,
  "Results": runResults,
};

export const firstScene = "Main Menu";

export function runScene(game, name) {
  const fn = scenes[name];
  if (!fn) throw new Error('Unknown scene: ' + name);
  fn(game);
}
