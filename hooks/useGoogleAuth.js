// hooks/useGoogleAuth.js
// Modus: Code-Buddy | Regel 6: Full-Body | Regel 7: Prettify
// Fix: Korrektur der Variablen-Mappings (CLIENT_ID_ANDROID etc.)

import { useEffect, useState } from 'react';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as AuthSession from 'expo-auth-session';
import { Config } from '../constants/Config';

WebBrowser.maybeCompleteAuthSession();

export function useGoogleAuth() {
  const [token, setToken] = useState(null);

  // Wichtig: Die Keys in der Config heißen CLIENT_ID_ANDROID usw.
  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: Config.GOOGLE_DRIVE.CLIENT_ID_ANDROID,
    iosClientId: Config.GOOGLE_DRIVE.CLIENT_ID_IOS,
    webClientId: Config.GOOGLE_DRIVE.CLIENT_ID_WEB,
    scopes: Config.GOOGLE_DRIVE.SCOPES,
    redirectUri: AuthSession.makeRedirectUri(),
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;
      setToken(authentication.accessToken);
    }
  }, [response]);

  const login = async () => {
    const result = await promptAsync();
    return result;
  };

  const logout = () => {
    setToken(null);
  };

  return {
    token,
    isAuthenticated: !!token,
    login,
    logout,
    isReady: !!request
  };
}