import { useState, useEffect } from 'react';
import { useGame } from './hooks/useGame';
import BucketCard from './components/BucketCard';
import ControlPanel from './components/ControlPanel';
import SetupForm from './components/SetupForm';
import ConfigModal from './components/ConfigModal';
import BurnDownChart from './components/BurnDownChart';
import MilestoneCelebration from './components/MilestoneCelebration';
import BucketStackChart from './components/BucketStackChart';
import ExpenseReveal from './components/ExpenseReveal';
import WelcomeScreen from './components/WelcomeScreen';
import Leaderboard from './components/Leaderboard';
import GenieNotification from './components/GenieNotification';
import ComparisonChart from './components/ComparisonChart';
import { StrategyHeader } from './components/StrategyHeader';
import MissionLog from './components/MissionLog';
import StrategyIntel from './components/StrategyIntel';
import { saveGameResult, calculateScore } from './utils/storage';
import { formatCurrency } from './utils/currency';
import type { GameConfig, LeaderboardEntry } from './types';
import { ErrorBoundary } from './components/ErrorBoundary';

function App() {
  console.log("DEBUG: App Component Rendering");
  const [username, setUsername] = useState<string | null>(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  // Animation Triggers
  const [expenseTrigger, setExpenseTrigger] = useState(false);

  // Transfer Mode State
  const [transferSource, setTransferSource] = useState<number | null>(null);

  // Chart Mode State
  const [chartMode, setChartMode] = useState<'wealth' | 'buckets' | 'allocation' | 'comparison'>('wealth');
  const [viewMode, setViewMode] = useState<'visuals' | 'data' | 'intel'>('visuals');

  // Use the game hook
  const { gameState, nextYear, transfer, restartGame, updateConfig, playback } = useGame();
  const { speed } = playback;

  // Save Game Result on Completion
  useEffect(() => {
    if (gameState.isGameOver && username) {
      const totalWealth = gameState.buckets.reduce((sum, b) => sum + b.balance, 0);
      const entry: LeaderboardEntry = {
        id: gameState.sessionId,
        username,
        timestamp: new Date().toISOString(),
        survivalYears: gameState.currentYear,
        maxYears: gameState.config.survivalYears,
        endingWealth: totalWealth,
        score: calculateScore(gameState.currentYear, totalWealth, gameState.config.survivalYears),
        outcome: gameState.currentYear >= gameState.config.survivalYears ? 'Victory' : 'Bankrupt'
      };
      saveGameResult(entry);
    }
  }, [gameState.isGameOver, username, gameState.currentYear, gameState.buckets, gameState.config.survivalYears]);

  const handleNextYear = () => {
    // Safety Check: Ensure Bucket 1 has enough for next year's expenses
    const nextYearNum = gameState.currentYear + 1;
    const inflationMultiplier = Math.pow(1 + gameState.config.inflationRate, nextYearNum);
    const estimatedExpenses = gameState.config.initialExpenses * inflationMultiplier;
    const bucket1Balance = gameState.buckets[0].balance;

    if (bucket1Balance < estimatedExpenses) {
      const shortage = estimatedExpenses - bucket1Balance;
      // Using a simple alert for now, could be a nicer modal
      alert(`⚠️ COMMANDER ALERT!\n\nBucket 1 (Cash) is too low for Year ${nextYearNum} expenses.\n\nRequired: ${new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(estimatedExpenses)}\nAvailable: ${new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(bucket1Balance)}\n\nPlease Transfer at least ${new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(shortage)} to Bucket 1 before proceeding!`);
      return;
    }

    setExpenseTrigger(true); // Fire animation
    setTimeout(() => setExpenseTrigger(false), 100); // Reset trigger quickly so it can re-fire
    nextYear();
  };

  const handleStart = (config: GameConfig) => {
    restartGame(config);
    setHasStarted(true);
  };

  const handleTransferInitiate = (index: number) => {
    if (transferSource === index) {
      setTransferSource(null); // Deselect
    } else {
      setTransferSource(index);
    }
  };

  const handleTransferComplete = (toIndex: number, amount: number) => {
    if (transferSource !== null && amount > 0) {
      transfer(transferSource, toIndex, amount);
      setTransferSource(null); // Reset after transfer
    }
  };

  // Dashboard Layout
  return (
    <ErrorBoundary>
      <div className="dashboard-container">
        {/* HEADER */}
        {
          !username ? (
            <WelcomeScreen onStart={setUsername} />
          ) : (
            <>
              {/* Global Rebalancing Notification Layer */}
              <GenieNotification
                latestMoves={gameState.history[gameState.history.length - 1]?.rebalancingMoves}
                year={gameState.currentYear}
                speed={speed}
              />




              <header className="dashboard-header" style={{ padding: '0 0.5rem', position: 'relative', zIndex: 101, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <h1 style={{
                    fontSize: '1.25rem', fontWeight: 700, margin: 0, letterSpacing: '-0.03em',
                    background: 'linear-gradient(to right, #38bdf8, #818cf8)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer'
                  }} onClick={() => setShowLeaderboard(true)}>
                    <span style={{ fontSize: '1.5rem' }}>🚀</span> Retirement Bucket Survivor
                  </h1>

                  {/* Strategy Selector (Only when running) */}
                  {hasStarted && (
                    <StrategyHeader
                      currentStrategy={gameState.config.rebalancingStrategy}
                      onStrategyChange={(strat) => updateConfig({ ...gameState.config, rebalancingStrategy: strat })}
                    />
                  )}
                </div>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <button className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem' }} onClick={() => setShowLeaderboard(true)}>
                    🏆 Leaderboard
                  </button>
                  {hasStarted && (
                    <>
                      <span style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>Year {gameState.currentYear}</span>
                      <button
                        onClick={() => setShowConfig(true)}
                        className="btn"
                        style={{ background: 'rgba(255,255,255,0.1)', padding: '0.5rem', display: 'flex', alignItems: 'center', color: '#94a3b8' }}
                        title="Advanced Settings (Geeks Only)"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.74v-.47a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.39a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
                          <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                      </button>
                      <button
                        onClick={() => {
                          try {
                            // Global CSV Export Logic
                            const headers = ['Year', 'Total Wealth (Cr)', 'Tax Paid', 'Withdrawn', 'B1 Balance', 'B1 Return', 'B2 Balance', 'B2 Return', 'B3 Balance', 'B3 Return', 'Rebalancing Log'];
                            if (!gameState.history || gameState.history.length === 0) {
                              alert("No simulation data to export yet.");
                              return;
                            }
                            const rows = gameState.history.map(h => {
                              // Serialize logs: safely handle array vs string
                              let logString: string = '';
                              if (Array.isArray(h.rebalancingMoves)) {
                                const buckets = ['Cash', 'Income', 'Growth'];
                                logString = h.rebalancingMoves.map(m => {
                                  const from = buckets[m.fromBucketIndex] || `B${m.fromBucketIndex + 1}`;
                                  const to = buckets[m.toBucketIndex] || `B${m.toBucketIndex + 1}`;
                                  return `${m.reason}: ${formatCurrency(m.amount)} (${from} -> ${to})`;
                                }).join('; ');
                              } else if (typeof h.rebalancingMoves === 'string') {
                                logString = h.rebalancingMoves;
                              }

                              const log = `"${logString.replace(/"/g, '""').replace(/\n/g, ' ')}"`;

                              return [
                                h.year,
                                (h.totalWealth / 10000000).toFixed(4),
                                h.taxPaid.toFixed(2),
                                h.withdrawn.toFixed(2),
                                h.buckets[0].balance.toFixed(2),
                                (h.buckets[0].lastYearReturn * 100).toFixed(2) + '%',
                                h.buckets[1].balance.toFixed(2),
                                (h.buckets[1].lastYearReturn * 100).toFixed(2) + '%',
                                h.buckets[2].balance.toFixed(2),
                                (h.buckets[2].lastYearReturn * 100).toFixed(2) + '%',
                                log
                              ].join(',');
                            });

                            const csvContent = [headers.join(','), ...rows].join('\n');
                            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                            const url = URL.createObjectURL(blob);
                            const link = document.createElement('a');
                            link.setAttribute('href', url);
                            link.setAttribute('download', `simulation_data_${gameState.sessionId || 'run'}.csv`);
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                            setTimeout(() => URL.revokeObjectURL(url), 100); // Slight delay to ensure download starts
                          } catch (err) {
                            console.error("Export failed:", err);
                            alert("Failed to export data. See console for details.");
                          }
                        }}
                        className="btn btn-secondary"
                        style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}
                      >
                        ⬇ Export Data
                      </button>
                    </>
                  )}
                </div>
              </header>

              {
                showLeaderboard && (
                  <Leaderboard
                    onClose={() => setShowLeaderboard(false)}
                  />
                )
              }

              <ConfigModal
                isOpen={showConfig}
                onClose={() => setShowConfig(false)}
                config={gameState.config}
                onSave={(newConfig) => {
                  updateConfig(newConfig);
                  setShowConfig(false);
                }}
              />

              <MilestoneCelebration
                year={gameState.currentYear}
                survivalYears={gameState.config.survivalYears}
              />

              <ExpenseReveal
                expenses={gameState.history[gameState.currentYear]?.withdrawn || 0}
                year={gameState.currentYear}
                trigger={expenseTrigger}
              />



              {
                !hasStarted ? (
                  <div style={{ gridArea: 'buckets', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <SetupForm onStart={handleStart} />
                  </div>
                ) : (
                  <>
                    {/* Buckets Section */}
                    <section className="dashboard-buckets">
                      {gameState.buckets.map((bucket, index) => (
                        <BucketCard
                          key={index}
                          bucket={bucket}
                          index={index}
                          currentYear={gameState.currentYear}
                          history={gameState.history}
                          totalWealth={gameState.history[gameState.currentYear]?.totalWealth || 0}
                          isTransferSource={transferSource === index}
                          isTransferTarget={transferSource !== null && transferSource !== index}
                          maxTransferableAmount={transferSource !== null ? gameState.buckets[transferSource].balance : 0}
                          onTransferInitiate={() => handleTransferInitiate(index)}
                          onTransferComplete={(amount) => handleTransferComplete(index, amount)}
                        />
                      ))}
                    </section>

                    {/* Compact Controls Bar */}
                    <section style={{ gridArea: 'controls', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      {/* Playback Controls */}
                      <div style={{ flex: '0 0 auto' }}>
                        <ControlPanel
                          gameState={gameState}
                          onNextYear={handleNextYear}
                          onRestart={() => {
                            restartGame();
                            setShowLeaderboard(true);
                          }}
                          onExtend={() => {
                            updateConfig({
                              ...gameState.config,
                              survivalYears: gameState.config.survivalYears + 10
                            });
                          }}
                          playback={playback}
                        />
                      </div>

                      {/* Middle Tab Switcher - Refactored for aesthetics */}
                      <div style={{ flex: 1, display: 'flex', gap: '0.75rem', alignItems: 'center', height: '100%', paddingLeft: '1rem' }}>
                        <button
                          className={`btn ${viewMode === 'visuals' ? 'btn-primary' : ''}`}
                          style={{
                            flex: 1,
                            padding: '0.75rem',
                            fontSize: '1rem', // Bigger text
                            fontWeight: 600,
                            borderRadius: '8px',
                            background: viewMode === 'visuals' ? undefined : 'rgba(255,255,255,0.05)',
                            border: '1px solid var(--glass-border)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                          }}
                          onClick={() => setViewMode('visuals')}
                        >
                          <span>📊</span> Visuals
                        </button>
                        <button
                          className={`btn ${viewMode === 'data' ? 'btn-primary' : ''}`}
                          style={{
                            flex: 1,
                            padding: '0.75rem',
                            fontSize: '1rem', // Bigger text
                            fontWeight: 600,
                            borderRadius: '8px',
                            background: viewMode === 'data' ? undefined : 'rgba(255,255,255,0.05)',
                            border: '1px solid var(--glass-border)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                          }}
                          onClick={() => setViewMode('data')}
                        >
                          <span>📋</span> Mission Log
                        </button>
                        <button
                          className={`btn ${viewMode === 'intel' ? 'btn-primary' : ''}`}
                          style={{
                            flex: 1,
                            padding: '0.75rem',
                            fontSize: '1rem', // Bigger text
                            fontWeight: 600,
                            borderRadius: '8px',
                            background: viewMode === 'intel' ? undefined : 'rgba(255,255,255,0.05)',
                            border: '1px solid var(--glass-border)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                          }}
                          onClick={() => setViewMode('intel')}
                        >
                          <span>🧠</span> Strategy Intel
                        </button>
                      </div>
                    </section>

                    {/* Main Content Area */}
                    <div style={{ gridArea: 'main', display: 'flex', flexDirection: 'column', overflow: 'hidden', height: '100%', gap: '0.5rem' }}>

                      {/* CONTENT AREA */}
                      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
                        {viewMode === 'visuals' && (
                          <section className="dashboard-chart" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: '300px', gap: '0.5rem' }}>
                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', padding: '0 0.5rem' }}>
                              <button
                                className="btn"
                                style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', background: chartMode === 'wealth' ? 'var(--color-primary)' : 'rgba(255,255,255,0.05)', opacity: chartMode === 'wealth' ? 1 : 0.7 }}
                                onClick={() => setChartMode('wealth')}
                              >
                                Wealth
                              </button>
                              <button
                                className="btn"
                                style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', background: chartMode === 'buckets' ? 'var(--color-primary)' : 'rgba(255,255,255,0.05)', opacity: chartMode === 'buckets' ? 1 : 0.7 }}
                                onClick={() => setChartMode('buckets')}
                              >
                                Buckets
                              </button>
                              <button
                                className="btn"
                                style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', background: chartMode === 'allocation' ? 'var(--color-primary)' : 'rgba(255,255,255,0.05)', opacity: chartMode === 'allocation' ? 1 : 0.7 }}
                                onClick={() => setChartMode('allocation')}
                              >
                                Alloc %
                              </button>
                              <button
                                className="btn"
                                style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', background: chartMode === 'comparison' ? 'var(--color-primary)' : 'rgba(255,255,255,0.05)', opacity: chartMode === 'comparison' ? 1 : 0.7 }}
                                onClick={() => setChartMode('comparison')}
                              >
                                GOD Mode
                              </button>
                            </div>

                            {chartMode === 'wealth' ? (
                              <BurnDownChart
                                history={gameState.history}
                                survivalYears={gameState.config.survivalYears}
                                currentYear={gameState.currentYear}
                              />
                            ) : chartMode === 'comparison' ? (
                              <ComparisonChart gameState={gameState} />
                            ) : (
                              <BucketStackChart
                                history={gameState.history}
                                survivalYears={gameState.config.survivalYears}
                                currentYear={gameState.currentYear}
                                mode={chartMode === 'allocation' ? 'percent' : 'absolute'}
                              />
                            )}
                          </section>
                        )}

                        {viewMode === 'data' && (
                          <MissionLog history={gameState.history} />
                        )}

                        {viewMode === 'intel' && (
                          <StrategyIntel />
                        )}
                      </div>
                    </div>
                  </>
                )
              }
            </>
          )
        }
      </div>
    </ErrorBoundary>
  );
}

export default App;
