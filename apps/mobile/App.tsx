/**
 * Application Mobile SnakeX (React Native / Expo)
 * Grow. Fight. Dominate.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useOrientation } from './src/hooks/useOrientation';
import { useGameSocket } from './src/hooks/useGameSocket';
import { GameCanvas } from './src/components/GameCanvas';
import { TouchController } from './src/components/TouchController';
import { HUD } from './src/components/HUD';
import { DeathModal } from './src/components/DeathModal';
import { AuthModal } from './src/components/AuthModal';
import { COLORS } from './src/theme/colors';

export default function App() {
  const { width, height, isLandscape } = useOrientation();
  const [inGame, setInGame] = useState(false);
  const [playerName, setPlayerName] = useState('SnakeMaster');
  const [authToken, setAuthToken] = useState<string | undefined>(undefined);
  const [currentUser, setCurrentUser] = useState<{ id: string; username: string } | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isBoosting, setIsBoosting] = useState(false);

  const {
    isConnected,
    myPlayerId,
    players,
    orbs,
    leaderboard,
    deathStats,
    latencyMs,
    serverNotification,
    joinGame,
    sendInput,
    respawn,
    reconnect,
  } = useGameSocket();

  // Joueur local
  const mySnake = players.find((p) => p.id === myPlayerId);

  const handleStartGame = () => {
    const finalName = playerName.trim() || 'Snake_Player';
    joinGame(finalName, authToken);
    setInGame(true);
  };

  const handleAngleChange = (angle: number) => {
    sendInput(angle, isBoosting);
  };

  const handleBoostChange = (boosting: boolean) => {
    setIsBoosting(boosting);
    if (mySnake) {
      sendInput(mySnake.angle, boosting);
    }
  };

  const handleAuthenticated = (id: string, username: string, token: string) => {
    setCurrentUser({ id, username });
    setPlayerName(username);
    setAuthToken(token);
    setShowAuthModal(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />

      {inGame ? (
        <View style={styles.gameContainer}>
          {/* 1. Moteur de rendu arène 2D */}
          <GameCanvas
            width={width}
            height={height}
            myPlayerId={myPlayerId}
            players={players}
            orbs={orbs}
          />

          {/* 2. Interface tête haute (HUD) : en dessous des contrôles pour ne jamais bloquer les touches */}
          <HUD
            score={mySnake?.score || 0}
            length={mySnake?.body.length || 0}
            kills={0}
            leaderboard={leaderboard}
            myPlayerId={myPlayerId}
            latencyMs={latencyMs}
            isConnected={isConnected}
            isLandscape={isLandscape}
            notification={serverNotification}
          />

          {/* 3. Contrôles tactiles (visée à l'écran & boost) : au-dessus du HUD */}
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
              onExitMenu={() => setInGame(false)}
            />
          )}
        </View>
      ) : (
        /* MENU PRINCIPAL / LOBBY */
        <View style={[styles.lobbyContainer, isLandscape && styles.lobbyLandscape]}>
          <View style={styles.brandingBox}>
            <Image
              source={require('./assets/logo.png')}
              style={[styles.logoImage, isLandscape && styles.logoLandscape]}
              resizeMode="contain"
            />
            <Text style={styles.slogan}>GROW. FIGHT. DOMINATE.</Text>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.inputLabel}>VOTRE PSEUDONYME :</Text>
            <TextInput
              style={styles.nameInput}
              value={playerName}
              onChangeText={setPlayerName}
              placeholder="Entrez votre pseudo"
              placeholderTextColor={COLORS.TEXT_MUTED}
              maxLength={16}
            />

            <TouchableOpacity
              style={styles.playButton}
              activeOpacity={0.8}
              onPress={handleStartGame}
            >
              <Text style={styles.playButtonText}>🎮 JOUER MAINTENANT</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.authButton}
              activeOpacity={0.8}
              onPress={() => setShowAuthModal(true)}
            >
              <Text style={styles.authButtonText}>
                {currentUser ? `👤 ${currentUser.username} (Connecté)` : '🔐 Connexion / Inscription Supabase'}
              </Text>
            </TouchableOpacity>

            <View style={styles.serverStatusRow}>
              <View
                style={[
                  styles.statusIndicator,
                  { backgroundColor: isConnected ? COLORS.PRIMARY_NEON : COLORS.DANGER },
                ]}
              />
              <Text style={styles.serverStatusText}>
                {isConnected ? 'Serveur OVH En Ligne' : 'Connexion au VPS en cours...'}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Modal Supabase Auth */}
      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onAuthenticated={handleAuthenticated}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  gameContainer: {
    flex: 1,
    position: 'relative',
    backgroundColor: COLORS.BACKGROUND,
  },
  lobbyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  lobbyLandscape: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  brandingBox: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoImage: {
    width: 240,
    height: 180,
  },
  logoLandscape: {
    width: 220,
    height: 150,
  },
  slogan: {
    color: COLORS.SECONDARY_CYAN,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 3,
    marginTop: 8,
  },
  formCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: COLORS.SURFACE,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  inputLabel: {
    color: COLORS.TEXT_MUTED,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 8,
  },
  nameInput: {
    backgroundColor: COLORS.SURFACE_LIGHT,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: COLORS.TEXT_LIGHT,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  playButton: {
    backgroundColor: COLORS.PRIMARY_NEON,
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: COLORS.PRIMARY_NEON,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 8,
  },
  playButtonText: {
    color: COLORS.BACKGROUND,
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
  authButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.SECONDARY_CYAN,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  authButtonText: {
    color: COLORS.SECONDARY_CYAN,
    fontSize: 13,
    fontWeight: '700',
  },
  serverStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  serverStatusText: {
    color: COLORS.TEXT_MUTED,
    fontSize: 12,
  },
});
