import { sample } from "es-toolkit";
import { useState, useCallback } from "react";

interface Tile {
	value: number;
	isNew: boolean;
	isMerged: boolean;
}

const createTile = (value: number): Tile => {
	return { value, isNew: true, isMerged: false };
};

export const GameState = {
	Playing: "Playing",
	GameOver: "GameOver",
	GameWon: "GameWon",
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

const initializeGrid = (): Tile[] => {
	const initialGrid: Tile[] = Array(16)
		.fill(null)
		.map(() => createTile(0));

	let gridWithTwoTiles = addRandomTile(initialGrid);
	gridWithTwoTiles = addRandomTile(gridWithTwoTiles);

	return gridWithTwoTiles;
};

const slide = (tilesInLine: Tile[]) => {
	let currentScore = 0;

	const line = tilesInLine.map((tile) => ({
		...tile,
		isNew: false,
		isMerged: false,
	}));

	const activeTiles = line.filter((tile) => tile.value !== 0);

	for (let i = 0; i < activeTiles.length - 1; i++) {
		if (activeTiles[i].value === activeTiles[i + 1].value) {
			activeTiles[i].value *= 2;
			currentScore += activeTiles[i].value;
			activeTiles[i].isMerged = true;
			activeTiles.splice(i + 1, 1);
		}
	}

	while (activeTiles.length < 4) {
		activeTiles.push(createTile(0));
	}

	const hasChanged = tilesInLine.some(
		(originalTile, index) => originalTile.value !== activeTiles[index].value,
	);

	return {
		newTilesInLine: activeTiles,
		changed: hasChanged,
		scoreIncrease: currentScore,
	};
};

const simulateMove = (
	gridToSimulate: Tile[],
	direction: "left" | "right" | "up" | "down",
) => {
	let changed = false;
	if (direction === "left" || direction === "right") {
		for (let y = 0; y < 4; y++) {
			const row = gridToSimulate.slice(y * 4, y * 4 + 4);
			const { changed: rowChanged } = slide(
				direction === "left" ? row : [...row].reverse(),
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
				direction === "up" ? col : [...col].reverse(),
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

	if (simulateMove(currentGrid, "left")) return false;
	if (simulateMove(currentGrid, "right")) return false;
	if (simulateMove(currentGrid, "up")) return false;
	if (simulateMove(currentGrid, "down")) return false;

	return true;
};

const useGameLogic = () => {
	const [grid, setGrid] = useState<Tile[]>(initializeGrid());
	const [score, setScore] = useState(0);
	const [gameState, setGameState] = useState<GameState>(GameState.Playing);

	const addNewTile = useCallback(
		(currentGrid: Tile[]): { updatedTiles: Tile[]; newTileIndex?: number } => {
			const emptyTileIndex = getRandomEmptyTileIndex(currentGrid);
			if (emptyTileIndex !== undefined) {
				const newValue = Math.random() < 0.9 ? 2 : 4;
				const newTile = createTile(newValue);
				const updatedGrid = currentGrid.map((tile) => ({
					...tile,
					isNew: false,
					isMerged: false,
				}));
				updatedGrid[emptyTileIndex] = newTile;
				return { updatedTiles: updatedGrid, newTileIndex: emptyTileIndex };
			}
			const updatedGrid = currentGrid.map((tile) => ({
				...tile,
				isNew: false,
				isMerged: false,
			}));
			return { updatedTiles: updatedGrid };
		},
		[],
	);

	const checkGameWon = useCallback((currentGrid: Tile[]) => {
		return currentGrid.some((tile) => tile.value === 2048);
	}, []);

	const move = useCallback(
		(direction: "left" | "right" | "up" | "down") => {
			let changed = false;
			let totalScoreIncrease = 0;
			let newGrid = [...grid];

			if (direction === "left" || direction === "right") {
				for (let y = 0; y < 4; y++) {
					const row = newGrid.slice(y * 4, y * 4 + 4);
					const {
						newTilesInLine,
						changed: rowChanged,
						scoreIncrease,
					} = slide(direction === "left" ? row : [...row].reverse());
					if (rowChanged) {
						changed = true;
						totalScoreIncrease += scoreIncrease;
						const resultRow =
							direction === "left" ? newTilesInLine : newTilesInLine.reverse();
						for (let x = 0; x < 4; x++) {
							newGrid[y * 4 + x] = resultRow[x];
						}
					}
				}
			} else {
				// up or down
				for (let x = 0; x < 4; x++) {
					const col = [
						newGrid[x],
						newGrid[x + 4],
						newGrid[x + 8],
						newGrid[x + 12],
					];
					const {
						newTilesInLine,
						changed: colChanged,
						scoreIncrease,
					} = slide(direction === "up" ? col : [...col].reverse());
					if (colChanged) {
						changed = true;
						totalScoreIncrease += scoreIncrease;
						const resultCol =
							direction === "up" ? newTilesInLine : newTilesInLine.reverse();
						for (let y = 0; y < 4; y++) {
							newGrid[y * 4 + x] = resultCol[y];
						}
					}
				}
			}

			let newTileIndex: number | undefined;
			let isGameOver = false;
			let isGameWon = false;

			if (changed) {
				const { updatedTiles, newTileIndex: addedTileIndex } =
					addNewTile(newGrid);
				newGrid = updatedTiles;
				newTileIndex = addedTileIndex;

				isGameWon = checkGameWon(newGrid);
				if (!isGameWon) {
					isGameOver = checkGameOver(newGrid);
				}
			}

			setScore((prevScore) => prevScore + totalScoreIncrease);
			if (isGameWon) {
				setGameState(GameState.GameWon);
			} else if (isGameOver) {
				setGameState(GameState.GameOver);
			} else {
				setGameState(GameState.Playing);
			}

			return {
				finalGrid: newGrid,
				changed,
				scoreIncrease: totalScoreIncrease,
				isGameOver,
				isGameWon,
				newTile: newTileIndex,
			};
		},
		[grid, addNewTile, checkGameWon],
	);

	return {
		grid,
		score,
		gameState,
		initializeGrid,
		move,
		setGrid,
	};
};

export default useGameLogic;
