// server.js

// import libraries
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');

// create app definition
const app = express();
const port = 3000 || process.env.PORT;
const server = createServer(app);
const io = new Server(server);

// send the render engine to use html files that allow variables to be passed in
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

// index route
app.get('/', (req, res) => {
  // get a list of current games available to join
  const rooms = io.of('/').adapter.rooms;
  const games = [];
  for (const [key, value] of rooms.entries()) {
    if (key.startsWith('game-') && value.size < 2) {
      games.push({
        id: key.split('-')[1],
        url: `/game/${key.split('-')[1]}`,
      });
    }
  }
  // send the index.html file with the games list
  res.render('index', { games: games });
});

// game route
app.get('/game/:gameId', (req, res) => {
  const gameId = req.params.gameId;
  // send the pong.html file with the gameId
  res.render('pong', { gameId: gameId });
});

// socket.io connections
io.on('connection', (socket) => {
  // get the gameId from the socket connection query
  const gameId = socket.handshake.query.gameId;
  // ensure room is not full
  const room = io.of('/').adapter.rooms.get(`game-${gameId}`);
  const numClients = room ? room.size : 0;
  if (numClients >= 2) {
    console.log(`User ${socket.id} tried to join game-${gameId}, but room is full`);
    socket.emit('roomFull', 'The room is full, please try again later');
    return;
  }
  console.log(`User connected ${socket.id} to game-${gameId}`);
  socket.join(`game-${gameId}`);

  socket.on('disconnect', () => {
    console.log(`User disconnected ${socket.id} from game-${gameId}`);
  });

  // events
  socket.on('keyDown', (data) => {
    const gameId = data.gameId;
    socket.to(`game-${gameId}`).emit('keyDown', data);
  });
  socket.on('keyUp', (data) => {
    const gameId = data.gameId;
    socket.to(`game-${gameId}`).emit('keyUp', data);
  });
  socket.on('resetGame', (data) => {
    const gameId = data.gameId;
    socket.to(`game-${gameId}`).emit('resetGame', data);
  });
  socket.on('startGame', (data) => {
    const gameId = data.gameId;
    socket.to(`game-${gameId}`).emit('startGame', data);
  });
  socket.on('collision', (data) => {
    const gameId = data.gameId;
    socket.to(`game-${gameId}`).emit('collision', data);
  });
  socket.on('point', (data) => {
    const gameId = data.gameId;
    socket.to(`game-${gameId}`).emit('point', data);
  });
  socket.on('resetBall', (data) => {
    const gameId = data.gameId;
    socket.to(`game-${gameId}`).emit('resetBall', data);
  });
});

app.use(express.static('public'));

server.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});

