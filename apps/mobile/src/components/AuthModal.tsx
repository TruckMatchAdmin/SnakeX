/**
 * Modal d'authentification Supabase (Connexion, Inscription & Mode Invité)
 */

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { supabase } from '../services/supabaseClient';
import { COLORS } from '../theme/colors';

interface AuthModalProps {
  onClose: () => void;
  onAuthenticated: (userId: string, username: string, token: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onClose, onAuthenticated }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      if (isSignUp) {
        if (!username.trim()) {
          setErrorMessage('Veuillez renseigner un pseudonyme.');
          setLoading(false);
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { username: username.trim() },
          },
        });

        if (error) throw error;
        if (data.session) {
          onAuthenticated(data.user!.id, username.trim(), data.session.access_token);
        } else {
          setErrorMessage('Compte créé ! Vérifiez votre boîte mail si la confirmation est activée.');
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) throw error;
        if (data.session && data.user) {
          const uName = data.user.user_metadata?.username || email.split('@')[0];
          onAuthenticated(data.user.id, uName, data.session.access_token);
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.overlay}>
      <View style={styles.card}>
        <Text style={styles.title}>{isSignUp ? 'CRÉER UN COMPTE' : 'CONNEXION'}</Text>
        <Text style={styles.subtitle}>Enregistrez vos records et hissez-vous au classement mondial !</Text>

        {errorMessage && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}

        {isSignUp && (
          <TextInput
            style={styles.input}
            placeholder="Pseudonyme de joueur"
            placeholderTextColor={COLORS.TEXT_MUTED}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />
        )}

        <TextInput
          style={styles.input}
          placeholder="Adresse Email"
          placeholderTextColor={COLORS.TEXT_MUTED}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <TextInput
          style={styles.input}
          placeholder="Mot de passe"
          placeholderTextColor={COLORS.TEXT_MUTED}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity style={styles.submitBtn} activeOpacity={0.8} onPress={handleSubmit} disabled={loading}>
          {loading ? (
            <ActivityIndicator color={COLORS.BACKGROUND} />
          ) : (
            <Text style={styles.submitBtnText}>{isSignUp ? "S'INSCRIRE" : 'SE CONNECTER'}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)} style={styles.toggleBtn}>
          <Text style={styles.toggleBtnText}>
            {isSignUp ? 'Déjà un compte ? Se connecter' : "Pas encore de compte ? S'inscrire"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <Text style={styles.closeBtnText}>Fermer (Mode Invité)</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.OVERLAY,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 1000,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: COLORS.SURFACE,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  title: {
    color: COLORS.PRIMARY_NEON,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 1,
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    color: COLORS.TEXT_MUTED,
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 20,
  },
  errorBox: {
    backgroundColor: 'rgba(255, 42, 66, 0.2)',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.DANGER,
    marginBottom: 14,
  },
  errorText: {
    color: COLORS.DANGER,
    fontSize: 12,
    fontWeight: 'bold',
  },
  input: {
    backgroundColor: COLORS.SURFACE_LIGHT,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: COLORS.TEXT_LIGHT,
    fontSize: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  submitBtn: {
    backgroundColor: COLORS.PRIMARY_NEON,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 6,
  },
  submitBtnText: {
    color: COLORS.BACKGROUND,
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 1,
  },
  toggleBtn: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  toggleBtnText: {
    color: COLORS.SECONDARY_CYAN,
    fontSize: 12,
    fontWeight: '600',
  },
  closeBtn: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  closeBtnText: {
    color: COLORS.TEXT_MUTED,
    fontSize: 12,
  },
});
