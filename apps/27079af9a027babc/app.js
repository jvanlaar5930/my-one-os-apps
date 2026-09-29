const gameState = {
  cards: [],
  flipped: [],
  matched: [],
  moves: 0,
  startTime: null,
  isGameRunning: false,
  difficulty: 'easy',
  timerInterval: null,
  canFlip: true,
  gameScore: 0
};

const DIFFICULTY_CONFIG = {
  easy: { rows: 4, cols: 4, pairs: 8 },
  medium: { rows: 4, cols: 6, pairs: 12 },
  hard: { rows: 6, cols: 6, pairs: 18 },
  extreme: { rows: 8, cols: 8, pairs: 32 }
};

const CARD_EMOJIS = ['🎮', '🎯', '🎲', '🎪', '🎨', '🎭', '🎬', '🎸', '🎺', '🎻', '🎰', '⚽', '🏀', '🎳', '🏐', '🏈', '🎾'];

const difficultySelect = document.getElementById('difficulty-select');
const startGameBtn = document.getElementById('start-game-btn');
const gameBoard = document.getElementById('game-board');
const cardGrid = document.getElementById('card-grid');
const timerEl = document.getElementById('timer');
const moveCountEl = document.getElementById('move-count');
const gameOverModal = document.getElementById('game-over-modal');
const playerNameInput = document.getElementById('player-name-input');
const saveScoreBtn = document.getElementById('save-score-btn');
const cancelScoreBtn = document.getElementById('cancel-score-btn');
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const difficultyFilter = document.getElementById('difficulty-filter');
const topTenFilter = document.getElementById('top-10-filter');
const refreshLeaderboardBtn = document.getElementById('refresh-leaderboard-btn');
const leaderboardBody = document.getElementById('leaderboard-body');
const sortableHeaders = document.querySelectorAll('.sortable');

let currentSortColumn = 'score';
let sortAscending = false;

async function initializeApp() {
  if (!window.os) return;

  try {
    await os.database.exec(`
      CREATE TABLE IF NOT EXISTS games (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        playerName TEXT NOT NULL,
        score INTEGER NOT NULL,
        timeSeconds REAL NOT NULL,
        difficulty TEXT NOT NULL,
        dateCreated TEXT NOT NULL
      )
    `);

    await loadLeaderboard();
    await updateStats();
  } catch (error) {
    console.error('Database initialization error:', error);
  }
}

function generateCards(pairCount) {
  const cards = [];
  const emojis = CARD_EMOJIS.slice(0, pairCount);

  emojis.forEach(emoji => {
    cards.push(emoji);
    cards.push(emoji);
  });

  return cards.sort(() => Math.random() - 0.5);
}

function startGame() {
  gameState.difficulty = difficultySelect.value;
  const config = DIFFICULTY_CONFIG[gameState.difficulty];

  gameState.cards = generateCards(config.pairs);
  gameState.flipped = [];
  gameState.matched = [];
  gameState.moves = 0;
  gameState.isGameRunning = true;
  gameState.canFlip = true;
  gameState.startTime = Date.now();

  renderCardGrid();
  gameBoard.classList.remove('hidden');
  startTimer();
  updateMoveCount();

  difficultySelect.disabled = true;
  startGameBtn.disabled = true;
}

function renderCardGrid() {
  const config = DIFFICULTY_CONFIG[gameState.difficulty];
  cardGrid.className = `card-grid ${gameState.difficulty}`;
  cardGrid.innerHTML = '';

  gameState.cards.forEach((emoji, index) => {
    const card = document.createElement('button');
    card.className = 'card';
    card.dataset.index = index;

    if (gameState.matched.includes(index)) {
      card.classList.add('matched');
      card.disabled = true;
      card.textContent = emoji;
    }

    if (gameState.flipped.includes(index)) {
      card.classList.add('flipped');
      card.textContent = emoji;
    }

    card.addEventListener('click', () => flipCard(index, card));
    cardGrid.appendChild(card);
  });
}

function flipCard(index, cardEl) {
  if (!gameState.canFlip || gameState.flipped.includes(index) || gameState.matched.includes(index)) {
    return;
  }

  gameState.flipped.push(index);
  cardEl.classList.add('flipped');
  cardEl.textContent = gameState.cards[index];

  if (gameState.flipped.length === 2) {
    gameState.canFlip = false;
    gameState.moves++;
    updateMoveCount();

    const [first, second] = gameState.flipped;

    if (gameState.cards[first] === gameState.cards[second]) {
      gameState.matched.push(first, second);
      gameState.flipped = [];
      gameState.canFlip = true;

      if (gameState.matched.length === gameState.cards.length) {
        endGame();
      }
    } else {
      setTimeout(() => {
        gameState.flipped = [];
        gameState.canFlip = true;
        renderCardGrid();
      }, 1000);
    }
  }
}

