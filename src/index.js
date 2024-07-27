import * as PIXI from "pixi.js";
import shipImage from "../assets/ship.png";
import meteorImage from "../assets/meteor.png";
import bossImage from "../assets/boss.png";

const app = new PIXI.Application({
  width: 1280,
  height: 720,
  backgroundColor: 0x1099bb,
});
document.querySelector("canvas").replaceWith(app.view);

const shipTexture = PIXI.Texture.from(shipImage);
const meteorTexture = PIXI.Texture.from(meteorImage);
const bossTexture = PIXI.Texture.from(bossImage);

const ship = new PIXI.Sprite(shipTexture);
ship.width = 100;
ship.height = 100;
ship.x = (app.view.width - ship.width) / 2;
ship.y = app.view.height - ship.height - 20;
app.stage.addChild(ship);

const bullets = [];
const meteors = [];

let totalBulletCount = 0;
const maxBullets = 10;
let destroyedMeteorsCount = 0;
let currentLevel = 1;
let areMeteorsMoving = true;
let bossHp = 4;
const bulletCountDisplay = document.getElementById("bulletCount");
const destroyedMeteorsDisplay = document.getElementById("destroyedMeteorsCount");
const bossHpDisplay = document.getElementById("boss");
const levelDisplay = document.getElementById("level");
const directionChangeProbability = 0.01; // Вірогідність зміни напряму босу
const healthIndicator = [];

const createHealthIndicator = boss => {
  healthIndicator.forEach(indicator => app.stage.removeChild(indicator));
  healthIndicator.length = 0;

  const numberOfPieces = 4;

  for (let i = 0; i < numberOfPieces; i++) {
    const healthPiece = new PIXI.Graphics();
    healthPiece.beginFill(0xff0000);
    healthPiece.drawRect(0, 0, 25, 10);
    healthPiece.endFill();

    healthPiece.x = boss.x + i * 10;
    healthPiece.y = boss.y - 20;

    healthIndicator.push(healthPiece);
    app.stage.addChild(healthPiece);
  }
};

const updateHealthIndicator = () => {
  if (healthIndicator.length > 0) {
    const healthPiece = healthIndicator.pop();
    app.stage.removeChild(healthPiece);
  }
};

const updateDisplays = () => {
  bulletCountDisplay.textContent = `Bullets: ${totalBulletCount} / 10`;
  levelDisplay.textContent = `Level ${currentLevel}`;

  if (currentLevel === 1) {
    destroyedMeteorsDisplay.textContent = `Destroyed Meteors: ${destroyedMeteorsCount} / 4`;
    bossHpDisplay.textContent = ``;
  }

  if (currentLevel === 2) {
    bossHpDisplay.textContent = `BOSS HP: ${bossHp} / 4`;
    destroyedMeteorsDisplay.textContent = ``;
  }
};

const createBullet = () => {
  if (totalBulletCount >= maxBullets) return;

  const bullet = new PIXI.Graphics();
  bullet.beginFill(0xff0000);
  bullet.drawRect(0, 0, 5, 20);
  bullet.endFill();

  bullet.x = ship.x + ship.width / 2 - 2.5;
  bullet.y = ship.y;

  bullets.push(bullet);
  app.stage.addChild(bullet);
  totalBulletCount++;
  updateDisplays();
};

const createMeteor = (simple = true) => {
  const meteor = new PIXI.Sprite(simple ? meteorTexture : bossTexture);
  meteor.width = simple ? 50 : 100;
  meteor.height = simple ? 50 : 100;
  meteor.x = Math.random() * (app.view.width - meteor.width);
  meteor.y = -meteor.height;

  meteor.velocityX = Math.random() > 0.5 ? 5 : -5; // Швидкість горизонтального переміщення

  if (!simple) {
    meteor.y = app.view.height / 2 - meteor.height / 2;
  }

  meteors.push(meteor);
  app.stage.addChild(meteor);
};

window.addEventListener("keydown", event => {
  switch (event.key) {
    case "ArrowLeft":
      ship.x -= 40;
      break;
    case "ArrowRight":
      ship.x += 40;
      break;
    case " ":
      createBullet();
      break;
  }
});

