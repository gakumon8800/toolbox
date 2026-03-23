import {
  GRID_SIZE,
  advanceState,
  createInitialState,
  queueDirection
} from "./snake-core.js";

const TICK_MS = 140;
const STORAGE_KEY = "snake-classic-best-score";

const boardElement = document.getElementById("game-board");
const scoreValue = document.getElementById("score-value");
const lengthValue = document.getElementById("length-value");
const bestValue = document.getElementById("best-value");
const statusText = document.getElementById("status-text");
const statusChip = document.getElementById("status-chip");
const startButton = document.getElementById("start-button");
const pauseButton = document.getElementById("pause-button");
const restartButton = document.getElementById("restart-button");
const directionButtons = Array.from(document.querySelectorAll("[data-direction]"));

let state = createInitialState();
let tickHandle = null;
let bestScore = loadBestScore();

function loadBestScore() {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const parsed = Number(stored);
    return Number.isFinite(parsed) ? parsed : 0;
  } catch {
    return 0;
  }
}

function saveBestScore(score) {
  try {
    window.localStorage.setItem(STORAGE_KEY, String(score));
  } catch {
    // Ignore storage failures so gameplay still works.
  }
}

function ensureBoardCells() {
  boardElement.replaceChildren();
  const totalCells = GRID_SIZE * GRID_SIZE;
  const fragment = document.createDocumentFragment();

  for (let index = 0; index < totalCells; index += 1) {
    const cell = document.createElement("div");
    cell.className = "cell";
    cell.dataset.index = String(index);
    fragment.appendChild(cell);
  }

  boardElement.appendChild(fragment);
}

function renderBoard() {
  const cells = boardElement.children;

  for (const cell of cells) {
    cell.className = "cell";
  }

  state.snake.forEach((segment, index) => {
    const cellIndex = segment.y * GRID_SIZE + segment.x;
    const cell = cells[cellIndex];

    if (!cell) {
      return;
    }

    cell.classList.add("snake");
    if (index === 0) {
      cell.classList.add("head");
    }
  });

  if (state.food) {
    const foodIndex = state.food.y * GRID_SIZE + state.food.x;
    const foodCell = cells[foodIndex];
    if (foodCell) {
      foodCell.classList.add("food");
    }
  }
}

function renderMeta() {
  scoreValue.textContent = String(state.score);
  lengthValue.textContent = String(state.snake.length);
  bestValue.textContent = String(bestScore);

  statusChip.className = "status-chip";

  if (state.status === "playing") {
    statusChip.classList.add("playing");
    statusChip.textContent = "PLAYING";
    statusText.textContent = "Eat food and keep moving.";
    return;
  }

  if (state.status === "paused") {
    statusChip.classList.add("paused");
    statusChip.textContent = "PAUSED";
    statusText.textContent = "Press Space or Start to resume.";
    return;
  }

  if (state.status === "over") {
    statusChip.classList.add("over");
    statusChip.textContent = "GAME OVER";
    statusText.textContent = "You hit a wall or yourself. Press Enter or Restart.";
    return;
  }

  if (state.status === "won") {
    statusChip.classList.add("playing");
    statusChip.textContent = "CLEARED";
    statusText.textContent = "Board cleared. Press Restart to play again.";
    return;
  }

  statusChip.textContent = "READY";
  statusText.textContent = "Press Enter or Start to begin.";
}

function render() {
  renderBoard();
  renderMeta();
}

function syncBestScore() {
  if (state.score > bestScore) {
    bestScore = state.score;
    saveBestScore(bestScore);
  }
}

function stopLoop() {
  if (tickHandle) {
    window.clearInterval(tickHandle);
    tickHandle = null;
  }
}

function tick() {
  state = advanceState(state);
  syncBestScore();
  render();

  if (state.status !== "playing") {
    stopLoop();
  }
}

function startLoop() {
  stopLoop();
  tickHandle = window.setInterval(tick, TICK_MS);
}

function startGame() {
  if (state.status === "playing") {
    return;
  }

  if (state.status === "over" || state.status === "won") {
    state = createInitialState();
  }

  state = {
    ...state,
    status: "playing"
  };

  render();
  startLoop();
  boardElement.focus();
}

function pauseGame() {
  if (state.status !== "playing") {
    return;
  }

  state = {
    ...state,
    status: "paused"
  };

  stopLoop();
  render();
}

function togglePause() {
  if (state.status === "playing") {
    pauseGame();
    return;
  }

  if (state.status === "paused" || state.status === "ready") {
    startGame();
  }
}

function restartGame() {
  stopLoop();
  state = {
    ...createInitialState(),
    status: "playing"
  };
  render();
  startLoop();
  boardElement.focus();
}

function handleDirection(direction) {
  if (state.status === "ready") {
    state = queueDirection(
      {
        ...state,
        status: "playing"
      },
      direction
    );
    render();
    startLoop();
    boardElement.focus();
    return;
  }

  if (state.status !== "playing" && state.status !== "paused") {
    return;
  }

  state = queueDirection(state, direction);

  if (state.status === "paused") {
    state = {
      ...state,
      status: "playing"
    };
    render();
    startLoop();
  }
}

function handleKeydown(event) {
  const directionByKey = {
    ArrowUp: "up",
    ArrowDown: "down",
    ArrowLeft: "left",
    ArrowRight: "right",
    w: "up",
    W: "up",
    s: "down",
    S: "down",
    a: "left",
    A: "left",
    d: "right",
    D: "right"
  };

  const direction = directionByKey[event.key];
  if (direction) {
    event.preventDefault();
    handleDirection(direction);
    return;
  }

  if (event.key === " ") {
    event.preventDefault();
    togglePause();
    return;
  }

  if (event.key === "Enter") {
    event.preventDefault();
    if (state.status === "over" || state.status === "won") {
      restartGame();
    } else {
      startGame();
    }
  }
}

function bindEvents() {
  document.addEventListener("keydown", handleKeydown);
  startButton.addEventListener("click", startGame);
  pauseButton.addEventListener("click", togglePause);
  restartButton.addEventListener("click", restartGame);

  directionButtons.forEach((button) => {
    button.addEventListener("click", () => {
      handleDirection(button.dataset.direction);
    });
  });
}

function init() {
  if (!boardElement) {
    return;
  }

  ensureBoardCells();
  bindEvents();
  render();
}

init();
