import clsx from 'clsx';
import { motion } from 'framer-motion';
import { useCallback, useEffect, useState } from 'react';
import useGameLogic, { GameState } from './hooks/useGameLogic';

function App() {
  const { grid, score, gameState, move, setGrid } = useGameLogic();

  const [touchStartX, setTouchStartX] = useState(0);
  const [touchStartY, setTouchStartY] = useState(0);

  const handleMove = useCallback(
    (direction: 'left' | 'right' | 'up' | 'down') => {
      if (gameState !== GameState.Playing) return;
      const { finalGrid, changed } = move(direction);
      if (changed) {
        setGrid(finalGrid);
      }
      // for(let i=0;i<4;i++){
      //   console.log(`🚀 ~ App ~ finalGrid row ${i}:`, finalGrid.slice(i*4,i*4+4).map((tile) => `${tile.id}:${tile.value}`).join(' '));
      // }
      // console.log('--------------------------------------------------------------------');
    },
    [gameState, move, setGrid],
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
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
    },
    [handleMove],
  );

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
    setTouchStartY(e.touches[0].clientY);
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
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
    },
    [handleMove, touchStartX, touchStartY],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  return (
    <div
      className="bg-gray-800 text-white absolute inset-0 flex flex-col items-center justify-center p-4"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="mb-4 text-2xl font-bold">Score: {score}</div>
      <div className="w-[90vw] h-[90vw] md:w-[600px] md:h-[600px] @container/main relative flex flex-col">
        <div className="relative gap-[3cqw] bg-gray-700 p-[3cqw] rounded-lg grow">
          {grid.map((tile, index) => {
            const y = Math.floor(index / 4);
            const x = index % 4;

            return (
              <motion.div
                key={tile.id}
                layout
                transition={{ duration: 0.2 }}
                className={clsx(
                  'absolute w-[20cqw] h-[20cqw] rounded-lg flex items-center justify-center text-[6.5cqw] font-bold',
                  {'z-10': tile.value !== 0},
                  getTileClass(tile.value),
                )}
                style={{
                  left: `calc(4cqw + 24cqw * ${x})`,
                  top: `calc(4cqw + 24cqw * ${y})`,
                }}
              >
                {tile.value !== 0 ? tile.value : ''}
              </motion.div>
            );
          })}
        </div>
      </div>

      {gameState === GameState.GameOver && (
        <div className="absolute inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center">
          <p className="text-4xl font-bold">Game Over!</p>
        </div>
      )}

      {gameState === GameState.GameWon && (
        <div className="absolute inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center">
          <p className="text-4xl font-bold">You Win!</p>
        </div>
      )}
    </div>
  );
}

export default App;

const getTileClass = (value: number) => {
  switch (value) {
    case 2:
      return 'bg-amber-100 text-gray-800';
    case 4:
      return 'bg-amber-200 text-gray-800';
    case 8:
      return 'bg-amber-400 text-gray-800';
    case 16:
      return 'bg-orange-400 text-white';
    case 32:
      return 'bg-orange-500 text-white';
    case 64:
      return 'bg-rose-500 text-white';
    case 128:
      return 'bg-rose-600 text-gray-100';
    case 256:
      return 'bg-red-600 text-gray-100';
    case 512:
      return 'bg-red-700 text-gray-100';
    case 1024:
      return 'bg-red-700 text-gray-100';
    case 2048:
      return 'bg-red-700 text-gray-100';
    default:
      return 'bg-gray-600';
  }
};