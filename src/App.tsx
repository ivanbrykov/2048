import clsx from 'clsx';
import { motion } from 'framer-motion';
import { HelpCircle, Play, RotateCcw, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import useGameLogic, { GameState } from './hooks/useGameLogic';

function App() {
  const {
    grid,
    score,
    highScore,
    gameState,
    move,
    setGrid,
    restartGame,
    continueGame,
  } = useGameLogic();

  const [touchStartX, setTouchStartX] = useState(0);
  const [touchStartY, setTouchStartY] = useState(0);
  const [showHelp, setShowHelp] = useState(false);

  const handleMove = useCallback(
    (direction: 'left' | 'right' | 'up' | 'down') => {
      if (gameState === GameState.GameOver || gameState === GameState.GameWon)
        return;
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
      if (showHelp) return;
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
    [handleMove, showHelp],
  );

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (showHelp) return;
    setTouchStartX(e.touches[0].clientX);
    setTouchStartY(e.touches[0].clientY);
  }, [showHelp]);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (showHelp) return;
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
    [handleMove, touchStartX, touchStartY, showHelp],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  useEffect(() => {
    if (showHelp) {
      const helpContent = document.getElementById('help-content');
      if (helpContent) {
        helpContent.style.display = 'block';
      }
    } else {
      const helpContent = document.getElementById('help-content');
      if (helpContent) {
        helpContent.style.display = 'none';
      }
    }
  }, [showHelp]);

  return (
    <div
      className="bg-gray-800 text-white absolute inset-0 flex flex-col items-center justify-center p-4"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="mb-4 text-2xl font-bold">Score: {score}</div>
      <div className="mb-4 text-xl font-bold">High Score: {highScore}</div>
      <button
        type="button"
        onClick={() => setShowHelp(true)}
        className="absolute top-4 right-4 p-2 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors"
      >
        <HelpCircle className="w-8 h-8" />
      </button>
      <div className="w-[90vw] h-[90vw] md:w-[600px] md:h-[600px] @container/main relative flex flex-col">
        <div className="relative gap-[3cqw] bg-gray-700 p-[3cqw] rounded-lg grow">
          {grid.map((tile, index) => {
            const y = Math.floor(index / 4);
            const x = index % 4;

            return (
              <motion.div
                key={tile.id}
                layout
                {...(tile.value !== 0 && {
                  initial: { scale: 0, opacity: 0 },
                  animate: { scale: 1, opacity: 1 },
                })}
                transition={{ duration: 0.2 }}
                className={clsx(
                  'merriweather absolute w-[20cqw] h-[20cqw] rounded-lg flex items-center justify-center text-[6.5cqw] font-bold',
                  { 'z-10': tile.value !== 0 },
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
        <div className="merriweather absolute inset-0 bg-gray-800/90 backdrop-blur-xs flex flex-col items-center justify-center z-20">
          <p className="text-4xl font-bold">Game Over!</p>
          <p className="text-2xl font-bold">Score: {score}</p>
          <p className="text-2xl font-bold">High Score: {highScore}</p>
          <button
            type="button"
            onClick={restartGame}
            className="mt-4 p-2 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors"
          >
            <RotateCcw className="w-8 h-8" />
          </button>
        </div>
      )}

      {gameState === GameState.GameWon && (
        <div className="absolute inset-0 bg-gray-800 bg-opacity-75 flex flex-col items-center justify-center">
          <p className="text-4xl font-bold">You Win!</p>
          <div className="flex mt-4 space-x-4">
            <button
              type="button"
              onClick={continueGame}
              className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors"
            >
              <Play className="w-8 h-8" />
            </button>
            <button
              type="button"
              onClick={restartGame}
              className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors"
            >
              <RotateCcw className="w-8 h-8" />
            </button>
          </div>
        </div>
      )}

      {showHelp && (
        <div className="absolute inset-0 bg-gray-800/90 backdrop-blur-xs flex flex-col items-center justify-center z-30 p-4">
          <div className="bg-gray-700 p-6 rounded-lg max-w-lg w-full relative">
            <button
              type="button"
              onClick={() => setShowHelp(false)}
              className="absolute top-2 right-2 p-3 rounded-full bg-gray-600 hover:bg-gray-500 transition-colors text-white"
            >
              <X />
            </button>
            <div
              id="help-content-modal"
              // biome-ignore lint/security/noDangerouslySetInnerHtml: it's ok
              dangerouslySetInnerHTML={{
                __html:
                  document.getElementById('help-content')?.innerHTML || '',
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}


export default App;

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
    case 1024:
      return 'bg-red-700 text-gray-100';
    case 2048:
      return 'bg-red-700 text-gray-100';
    default:
      return 'bg-gray-900 text-gray-100';
  }
};
