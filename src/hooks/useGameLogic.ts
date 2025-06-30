import { sample } from 'es-toolkit';
import { useState, useCallback } from 'react';

interface Tile {
  id: number;
  value: number;
  x: number;
  y: number;
  isNew: boolean;
  isMerged: boolean;
}

const createTile = (id: number, value: number, x: number, y: number): Tile => {
  return { id, value, x, y, isNew: true, isMerged: false };
};

export const GameState = {
  Playing: 'Playing',
  GameOver: 'GameOver',
  GameWon: 'GameWon',
} as const;

type GameState = typeof GameState[keyof typeof GameState];

const getRandomEmptyTilePosition = (currentGrid: Tile[][]) => {
  return sample(currentGrid.flat().filter(tile => tile.value === 0));
};

const initializeGrid = () => {
  const initialGrid: Tile[][] = [];
  for (let y = 0; y < 4; y++) {
    initialGrid.push([]);
    for (let x = 0; x < 4; x++) {
      initialGrid[y].push(createTile(y * 4 + x, 0, x, y));
    }
  }

  const addRandomTile = (gridArr: Tile[][], value?: number) => {
    const emptyTile = getRandomEmptyTilePosition(gridArr);
    if (emptyTile) {
      const newValue = value !== undefined ? value : (Math.random() < 0.9 ? 2 : 4);
      const newGrid = gridArr.map(row => row.map(tile =>
        tile.id === emptyTile.id ? { ...tile, value: newValue, isNew: true } : tile
      ));
      return newGrid;
    }
    return gridArr;
  };

  let gridWithTwoTiles = addRandomTile(initialGrid);
  gridWithTwoTiles = addRandomTile(gridWithTwoTiles);

  return gridWithTwoTiles
}

