import { useState, useCallback, useEffect, useRef } from 'react';
import type { GameState, GameConfig } from '../types';
import { initializeGame, advanceYear, transferFunds, INITIAL_CONFIG } from '../engine/GameEngine';
import { saveConfig, loadConfig } from '../utils/storage';

console.log("DEBUG: useGame.ts evaluating");

export function useGame() {
    const [gameState, setGameState] = useState<GameState>(() => {
        const savedConfig = loadConfig();
        const config = savedConfig ? { ...INITIAL_CONFIG, ...savedConfig } : INITIAL_CONFIG;
        return initializeGame(config);
    });
    const [isPlaying, setIsPlaying] = useState(false);
    const [playbackSpeed, setPlaybackSpeed] = useState(1000); // ms per year

    // Timer Ref
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const restartGame = useCallback((config?: GameConfig) => {
        setIsPlaying(false); // Stop playback on restart
        if (timerRef.current) clearInterval(timerRef.current);

        // If config provided, use it. Else reuse current config from state.
        const cfg = config || gameState.config;
        setGameState(initializeGame(cfg));
    }, [gameState.config]);

    const updateConfig = useCallback((newConfig: GameConfig) => {
        setGameState(prev => {
            // Check for Strategy Change to Log
            let newHistory = prev.history;
            if (prev.config.rebalancingStrategy !== newConfig.rebalancingStrategy && prev.history.length > 0) {
                newHistory = [...prev.history];
                const lastIdx = newHistory.length - 1;
                const changeMsg = `Switched: ${prev.config.rebalancingStrategy} ➝ ${newConfig.rebalancingStrategy}`;
                const existingLog = newHistory[lastIdx].strategyChange;

                newHistory[lastIdx] = {
                    ...newHistory[lastIdx],
                    strategyChange: existingLog ? `${existingLog} | ${changeMsg}` : changeMsg
                };
            }

            // Check if we are extending the mission to clear 'Victory' state
            const isExtending = prev.isGameOver &&
                prev.gameOverReason?.startsWith('Victory') &&
                newConfig.survivalYears > prev.currentYear;

            return {
                ...prev,
                history: newHistory,
                config: newConfig,
                isGameOver: isExtending ? false : prev.isGameOver,
                gameOverReason: isExtending ? undefined : prev.gameOverReason
            };
        });
        saveConfig(newConfig);
    }, []);

    const nextYear = useCallback(() => {
        setGameState(prev => {
            if (prev.isGameOver) {
                setIsPlaying(false);
                return prev;
            }

            // 1. Advance Year (Market, Tax, Withdraw) - Includes Rebalancing logic internally
            let newState = advanceYear(prev);

            return newState;
        });
    }, []);

    const transfer = useCallback((fromIndex: number, toIndex: number, amount: number) => {
        setGameState(prev => transferFunds(prev, fromIndex, toIndex, amount));
    }, []);

    // Auto-Play Effect
    useEffect(() => {
        if (isPlaying && !gameState.isGameOver) {
            timerRef.current = setInterval(() => {
                nextYear();
            }, playbackSpeed);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
        }

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isPlaying, playbackSpeed, nextYear, gameState.isGameOver]);

    const togglePlay = useCallback(() => {
        if (gameState.isGameOver) return;
        setIsPlaying(p => !p);
    }, [gameState.isGameOver]);

    const setSpeed = useCallback((speed: number) => {
        setPlaybackSpeed(speed);
    }, []);

    return {
        gameState,
        restartGame,
        updateConfig,
        nextYear,
        transfer,
        playback: {
            isPlaying,
            togglePlay,
            setSpeed,
            speed: playbackSpeed
        }
    };
}
