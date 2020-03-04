import Phaser from "phaser";
import "./index.css";
import { BootGame, PlayGame } from "./scenes";

const opts = {
  tileSize: 200,
  tileSpacing: 20,
  boardSize: {
    rows: 4,
    cols: 4
  },
  tweenSpeed: 50,
  swipeMaxTime: 1000,
  swipeMinDistance: 20,
  swipeMinNormal: 0.85
};
let game = null;

window.onload = () => {
  const resizeGame = () => {
    const canvas = document.querySelector("canvas");
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const windowRatio = windowWidth / windowHeight;
    const gameRatio = game.config.width / game.config.height;
    if (windowRatio < gameRatio) {
      canvas.style.width = `${windowWidth}px`;
      canvas.style.height = `${windowWidth / gameRatio}px`;
    } else {
      canvas.style.width = `${windowHeight * gameRatio}px`;
      canvas.style.height = `${windowHeight}px`;
    }
  };
  const bootGame = new BootGame(opts);
  const playGame = new PlayGame(opts);
  const config = {
    width:
      opts.boardSize.cols * (opts.tileSize + opts.tileSpacing) +
      opts.tileSpacing,
    height:
      opts.boardSize.rows * (opts.tileSize + opts.tileSpacing) +
      opts.tileSpacing,
    type: Phaser.CANVAS,
    backgroundColor: 0xecf0f1,
    scene: [bootGame, playGame]
  };
  game = new Phaser.Game(config);
  window.focus();
  resizeGame();
  window.addEventListener("resize", resizeGame);
};
