import React from 'react';
import { STAGES, type GamePhase, type RunSnapshot } from '../game/rules';

interface StatusModalProps {
  phase: GamePhase;
  snapshot: RunSnapshot | null;
  currentStageIndex: number;
  onResume: () => void;
  onRestart: () => void;
  onNextStage: () => void;
  onReturnTitle: () => void;
}

export const StatusModal: React.FC<StatusModalProps> = ({
  phase,
  snapshot,
  currentStageIndex,
  onResume,
  onRestart,
  onNextStage,
  onReturnTitle,
}) => {
  if (phase !== 'paused' && phase !== 'gameover') return null;

  const isVictory = phase === 'gameover' && snapshot?.outcome === 'victory';
  const isDefeat = phase === 'gameover' && snapshot?.outcome === 'defeat';
  const hasNextStage = currentStageIndex < STAGES.length - 1;

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(13, 20, 38, 0.78)' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-status-heading"
    >
      <div className="w-full max-w-md rounded-3xl bg-[#192848] border-3 border-[#fff5e4] p-6 md:p-8 shadow-[0_10px_0_#0f172a] text-[#fffaf0]">
        {phase === 'paused' && (
          <>
            <div className="text-xs font-bold tracking-widest text-[#ffd166] uppercase">
              SHIFT PAUSED · 休憩中
            </div>
            <h2
              id="modal-status-heading"
              className="font-display font-bold text-3xl text-[#fffaf0] mt-1"
            >
              Hot Cocoa Break
            </h2>
            <p className="text-sm text-[#cbd5e1] mt-2">
              Your kei-truck heater is idling warmly. Ready to get back to clearing the village lanes?
            </p>

            <div className="mt-6 flex flex-col gap-3">
              <button
                type="button"
                onClick={onResume}
                className="w-full py-3.5 px-5 rounded-xl bg-[#ff7847] hover:bg-[#ff8c61] text-[#162038] font-display font-bold text-lg border-2 border-[#fffaf0] shadow-[0_4px_0_#0f172a] cursor-pointer whitespace-nowrap shrink-0"
              >
                Resume Shift [Esc]
              </button>
              <button
                type="button"
                onClick={onRestart}
                className="w-full py-3 px-5 rounded-xl bg-[#22355c] hover:bg-[#2b4270] text-[#fffaf0] font-bold text-sm border-2 border-[#fff5e4]/30 cursor-pointer whitespace-nowrap shrink-0"
              >
                Restart Stage
              </button>
              <button
                type="button"
                onClick={onReturnTitle}
                className="w-full py-3 px-5 rounded-xl bg-[#131d33] hover:bg-[#1e2f52] text-[#cbd5e1] font-bold text-sm border border-[#fff5e4]/20 cursor-pointer whitespace-nowrap shrink-0"
              >
                Title Screen
              </button>
            </div>
          </>
        )}

        {phase === 'gameover' && snapshot && (
          <>
            <div className="text-xs font-bold tracking-widest text-[#ffd166] uppercase">
              {isVictory ? 'STAGE CLEAR · 除雪完了' : 'CHILLED OUT · 暖炉切れ'}
            </div>
            <h2
              id="modal-status-heading"
              className="font-display font-bold text-3xl text-[#fffaf0] mt-1"
            >
              {isVictory ? `${snapshot.stageName} Cleared!` : 'Towed Back to the Onsen'}
            </h2>
            <p className="text-sm text-[#cbd5e1] mt-1.5">
              {isVictory
                ? `Village lanes are sparkling clean! Earned +¥${Math.round(snapshot.coinsEarned)} shift bonus.`
                : 'Winter critters chilled your kei-truck boiler. Upgrade your Cocoa Boiler or V-Plow Blade and try again!'}
            </p>

            {/* 3 Tabular-Nums Mastery / Progress Metric Tiles */}
            <div className="grid grid-cols-3 gap-2.5 my-6">
              <div className="rounded-2xl bg-[#131d33] border border-[#fff5e4]/20 p-3 text-center">
                <div className="text-[10px] font-bold text-[#94a3b8] uppercase">
                  SCORE / BEST
                </div>
                <div className="font-mono-tabular font-bold text-lg text-[#fffaf0] mt-1">
                  {Math.round(snapshot.score)}
                </div>
                <div className="font-mono-tabular text-[11px] text-[#ffd166]">
                  Best {Math.round(snapshot.bestScore)}
                </div>
              </div>

              <div className="rounded-2xl bg-[#131d33] border border-[#fff5e4]/20 p-3 text-center">
                <div className="text-[10px] font-bold text-[#94a3b8] uppercase">
                  {isVictory ? 'CLEAR TIME' : 'SNOW CLEARED'}
                </div>
                <div className="font-mono-tabular font-bold text-lg text-[#72efdd] mt-1">
                  {isVictory
                    ? `${Math.round(snapshot.clearTimeSec)}s`
                    : `${Math.round(snapshot.clearedPercent)}%`}
                </div>
                <div className="font-mono-tabular text-[11px] text-[#cbd5e1]">
                  Goal {Math.round(snapshot.targetPercent)}%
                </div>
              </div>

              <div className="rounded-2xl bg-[#131d33] border border-[#fff5e4]/20 p-3 text-center">
                <div className="text-[10px] font-bold text-[#94a3b8] uppercase">
                  MAX COMBO
                </div>
                <div className="font-mono-tabular font-bold text-lg text-[#ff7847] mt-1">
                  {Math.round(snapshot.maxCombo)}
                </div>
                <div className="font-mono-tabular text-[11px] text-[#cbd5e1]">
                  Warmth {Math.round(snapshot.warmthRemaining)}/{Math.round(snapshot.maxWarmth)}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {isVictory && hasNextStage ? (
                <button
                  type="button"
                  data-start="true"
                  onClick={onNextStage}
                  className="w-full py-3.5 px-5 rounded-xl bg-[#ff7847] hover:bg-[#ff8c61] text-[#162038] font-display font-bold text-lg border-2 border-[#fffaf0] shadow-[0_4px_0_#0f172a] cursor-pointer whitespace-nowrap shrink-0"
                >
                  Next Village Stage
                </button>
              ) : (
                <button
                  type="button"
                  data-start="true"
                  onClick={onRestart}
                  className="w-full py-3.5 px-5 rounded-xl bg-[#ff7847] hover:bg-[#ff8c61] text-[#162038] font-display font-bold text-lg border-2 border-[#fffaf0] shadow-[0_4px_0_#0f172a] cursor-pointer whitespace-nowrap shrink-0"
                >
                  {isDefeat ? 'Try Shift Again' : 'Play Stage Again'}
                </button>
              )}

              <button
                type="button"
                onClick={onReturnTitle}
                className="w-full py-3 px-5 rounded-xl bg-[#22355c] hover:bg-[#2b4270] text-[#fffaf0] font-bold text-sm border border-[#fff5e4]/25 cursor-pointer whitespace-nowrap shrink-0"
              >
                Title Screen
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
