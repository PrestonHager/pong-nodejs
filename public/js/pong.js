const socket = io({
  query: {
    gameId: gameId,
  },
});

const startButton = document.getElementById('start-button');
const resetButton = document.getElementById('reset-button');

const canvas = document.getElementById('game-canvas');
const context = canvas.getContext('2d');
const width = canvas.width;
const height = canvas.height;
const padding = 10;
const paddleWidth = 10;
const paddleHeight = 100;
const ballSize = 10;
const playerSpeed = 5;
const ballSpeed = 5;

const MOVE_NONE = 0;
const MOVE_UP = -1;
const MOVE_DOWN = 1;

const player = {
  x: width - paddleWidth - padding,
  y: height / 2 - paddleHeight / 2,
  width: paddleWidth,
  height: paddleHeight,
  move: MOVE_NONE,
};

const opponent = {
  x: padding,
  y: height / 2 - paddleHeight / 2,
  width: paddleWidth,
  height: paddleHeight,
  move: MOVE_NONE,
};

const ball = {
  x: width / 2 - ballSize / 2,
  y: height / 2 - ballSize / 2,
  dx: 0,
  dy: 0,
  size: ballSize,
};

let playerScore = 0;
let opponentScore = 0;

function drawRect(x, y, width, height, color) {
  context.fillStyle = color;
  context.fillRect(x, y, width, height);
}

function drawBall(x, y, size, color) {
  context.fillStyle = color;
  context.beginPath();
  context.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
  context.fill();
  context.closePath();
}

startButton.addEventListener('click', () => {
  // start the game
  resetBall();
  socket.emit('startGame', {
    gameId: gameId,
  });
});

resetButton.addEventListener('click', () => {
  // reset the game
  resetGame();
  socket.emit('resetGame', {
    gameId: gameId,
  });
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'w') {
    player.move = MOVE_UP;
    // tell socket that we pressed the up arrow
    socket.emit('keyDown', { gameId: gameId, key: event.key });
  }
  if (event.key === 's') {
    player.move = MOVE_DOWN;
    // tell socket that we pressed the down arrow
    socket.emit('keyDown', { gameId: gameId, key: event.key });
  }
});
document.addEventListener('keyup', (event) => {
  if (event.key === 'w' || event.key === 's') {
    player.move = MOVE_NONE;
    // tell socket that we released the up or down arrow and give position
    socket.emit('keyUp', { gameId: gameId, key: event.key, y: player.y });
  }
});

function update() {
  context.clearRect(0, 0, width, height);

  // draw player paddle
  drawRect(player.x, player.y, player.width, player.height, 'white');

  // draw opponent paddle
  drawRect(opponent.x, opponent.y, opponent.width, opponent.height, 'white');

  // draw ball
  drawBall(ball.x, ball.y, ball.size, 'white');

  // update player position
  if (player.move !== MOVE_NONE) {
    player.y += playerSpeed * player.move;
    // ensure player paddle stays within bounds
    if (player.y < 0) player.y = 0;
    if (player.y + player.height > height) player.y = height - player.height;
  }
  // update opponent position
  if (opponent.move !== MOVE_NONE) {
    opponent.y += playerSpeed * opponent.move;
    // ensure opponent paddle stays within bounds
    if (opponent.y < 0) opponent.y = 0;
    if (opponent.y + opponent.height > height) opponent.y = height - opponent.height;
  }

  // update ball position
  ball.x += ball.dx;
  ball.y += ball.dy;

  // check for collision with top and bottom walls
  if (ball.y <= 0 || ball.y + ball.size >= height) {
    ball.dy *= -1;
  }

  // check for collision with paddles
  if (ball.x <= opponent.x + opponent.width && ball.y + ball.size >= opponent.y && ball.y <= opponent.y + opponent.height) {
    ball.dx *= -1;
    ball.x = opponent.x + opponent.width;
  }
  if (ball.x + ball.size >= player.x && ball.y + ball.size >= player.y && ball.y <= player.y + player.height) {
    ball.dx *= -1;
    ball.x = player.x - ball.size;
  }

  // check for scoring
  if (ball.x <= 0) {
    // emit to socket
    socket.emit('point', {
      gameId: gameId,
      player: 'player1',
    });
    updateScore('player1');
    resetBall();
  }
  if (ball.x + ball.size >= width) {
    // emit to socket
    socket.emit('point', {
      gameId: gameId,
      player: 'player2',
    });
    updateScore('player2');
    resetBall();
  }
}

function resetBall() {
  ball.x = width / 2 - ball.size / 2;
  ball.y = height / 2 - ball.size / 2;
  // direction is random
  const angle = Math.random() * Math.PI * 2;
  ball.dx = ballSpeed * Math.cos(angle);
  ball.dy = ballSpeed * Math.sin(angle);
  // tell socket to reset ball
  socket.emit('resetBall', {
    gameId: gameId,
    ball: ball,
  });
}

function resetGame() {
  playerScore = 0;
  opponentScore = 0;
  ball.x = width / 2 - ballSize / 2;
  ball.y = height / 2 - ballSize / 2;
  ball.dx = 0;
  ball.dy = 0;
  updateScore();
}

function updateScore(who) {
  if (who === 'player1') {
    playerScore++;
  } else if (who === 'player2') {
    opponentScore++;
  }
  // update element
  const playerScoreDiv = document.getElementById('player1-score');
  const opponentScoreDiv = document.getElementById('player2-score');
  // update the span inside each element
  const playerScoreElement = playerScoreDiv.querySelector('span');
  const opponentScoreElement = opponentScoreDiv.querySelector('span');
  playerScoreElement.innerText = playerScore;
  opponentScoreElement.innerText = opponentScore;
}

// socket.io events
socket.on('keyDown', (data) => {
  if (data.key === 'w') {
    opponent.move = MOVE_UP;
  }
  if (data.key === 's') {
    opponent.move = MOVE_DOWN;
  }
});

socket.on('keyUp', (data) => {
  if (data.key === 'w' || data.key === 's') {
    opponent.move = MOVE_NONE;
  }
  // update opponent position in case of delays
  opponent.y = data.y;
});

socket.on('startGame', (data) => {
});

socket.on('resetGame', (data) => {
  resetGame();
});

// allow other player to report their collisions with the ball
socket.on('collision', (data) => {
  ball.x = data.ball.x;
  ball.y = data.ball.y;
  ball.dx = -data.ball.dx;
  ball.dy = data.ball.dy;
});

socket.on('point', (data) => {
  updateScore(data.player);
});

socket.on('resetBall', (data) => {
  ball.x = data.ball.x;
  ball.y = data.ball.y;
  ball.dx = -data.ball.dx;
  ball.dy = data.ball.dy;
});

function gameLoop() {
  update();
  requestAnimationFrame(gameLoop);
}

document.addEventListener('DOMContentLoaded', () => {
  gameLoop();
})

