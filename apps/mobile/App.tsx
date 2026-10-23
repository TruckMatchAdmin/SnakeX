/**
 * Application Mobile SnakeX (React Native / Expo)
 * Grow. Fight. Dominate.
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { useOrientation } from './src/hooks/useOrientation';
import { useGameSocket } from './src/hooks/useGameSocket';
import { GameCanvas } from './src/components/GameCanvas';
import { TouchController } from './src/components/TouchController';
import { HUD } from './src/components/HUD';
import { DeathModal } from './src/components/DeathModal';
import { AuthModal } from './src/components/AuthModal';
import { LobbyScreen } from './src/components/LobbyScreen';
import { COLORS } from './src/theme/colors';
import { SNAKE_SKINS } from '@snakex/shared';

export default function App() {
  const { width, height, isLandscape } = useOrientation();
  const [inGame, setInGame] = useState(false);
  const [playerName, setPlayerName] = useState('SnakeMaster');
  const [selectedSkinId, setSelectedSkinId] = useState('neon_viper');
  const [authToken, setAuthToken] = useState<string | undefined>(undefined);
  const [currentUser, setCurrentUser] = useState<{ id: string; username: string } | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isBoosting, setIsBoosting] = useState(false);

  const {
    isConnected,
    myPlayerId,
    players,
    snapshotsRef,
    inputRef,
    latencyRef,
    orbsMapRef,
    leaderboard,
    deathStats,
    latencyMs,
    serverNotification,
    joinGame,
    sendInput,
    respawn,
    resetDeath,
    reconnect,
  } = useGameSocket();

  // Joueur local
  const mySnake = players.find((p) => p.id === myPlayerId);
  const selectedSkin = SNAKE_SKINS.find((s) => s.id === selectedSkinId) || SNAKE_SKINS[0];

  const handleStartGame = () => {
    const finalName = playerName.trim() || 'Snake_Player';
    joinGame(finalName, authToken);
    setInGame(true);
  };

  const handleAngleChange = (angle: number) => {
    sendInput(angle, inputRef.current.boost);
  };

  const handleBoostChange = (boosting: boolean) => {
    setIsBoosting(boosting);
    const angle = inputRef.current.angle ?? mySnake?.angle;
    if (angle !== undefined) {
      sendInput(angle, boosting);
    }
  };

  const handleAuthenticated = (id: string, username: string, token: string) => {
    setCurrentUser({ id, username });
    setPlayerName(username);
    setAuthToken(token);
    setShowAuthModal(false);
  };

  return (
    <View style={styles.container}>
      <StatusBar hidden={true} />

      {inGame ? (
        <View style={styles.gameContainer}>
          {/* 1. Moteur de rendu arène 2D Ultra-Fluide */}
          <GameCanvas
            width={width}
            height={height}
            myPlayerId={myPlayerId}
            snapshotsRef={snapshotsRef}
            inputRef={inputRef}
            latencyRef={latencyRef}
            orbsMapRef={orbsMapRef}
            leaderboard={leaderboard}
            localColors={selectedSkin}
          />

          {/* 2. Interface tête haute (HUD) */}
          <HUD
            score={mySnake?.score || 0}
            length={mySnake?.body.length || 0}
            kills={leaderboard.find((l) => l.id === myPlayerId)?.kills || 0}
            leaderboard={leaderboard}
            myPlayerId={myPlayerId}
            latencyMs={latencyMs}
            isConnected={isConnected}
            isLandscape={isLandscape}
            notification={serverNotification}
            players={players}
          />

          {/* 3. Contrôles tactiles (visée à l'écran & boost) */}
          <TouchController
            onAngleChange={handleAngleChange}
            onBoostChange={handleBoostChange}
            isBoosting={isBoosting}
          />

          {/* 4. Écran de défaite */}
          {deathStats && (
            <DeathModal
              stats={deathStats}
              onRespawn={() => respawn()}
              onExitMenu={() => {
                resetDeath();
                setInGame(false);
              }}
            />
          )}
        </View>
      ) : (
        /* MENU PRINCIPAL ÉPURÉ & PARFAITEMENT ENCADRÉ */
        <LobbyScreen
          playerName={playerName}
          setPlayerName={setPlayerName}
          selectedSkinId={selectedSkinId}
          setSelectedSkinId={setSelectedSkinId}
          onStartGame={handleStartGame}
          isConnected={isConnected}
          latencyMs={latencyMs}
          currentUser={currentUser}
          onOpenAuth={() => setShowAuthModal(true)}
          isLandscape={isLandscape}
        />
      )}

      {/* Modal Supabase Auth */}
      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onAuthenticated={handleAuthenticated}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#040711',
  },
  gameContainer: {
    flex: 1,
    position: 'relative',
    backgroundColor: COLORS.BACKGROUND,
  },
});
