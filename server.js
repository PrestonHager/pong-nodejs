// server.js

// import libraries
const express = require('express');
const cookieSession = require('cookie-session');
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

// setup cookie authentication
app.use(cookieSession({
  secret: 'my-secret',
}));

// index route
app.get('/', (req, res) => {
  res.send(`Hello World!\nSession: ${JSON.stringify(req.session)}`);
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