const useGameLogic = () => {
  const [grid, setGrid] = useState<Tile[][]>(initializeGrid());
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState<GameState>(GameState.Playing);

  const addNewTile = useCallback((currentGrid: Tile[][]): { updatedTiles: Tile[][], newTile?: Tile } => {
    const emptyTile = getRandomEmptyTilePosition(currentGrid);
    if (emptyTile) {
      const newValue = Math.random() < 0.9 ? 2 : 4;
      const newTile = { ...emptyTile, value: newValue, isNew: true };
      const updatedGrid = currentGrid.map(row => row.map(tile =>
        tile.id === newTile.id ? newTile : { ...tile, isNew: false, isMerged: false }
      ));
      return { updatedTiles: updatedGrid, newTile };
    }
    return { updatedTiles: currentGrid.map(row => row.map(tile => ({ ...tile, isNew: false, isMerged: false })) ) };
  }, []);

  const slide = useCallback((tilesInLine: Tile[], direction: 'left' | 'right' | 'up' | 'down') => {
    let currentScore = 0;

    // Create a deep copy of the tiles in the line, preserving their original IDs and positions
    const line = tilesInLine.map(tile => ({ ...tile, isNew: false, isMerged: false }));

    // Filter out empty tiles (value 0)
    const activeTiles = line.filter(tile => tile.value !== 0);

    // Reverse for right/down movements
    if (direction === 'right' || direction === 'down') {
      activeTiles.reverse();
    }

    // Merge logic
    for (let i = 0; i < activeTiles.length - 1; i++) {
      if (activeTiles[i].value === activeTiles[i + 1].value) {
        activeTiles[i].value *= 2;
        currentScore += activeTiles[i].value;
        activeTiles[i].isMerged = true;
        activeTiles.splice(i + 1, 1); // Remove the merged tile
      }
    }

    // Fill with zeros to maintain 4-element structure
    while (activeTiles.length < 4) {
      // Create a new dummy tile for empty spots. Its ID, x, y don't matter here.
      activeTiles.push({ id: -1, value: 0, x: 0, y: 0, isNew: false, isMerged: false });
    }

    // Reverse back if needed
    if (direction === 'right' || direction === 'down') {
      activeTiles.reverse();
    }

    // Reconstruct the line with updated values and flags, preserving original IDs and positions
    const newTilesInLine: Tile[] = tilesInLine.map((originalTile, index) => {
      const processedTile = activeTiles[index];
      return {
        ...originalTile, // Keep original ID, x, y
        value: processedTile.value,
        isMerged: processedTile.isMerged,
        isNew: processedTile.isNew,
      };
    });

    // Determine if any change occurred (value change or effective position change)
    const hasChanged = tilesInLine.some((originalTile, index) => {
      const newTile = newTilesInLine[index];
      return originalTile.value !== newTile.value || originalTile.isMerged !== newTile.isMerged;
    });

    return { newTilesInLine, changed: hasChanged, scoreIncrease: currentScore };
  }, []);

  const checkGameOver = useCallback((currentGrid: Tile[][]) => {
    // If there's an empty tile, the game is not over
    if (currentGrid.flat().some(tile => tile.value === 0)) return false;

    // Helper to simulate a move on a given grid without changing the actual game state
    const simulateMoveOnGrid = (gridToSimulate: Tile[][], direction: 'left' | 'right' | 'up' | 'down') => {
      let changed = false;
      const tempGrid: Tile[][] = gridToSimulate.map(row => row.map(tile => ({ ...tile }))); // Deep copy

      if (direction === 'left' || direction === 'right') {
        for (let y = 0; y < 4; y++) {
          const rowTiles = tempGrid[y];
          const { changed: rowChanged } = slide(rowTiles, direction);
          if (rowChanged) changed = true;
        }
      } else { // Up or Down
        for (let x = 0; x < 4; x++) {
          const colTiles: Tile[] = [];
          for (let y = 0; y < 4; y++) {
            colTiles.push(tempGrid[y][x]);
          }
          const { changed: colChanged } = slide(colTiles, direction);
          if (colChanged) changed = true;
        }
      }
      return changed;
    };

    if (simulateMoveOnGrid(currentGrid, 'left')) return false;
    if (simulateMoveOnGrid(currentGrid, 'right')) return false;
    if (simulateMoveOnGrid(currentGrid, 'up')) return false;
    if (simulateMoveOnGrid(currentGrid, 'down')) return false;

    return true;
  }, [slide]);

  const checkGameWon = useCallback((currentGrid: Tile[][]) => {
    return currentGrid.flat().some(tile => tile.value === 2048);
  }, []);

  const move = useCallback((direction: 'left' | 'right' | 'up' | 'down') => {
    let changed = false;
    let totalScoreIncrease = 0;

    // Create a deep copy of the current grid to work on
    let newGrid: Tile[][] = grid.map(row => row.map(tile => ({ ...tile, isNew: false, isMerged: false })));

    if (direction === 'left' || direction === 'right') {
      for (let y = 0; y < 4; y++) {
        const rowTiles = newGrid[y];
        const { newTilesInLine, changed: rowChanged, scoreIncrease } = slide(rowTiles, direction);
        if (rowChanged) changed = true;
        totalScoreIncrease += scoreIncrease;

        newTilesInLine.forEach((processedTile, index) => {
          newGrid[y][index] = { ...processedTile, x: index, y: y };
        });
      }
    } else { // Up or Down
      for (let x = 0; x < 4; x++) {
        const colTiles: Tile[] = [];
        for (let y = 0; y < 4; y++) {
          colTiles.push(newGrid[y][x]);
        }
        const { newTilesInLine, changed: colChanged, scoreIncrease } = slide(colTiles, direction);
        if (colChanged) changed = true;
        totalScoreIncrease += scoreIncrease;

        newTilesInLine.forEach((processedTile, index) => {
          newGrid[index][x] = { ...processedTile, x: x, y: index };
        });
      }
    }

    let newTile: Tile | undefined;
    let isGameOver = false;
    let isGameWon = false;

    if (changed) {
      const { updatedTiles, newTile: addedTile } = addNewTile(newGrid);
      newGrid = updatedTiles;
      newTile = addedTile;

      isGameWon = checkGameWon(newGrid);
      if (!isGameWon) {
        isGameOver = checkGameOver(newGrid);
      }
    }

    setScore(prevScore => prevScore + totalScoreIncrease);
    if (isGameWon) {
      setGameState(GameState.GameWon);
    } else if (isGameOver) {
      setGameState(GameState.GameOver);
    } else {
      setGameState(GameState.Playing);
    }

    return { finalGrid: newGrid, changed, scoreIncrease: totalScoreIncrease, isGameOver, isGameWon, newTile };
  }, [grid, slide, addNewTile, checkGameWon, checkGameOver]);

  return {
    grid,
    score,
    gameState,
    initializeGrid,
    move,
    setGrid, // Expose setGrid for animation updates
  };
};

export default useGameLogic;