import { useState, useEffect, useCallback } from 'react';
import clsx from 'clsx';
import { motion } from 'framer-motion';
import useGameLogic, { GameState } from './hooks/useGameLogic';

function App() {
  const { grid, score, gameState, initializeGrid, move, setGrid } = useGameLogic();

  const [touchStartX, setTouchStartX] = useState(0);
  const [touchStartY, setTouchStartY] = useState(0);

  const handleMove = useCallback((direction: 'left' | 'right' | 'up' | 'down') => {
    if (gameState !== GameState.Playing) return; // Prevent moves if game is over or won

    const { finalGrid, changed } = move(grid, direction); // Pass current grid to move

    if (changed) {
      setGrid(finalGrid);
    }
  }, [gameState, move, grid, setGrid]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowLeft':
        handleMove('left');
        break;
      case 'ArrowRight':
        handleMove('right');
        break;
      case 'ArrowUp':
        handleMove('up');
        break;
      case 'ArrowDown':
        handleMove('down');
        break;
      default:
        break;
    }
  }, [handleMove]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
    setTouchStartY(e.touches[0].clientY);
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;

    const dx = touchEndX - touchStartX;
    const dy = touchEndY - touchStartY;

    if (Math.abs(dx) > Math.abs(dy)) {
      // Horizontal swipe
      if (dx > 0) {
        handleMove('right');
      } else {
        handleMove('left');
      }
    } else {
      // Vertical swipe
      if (dy > 0) {
        handleMove('down');
      } else {
        handleMove('up');
      }
    }
  }, [handleMove, touchStartX, touchStartY]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  useEffect(() => {
    initializeGrid();
  }, [initializeGrid]);

  return (
    <div
      className="bg-gray-800 text-white min-h-screen flex flex-col items-center justify-center p-4"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="mb-4 text-2xl font-bold">Score: {score}</div>
      <div className="w-[90vw] h-[90vw] md:w-[600px] md:h-[600px] @container/main relative flex flex-col">
        <div className="grid grid-cols-4 gap-[3cqw] grid-rows-4 bg-gray-700 p-[3cqw] rounded-lg grow">
          {grid.flat().map((tile) => (
            <motion.div
              key={tile.id}
              className={clsx(
                'rounded-lg flex items-center justify-center text-2xl font-bold',
                getTileClass(tile.value),
              )}
              initial={{
                opacity: tile.isNew ? 0 : 1,
                scale: tile.isNew ? 0 : 1,
              }}
              animate={{
                opacity: 1,
                scale: 1,
              }}
              transition={{
                opacity: { duration: 0.15, ease: 'easeOut' },
                scale: { duration: 0.15, ease: 'easeOut' },
              }}
              layout
            >
              {tile.value !== 0 ? tile.value : ''}
            </motion.div>
          ))}

        </div>
      </div>

      {(gameState === GameState.GameOver) && (
        <div className="absolute inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center">
          <p className="text-4xl font-bold">Game Over!</p>
        </div>
      )}

      {(gameState === GameState.GameWon) && (
        <div className="absolute inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center">
          <p className="text-4xl font-bold">You Win!</p>
        </div>
      )}
    </div>
  )
}

export default App

const getTileClass = (value: number) => {
  switch (value) {
    case 2:
      return 'bg-yellow-200';
    case 4:
      return 'bg-yellow-300';
    case 8:
      return 'bg-yellow-400';
    case 16:
      return 'bg-yellow-500';
    case 32:
      return 'bg-yellow-600';
    case 64:
      return 'bg-yellow-700';
    case 128:
      return 'bg-yellow-800';
    case 256:
      return 'bg-yellow-900';
    case 512:
      return 'bg-red-500';
    case 1024:
      return 'bg-red-600';
    case 2048:
      return 'bg-red-700';
    default:
      return 'bg-gray-600';
  }
}
