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
import { saveGameResult, calculateScore } from './utils/storage';
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
              <header className="dashboard-header" style={{ padding: '0 0.5rem', position: 'relative', zIndex: 101 }}>
                <h1 style={{
                  fontSize: '1.25rem', fontWeight: 700, margin: 0, letterSpacing: '-0.03em',
                  background: 'linear-gradient(to right, #38bdf8, #818cf8)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                  display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer'
                }} onClick={() => setShowLeaderboard(true)}>
                  <span style={{ fontSize: '1.5rem' }}>🚀</span> Retirement Bucket Survivor
                </h1>

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
                        style={{ background: 'rgba(255,255,255,0.1)', padding: '0.5rem', display: 'flex', alignItems: 'center' }}
                        title="Simulation Settings"
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
                              // Escape quotes in log
                              const log = h.rebalancingMoves ? `"${h.rebalancingMoves.replace(/"/g, '""').replace(/\n/g, ' ')}"` : '""';
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
                          onTransferInitiate={() => handleTransferInitiate(index)}
                          onTransferComplete={(amount) => handleTransferComplete(index, amount)}
                        />
                      ))}
                    </section>

                    {/* Chart Section */}
                    {/* Chart Section */}
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

                    {/* Controls & Log Section */}
                    <section className="dashboard-controls" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <ControlPanel
                        gameState={gameState}
                        onNextYear={handleNextYear}
                        onRestart={() => {
                          restartGame();
                          setShowLeaderboard(true); // Show leaderboard on restart
                        }}
                        onExtend={() => {
                          updateConfig({
                            ...gameState.config,
                            survivalYears: gameState.config.survivalYears + 10
                          });
                        }}
                        playback={playback}
                      />

                      {/* Detailed Data Table */}
                      <div className="glass-panel" style={{ flex: 1, padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: '200px' }}>
                        <div style={{ padding: '0.75rem', borderBottom: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.02)' }}>
                          <h4 className="compact-h" style={{ margin: 0 }}>Mission Log</h4>
                        </div>
                        <div style={{ overflow: 'auto', flex: 1 }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
                            <thead style={{ position: 'sticky', top: 0, background: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(4px)', zIndex: 10 }}>
                              <tr>
                                <th style={{ padding: '0.5rem', borderBottom: '1px solid var(--glass-border)' }}>Year</th>
                                <th style={{ padding: '0.5rem', borderBottom: '1px solid var(--glass-border)' }}>B1 %</th>
                                <th style={{ padding: '0.5rem', borderBottom: '1px solid var(--glass-border)' }}>B2 %</th>
                                <th style={{ padding: '0.5rem', borderBottom: '1px solid var(--glass-border)' }}>B3 %</th>
                                <th style={{ padding: '0.5rem', borderBottom: '1px solid var(--glass-border)' }}>Tax</th>
                                <th style={{ padding: '0.5rem', borderBottom: '1px solid var(--glass-border)' }}>Drawdown</th>
                                <th style={{ padding: '0.5rem', borderBottom: '1px solid var(--glass-border)' }}>Wealth</th>
                              </tr>
                            </thead>
                            <tbody>
                              {gameState.history.length === 1 &&
                                <tr><td colSpan={7} style={{ padding: '1rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>Simulation Initialized.</td></tr>
                              }
                              {[...gameState.history].reverse().map((h) => (
                                <tr key={h.year} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: h.marketEvent ? 'rgba(234, 179, 8, 0.05)' : 'transparent' }}>
                                  <td style={{ padding: '0.5rem', fontWeight: 600 }}>{h.year}</td>
                                  {/* Bucket Returns */}
                                  {[0, 1, 2].map(i => {
                                    const ret = h.buckets[i].lastYearReturn;
                                    return (
                                      <td key={i} style={{ padding: '0.5rem', color: ret >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                                        {ret !== 0 ? `${(ret * 100).toFixed(1)}%` : '-'}
                                      </td>
                                    );
                                  })}
                                  <td style={{ padding: '0.5rem', color: '#fb923c' }}>
                                    {h.taxPaid > 0 ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0, notation: 'compact' }).format(h.taxPaid) : '-'}
                                  </td>
                                  <td style={{ padding: '0.5rem' }}>
                                    {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0, notation: 'compact' }).format(h.withdrawn)}
                                  </td>
                                  <td style={{ padding: '0.5rem', fontWeight: 600 }}>
                                    {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0, notation: 'compact' }).format(h.totalWealth)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </section>
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
