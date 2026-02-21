import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Pause, Dice5, Trash2, Settings2, Info } from 'lucide-react';

type Grid = boolean[][];

export default function App() {
  // Simulation parameters
  const [gridSize, setGridSize] = useState(20);
  const [probSpread, setProbSpread] = useState(0.1);
  const [probExtinguish, setProbExtinguish] = useState(0.05);
  const [lifespan, setLifespan] = useState(10);
  const [intervalTime, setIntervalTime] = useState(200);
  const [showHeatmap, setShowHeatmap] = useState(false);
  
  // State
  const [grid, setGrid] = useState<Grid>(() => 
    Array(20).fill(null).map(() => Array(20).fill(false))
  );
  const [ageGrid, setAgeGrid] = useState<number[][]>(() => 
    Array(20).fill(null).map(() => Array(20).fill(0))
  );
  const [isRunning, setIsRunning] = useState(false);
  const [generation, setGeneration] = useState(0);
  
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const ageGridRef = useRef<number[][]>(Array(20).fill(null).map(() => Array(20).fill(0)));

  // Initialize grid when size changes
  useEffect(() => {
    const nextGrid = Array(gridSize).fill(null).map(() => Array(gridSize).fill(false));
    const nextAgeGrid = Array(gridSize).fill(null).map(() => Array(gridSize).fill(0));
    setGrid(nextGrid);
    setAgeGrid(nextAgeGrid);
    ageGridRef.current = nextAgeGrid;
    setGeneration(0);
    setIsRunning(false);
  }, [gridSize]);

  const step = useCallback(() => {
    setGrid(prevGrid => {
      const size = prevGrid.length;
      const currentAgeGrid = ageGridRef.current;
      const nextGrid = Array(size).fill(null).map(() => Array(size).fill(false));
      const nextAgeGrid = Array(size).fill(null).map(() => Array(size).fill(0));

      // First, calculate neighbor counts for the whole grid
      const neighborCount = Array(size).fill(null).map(() => Array(size).fill(0));
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          if (prevGrid[r][c]) {
            const neighbors = [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]];
            for (const [nr, nc] of neighbors) {
              if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
                neighborCount[nr][nc]++;
              }
            }
          }
        }
      }

      // Apply rules for each cell
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          const isCurrentlyOn = prevGrid[r][c];
          const k = neighborCount[r][c];

          if (isCurrentlyOn) {
            // 1. Auto-extinguish rule
            const currentAge = currentAgeGrid[r][c];
            if (currentAge + 1 >= lifespan) {
              nextGrid[r][c] = false;
              nextAgeGrid[r][c] = 0;
            } else {
              // 2. Extinguish by neighbor rule (s)
              // If any neighbor is ON, they have a probability 's' of extinguishing this cell
              let extinguished = false;
              if (k > 0) {
                // Probability of NOT being extinguished by any of the k neighbors is (1-s)^k
                const probNotExtinguished = Math.pow(1 - probExtinguish, k);
                if (Math.random() > probNotExtinguished) {
                  extinguished = true;
                }
              }

              if (extinguished) {
                nextGrid[r][c] = false;
                nextAgeGrid[r][c] = 0;
              } else {
                nextGrid[r][c] = true;
                nextAgeGrid[r][c] = currentAge + 1;
              }
            }
          } else {
            // 3. Proximity-based ignition rule (a)
            if (k > 0) {
              // Probability of being ignited by at least one of the k neighbors is 1 - (1-a)^k
              const probIgnite = 1 - Math.pow(1 - probSpread, k);
              if (Math.random() < probIgnite) {
                nextGrid[r][c] = true;
                nextAgeGrid[r][c] = 1;
              }
            }
          }
        }
      }
      
      // We need to update ageGrid as well, but setGrid only updates grid.
      // In React, it's better to update both in a single state or use a ref for ageGrid.
      // Since we are in a functional component, let's use a trick or wrap them.
      ageGridRef.current = nextAgeGrid;
      setAgeGrid(nextAgeGrid);
      return nextGrid;
    });
    setGeneration(g => g + 1);
  }, [probSpread, probExtinguish, lifespan]);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(step, intervalTime);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, step, intervalTime]);

  const toggleCell = (r: number, c: number) => {
    const newGrid = grid.map(row => [...row]);
    const newAgeGrid = ageGrid.map(row => [...row]);
    
    newGrid[r][c] = !newGrid[r][c];
    newAgeGrid[r][c] = newGrid[r][c] ? 1 : 0;
    
    setGrid(newGrid);
    setAgeGrid(newAgeGrid);
    ageGridRef.current = newAgeGrid;
  };

  const randomize = () => {
    const newGrid = grid.map(row => row.map(() => Math.random() > 0.85));
    const newAgeGrid = newGrid.map(row => row.map(val => val ? 1 : 0));
    setGrid(newGrid);
    setAgeGrid(newAgeGrid);
    ageGridRef.current = newAgeGrid;
    setGeneration(0);
  };

  const clear = () => {
    const newGrid = grid.map(row => row.map(() => false));
    const newAgeGrid = ageGrid.map(row => row.map(() => 0));
    setGrid(newGrid);
    setAgeGrid(newAgeGrid);
    ageGridRef.current = newAgeGrid;
    setGeneration(0);
    setIsRunning(false);
  };

  return (
    <div className="min-h-screen bg-[#E4E3E0] text-[#141414] font-sans p-4 md:p-8">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-8">
        
        {/* Sidebar Controls */}
        <aside className="space-y-6">
          <header className="border-b border-[#141414] pb-4">
            <h1 className="text-3xl font-serif uppercase font-bold tracking-tight">Stochastic Grid</h1>
            <p className="text-xs uppercase tracking-widest opacity-60 mt-1">Simulation Engine v1.0</p>
          </header>

          <section className="space-y-4 bg-white/50 p-6 rounded-2xl border border-[#141414]/10 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Settings2 size={18} />
              <h2 className="text-sm font-bold uppercase tracking-wider">Parameters</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="flex justify-between text-xs font-mono mb-1">
                  <span>Grid Size (N)</span>
                  <span>{gridSize}x{gridSize}</span>
                </label>
                <input 
                  type="range" min="10" max="50" step="1" 
                  value={gridSize} 
                  onChange={(e) => setGridSize(parseInt(e.target.value))}
                  className="w-full accent-[#141414]"
                />
              </div>

              <div>
                <label className="flex justify-between text-xs font-mono mb-1">
                  <span>Spread Prob. (a)</span>
                  <span>{(probSpread * 100).toFixed(1)}%</span>
                </label>
                <input 
                  type="range" min="0" max="1" step="0.01" 
                  value={probSpread} 
                  onChange={(e) => setProbSpread(parseFloat(e.target.value))}
                  className="w-full accent-[#141414]"
                />
              </div>

              <div>
                <label className="flex justify-between text-xs font-mono mb-1">
                  <span>Extinguish Prob. (s)</span>
                  <span>{(probExtinguish * 100).toFixed(1)}%</span>
                </label>
                <input 
                  type="range" min="0" max="1" step="0.01" 
                  value={probExtinguish} 
                  onChange={(e) => setProbExtinguish(parseFloat(e.target.value))}
                  className="w-full accent-[#141414]"
                />
              </div>

              <div>
                <label className="flex justify-between text-xs font-mono mb-1">
                  <span>Lifespan (L)</span>
                  <span>{lifespan} steps</span>
                </label>
                <input 
                  type="range" min="1" max="50" step="1" 
                  value={lifespan} 
                  onChange={(e) => setLifespan(parseInt(e.target.value))}
                  className="w-full accent-[#141414]"
                />
              </div>

              <div>
                <label className="flex justify-between text-xs font-mono mb-1">
                  <span>Interval (T)</span>
                  <span>{intervalTime}ms</span>
                </label>
                <input 
                  type="range" min="50" max="1000" step="50" 
                  value={intervalTime} 
                  onChange={(e) => setIntervalTime(parseInt(e.target.value))}
                  className="w-full accent-[#141414]"
                />
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative">
                    <input 
                      type="checkbox" 
                      checked={showHeatmap}
                      onChange={(e) => setShowHeatmap(e.target.checked)}
                      className="sr-only"
                    />
                    <div className={`w-10 h-5 rounded-full transition-colors ${showHeatmap ? 'bg-[#10b981]' : 'bg-[#141414]/20'}`} />
                    <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${showHeatmap ? 'translate-x-5' : ''}`} />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider opacity-70 group-hover:opacity-100 transition-opacity">Show Age Heatmap</span>
                </label>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => setIsRunning(!isRunning)}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${
                isRunning 
                ? 'bg-[#141414] text-[#E4E3E0]' 
                : 'bg-white border border-[#141414] hover:bg-[#141414] hover:text-[#E4E3E0]'
              }`}
            >
              {isRunning ? <Pause size={18} /> : <Play size={18} />}
              {isRunning ? 'STOP' : 'START'}
            </button>
            <button 
              onClick={step}
              disabled={isRunning}
              className="flex items-center justify-center gap-2 py-3 rounded-xl font-bold bg-white border border-[#141414] hover:bg-[#141414] hover:text-[#E4E3E0] disabled:opacity-30"
            >
              STEP
            </button>
            <button 
              onClick={randomize}
              className="flex items-center justify-center gap-2 py-3 rounded-xl font-bold bg-white border border-[#141414] hover:bg-[#141414] hover:text-[#E4E3E0]"
            >
              <Dice5 size={18} />
              RANDOM
            </button>
            <button 
              onClick={clear}
              className="flex items-center justify-center gap-2 py-3 rounded-xl font-bold bg-white border border-[#141414] hover:bg-[#141414] hover:text-[#E4E3E0]"
            >
              <Trash2 size={18} />
              CLEAR
            </button>
          </section>

          <div className="p-4 bg-[#141414] text-[#E4E3E0] rounded-xl flex justify-between items-center">
            <span className="text-xs font-mono uppercase tracking-widest opacity-60">Generation</span>
            <span className="text-2xl font-serif font-bold">{generation}</span>
          </div>

          <div className="p-4 border border-[#141414]/20 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase opacity-60">
              <Info size={14} />
              <span>Rules</span>
            </div>
            <p className="text-[11px] leading-relaxed opacity-80">
              1. An OFF cell has an ignition probability that increases with the number of ON neighbors.<br/>
              2. Each ON cell has a probability <b>s</b> of extinguishing an adjacent ON cell.<br/>
              3. An ON cell automatically turns OFF after <b>L</b> time steps.
            </p>
          </div>
        </aside>

        {/* Main Grid View */}
        <main className="flex flex-col items-center justify-center bg-white rounded-3xl border border-[#141414]/10 shadow-xl p-4 md:p-8 overflow-hidden">
          <div 
            className="grid gap-[1px] bg-[#141414]/10 border border-[#141414]/20 shadow-inner"
            style={{ 
              gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
              width: '100%',
              maxWidth: 'min(80vh, 100%)',
              aspectRatio: '1/1'
            }}
          >
            {grid.map((row, r) => 
              row.map((isAlive, c) => {
                const age = ageGrid[r][c];
                const ageRatio = Math.min(age / lifespan, 1);
                
                // Heatmap color: From Emerald (New) to Black (Old)
                // New: hsl(160, 80%, 50%) -> Old: hsl(160, 80%, 5%)
                const heatmapStyle = showHeatmap && isAlive ? {
                  backgroundColor: `hsl(160, 84%, ${50 - (ageRatio * 45)}%)`,
                } : {};

                return (
                  <div
                    key={`${r}-${c}`}
                    onClick={() => toggleCell(r, c)}
                    style={heatmapStyle}
                    className={`cursor-pointer ${isRunning ? '' : 'transition-colors duration-150'} ${
                      isAlive 
                      ? (!showHeatmap ? 'bg-[#141414]' : '') 
                      : 'bg-white hover:bg-[#141414]/5'
                    }`}
                  />
                );
              })
            )}
          </div>
          
          <div className="mt-6 flex flex-wrap justify-center gap-8 text-[10px] font-mono uppercase tracking-widest opacity-40">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-white border border-[#141414]/20 rounded-sm" />
              <span>OFF</span>
            </div>
            {!showHeatmap ? (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-[#141414] rounded-sm" />
                <span>ON</span>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <span>New</span>
                <div className="flex h-3 w-24 rounded-sm overflow-hidden border border-[#141414]/10">
                  <div className="flex-1 bg-[#10b981]" />
                  <div className="flex-1 bg-[#059669]" />
                  <div className="flex-1 bg-[#047857]" />
                  <div className="flex-1 bg-[#064e3b]" />
                  <div className="flex-1 bg-[#141414]" />
                </div>
                <span>Old</span>
              </div>
            )}
          </div>
        </main>

      </div>
    </div>
  );
}
