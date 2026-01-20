import { useState, useEffect } from 'react';
import { useGame } from './hooks/useGame';
import BucketCard from './components/BucketCard';

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
  const [isInspecting, setIsInspecting] = useState(false); // New state for Game Over inspection

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

  const handleExportData = () => {
    try {
      const headers = ['Year', 'Total Wealth (Cr)', 'Tax Paid', 'Withdrawn', 'B1 Balance', 'B1 Return', 'B2 Balance', 'B2 Return', 'B3 Balance', 'B3 Return', 'Rebalancing Log'];
      if (!gameState.history || gameState.history.length === 0) {
        alert("No simulation data to export yet.");
        return;
      }
      const rows = gameState.history.map(h => {
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
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch (err) {
      console.error("Export failed:", err);
      alert("Failed to export data. See console for details.");
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
              <GenieNotification
                latestMoves={gameState.history[gameState.history.length - 1]?.rebalancingMoves}
                year={gameState.currentYear}
                speed={speed}
                showInterventions={false}
              />

              <header className="dashboard-header" style={{
                padding: '0.5rem',
                position: 'relative',
                zIndex: 101,
                display: 'flex',
                flexWrap: 'wrap', // Allow wrapping on small mobile
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.5rem'
              }}>
                {/* Left: Title & Strategy */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <h1 style={{
                    fontSize: '1.1rem', fontWeight: 700, margin: 0, letterSpacing: '-0.03em',
                    background: 'linear-gradient(to right, #38bdf8, #818cf8)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer'
                  }} onClick={() => setShowLeaderboard(true)}>
                    <span>🚀</span> Retirement Survivor
                  </h1>
                  {hasStarted && (
                    <div style={{ transform: 'scale(0.85)', transformOrigin: 'top left' }}>
                      <StrategyHeader
                        currentStrategy={gameState.config.rebalancingStrategy}
                        onStrategyChange={(strat) => updateConfig({ ...gameState.config, rebalancingStrategy: strat })}
                      />
                    </div>
                  )}
                </div>

                {/* Right: Controls & Menu */}
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginLeft: 'auto' }}>

                  {hasStarted && !gameState.isGameOver && (
                    <div className="control-group" style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '2px' }}>
                      {/* Speed */}
                      <div style={{ display: 'flex', borderRight: '1px solid rgba(255,255,255,0.1)', paddingRight: '4px', marginRight: '4px' }}>
                        {[1000, 200].map((s) => (
                          <button key={s} onClick={() => playback.setSpeed(s)} style={{
                            padding: '4px', fontSize: '0.7rem', border: 'none', background: 'transparent',
                            color: speed === s ? '#fbbf24' : '#64748b', fontWeight: 700, cursor: 'pointer'
                          }}>{s === 1000 ? '1x' : '5x'}</button>
                        ))}
                      </div>

                      {/* Step */}
                      <button className="btn" onClick={handleNextYear} disabled={playback.isPlaying} style={{
                        padding: '6px 10px', background: 'transparent', border: 'none', color: '#cbd5e1', cursor: playback.isPlaying ? 'not-allowed' : 'pointer', opacity: playback.isPlaying ? 0.3 : 1
                      }} title="Step 1 Year">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                      </button>

                      {/* PLAY/PAUSE - Prominent */}
                      <button className="btn" onClick={playback.togglePlay} style={{
                        padding: '6px 16px', borderRadius: '6px', border: 'none',
                        background: playback.isPlaying ? '#fbbf24' : '#22c55e',
                        color: playback.isPlaying ? '#78350f' : 'white',
                        fontWeight: 700, fontSize: '0.9rem',
                        display: 'flex', alignItems: 'center', gap: '6px',
                        boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
                      }}>
                        {playback.isPlaying ? '⏸' : '▶'}
                      </button>
                    </div>
                  )}

                  {gameState.isGameOver && isInspecting && (
                    <div style={{ display: 'flex', marginLeft: 'auto' }}>
                      <button className="btn" onClick={() => setIsInspecting(false)} style={{
                        background: '#fbbf24', color: '#78350f', padding: '0.5rem 1rem', fontSize: '0.9rem', fontWeight: 700,
                        boxShadow: '0 4px 12px rgba(251, 191, 36, 0.3)'
                      }}>
                        🏆 Show Result
                      </button>
                    </div>
                  )}

                  {/* Settings Gear */}
                  {hasStarted && (
                    <button
                      onClick={() => setShowConfig(true)}
                      className="btn"
                      style={{ background: 'rgba(255,255,255,0.1)', padding: '0.6rem', color: '#94a3b8', borderRadius: '50%' }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="3"></circle>
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                      </svg>
                    </button>
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
                onShowLeaderboard={() => setShowLeaderboard(true)}
                onExportData={handleExportData}
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

                    {/* Compact Tabs Bar (Controls removed) */}
                    <section className="dashboard-controls" style={{
                      gridArea: 'controls', display: 'flex', gap: '0.75rem', alignItems: 'center',
                      justifyContent: 'center', width: '100%'
                    }}>
                      {/* Tabs only now */}
                      <div className="dashboard-tabs" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', width: '100%', maxWidth: '600px' }}>
                        <button
                          className={`btn ${viewMode === 'visuals' ? 'btn-primary' : ''}`}
                          style={{
                            flex: 1, padding: '0.75rem', fontSize: '0.9rem', fontWeight: 600, borderRadius: '8px',
                            background: viewMode === 'visuals' ? undefined : 'rgba(255,255,255,0.05)',
                            border: '1px solid var(--glass-border)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                          }}
                          onClick={() => setViewMode('visuals')}
                        >
                          <span>📊</span> Visuals
                        </button>
                        <button
                          className={`btn ${viewMode === 'data' ? 'btn-primary' : ''}`}
                          style={{
                            flex: 1, padding: '0.75rem', fontSize: '0.9rem', fontWeight: 600, borderRadius: '8px',
                            background: viewMode === 'data' ? undefined : 'rgba(255,255,255,0.05)',
                            border: '1px solid var(--glass-border)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                          }}
                          onClick={() => setViewMode('data')}
                        >
                          <span></span> Mission Log
                        </button>
                        <button
                          className={`btn ${viewMode === 'intel' ? 'btn-primary' : ''}`}
                          style={{
                            flex: 1, padding: '0.75rem', fontSize: '0.9rem', fontWeight: 600, borderRadius: '8px',
                            background: viewMode === 'intel' ? undefined : 'rgba(255,255,255,0.05)',
                            border: '1px solid var(--glass-border)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                          }}
                          onClick={() => setViewMode('intel')}
                        >
                          <span>🧠</span> Intel
                        </button>
                      </div>
                    </section>

                    {/* Main Content Area */}
                    <div style={{ gridArea: 'main', display: 'flex', flexDirection: 'column', overflow: 'hidden', height: '100%', gap: '0.5rem', position: 'relative' }}>

                      {/* Initial Instruction Overlay */}
                      {hasStarted && gameState.currentYear === 0 && !playback.isPlaying && !gameState.isGameOver && (
                        <div style={{
                          position: 'absolute', top: '10%', left: '50%', transform: 'translate(-50%, 0)', zIndex: 50,
                          background: 'rgba(56, 189, 248, 0.2)', border: '1px solid #38bdf8', padding: '1rem', borderRadius: '12px',
                          backdropFilter: 'blur(8px)', textAlign: 'center', maxWidth: '90%'
                        }}>
                          <div style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>👈 <b>Step 1:</b> Select a Strategy (Top Left)</div>
                          <div style={{ fontSize: '1.2rem' }}>👉 <b>Step 2:</b> Click <span style={{ background: '#22c55e', padding: '2px 8px', borderRadius: '4px', color: 'white' }}>▶</span> to Play</div>
                        </div>
                      )}

                      {/* Game Over Overlay */}
                      {gameState.isGameOver && !isInspecting && (
                        <div style={{
                          position: 'absolute', inset: 0, zIndex: 1000,
                          background: 'rgba(15, 23, 42, 0.85)',
                          backdropFilter: 'blur(10px)',
                          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
                        }}>
                          <div style={{
                            background: 'rgba(30, 41, 59, 0.9)', padding: '2rem', borderRadius: '20px',
                            border: '2px solid rgba(255,255,255,0.1)', textAlign: 'center', boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                            maxWidth: '400px', width: '90%', position: 'relative'
                          }}>
                            {/* Close Button */}
                            <button
                              onClick={() => setIsInspecting(true)}
                              style={{
                                position: 'absolute', top: '10px', right: '10px',
                                background: 'rgba(255,255,255,0.1)', border: 'none', color: '#94a3b8',
                                width: '32px', height: '32px', borderRadius: '50%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer', fontSize: '1.2rem', lineHeight: 1
                              }}
                              title="Close to Review Data"
                            >
                              &times;
                            </button>

                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
                              {gameState.gameOverReason?.includes('Victory') ? '🏆' : '💀'}
                            </div>
                            <h2 style={{ fontSize: '2rem', margin: '0 0 0.5rem 0', color: gameState.gameOverReason?.includes('Victory') ? '#fbbf24' : '#f87171' }}>
                              {gameState.gameOverReason?.includes('Victory') ? 'Mission Accomplished' : 'Bankrupt'}
                            </h2>
                            <p style={{ color: '#94a3b8', marginBottom: '1.5rem', fontSize: '1.1rem' }}>
                              {gameState.gameOverReason || (gameState.currentYear >= gameState.config.survivalYears ? 'Target reached!' : 'Corpus depleted.')}
                            </p>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '10px' }}>
                                <div style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase' }}>Years Lasted</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white' }}>{gameState.currentYear} / {gameState.config.survivalYears}</div>
                              </div>
                              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '10px' }}>
                                <div style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase' }}>Legacy Left</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#4ade80' }}>
                                  {formatCurrency(gameState.buckets.reduce((a, b) => a + b.balance, 0))}
                                </div>
                              </div>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                              <button className="btn" onClick={() => setIsInspecting(true)} style={{
                                background: 'transparent', border: '1px solid #94a3b8', color: '#cbd5e1', padding: '0.75rem 1.5rem', fontSize: '1rem', flex: '1 1 100%'
                              }}>
                                🔍 Review Data
                              </button>

                              <button className="btn" onClick={() => { restartGame(); setIsInspecting(false); setShowLeaderboard(true); }} style={{
                                background: '#38bdf8', color: 'white', padding: '0.75rem 1.5rem', fontSize: '1rem', flex: 1
                              }}>
                                🔄 Restart
                              </button>
                              {gameState.gameOverReason?.includes('Victory') && (
                                <button className="btn" onClick={() => updateConfig({ ...gameState.config, survivalYears: gameState.config.survivalYears + 10 })} style={{
                                  background: '#22c55e', color: 'white', padding: '0.75rem 1.5rem', fontSize: '1rem', flex: 1
                                }}>
                                  Extend +10Y
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

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
