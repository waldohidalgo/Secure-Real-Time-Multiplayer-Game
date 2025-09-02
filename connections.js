const canvasWidth = 640;
const canvasHeight = 480;

function execIO(io) {
  let players = {};
  let item = null;

  io.on("connection", (socket) => {
    console.log("Jugador conectado:", socket.id);
    players[socket.id] = createPlayer(socket.id, canvasWidth, canvasHeight);

    if (item) {
      io.emit("updatePlayers", players, item);
    } else {
      item = createItem(canvasWidth, canvasHeight);
      io.emit("updatePlayers", players, item);
    }
    calculateRanks(players);

    socket.on("playerMove", (data) => {
      if (players[socket.id]) {
        players[socket.id].x = data.x;
        players[socket.id].y = data.y;
        players[socket.id].score = data.score;

        io.emit("updatePlayers", players, item);
      }
    });

    socket.on("itemCollected", (data) => {
      const id = data.id;

      if (players[id] && socket.id === id) {
        players[id].score += item.value;
      }
      item = createItem(canvasWidth, canvasHeight);

      calculateRanks(players);

      io.emit("updatePlayers", players, item);
    });

    socket.on("disconnect", (reason) => {
      console.log("Jugador desconectado:", socket.id);
      console.log("Motivo de desconexión:", reason);

      delete players[socket.id];
      if (!Object.keys(players).length) item = null;

      io.emit("updatePlayers", players, item);
    });
  });
}

function createPlayer(socketId, canvasWidth, canvasHeight) {
  const avatarSize = 20;
  const x_random = Math.floor(
    avatarSize + Math.random() * (canvasWidth - 2 * avatarSize)
  );
  const y_random = Math.floor(
    avatarSize + Math.random() * (canvasHeight - 2 * avatarSize)
  );
  const id = socketId;
  const color = `hsl(${Math.random() * 360},70%,50%)`;
  return { x: x_random, y: y_random, id, color, score: 0 };
}

function createItem(canvasWidth, canvasHeight) {
  const itemSize = 20;
  const x_random = Math.floor(
    itemSize + Math.random() * (canvasWidth - 2 * itemSize)
  );
  const y_random = Math.floor(
    itemSize + Math.random() * (canvasHeight - 2 * itemSize)
  );
  const value = Math.floor(1 + Math.random() * 10);
  return { x: x_random, y: y_random, value };
}

function calculateRanks(players) {
  const sorted = Object.values(players).sort((a, b) => b.score - a.score);
  sorted.forEach((p, i) => (p.rank = i + 1));
}
module.exports = execIO;
