// Scene functions come from src/scenes/*.js — real files, concatenated into
// this same script, so their declarations (hoisted) are already in reach
// here without an import.
var scenes = {
  "Main Menu": runMainMenu,
  "Level 1": runLevel1,
  "Level 2": runLevel2,
  "Level 3": runLevel3,
  "Game Over": runGameOver,
  "Victory": runVictory,
};

var firstScene = "Main Menu";

function runScene(game, name) {
  var fn = scenes[name];
  if (!fn) throw new Error('Unknown scene: ' + name);
  fn(game);
}
