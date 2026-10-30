/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useState } from 'react';
import {
  purchaseUpgrade,
  STAGES,
  UPGRADE_SPECS,
  type CameraPreset,
  type GamePhase,
  type OutcomeType,
  type RunSnapshot,
  type UpgradeLevels,
} from './game/rules';
import { synthAudio } from './game/audio';
import { SnowPlowCanvas, type HudTelemetry } from './components/SnowPlowCanvas';
import { TitleScreen } from './components/TitleScreen';
import { GameHud } from './components/GameHud';
import { StatusModal } from './components/StatusModal';

export default function App() {
  // Check ?autostart=1 query parameter on boot
  const [phase, setPhase] = useState<GamePhase>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('autostart') === '1') {
        return 'playing';
      }
    }
    return 'title';
  });

  const [stageIndex, setStageIndex] = useState<number>(0);
  const [highestReachedStage, setHighestReachedStage] = useState<number>(0);
  const [coins, setCoins] = useState<number>(60); // Seeded starting Yen so players can immediately test an upgrade
  const [bestScore, setBestScore] = useState<number>(0);
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('isometric');
  const [dockCollapsed, setDockCollapsed] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [resetSignal, setResetSignal] = useState<number>(0);
  const [runSnapshot, setRunSnapshot] = useState<RunSnapshot | null>(null);

  const [upgradeLevels, setUpgradeLevels] = useState<UpgradeLevels>({
    blade: 1,
    engine: 1,
    heater: 1,
    magnet: 1,
  });

  const [hud, setHud] = useState<HudTelemetry>({
    score: 0,
    bestScore: 0,
    coins: 60,
    clearedPercent: 0,
    targetPercent: STAGES[0].targetClearPercent,
    comboCount: 0,
    comboMultiplier: 1,
    comboTimerRatio: 0,
    warmthPips: 3,
    maxWarmthPips: 3,
    damagedFlash: false,
    boostEnergyRatio: 1,
    isBoosting: false,
    stageIndex: 0,
    stageName: STAGES[0].name,
    stageJpName: STAGES[0].jpName,
    speedKmh: 0,
    activeCritterWarning: null,
  });

  // Sync game state machine to document.body.dataset.state
  useEffect(() => {
    document.body.dataset.state = phase;
    if (phase === 'paused' || phase === 'gameover' || phase === 'title') {
      document.exitPointerLock?.();
    }
  }, [phase]);

  const handlePhaseChange = useCallback(
    (nextPhase: GamePhase, outcome?: OutcomeType, snapshot?: RunSnapshot) => {
      if (snapshot) {
        setRunSnapshot(snapshot);
        setBestScore((prev) => Math.max(prev, snapshot.score));
        if (outcome === 'victory') {
          setHighestReachedStage((prev) =>
            Math.min(STAGES.length - 1, Math.max(prev, snapshot.stageIndex + 1)),
          );
        }
      }
      setPhase(nextPhase);
    },
    [],
  );

  const handleStartGame = useCallback(() => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    setRunSnapshot(null);
    setResetSignal((n) => n + 1);
    setPhase('playing');
  }, []);

  const handleRestartStage = useCallback(() => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    setRunSnapshot(null);
    setResetSignal((n) => n + 1);
    setPhase('playing');
  }, []);

  const handleNextStage = useCallback(() => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    const nextIdx = Math.min(STAGES.length - 1, stageIndex + 1);
    setStageIndex(nextIdx);
    setRunSnapshot(null);
    setResetSignal((n) => n + 1);
    setPhase('playing');
  }, [stageIndex]);

  const handleReturnTitle = useCallback(() => {
    setRunSnapshot(null);
    setPhase('title');
  }, []);

  const handlePurchaseUpgrade = useCallback(
    (id: keyof UpgradeLevels) => {
      const res = purchaseUpgrade(id, upgradeLevels, coins);
      if (res.purchased) {
        setUpgradeLevels(res.levels);
        setCoins(res.coins);
        synthAudio.playUpgradePurchase();
      }
    },
    [upgradeLevels, coins],
  );

  const handleQuickUpgradeKey = useCallback(
    (slotIndex: number) => {
      const spec = UPGRADE_SPECS[slotIndex];
      if (spec) {
        handlePurchaseUpgrade(spec.id);
      }
    },
    [handlePurchaseUpgrade],
  );

  const handleToggleMute = useCallback(() => {
    const nextMuted = synthAudio.toggleMute();
    setIsMuted(nextMuted);
  }, []);

  const handleToggleDock = useCallback(() => {
    setDockCollapsed((prev) => !prev);
  }, []);

  return (
    <main className="relative w-full h-full overflow-hidden select-none">
      {/* Isolated Three.js WebGL Viewport Container */}
      <SnowPlowCanvas
        phase={phase}
        stageIndex={stageIndex}
        upgradeLevels={upgradeLevels}
        coins={coins}
        bestScore={bestScore}
        cameraPreset={cameraPreset}
        resetSignal={resetSignal}
        onPhaseChange={handlePhaseChange}
        onCoinsChange={setCoins}
        onHudUpdate={setHud}
        onQuickUpgradeKey={handleQuickUpgradeKey}
        onToggleDockKey={handleToggleDock}
        onToggleMuteKey={handleToggleMute}
      />

      {/* Title Screen Overlay */}
      {phase === 'title' && (
        <TitleScreen
          selectedStage={stageIndex}
          highestReachedStage={highestReachedStage}
          bestScore={bestScore}
          isMuted={isMuted}
          onSelectStage={setStageIndex}
          onStartGame={handleStartGame}
          onToggleMute={handleToggleMute}
        />
      )}

      {/* Active Gameplay HUD & Collapsible Bottom Upgrade Dock */}
      {(phase === 'playing' || phase === 'paused') && (
        <GameHud
          hud={{ ...hud, coins }}
          upgradeLevels={upgradeLevels}
          cameraPreset={cameraPreset}
          dockCollapsed={dockCollapsed}
          isMuted={isMuted}
          onPurchaseUpgrade={handlePurchaseUpgrade}
          onSelectCameraPreset={setCameraPreset}
          onToggleDock={handleToggleDock}
          onToggleMute={handleToggleMute}
          onPause={() => setPhase('paused')}
          onRestart={handleRestartStage}
        />
      )}

      {/* Focused Status Modal for Pause, Victory, or Defeat */}
      <StatusModal
        phase={phase}
        snapshot={runSnapshot}
        currentStageIndex={stageIndex}
        onResume={() => setPhase('playing')}
        onRestart={handleRestartStage}
        onNextStage={handleNextStage}
        onReturnTitle={handleReturnTitle}
      />
    </main>
  );
}
