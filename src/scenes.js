import Phaser, { LEFT, RIGHT, UP, DOWN } from "phaser";
import emptytile_png from "./assets/sprites/emptytile.png";
import tiles_png from "./assets/sprites/tiles.png";
import grow_mp3 from "./assets/sounds/grow.mp3";
import grow_ogg from "./assets/sounds/grow.ogg";
import move_mp3 from "./assets/sounds/move.mp3";
import move_ogg from "./assets/sounds/move.ogg";

class PlayGame extends Phaser.Scene {
  constructor(opts) {
    super("PlayGame");
    this.opts = opts;
  }
  create() {
    this.canMove = false;
    this.board = [];
    for (let i = 0; i < this.opts.boardSize.rows; ++i) {
      this.board[i] = [];
    }
    this.moveSound = this.sound.add("move");
    this.growSound = this.sound.add("grow");

    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        const pos = this.getTilePosition(i, j);
        this.add.image(pos.x, pos.y, "emptytile");
        const tile = this.add.sprite(pos.x, pos.y, "tiles", 0);
        tile.visible = false;
        this.board[i][j] = {
          tileValue: 0,
          tileSprite: tile
        };
      }
    }
    this.addTile();
    this.addTile();
    this.input.keyboard.on("keydown", this.handleKey, this);
    this.input.on("pointerup", this.handleSwipe, this);
  }

  isLegalPosition(row, col, value) {
    const rowInside = row >= 0 && row < this.opts.boardSize.rows;
    const colInside = col >= 0 && col < this.opts.boardSize.cols;
    if (!rowInside || !colInside) {
      return false;
    }
    const emptySpot = this.board[row][col].tileValue == 0;
    const sameValue = this.board[row][col].tileValue == value;
    return emptySpot || sameValue;
  }

  makeMove(d) {
    this.movingTiles = 0;
    const dRow = d == LEFT || d == RIGHT ? 0 : d == UP ? -1 : 1;
    const dCol = d == UP || d == DOWN ? 0 : d == LEFT ? -1 : 1;
    this.canMove = false;
    const firstRow = d == UP ? 1 : 0;
    const lastRow = this.opts.boardSize.rows - (d == DOWN ? 1 : 0);
    const firstCol = d == LEFT ? 1 : 0;
    const lastCol = this.opts.boardSize.cols - (d == RIGHT ? 1 : 0);
    for (let i = firstRow; i < lastRow; i++) {
      for (let j = firstCol; j < lastCol; j++) {
        const curRow = dRow == 1 ? lastRow - 1 - i : i;
        const curCol = dCol == 1 ? lastCol - 1 - j : j;
        const tileValue = this.board[curRow][curCol].tileValue;
        if (tileValue != 0) {
          let newRow = curRow;
          let newCol = curCol;
          while (
            this.isLegalPosition(newRow + dRow, newCol + dCol, tileValue)
          ) {
            newRow += dRow;
            newCol += dCol;
          }
          if (newRow != curRow || newCol != curCol) {
            const newPos = this.getTilePosition(newRow, newCol);
            const willUpdate =
              this.board[newRow][newCol].tileValue == tileValue;
            this.moveTile(
              this.board[curRow][curCol].tileSprite,
              newPos,
              willUpdate
            );
            this.board[curRow][curCol].tileValue = 0;
            if (willUpdate) {
              this.board[newRow][newCol].tileValue++;
              this.board[newRow][newCol].upgraded = true;
            } else {
              this.board[newRow][newCol].tileValue = tileValue;
            }
          }
        }
      }
    }
    if (this.movingTiles == 0) {
      this.canMove = true;
    } else {
      this.moveSound.play();
    }
  }

  moveTile(tile, point, upgrade) {
    this.movingTiles++;
    tile.depth = this.movingTiles;
    const distance = Math.abs(tile.x - point.x) + Math.abs(tile.y - point.y);
    this.tweens.add({
      targets: [tile],
      x: point.x,
      y: point.y,
      duration: (this.opts.tweenSpeed * distance) / this.opts.tileSize,
      callbackScope: this,
      onComplete: () => {
        if (upgrade) {
          this.upgradeTile(tile);
        } else {
          this.endTween(tile);
        }
      }
    });
  }

  upgradeTile(tile) {
    this.growSound.play();
    tile.setFrame(tile.frame.name + 1);
    this.tweens.add({
      targets: [tile],
      scaleX: 1.1,
      scaleY: 1.1,
      duration: this.opts.tweenSpeed,
      yoyo: true,
      repeat: 1,
      callbackScope: this,
      onComplete: () => {
        this.movingTiles--;
        tile.depth = 0;
        if (this.movingTiles == 0) {
          this.refreshBoard();
        }
      }
    });
  }

  endTween(tile) {
    this.movingTiles--;
    tile.depth = 0;
    if (this.movingTiles == 0) {
      this.refreshBoard();
    }
  }

  refreshBoard() {
    for (let i = 0; i < this.opts.boardSize.rows; i++) {
      for (let j = 0; j < this.opts.boardSize.cols; j++) {
        const spritePosition = this.getTilePosition(i, j);
        this.board[i][j].tileSprite.x = spritePosition.x;
        this.board[i][j].tileSprite.y = spritePosition.y;
        const tileValue = this.board[i][j].tileValue;
        if (tileValue > 0) {
          this.board[i][j].tileSprite.visible = true;
          this.board[i][j].tileSprite.setFrame(tileValue - 1);
        } else {
          this.board[i][j].tileSprite.visible = false;
        }
      }
    }
    this.addTile();
  }

  handleKey(e) {
    if (this.canMove) {
      const keyPressed = e.code;
      switch (e.code) {
        case "KeyA":
        case "ArrowLeft":
          this.makeMove(LEFT);
          break;
        case "KeyD":
        case "ArrowRight":
          this.makeMove(RIGHT);
          break;
        case "KeyW":
        case "ArrowUp":
          this.makeMove(UP);
          break;
        case "KeyS":
        case "ArrowDown":
          this.makeMove(DOWN);
        default:
          break;
      }
    }
  }

  handleSwipe(e) {
    if (this.canMove) {
      const swipeTime = e.upTime - e.downTime;
      const fastEnough = swipeTime < this.opts.swipeMaxTime;
      const swipe = new Phaser.Geom.Point(e.upX - e.downX, e.upY - e.downY);
      const swipeMagnitude = Phaser.Geom.Point.GetMagnitude(swipe);
      const longEnough = swipeMagnitude > this.opts.swipeMinDistance;
      if (fastEnough && longEnough) {
        Phaser.Geom.Point.SetMagnitude(swipe, 1);
        if (swipe.x > this.opts.swipeMinNormal) {
          this.makeMove(RIGHT);
        }
        if (swipe.x < -this.opts.swipeMinNormal) {
          this.makeMove(LEFT);
        }
        if (swipe.y > this.opts.swipeMinNormal) {
          this.makeMove(DOWN);
        }
        if (swipe.y < -this.opts.swipeMinNormal) {
          this.makeMove(UP);
        }
      }
    }
  }

  getTilePosition(row, col) {
    const opts = this.opts;
    const x = opts.tileSpacing * (col + 1) + opts.tileSize * (col + 0.5);
    const y = opts.tileSpacing * (row + 1) + opts.tileSize * (row + 0.5);
    return new Phaser.Geom.Point(x, y);
  }

  addTile() {
    const emptyTiles = [];
    for (let i = 0; i < this.opts.boardSize.rows; ++i) {
      for (let j = 0; j < this.opts.boardSize.cols; ++j) {
        if (this.board[i][j].tileValue == 0) {
          emptyTiles.push({
            row: i,
            col: j
          });
        }
      }
    }
    if (emptyTiles.length > 0) {
      let chosenTile = Phaser.Utils.Array.GetRandom(emptyTiles);
      this.board[chosenTile.row][chosenTile.col].tileValue = 1;
      this.board[chosenTile.row][chosenTile.col].tileSprite.visible = true;
      this.board[chosenTile.row][chosenTile.col].tileSprite.setFrame(0);
      this.board[chosenTile.row][chosenTile.col].tileSprite.alpha = 0;
      this.tweens.add({
        targets: [this.board[chosenTile.row][chosenTile.col].tileSprite],
        alpha: 1,
        duration: this.opts.tweenSpeed,
        onComplete: () => {
          console.log("tween completed");
          this.canMove = true;
        }
      });
    }
  }
}

class BootGame extends Phaser.Scene {
  constructor(opts) {
    super("BootGame");
    this.opts = opts;
  }

  preload() {
    this.load.image("emptytile", emptytile_png);
    this.load.spritesheet("tiles", tiles_png, {
      frameWidth: this.opts.tileSize,
      frameHeight: this.opts.tileSize
    });
    this.load.audio("move", [move_mp3, move_ogg]);
    this.load.audio("grow", [grow_mp3, grow_ogg]);
  }

  create() {
    console.log("Game is booting...");
    this.scene.start("PlayGame");
  }
}

export { BootGame, PlayGame };
