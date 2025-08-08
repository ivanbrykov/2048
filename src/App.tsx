/* eslint-disable react/no-danger */
import useGameLogic, { GameState } from './hooks/useGameLogic';
import clsx from 'clsx';
import { motion } from 'framer-motion';
import { HelpCircle, Play, RotateCcw, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import FocusLock from 'react-focus-lock';

const getTileClass = (value: number) => {
  switch (value) {
    case 0:
      return 'bg-gray-600';
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
    case 1_024:
      return 'bg-red-700 text-gray-100';
    case 2_048:
      return 'bg-red-700 text-gray-100';
    default:
      return 'bg-gray-900 text-gray-100';
  }
};

const App = () => {
  const { continueGame, gameState, grid, highScore, move, restartGame, score } =
    useGameLogic();

  const [touchStartX, setTouchStartX] = useState(0);
  const [touchStartY, setTouchStartY] = useState(0);
  const [showHelp, setShowHelp] = useState(false);

  const handleMove = useCallback(
    (direction: 'down' | 'left' | 'right' | 'up') => {
      if (gameState === GameState.GameOver || gameState === GameState.GameWon) {
        return;
      }

      move(direction);
      // for(let i=0;i<4;i++){
      //   console.log(`🚀 ~ App ~ finalGrid row ${i}:`, finalGrid.slice(i*4,i*4+4).map((tile) => `${tile.id}:${tile.value}`).join(' '));
      // }
      // console.log('--------------------------------------------------------------------');
    },
    [gameState, move],
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (showHelp) {
        return;
      }

      switch (event.key) {
        case 'ArrowDown':
          handleMove('down');
          break;
        case 'ArrowLeft':
          handleMove('left');
          break;
        case 'ArrowRight':
          handleMove('right');
          break;
        case 'ArrowUp':
          handleMove('up');
          break;
        default:
          break;
      }
    },
    [handleMove, showHelp],
  );

  const handleTouchStart = useCallback(
    (event: React.TouchEvent) => {
      if (showHelp) {
        return;
      }

      setTouchStartX(event.touches[0].clientX);
      setTouchStartY(event.touches[0].clientY);
    },
    [showHelp],
  );

  const handleTouchEnd = useCallback(
    (event: React.TouchEvent) => {
      if (showHelp) {
        return;
      }

      const touchEndX = event.changedTouches[0].clientX;
      const touchEndY = event.changedTouches[0].clientY;

      const dx = touchEndX - touchStartX;
      const dy = touchEndY - touchStartY;

      const minSwipeDistance = 5; // pixels

      if (Math.abs(dx) < minSwipeDistance && Math.abs(dy) < minSwipeDistance) {
        return; // It's a tap, not a swipe
      }

      if (Math.abs(dx) > Math.abs(dy)) {
        // Horizontal swipe
        if (dx > 0) {
          handleMove('right');
        } else {
          handleMove('left');
        }
      } else if (dy > 0) {
        handleMove('down');
      } else {
        handleMove('up');
      }
    },
    [handleMove, showHelp, touchStartX, touchStartY],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  return (
    <>
      <button
        aria-controls="help-content-modal"
        aria-haspopup="dialog"
        aria-label="Open help"
        className="absolute top-4 right-4 p-2 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors z-10 text-white"
        onClick={() => setShowHelp(true)}
        type="button"
      >
        <HelpCircle className="w-8 h-8" />
      </button>

      <div
        className="bg-gray-800 text-white absolute inset-0 flex flex-col items-center justify-center p-4"
        onTouchEnd={handleTouchEnd}
        onTouchStart={handleTouchStart}
      >
        <div
          aria-live="polite"
          className="mb-4 text-2xl font-bold"
        >
          Score: {score}
        </div>
        <div
          aria-live="polite"
          className="mb-4 text-xl font-bold"
        >
          High Score: {highScore}
        </div>
        <div className="w-[90vw] h-[90vw] md:w-[600px] md:h-[600px] @container/main relative flex flex-col">
          <div
            aria-label="Game board"
            className="relative gap-[3cqw] bg-gray-700 p-[3cqw] rounded-lg grow"
            role="grid"
          >
            {grid.map((tile, index) => {
              const y = Math.floor(index / 4);
              const x = index % 4;

              return (
                <motion.div
                  aria-hidden={tile.value === 0}
                  aria-label={`Row ${y + 1} Column ${x + 1}. Value ${tile.value}`}
                  key={tile.id}
                  layout
                  role="gridcell"
                  tabIndex={tile.value === 0 ? -1 : 0}
                  {...(tile.value !== 0 && {
                    animate: { opacity: 1, scale: 1 },
                    initial: { opacity: 0, scale: 0 },
                  })}
                  className={clsx(
                    'merriweather absolute w-[20cqw] h-[20cqw] rounded-lg flex items-center justify-center text-[6.5cqw] font-bold',
                    { 'z-10': tile.value !== 0 },
                    getTileClass(tile.value),
                  )}
                  style={{
                    left: `calc(4cqw + 24cqw * ${x})`,
                    top: `calc(4cqw + 24cqw * ${y})`,
                  }}
                  transition={{ duration: 0.2 }}
                >
                  {tile.value === 0 ? '' : tile.value}
                </motion.div>
              );
            })}
          </div>
        </div>

        {gameState === GameState.GameOver && (
          <div className="merriweather absolute inset-0 bg-gray-800/90 backdrop-blur-xs flex flex-col items-center justify-center z-20">
            <p className="text-4xl font-bold">Game Over!</p>
            <p className="text-2xl font-bold">Score: {score}</p>
            <p className="text-2xl font-bold">High Score: {highScore}</p>
            <button
              aria-label="Restart game"
              className="mt-4 p-2 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors"
              onClick={restartGame}
              type="button"
            >
              <RotateCcw className="w-8 h-8" />
            </button>
          </div>
        )}

        {gameState === GameState.GameWon && (
          <div className="merriweather absolute inset-0 bg-gray-800/90 bg-opacity-75 flex flex-col items-center justify-center z-20">
            <p className="text-4xl font-bold">You Win!</p>
            <div className="flex mt-4 space-x-4">
              <button
                aria-label="Continue playing"
                className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors"
                onClick={continueGame}
                type="button"
              >
                <Play className="w-8 h-8" />
              </button>
              <button
                aria-label="Restart game"
                className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors"
                onClick={restartGame}
                type="button"
              >
                <RotateCcw className="w-8 h-8" />
              </button>
            </div>
          </div>
        )}

        {showHelp && (
          <FocusLock
            autoFocus
            returnFocus
          >
            <div
              aria-label="Help"
              aria-modal="true"
              className="absolute inset-0 bg-gray-800/90 backdrop-blur-xs flex flex-col items-center justify-center z-30 p-4"
              onKeyDown={(event) => {
                if (event.key === 'Escape') {
                  setShowHelp(false);
                }
              }}
              role="dialog"
            >
              <div className="bg-gray-700 p-6 rounded-lg max-w-lg w-full relative">
                <button
                  aria-label="Close help"
                  className="absolute top-2 right-2 p-3 rounded-full bg-gray-600 hover:bg-gray-500 transition-colors text-white"
                  onClick={() => setShowHelp(false)}
                  type="button"
                >
                  <X />
                </button>
                <div
                  dangerouslySetInnerHTML={{
                    __html:
                      document.querySelector('#help-content')?.innerHTML || '',
                  }}
                  id="help-content-modal"
                />
              </div>
            </div>
          </FocusLock>
        )}
      </div>
    </>
  );
};

export default App;
