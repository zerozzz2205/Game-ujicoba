import React from 'react';
import {
  canPurchaseUpgrade,
  getUpgradeCost,
  UPGRADE_SPECS,
  type CameraPreset,
  type UpgradeLevels,
} from '../game/rules';
import type { HudTelemetry } from './SnowPlowCanvas';

interface GameHudProps {
  hud: HudTelemetry;
  upgradeLevels: UpgradeLevels;
  cameraPreset: CameraPreset;
  dockCollapsed: boolean;
  isMuted: boolean;
  onPurchaseUpgrade: (id: keyof UpgradeLevels) => void;
  onSelectCameraPreset: (preset: CameraPreset) => void;
  onToggleDock: () => void;
  onToggleMute: () => void;
  onPause: () => void;
  onRestart: () => void;
}

/**
 * Custom SVG Warmth Vitality Socket Pip with 3 readable states:
 * 'full' | 'cracked' | 'empty'
 */
const WarmthPipIcon: React.FC<{ state: 'full' | 'cracked' | 'empty' }> = ({ state }) => {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6 shrink-0" aria-hidden="true">
      {/* Dark Outer Silhouette */}
      <path
        d="M12 21.5C12 21.5 4 16.2 4 9.8C4 6.4 6.6 4 9.5 4C11.1 4 12 5 12 5C12 5 12.9 4 14.5 4C17.4 4 20 6.4 20 9.8C20 16.2 12 21.5 12 21.5Z"
        fill="#162038"
        stroke="#162038"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      {state === 'full' && (
        <>
          <path
            d="M12 20.5C12 20.5 5 15.6 5 9.8C5 7 7.1 5 9.5 5C11 5 12 6.2 12 6.2C12 6.2 13 5 14.5 5C16.9 5 19 7 19 9.8C19 15.6 12 20.5 12 20.5Z"
            fill="#ff5d5d"
          />
          <path
            d="M7.5 8.5C7.5 7.2 8.5 6.4 9.6 6.4"
            stroke="#fff5e4"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </>
      )}
      {state === 'cracked' && (
        <>
          <path
            d="M12 20.5C12 20.5 5 15.6 5 9.8C5 7 7.1 5 9.5 5C11 5 12 6.2 12 6.2C12 6.2 13 5 14.5 5C16.9 5 19 7 19 9.8C19 15.6 12 20.5 12 20.5Z"
            fill="#f59e0b"
          />
          <path
            d="M12 6L10 11L13.5 13.5L11 19"
            stroke="#162038"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      )}
      {state === 'empty' && (
        <path
          d="M12 19.5C12 19.5 6 15 6 9.8C6 7.5 7.6 6 9.5 6C10.8 6 12 7.2 12 7.2C12 7.2 13.2 6 14.5 6C16.4 6 18 7.5 18 9.8C18 15 12 19.5 12 19.5Z"
          fill="#263554"
          stroke="#475569"
          strokeWidth="1.2"
        />
      )}
    </svg>
  );
};

