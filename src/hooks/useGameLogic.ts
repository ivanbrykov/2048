import { isNull, sample } from 'es-toolkit';
import { useCallback, useState } from 'react';
import { ulid } from 'ulid';

interface Tile {
  id: string;
  value: number;
  prevValue: number | null;
}

const createTile = (value: number): Tile => {
  return { id: ulid(), value, prevValue: null };
};

export const GameState = {
  Playing: 'Playing',
  GameOver: 'GameOver',
  GameWon: 'GameWon',
} as const;

type GameState = (typeof GameState)[keyof typeof GameState];

const getRandomEmptyTileIndex = (currentGrid: Tile[]): number | undefined => {
  const emptyTileIndices = currentGrid
    .map((tile, index) => (tile.value === 0 ? index : -1))
    .filter((index) => index !== -1);
  return sample(emptyTileIndices);
};

const addRandomTile = (grid: Tile[], value?: number) => {
  const emptyTileIndex = getRandomEmptyTileIndex(grid);
  if (emptyTileIndex !== undefined) {
    const newValue = value !== undefined ? value : Math.random() < 0.9 ? 2 : 4;
    const newGrid = [...grid];
    newGrid[emptyTileIndex] = createTile(newValue);
    return newGrid;
  }
  return grid;
};

const gridWalker = {
  down: {
    init: (i: number) => 11 - i,
    next: (idx: number) => (idx > 11 ? null : idx + 4),
  },
  up: {
    init: (i: number) => i + 4,
    next: (idx: number) => (idx < 4 ? null : idx - 4),
  },
  left: {
    init: (i: number) => ((i * 4) % 15) + 1,
    next: (idx: number) => (idx % 4 === 0 ? null : idx - 1),
  },
  right: {
    init: (i: number) => 14 - ((i * 4) % 15),
    next: (idx: number) => ((idx + 1) % 4 === 0 ? null : idx + 1),
  },
};

type DirectionEnum = keyof typeof gridWalker;

const initializeGrid = (): Tile[] => {
  const initialGrid: Tile[] = Array(16)
    .fill(null)
    .map(() => createTile(0));

  let gridWithTwoTiles = addRandomTile(initialGrid);
  gridWithTwoTiles = addRandomTile(gridWithTwoTiles);

  // let gridWithTwoTiles = addRandomTile(initialGrid, 2);
  // gridWithTwoTiles = addRandomTile(gridWithTwoTiles, 4);
  // gridWithTwoTiles = addRandomTile(gridWithTwoTiles, 8);
  // gridWithTwoTiles = addRandomTile(gridWithTwoTiles, 16);
  // gridWithTwoTiles = addRandomTile(gridWithTwoTiles, 32);
  // gridWithTwoTiles = addRandomTile(gridWithTwoTiles, 64);
  // gridWithTwoTiles = addRandomTile(gridWithTwoTiles, 128);
  // gridWithTwoTiles = addRandomTile(gridWithTwoTiles, 256);
  // gridWithTwoTiles = addRandomTile(gridWithTwoTiles, 512);
  // gridWithTwoTiles = addRandomTile(gridWithTwoTiles, 1024);
  // gridWithTwoTiles = addRandomTile(gridWithTwoTiles, 2048);

  return gridWithTwoTiles;
};

const slide = (tilesInLine: Tile[]) => {
  let currentScore = 0;

  const newTiles: Tile[] = [];

  // Filter out empty tiles and create a working copy
  const activeTiles = tilesInLine.filter((tile) => tile.value !== 0);

  for (let i = 0; i < activeTiles.length; i++) {
    const currentTile = activeTiles[i];
    if (
      i + 1 < activeTiles.length &&
      currentTile.value === activeTiles[i + 1].value
    ) {
      // Merge
      const mergedValue = currentTile.value * 2;
      // Create a new tile object for the merged result, preserving the ID of the first tile
      newTiles.push({
        id: currentTile.id,
        value: mergedValue,
        prevValue: null,
      });
      currentScore += mergedValue;
      i++; // Skip the next tile as it's merged
    } else {
      // No merge, just move the tile
      newTiles.push({ ...currentTile }); // Keep the original tile object (and its ID)
    }
  }

  // Fill the rest with empty tiles
  while (newTiles.length < 4) {
    newTiles.push(createTile(0)); // createTile(0) will generate a new ID for empty spots
  }

  // Determine if the grid has changed based on value or ID changes
  const hasChanged = tilesInLine.some(
    (originalTile, index) =>
      originalTile.value !== newTiles[index].value ||
      originalTile.id !== newTiles[index].id,
  );

  return {
    newTilesInLine: newTiles,
    changed: hasChanged,
    scoreIncrease: currentScore,
  };
};