// Функція перевірки зіткнень
const checkCollisions = () => {
  for (let i = bullets.length - 1; i >= 0; i--) {
    const bullet = bullets[i];

    for (let j = meteors.length - 1; j >= 0; j--) {
      const meteor = meteors[j];

      if (bullet.getBounds().intersects(meteor.getBounds())) {
        if (currentLevel === 2 && meteor.texture === bossTexture) {
          bossHp--;
          updateHealthIndicator();

          if (bossHp <= 0) {
            app.stage.removeChild(meteor);
            meteors.splice(j, 1);
            goToNextLevel();
          }
        } else if (currentLevel === 1) {
          app.stage.removeChild(meteor);
          meteors.splice(j, 1);
          destroyedMeteorsCount++;
        }

        app.stage.removeChild(bullet);
        bullets.splice(i, 1);
        updateDisplays();
        break;
      }
    }
  }
};

const goToNextLevel = () => {
  bullets.forEach(bullet => app.stage.removeChild(bullet));
  meteors.forEach(meteor => app.stage.removeChild(meteor));
  bullets.length = 0;
  meteors.length = 0;

  if (currentLevel === 1) {
    currentLevel = 2;
    destroyedMeteorsCount = 0;
    totalBulletCount = 0;
    areMeteorsMoving = false;
    updateDisplays();

    createMeteor(false);
    createHealthIndicator(meteors[0]);
  } else {
    showGameOverModal("Victory! You completed all levels.");
    app.ticker.stop();
  }
};

const showGameOverModal = message => {
  const modal = document.createElement("div");
  modal.style.position = "absolute";
  modal.style.top = "50%";
  modal.style.left = "50%";
  modal.style.transform = "translate(-50%, -50%)";
  modal.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
  modal.style.color = "white";
  modal.style.padding = "20px";
  modal.style.borderRadius = "10px";
  modal.style.textAlign = "center";
  modal.style.fontSize = "24px";
  modal.textContent = message;

  const button = document.createElement("button");
  button.textContent = "Restart";
  button.style.marginTop = "20px";
  button.style.padding = "10px 20px";
  button.style.fontSize = "18px";
  button.addEventListener("click", () => {
    document.location.reload();
  });

  modal.appendChild(button);
  document.body.appendChild(modal);
};

const checkGameOver = () => {
  if (currentLevel === 1) {
    // умови поразки на 1 рівні
    if (totalBulletCount === maxBullets && bullets.length === 0 && destroyedMeteorsCount < 4) {
      showGameOverModal("YOU LOSE");
      return true; // Кінець гри
    }

    // умови переходу на наступний рівень або перемоги
    if (destroyedMeteorsCount >= 4) {
      goToNextLevel();
      return false; // Продовження анімації
    }
  } else if (currentLevel === 2) {
    // умови поразки на 2 рівні
    if (totalBulletCount === maxBullets && bullets.length === 0) {
      showGameOverModal("YOU LOSE");
      return true; // Кінець гри
    }

    // умови переходу на наступний рівень або перемоги
    if (meteors.length === 0) {
      goToNextLevel();
      return false; // Продовження анімації
    }
  }

  return false; // Продовження анімації
};

app.ticker.add(() => {
  // Перевірка закінчення
  if (checkGameOver()) {
    app.ticker.stop(); // Зупинити анімацію
    return;
  }

  // пересування корабля
  if (ship.x < 0) {
    ship.x = 0;
  } else if (ship.x > app.view.width - ship.width) {
    ship.x = app.view.width - ship.width;
  }

  // Постріли
  for (let i = bullets.length - 1; i >= 0; i--) {
    const bullet = bullets[i];
    bullet.y -= 10;

    // Видалення постріла якщо він війшов за єкран
    if (bullet.y < 0) {
      app.stage.removeChild(bullet);
      bullets.splice(i, 1);
    }
  }

  for (let i = meteors.length - 1; i >= 0; i--) {
    const meteor = meteors[i];

    if (areMeteorsMoving) {
      meteor.y += 1;
    } else {
      meteor.x += meteor.velocityX;

      if (Math.random() < directionChangeProbability) {
        meteor.velocityX = -meteor.velocityX;
      }

      if (meteor.x < 0 || meteor.x > app.view.width - meteor.width) {
        meteor.velocityX = -meteor.velocityX;
      }

      if (meteor.texture === bossTexture) {
        healthIndicator.forEach((piece, index) => {
          piece.x = meteor.x + index * (50 + 5);
        });
      }
    }

    // Видалення метеора, якщо він за екраном
    if (meteor.y > app.view.height) {
      app.stage.removeChild(meteor);
      meteors.splice(i, 1);
    }
  }

  if (Math.random() < 0.02 && areMeteorsMoving) {
    createMeteor();
  }

  // Проверка на столкновения
  checkCollisions();
});