export const GameHud: React.FC<GameHudProps> = ({
  hud,
  upgradeLevels,
  cameraPreset,
  dockCollapsed,
  isMuted,
  onPurchaseUpgrade,
  onSelectCameraPreset,
  onToggleDock,
  onToggleMute,
  onPause,
  onRestart,
}) => {
  const pips = Array.from({ length: hud.maxWarmthPips }, (_, i) => {
    if (i < hud.warmthPips) {
      if (hud.damagedFlash && i === hud.warmthPips - 1) return 'cracked';
      return 'full';
    }
    return 'empty';
  });

  const clearanceProgressRatio = Math.min(
    1,
    hud.targetPercent > 0 ? hud.clearedPercent / hud.targetPercent : 0,
  );

  return (
    <div className="fixed inset-0 z-10 pointer-events-none flex flex-col justify-between p-4 md:p-6">
      {/* Subtle low-warmth peripheral frost vignette when down to 1 pip */}
      {hud.warmthPips <= 1 && (
        <div
          className="fixed inset-0 pointer-events-none"
          style={{
            boxShadow: 'inset 0 0 90px rgba(56, 189, 248, 0.45)',
          }}
        />
      )}

      {/* TOP PERIMETER BAR: Left Status Cluster | Center Score & Combo | Right Utility Icons */}
      <div className="flex items-start justify-between gap-4">
        {/* Top-Left Cluster: Warmth Vitality Pips, Snow Clearance Goal, and Yen Coins */}
        <div
          className="rounded-2xl px-4 py-3 border-2 border-[#fff5e4]/25 shadow-[0_6px_0_#0f172a]"
          style={{ backgroundColor: 'rgba(22, 32, 56, 0.92)' }}
        >
          <div className="flex items-center gap-4">
            {/* Discrete Warmth Vitality Sockets */}
            <div>
              <div className="text-[10px] font-bold tracking-wider text-[#cbd5e1] uppercase">
                WARMTH HULL
              </div>
              <div
                className="flex items-center gap-1 mt-0.5"
                aria-label={`Warmth Hull: ${hud.warmthPips} of ${hud.maxWarmthPips}`}
              >
                {pips.map((st, idx) => (
                  <WarmthPipIcon key={idx} state={st} />
                ))}
              </div>
            </div>

            <div className="h-8 w-[1px] bg-[#fff5e4]/15" />

            {/* Yen Coins Readout */}
            <div>
              <div className="text-[10px] font-bold tracking-wider text-[#ffd166] uppercase">
                YEN COINS
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" aria-hidden="true">
                  <ellipse
                    cx="12"
                    cy="12"
                    rx="8"
                    ry="10"
                    fill="#ffd166"
                    stroke="#162038"
                    strokeWidth="2.5"
                  />
                  <rect x="9" y="8" width="6" height="8" rx="1" fill="#162038" />
                </svg>
                <span
                  data-testid="hud-coins"
                  className="font-mono-tabular font-bold text-xl text-[#fffaf0] hud-stroke-sm"
                >
                  ¥{Math.round(hud.coins)}
                </span>
              </div>
            </div>
          </div>

          {/* Snow Clearance Goal Bar */}
          <div className="mt-2.5">
            <div className="flex items-center justify-between gap-4 text-[11px] font-bold">
              <span className="text-[#94a3b8] uppercase tracking-wider whitespace-nowrap">
                {hud.stageName}
              </span>
              <span
                data-testid="hud-clearance"
                className="font-mono-tabular text-[#72efdd] whitespace-nowrap shrink-0"
              >
                {Math.round(hud.clearedPercent)}% / {Math.round(hud.targetPercent)}%
              </span>
            </div>
            <div className="w-60 h-2.5 rounded-full bg-[#0f172a] border border-[#fff5e4]/20 overflow-hidden mt-1">
              <div
                className="h-full bg-[#72efdd] transition-transform duration-150 origin-left"
                style={{ transform: `scaleX(${clearanceProgressRatio})` }}
              />
            </div>
          </div>
        </div>

        {/* Top-Center Cluster: Hero Score & Combo Multiplier (~3:1 Hero-to-Kicker hierarchy) */}
        <div className="flex flex-col items-center text-center">
          <div
            className="rounded-2xl px-6 py-2.5 border-2 border-[#fff5e4]/25 shadow-[0_6px_0_#0f172a] flex items-center gap-6"
            style={{ backgroundColor: 'rgba(22, 32, 56, 0.92)' }}
          >
            <div>
              <div className="text-[10px] font-bold tracking-widest text-[#94a3b8] uppercase">
                SCORE
              </div>
              <div
                data-testid="hud-score"
                className="font-mono-tabular font-bold text-3xl text-[#fffaf0] hud-stroke leading-none mt-0.5"
              >
                {Math.round(hud.score)}
              </div>
            </div>

            <div className="h-9 w-[1px] bg-[#fff5e4]/15" />

            <div>
              <div className="text-[10px] font-bold tracking-widest text-[#ffd166] uppercase">
                COMBO CHAIN
              </div>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span
                  data-testid="hud-multiplier"
                  className="font-display font-bold text-3xl text-[#ff7847] hud-stroke leading-none tabular-nums"
                >
                  {Math.round(hud.comboMultiplier)}x
                </span>
                <span className="font-mono-tabular text-xs font-semibold text-[#cbd5e1]">
                  ({Math.round(hud.comboCount)} tiles)
                </span>
              </div>
              {/* Fast-depleting combo chain timer bar */}
              <div className="w-28 h-1.5 bg-[#0f172a] rounded-full overflow-hidden mt-1">
                <div
                  className="h-full bg-[#ffd166] origin-left transition-transform duration-75"
                  style={{
                    transform: `scaleX(${Math.max(0, Math.min(1, hud.comboTimerRatio))})`,
                  }}
                />
              </div>
            </div>

            <div className="h-9 w-[1px] bg-[#fff5e4]/15 hidden sm:block" />

            {/* Cocoa Heater Boost Tank Gauge */}
            <div className="hidden sm:block">
              <div className="flex items-center justify-between gap-2 text-[10px] font-bold tracking-wider uppercase">
                <span className="text-[#ff9f1c]">BOOST [SPACE]</span>
                <span className="font-mono-tabular text-[#fffaf0]">
                  {Math.round(hud.speedKmh)} km/h
                </span>
              </div>
              <div className="w-28 h-2.5 bg-[#0f172a] rounded-full border border-[#fff5e4]/20 overflow-hidden mt-1.5">
                <div
                  className="h-full bg-[#ff7847] origin-left transition-transform duration-75"
                  style={{
                    transform: `scaleX(${Math.max(0, Math.min(1, hud.boostEnergyRatio))})`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Telegraphed Critter Windup Alert Banner */}
          {hud.activeCritterWarning && (
            <div
              className="mt-2 px-4 py-1 rounded-xl border-2 border-[#ff4d6d] text-xs font-bold text-[#fffaf0] shadow-md"
              style={{ backgroundColor: 'rgba(153, 27, 27, 0.92)' }}
            >
              ! {hud.activeCritterWarning}
            </div>
          )}
        </div>

        {/* Top-Right Utility Controls: Mute [M], Restart [R], Pause [P] */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            type="button"
            tabIndex={-1}
            aria-label={isMuted ? 'Unmute Audio [M]' : 'Mute Audio [M]'}
            title="Mute / Unmute Audio [M]"
            onClick={(e) => {
              e.currentTarget.blur();
              onToggleMute();
            }}
            className="w-11 h-11 rounded-xl bg-[#162038] border-2 border-[#fff5e4]/30 hover:border-[#ffd166] text-[#fffaf0] flex items-center justify-center shadow-[0_4px_0_#0f172a] active:translate-y-0.5 cursor-pointer"
          >
            {isMuted ? (
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M11 5L6 9H2v6h4l5 4V5z" fill="#ff7847" />
                <path d="M22 9l-6 6M16 9l6 6" strokeLinecap="round" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M11 5L6 9H2v6h4l5 4V5z" fill="#ffd166" />
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" strokeLinecap="round" />
              </svg>
            )}
          </button>

          <button
            type="button"
            tabIndex={-1}
            aria-label="Restart Stage [R]"
            title="Restart Stage [R]"
            onClick={(e) => {
              e.currentTarget.blur();
              onRestart();
            }}
            className="w-11 h-11 rounded-xl bg-[#162038] border-2 border-[#fff5e4]/30 hover:border-[#ffd166] text-[#fffaf0] flex items-center justify-center shadow-[0_4px_0_#0f172a] active:translate-y-0.5 cursor-pointer"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M3 12a9 9 0 1 0 3-6.7L3 8" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M3 3v5h5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <button
            type="button"
            tabIndex={-1}
            aria-label="Pause Game [P]"
            title="Pause Game [P / Esc]"
            onClick={(e) => {
              e.currentTarget.blur();
              onPause();
            }}
            className="w-11 h-11 rounded-xl bg-[#162038] border-2 border-[#fff5e4]/30 hover:border-[#ffd166] text-[#fffaf0] flex items-center justify-center shadow-[0_4px_0_#0f172a] active:translate-y-0.5 cursor-pointer"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
              <rect x="6" y="5" width="4" height="14" rx="1.2" />
              <rect x="14" y="5" width="4" height="14" rx="1.2" />
            </svg>
          </button>
        </div>
      </div>

      {/* UNIFIED COLLAPSIBLE BOTTOM CONTROL DOCK (Pinned Bottom Center, Zero Side-Panel Clutter) */}
      <div className="mx-auto w-full max-w-[1060px] flex flex-col items-center pointer-events-auto">
        <button
          type="button"
          tabIndex={-1}
          onClick={(e) => {
            e.currentTarget.blur();
            onToggleDock();
          }}
          className="px-4 py-1 rounded-t-xl bg-[#162038] border-t-2 border-x-2 border-[#fff5e4]/30 text-[11px] font-bold text-[#cbd5e1] hover:text-[#ffd166] cursor-pointer whitespace-nowrap shrink-0"
        >
          {dockCollapsed ? '▴ Show Garage & Camera Dock [H]' : '▾ Hide Controls [H]'}
        </button>

        {!dockCollapsed && (
          <div
            className="w-full rounded-2xl p-3 border-2 border-[#fff5e4]/30 shadow-[0_8px_0_#0f172a] flex flex-col lg:flex-row items-center justify-between gap-3"
            style={{ backgroundColor: 'rgba(22, 32, 56, 0.94)' }}
          >
            {/* 4 Kei-Truck Live Upgrade Slots with Cost, Key Binding, Level Pips, and Role Clue */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full">
              {UPGRADE_SPECS.map((spec) => {
                const lvl = upgradeLevels[spec.id];
                const isMax = lvl >= spec.maxLevel;
                const cost = getUpgradeCost(spec.id, lvl);
                const affordable = canPurchaseUpgrade(spec.id, upgradeLevels, hud.coins);

                return (
                  <button
                    key={spec.id}
                    type="button"
                    tabIndex={-1}
                    disabled={!affordable}
                    onClick={(e) => {
                      e.currentTarget.blur();
                      onPurchaseUpgrade(spec.id);
                    }}
                    className={`text-left rounded-xl px-3.5 py-2 border-2 transition-all cursor-pointer ${
                      affordable
                        ? 'bg-[#22355c] border-[#ffd166] hover:bg-[#2b4270] text-[#fffaf0]'
                        : 'bg-[#152039] border-[#334155] text-[#94a3b8] opacity-85 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-[#fffaf0] whitespace-nowrap">
                        [{spec.keyHint}] {spec.name}
                      </span>
                      <span className="font-mono-tabular text-xs font-bold text-[#ffd166] whitespace-nowrap shrink-0">
                        {isMax ? 'MAX' : `¥${cost}`}
                      </span>
                    </div>
                    <div className="text-[10px] text-[#cbd5e1] truncate mt-0.5">
                      {spec.roleClue}
                    </div>
                    {/* Level indicator pips */}
                    <div className="flex items-center gap-1 mt-1.5">
                      {Array.from({ length: spec.maxLevel }, (_, idx) => (
                        <span
                          key={idx}
                          className={`h-1.5 flex-1 rounded-full ${
                            idx < lvl ? 'bg-[#72efdd]' : 'bg-[#0f172a]'
                          }`}
                        />
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Camera Angle Switcher */}
            <div className="flex items-center gap-1 bg-[#0f172a] p-1 rounded-xl border border-[#fff5e4]/15 shrink-0">
              {(['isometric', 'chase', 'overview'] as CameraPreset[]).map((preset) => (
                <button
                  key={preset}
                  type="button"
                  tabIndex={-1}
                  onClick={(e) => {
                    e.currentTarget.blur();
                    onSelectCameraPreset(preset);
                  }}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold capitalize transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    cameraPreset === preset
                      ? 'bg-[#ff7847] text-[#162038]'
                      : 'text-[#cbd5e1] hover:text-[#fffaf0]'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
