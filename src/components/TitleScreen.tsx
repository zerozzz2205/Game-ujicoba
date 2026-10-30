import React from 'react';
import { STAGES } from '../game/rules';

interface TitleScreenProps {
  selectedStage: number;
  highestReachedStage: number;
  bestScore: number;
  isMuted: boolean;
  onSelectStage: (idx: number) => void;
  onStartGame: () => void;
  onToggleMute: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  selectedStage,
  highestReachedStage,
  bestScore,
  isMuted,
  onSelectStage,
  onStartGame,
  onToggleMute,
}) => {
  const activeStage = STAGES[selectedStage] || STAGES[0];

  return (
    <div
      className="fixed inset-0 z-20 pointer-events-none flex flex-col justify-between p-6 md:p-10"
      style={{
        background:
          'linear-gradient(95deg, rgba(16, 24, 48, 0.86) 0%, rgba(16, 24, 48, 0.52) 42%, rgba(16, 24, 48, 0.0) 74%)',
      }}
    >
      {/* Top Row: Quiet Japanese Stamp Kicker & Mute Toggle */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3 text-xs font-semibold tracking-wider text-[#ffd166]">
          <span>雪国軽トラ除雪便</span>
          <span aria-hidden="true">·</span>
          <span>HOKKAIDO WINTER EXPRESS</span>
          {bestScore > 0 && (
            <>
              <span aria-hidden="true">·</span>
              <span className="font-mono-tabular text-[#fffaf0]">
                BEST {Math.round(bestScore)}
              </span>
            </>
          )}
        </div>

        <button
          type="button"
          tabIndex={-1}
          aria-label={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          onClick={(e) => {
            e.currentTarget.blur();
            onToggleMute();
          }}
          className="pointer-events-auto w-11 h-11 rounded-xl bg-[#162038] border-2 border-[#fff5e4]/30 text-[#fffaf0] hover:border-[#ffd166] flex items-center justify-center transition-transform active:scale-95 shadow-lg"
        >
          {isMuted ? (
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M11 5L6 9H2v6h4l5 4V5z" fill="#ff7847" />
              <path d="M22 9l-6 6M16 9l6 6" strokeLinecap="round" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M11 5L6 9H2v6h4l5 4V5z" fill="#ffd166" />
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14" strokeLinecap="round" />
            </svg>
          )}
        </button>
      </div>

      {/* Left-Third Negative Space Focal Lockup */}
      <div className="max-w-lg my-auto py-4">
        {/* Bespoke Inline SVG Title Emblem Lockup */}
        <svg
          viewBox="0 0 500 165"
          className="w-full max-w-[460px] h-auto drop-shadow-[0_8px_0_rgba(15,23,42,0.95)]"
          role="img"
          aria-label="YukiPlow: Cozy Winter Express"
        >
          {/* Decorative wooden Ryokan crest plaque */}
          <rect
            x="6"
            y="10"
            width="488"
            height="144"
            rx="24"
            fill="#192848"
            stroke="#fff5e4"
            strokeWidth="4"
          />
          <rect
            x="14"
            y="18"
            width="472"
            height="128"
            rx="18"
            fill="#22355c"
            stroke="#ff9f1c"
            strokeWidth="2"
            strokeDasharray="8 6"
          />

          {/* V-Plow & Snowflake Crest Icon on Left */}
          <g transform="translate(34, 34)">
            <circle cx="48" cy="48" r="42" fill="#ff7847" stroke="#162038" strokeWidth="4" />
            <path
              d="M22 60 L48 38 L74 60 L68 74 L48 58 L28 74 Z"
              fill="#ffd166"
              stroke="#162038"
              strokeWidth="3.5"
              strokeLinejoin="round"
            />
            <circle cx="48" cy="26" r="7" fill="#fffaf0" />
            <circle cx="31" cy="34" r="4" fill="#fffaf0" />
            <circle cx="65" cy="34" r="4" fill="#fffaf0" />
          </g>

          {/* Main Display Lettering */}
          <text
            x="140"
            y="84"
            fontFamily="Fredoka, Plus Jakarta Sans, sans-serif"
            fontWeight="700"
            fontSize="58"
            fill="#fffaf0"
            stroke="#162038"
            strokeWidth="8"
            paintOrder="stroke fill"
            letterSpacing="1"
          >
            YUKI PLOW
          </text>
          <text
            x="143"
            y="122"
            fontFamily="Plus Jakarta Sans, sans-serif"
            fontWeight="700"
            fontSize="19"
            fill="#ffd166"
            stroke="#162038"
            strokeWidth="4"
            paintOrder="stroke fill"
            letterSpacing="3.5"
          >
            COZY WINTER KEI-TRUCK
          </text>
        </svg>

        <p className="mt-4 text-sm md:text-base text-[#e2e8f0] max-w-md leading-relaxed font-medium">
          {activeStage.subtitle}
        </p>

        {/* Stage Selection Tabs (Interactive controls, locks unreached stages) */}
        <div className="mt-5 pointer-events-auto">
          <div className="text-xs font-semibold text-[#94a3b8] mb-2">
            SELECT VILLAGE SHIFT · ステージ選択
          </div>
          <div className="flex flex-wrap gap-2">
            {STAGES.map((st) => {
              const unlocked = st.index <= highestReachedStage;
              const isSelected = st.index === selectedStage;
              return (
                <button
                  key={st.id}
                  type="button"
                  disabled={!unlocked}
                  onClick={(e) => {
                    e.currentTarget.blur();
                    onSelectStage(st.index);
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 border-2 ${
                    isSelected
                      ? 'bg-[#ffd166] text-[#162038] border-[#fffaf0] shadow-[0_4px_0_#162038]'
                      : unlocked
                        ? 'bg-[#1e2f52] text-[#fffaf0] border-[#475569] hover:border-[#ffd166]'
                        : 'bg-[#131d33]/70 text-[#64748b] border-[#334155]/50 cursor-not-allowed'
                  }`}
                >
                  {st.index + 1}. {st.name} {!unlocked ? ' (Locked)' : ''}
                </button>
              );
            })}
          </div>
        </div>

        {/* Primary Start Action CTA */}
        <div className="mt-6 flex items-center gap-4 pointer-events-auto">
          <button
            type="button"
            data-start="true"
            onClick={(e) => {
              e.currentTarget.blur();
              onStartGame();
            }}
            className="px-8 py-4 rounded-2xl bg-[#ff7847] hover:bg-[#ff8c61] text-[#162038] font-display font-bold text-xl tracking-wide border-2 border-[#fffaf0] shadow-[0_6px_0_#162038] active:translate-y-1 active:shadow-[0_2px_0_#162038] transition-all cursor-pointer whitespace-nowrap shrink-0"
          >
            Start Plowing Shift
          </button>
        </div>
      </div>

      {/* Single Flat Borderless Control-Hint Line in Bottom Safe Margin */}
      <div className="text-xs md:text-sm font-medium text-[#cbd5e1] tracking-wide">
        WASD / Arrows Drive · Space Boost Plow · Click-Drag Steer · 1–4 Upgrades · Esc Pause
      </div>
    </div>
  );
};
