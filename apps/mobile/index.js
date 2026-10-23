import { registerRootComponent } from 'expo';
import App from './App';

// Point d'entrée explicite : indispensable en monorepo (expo/AppEntry.js ne retrouve pas ./App
// quand expo est hissé à la racine de node_modules), sinon Expo Go ne charge pas le bundle.
registerRootComponent(App);
