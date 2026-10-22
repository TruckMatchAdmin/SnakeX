# 📱 Guide de Compilation APK Android — SnakeX

Ce guide décrit comment générer l'application Android autonome (`SnakeX.apk`), vérifier son intégrité et la distribuer.

---

## 1. Méthode Automatique Recommandée : GitHub Actions CI/CD

Le dépôt inclut le workflow :  
[`.github/workflows/android-build.yml`](file:///c:/Users/Gabin/Desktop/SnakeX/.github/workflows/android-build.yml)

### Fonctionnement :
1. Chaque push sur la branche `main` (ou déclenchement manuel dans l'onglet **Actions** de GitHub) lance un environnement virtuel Ubuntu équipé du JDK 17 et du SDK Android officiel.
2. Le workflow exécute `npx expo prebuild` puis `./gradlew assembleRelease`.
3. L'APK autonome `SnakeX.apk` est généré avec son empreinte SHA-256 (`SnakeX.apk.sha256`).
4. L'artefact est immédiatement disponible en téléchargement direct dans la section **Artifacts** du run GitHub Actions.

---

## 2. Méthode Cloud : Expo Application Services (EAS Build)

Si vous possédez un compte Expo :

1. Installer EAS CLI :
   ```bash
   npm install -g eas-cli
   ```

2. Se connecter :
   ```bash
   eas login
   ```

3. Lancer la compilation de l'APK autonome :
   ```bash
   cd apps/mobile
   eas build -p android --profile preview
   ```
   EAS compile l'APK sur les serveurs cloud Expo et vous fournit une URL HTTPS directe ainsi qu'un QR code pour télécharger le fichier `.apk` directement sur votre téléphone.

---

## 3. Méthode Locale (Machine Développeur)

Si Java JDK 17+ et Android Studio (avec SDK Platform 34) sont installés sur votre machine Windows :

1. Générer le projet natif Android :
   ```bash
   cd apps/mobile
   npx expo prebuild --platform android
   ```

2. Compiler l'APK :
   ```bash
   cd android
   ./gradlew assembleRelease
   ```
   L'APK produit sera situé dans :  
   `apps/mobile/android/app/build/outputs/apk/release/app-release.apk`

---

## 4. Vérification d'Intégrité de l'APK (SHA-256)

Sous Windows PowerShell :
```powershell
Get-FileHash -Algorithm SHA256 .\SnakeX.apk
```

Sous Linux / macOS :
```bash
sha256sum SnakeX.apk
```

---

## 5. Installation sur Téléphone Android

1. Téléchargez le fichier `SnakeX.apk` sur votre smartphone.
2. Ouvrez le fichier.
3. Si Android affiche *"Application bloquée par sécurité"*, appuyez sur **Paramètres** puis cochez **Autoriser l'installation depuis cette source**.
4. Appuyez sur **Installer**.
5. Lancez SnakeX et dominez l'arène !