function startTimer() {
  clearInterval(gameState.timerInterval);
  gameState.timerInterval = setInterval(() => {
    if (gameState.isGameRunning) {
      const elapsed = Math.floor((Date.now() - gameState.startTime) / 1000);
      const minutes = Math.floor(elapsed / 60);
      const seconds = elapsed % 60;
      timerEl.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
  }, 100);
}

function updateMoveCount() {
  moveCountEl.textContent = gameState.moves;
}

function endGame() {
  gameState.isGameRunning = false;
  clearInterval(gameState.timerInterval);

  const timeSeconds = (Date.now() - gameState.startTime) / 1000;
  gameState.gameScore = calculateScore(timeSeconds, gameState.moves, gameState.difficulty);

  document.getElementById('result-time').textContent = formatTime(timeSeconds);
  document.getElementById('result-moves').textContent = gameState.moves;
  document.getElementById('result-score').textContent = gameState.gameScore;

  playerNameInput.value = '';
  gameOverModal.classList.remove('hidden');
}

function calculateScore(timeSeconds, moves, difficulty) {
  const difficultyMultiplier = { easy: 1, medium: 1.5, hard: 2, extreme: 3 }[difficulty];
  const baseScore = Math.max(1000 - timeSeconds * 10 - moves * 5, 100);
  return Math.round(baseScore * difficultyMultiplier);
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

async function saveScore() {
  if (!window.os) return;

  const playerName = playerNameInput.value.trim() || 'Anonymous';
  const timeSeconds = (Date.now() - gameState.startTime) / 1000;

  try {
    await os.database.run(
      'INSERT INTO games (playerName, score, timeSeconds, difficulty, dateCreated) VALUES (?, ?, ?, ?, ?)',
      [playerName, gameState.gameScore, timeSeconds, gameState.difficulty, new Date().toISOString()]
    );

    gameOverModal.classList.add('hidden');
    resetGame();
    switchTab('leaderboard');
    await loadLeaderboard();
    await updateStats();
  } catch (error) {
    console.error('Error saving score:', error);
  }
}

function resetGame() {
  gameState.cards = [];
  gameState.flipped = [];
  gameState.matched = [];
  gameState.moves = 0;
  gameState.isGameRunning = false;
  gameState.canFlip = true;
  clearInterval(gameState.timerInterval);

  gameBoard.classList.add('hidden');
  timerEl.textContent = '0:00';
  moveCountEl.textContent = '0';
  cardGrid.innerHTML = '';

  difficultySelect.disabled = false;
  startGameBtn.disabled = false;
}

async function loadLeaderboard() {
  if (!window.os) return;

  try {
    const difficulty = difficultyFilter.value;
    const topTen = topTenFilter.checked;

    let query = 'SELECT * FROM games';
    const params = {};

    if (difficulty) {
      query += ' WHERE difficulty = @difficulty';
      params.difficulty = difficulty;
    }

    query += ' ORDER BY ' + currentSortColumn + (sortAscending ? ' ASC' : ' DESC');

    if (topTen) {
      query += ' LIMIT 10';
    }

    const games = await os.database.query(query, params);

    leaderboardBody.innerHTML = '';
    games.forEach((game, index) => {
      const row = document.createElement('tr');
      const date = new Date(game.dateCreated);
      const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();

      row.innerHTML = `
        <td>${index + 1}</td>
        <td>${game.playerName}</td>
        <td>${game.score}</td>
        <td>${formatTime(game.timeSeconds)}</td>
        <td>${game.difficulty}</td>
        <td>${formattedDate}</td>
      `;
      leaderboardBody.appendChild(row);
    });

    if (games.length === 0) {
      leaderboardBody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem;">No games played yet</td></tr>';
    }
  } catch (error) {
    console.error('Error loading leaderboard:', error);
  }
}

async function updateStats() {
  if (!window.os) return;

  try {
    const totalGames = await os.database.query('SELECT COUNT(*) as count FROM games');
    document.getElementById('total-games').textContent = totalGames[0]?.count || 0;

    const bestTime = await os.database.query('SELECT MIN(timeSeconds) as minTime FROM games');
    const minTime = bestTime[0]?.minTime;
    document.getElementById('best-time').textContent = minTime ? formatTime(minTime) : '-';

    const avgScore = await os.database.query('SELECT AVG(score) as avgScore FROM games');
    const avgVal = avgScore[0]?.avgScore;
    document.getElementById('avg-score').textContent = avgVal ? Math.round(avgVal) : '-';
  } catch (error) {
    console.error('Error updating stats:', error);
  }
}

function switchTab(tabName) {
  tabContents.forEach(content => content.classList.remove('active'));
  tabBtns.forEach(btn => btn.classList.remove('active'));

  document.getElementById(`${tabName}-tab`).classList.add('active');
  document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
}

startGameBtn.addEventListener('click', startGame);

saveScoreBtn.addEventListener('click', saveScore);
cancelScoreBtn.addEventListener('click', () => {
  gameOverModal.classList.add('hidden');
  resetGame();
});

tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    switchTab(btn.dataset.tab);
    if (btn.dataset.tab === 'leaderboard') {
      loadLeaderboard();
    }
  });
});

difficultyFilter.addEventListener('change', loadLeaderboard);
topTenFilter.addEventListener('change', loadLeaderboard);
refreshLeaderboardBtn.addEventListener('click', loadLeaderboard);

sortableHeaders.forEach(header => {
  header.addEventListener('click', () => {
    const columnName = header.dataset.sort;

    sortableHeaders.forEach(h => {
      h.classList.remove('sort-asc', 'sort-desc');
    });

    if (currentSortColumn === columnName) {
      sortAscending = !sortAscending;
    } else {
      currentSortColumn = columnName;
      sortAscending = false;
    }

    header.classList.add(sortAscending ? 'sort-asc' : 'sort-desc');
    loadLeaderboard();
  });
});

playerNameInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    saveScore();
  }
});

initializeApp();