const simulateMove = (gridToSimulate: Tile[], direction: DirectionEnum) => {
  let changed = false;
  if (direction === 'left' || direction === 'right') {
    for (let y = 0; y < 4; y++) {
      const row = gridToSimulate.slice(y * 4, y * 4 + 4);
      const { changed: rowChanged } = slide(
        direction === 'left' ? row : [...row].reverse(),
      );
      if (rowChanged) {
        changed = true;
        break;
      }
    }
  } else {
    for (let x = 0; x < 4; x++) {
      const col = [
        gridToSimulate[x],
        gridToSimulate[x + 4],
        gridToSimulate[x + 8],
        gridToSimulate[x + 12],
      ];
      const { changed: colChanged } = slide(
        direction === 'up' ? col : [...col].reverse(),
      );
      if (colChanged) {
        changed = true;
        break;
      }
    }
  }
  return changed;
};

const checkGameOver = (currentGrid: Tile[]) => {
  if (currentGrid.some((tile) => tile.value === 0)) return false;

  if (simulateMove(currentGrid, 'left')) return false;
  if (simulateMove(currentGrid, 'right')) return false;
  if (simulateMove(currentGrid, 'up')) return false;
  if (simulateMove(currentGrid, 'down')) return false;

  return true;
};

const useGameLogic = () => {
  const [grid, setGrid] = useState<Tile[]>(initializeGrid());
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState<GameState>(GameState.Playing);

  const restartGame = useCallback(() => {
    setScore(0);
    setGameState(GameState.Playing);
    setGrid(initializeGrid());
  }, []);

  const continueGame = useCallback(() => {
    setGameState(GameState.Playing);
  }, []);

  // const addNewTile = useCallback(
  //   (currentGrid: Tile[]): { updatedTiles: Tile[]; newTileIndex?: number } => {
  //     const emptyTileIndex = getRandomEmptyTileIndex(currentGrid);
  //     if (emptyTileIndex !== undefined) {
  //       const newValue = Math.random() < 0.9 ? 2 : 4;
  //       const newTile = createTile(newValue);
  //       const updatedGrid = [...currentGrid]; // Shallow copy
  //       updatedGrid[emptyTileIndex] = newTile;
  //       return { updatedTiles: updatedGrid, newTileIndex: emptyTileIndex };
  //     }
  //     return { updatedTiles: [...currentGrid] }; // Return a shallow copy even if no new tile
  //   },
  //   [],
  // );

  const checkGameWon = useCallback((currentGrid: Tile[]) => {
    return currentGrid.some((tile) => tile.value === 2048);
  }, []);

  const move = useCallback(
    (direction: DirectionEnum) => {
      if (gameState !== GameState.Playing) {
        return { finalGrid: grid, changed: false, scoreIncrease: 0 };
      }
      let changed = false;
      let totalScoreIncrease = 0;
      let newGrid = grid.map((tile) => {
        tile.prevValue = null;
        return tile;
      });

      for (let walker = 0; walker <= 11; walker++) {
        const fromTileIdx = gridWalker[direction].init(walker);
        if (newGrid[fromTileIdx].value === 0) {
          continue;
        }
        let toTileIdx = null;
        let fuse = 0;
        while (true) {
          if (fuse++ > 100) {
            break;
          }
          console.log('WHILE!', direction, fuse);
          const possibleNewTileIdx: number | null = gridWalker[direction].next(
            isNull(toTileIdx) ? fromTileIdx : toTileIdx,
          );
          console.log('🚀 ~ useGameLogic ~ possibleNewTileIdx:', {
            toTileIdx,
            fromTileIdx,
            possibleNewTileIdx,
          });

          if (isNull(possibleNewTileIdx)) {
            break;
          }
          if (newGrid[possibleNewTileIdx].value === 0) {
            toTileIdx = possibleNewTileIdx;
            continue;
          }
          if (
            isNull(newGrid[possibleNewTileIdx].prevValue) &&
            newGrid[possibleNewTileIdx].value === newGrid[fromTileIdx].value
          ) {
            toTileIdx = possibleNewTileIdx;
          }
          break;
        }
        if (!isNull(toTileIdx)) {
          changed = true;
          const tile = newGrid[fromTileIdx];
          if (newGrid[toTileIdx].value > 0) {
            tile.prevValue = tile.value;
            tile.value += newGrid[toTileIdx].value;
            totalScoreIncrease += tile.value;
          }
          newGrid[toTileIdx] = tile;
          newGrid[fromTileIdx] = createTile(0);
        }
      }

      if (changed) {
        newGrid = addRandomTile(newGrid);

        if (checkGameWon(newGrid)) {
          setGameState(GameState.GameWon);
        } else if (checkGameOver(newGrid)) {
          setGameState(GameState.GameOver);
        }

        setScore((prevScore) => prevScore + totalScoreIncrease);

        setGrid(newGrid);
      }

      return {
        finalGrid: newGrid,
        changed,
        scoreIncrease: totalScoreIncrease,
        // isGameOver,
        // isGameWon,
        // newTile: newTileIndex,
      };
    },
    [grid, checkGameWon, gameState],
  );

  return {
    grid,
    score,
    gameState,
    initializeGrid,
    move,
    setGrid,
    restartGame,
    continueGame,
  };
};

export default useGameLogic;
