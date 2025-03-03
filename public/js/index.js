// index.js

const newGameButton = document.getElementById('new-game-button');

newGameButton.addEventListener('click', () => {
  window.location.href = '/game/' + Math.floor(Math.random() * 1000000);
});

