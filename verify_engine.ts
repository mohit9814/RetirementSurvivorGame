import { initializeGame, advanceYear, transferFunds } from './src/engine/GameEngine';

const state = initializeGame();
console.log("Initial State:", state.currentYear, state.buckets.map(b => b.balance));

const state2 = advanceYear(state);
console.log("Year 1:", state2.currentYear, state2.buckets.map(b => b.balance));
console.log("Last Event:", state2.history[state2.history.length - 1].marketEvent);

const state3 = transferFunds(state2, 0, 1, 1000);
console.log("After Transfer:", state3.buckets.map(b => b.balance));
