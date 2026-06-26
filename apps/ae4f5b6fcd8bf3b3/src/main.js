import { runMainMenu } from './scenes/MainMenu.js';
import { runSettings } from './scenes/Settings.js';
import { runEraPreview } from './scenes/EraPreview.js';
import { runHighScores } from './scenes/HighScores.js';
import { runGame } from './scenes/Game.js';
import { runGameOver } from './scenes/GameOver.js';

export const scenes = {
  "Main Menu": runMainMenu,
  "Settings": runSettings,
  "Era Preview": runEraPreview,
  "High Scores": runHighScores,
  "Game": runGame,
  "Game Over": runGameOver,
};

export const firstScene = "Main Menu";

export function runScene(game, name) {
  const fn = scenes[name];
  if (!fn) throw new Error('Unknown scene: ' + name);
  fn(game);
}
