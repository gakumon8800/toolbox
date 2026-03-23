export const GRID_SIZE = 16;

export const DIRECTIONS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 }
};

const OPPOSITES = {
  up: "down",
  down: "up",
  left: "right",
  right: "left"
};

export function createInitialSnake() {
  return [
    { x: 8, y: 8 },
    { x: 7, y: 8 },
    { x: 6, y: 8 }
  ];
}

export function createInitialState(randomFn = Math.random) {
  const snake = createInitialSnake();

  return {
    gridSize: GRID_SIZE,
    snake,
    direction: "right",
    nextDirection: "right",
    food: spawnFood(snake, GRID_SIZE, randomFn),
    score: 0,
    status: "ready"
  };
}

export function isOppositeDirection(current, next) {
  return OPPOSITES[current] === next;
}

export function queueDirection(state, direction) {
  if (!DIRECTIONS[direction]) {
    return state;
  }

  if (isOppositeDirection(state.direction, direction) && state.snake.length > 1) {
    return state;
  }

  return {
    ...state,
    nextDirection: direction
  };
}

export function spawnFood(snake, gridSize, randomFn = Math.random) {
  const occupied = new Set(snake.map((segment) => `${segment.x},${segment.y}`));
  const openCells = [];

  for (let y = 0; y < gridSize; y += 1) {
    for (let x = 0; x < gridSize; x += 1) {
      const key = `${x},${y}`;
      if (!occupied.has(key)) {
        openCells.push({ x, y });
      }
    }
  }

  if (openCells.length === 0) {
    return null;
  }

  const index = Math.floor(randomFn() * openCells.length);
  return openCells[index];
}

export function advanceState(state, randomFn = Math.random) {
  if (state.status !== "playing") {
    return state;
  }

  const direction = state.nextDirection;
  const vector = DIRECTIONS[direction];
  const head = state.snake[0];
  const nextHead = {
    x: head.x + vector.x,
    y: head.y + vector.y
  };

  if (hitsBoundary(nextHead, state.gridSize)) {
    return {
      ...state,
      direction,
      status: "over"
    };
  }

  const willEat = state.food && nextHead.x === state.food.x && nextHead.y === state.food.y;
  const bodyToCheck = willEat ? state.snake : state.snake.slice(0, -1);

  if (hitsSnake(nextHead, bodyToCheck)) {
    return {
      ...state,
      direction,
      status: "over"
    };
  }

  const nextSnake = [nextHead, ...state.snake];
  if (!willEat) {
    nextSnake.pop();
  }

  const nextFood = willEat ? spawnFood(nextSnake, state.gridSize, randomFn) : state.food;
  const nextStatus = nextFood ? "playing" : "won";

  return {
    ...state,
    snake: nextSnake,
    direction,
    nextDirection: direction,
    food: nextFood,
    score: willEat ? state.score + 1 : state.score,
    status: nextStatus
  };
}

export function hitsBoundary(position, gridSize) {
  return position.x < 0 || position.y < 0 || position.x >= gridSize || position.y >= gridSize;
}

export function hitsSnake(position, snake) {
  return snake.some((segment) => segment.x === position.x && segment.y === position.y);
}
