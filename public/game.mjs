import Player from "./Player.mjs";
import Collectible from "./Collectible.mjs";

const socket = io();
const canvas = document.getElementById("game-window");
const ctx = canvas.getContext("2d");
const rankboard = document.getElementById("rankboard");
const scoreboard = document.getElementById("scoreboard");

socket.on("connect", () => {
  let currentPlayer;
  let currentRank;
  document.addEventListener("keydown", (e) => {
    let dir;
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
      e.preventDefault();
    }
    switch (e.key) {
      case "ArrowLeft":
        dir = "left";
        break;
      case "ArrowRight":
        dir = "right";
        break;
      case "ArrowUp":
        dir = "up";
        break;
      case "ArrowDown":
        dir = "down";
        break;
      default:
        return;
    }

    currentPlayer.movePlayer(dir, 5);

    socket.emit("playerMove", {
      id: socket.id,
      x: currentPlayer.x,
      y: currentPlayer.y,
      score: currentPlayer.score,
    });
  });

  let intervalId = null;

  function startMoving(dir) {
    if (intervalId) return;
    intervalId = setInterval(() => {
      currentPlayer.movePlayer(dir, 5);

      socket.emit("playerMove", {
        id: socket.id,
        x: currentPlayer.x,
        y: currentPlayer.y,
        score: currentPlayer.score,
      });
    }, 50);
  }

  function stopMoving() {
    clearInterval(intervalId);
    intervalId = null;
  }

  document.querySelectorAll(".btn").forEach((btn) => {
    const dir = btn.classList[1];

    btn.addEventListener("mousedown", () => startMoving(dir));
    btn.addEventListener("mouseup", () => stopMoving(dir));
    btn.addEventListener("mouseleave", () => stopMoving(dir));

    btn.addEventListener("touchstart", (e) => {
      e.preventDefault();
      startMoving(dir);
    });
    btn.addEventListener("touchend", () => stopMoving(dir));
    btn.addEventListener("touchcancel", () => stopMoving(dir));
  });

  socket.on("updatePlayers", (players, item) => {
    // players = { id1: {x, y}, id2: {x, y}, ... }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const playersLength = Object.keys(players).length;
    Object.values(players).forEach((p) => {
      const player = new Player({ x: p.x, y: p.y, score: p.score, id: p.id });
      const color = p.color;
      if (p.id === socket.id) {
        currentPlayer = player;
        scoreboard.innerHTML = `Score: ${player.score}`;
        rankboard.innerHTML = `Rank: ${p.rank ?? 1}/${playersLength}`;

        if (player.collision(item)) {
          socket.emit("itemCollected", { id: socket.id });
        }
      }

      renderAvatar(player, color, socket.id === p.id);

      renderCollectible(item);
    });
  });
});

async function renderAvatar(player, color, isHost = false) {
  const x = player.x;
  const y = player.y;
  const size = 20;

  ctx.beginPath();
  ctx.arc(x, y, size / 2, 0, 2 * Math.PI);
  ctx.stroke();

  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.fillStyle = color;

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, size / 2.2, 0, Math.PI * 2);
  ctx.fill();

  // Ojos
  ctx.fillStyle = "white";
  const eyeOffsetX = size * 0.15;
  const eyeOffsetY = size * -0.1;
  const eyeRadius = size * 0.07;

  ctx.beginPath();
  ctx.arc(x - eyeOffsetX, y + eyeOffsetY, eyeRadius, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(x + eyeOffsetX, y + eyeOffsetY, eyeRadius, 0, Math.PI * 2);
  ctx.fill();

  // Pupilas
  ctx.fillStyle = "black";
  const pupilRadius = size * 0.03;
  ctx.beginPath();
  ctx.arc(x - eyeOffsetX, y + eyeOffsetY, pupilRadius, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(x + eyeOffsetX, y + eyeOffsetY, pupilRadius, 0, Math.PI * 2);
  ctx.fill();

  // Nariz
  ctx.fillStyle = "black";
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x - size * 0.03, y + size * 0.1);
  ctx.lineTo(x + size * 0.03, y + size * 0.1);
  ctx.closePath();
  ctx.fill();

  // Boca
  ctx.beginPath();
  ctx.arc(x, y + size * 0.15, size * 0.15, 0, Math.PI);
  ctx.strokeStyle = "black";
  ctx.lineWidth = 2;
  ctx.stroke();

  if (isHost) {
    ctx.strokeStyle = "black";
    ctx.lineWidth = 3;

    ctx.beginPath();
    ctx.moveTo(x + size * 0.5, y - size * 0.4);
    ctx.lineTo(x + size * 0.8, y - size * 0.6);
    ctx.stroke();
  }
}

function renderCollectible(collectible) {
  const x = collectible.x;
  const y = collectible.y;
  const size = 20;
  ctx.beginPath();
  ctx.arc(x, y, size / 2, 0, 2 * Math.PI);
  ctx.stroke();
  ctx.fillStyle = getColorByValue(collectible.value);
  ctx.beginPath();
  ctx.arc(x, y, size / 2.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.font = "10px Arial";
  ctx.fillStyle = "black";

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(collectible.value, x, y);
}
function getColorByValue(value) {
  const colors = [
    "#7C5A2A",
    "#8D6E36",
    "#B87333",
    "#A7A9AC",
    "#BFC1C2",
    "#C0C0C0",
    "#D4AF37",
    "#E6BE50",
    "#F2C94C",
    "#FFD700",
  ];

  return colors[value - 1] || "#006400"; // fallback
}
