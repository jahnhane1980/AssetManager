// hooks/useGoogleAuth.js
// Modus: Code-Buddy | Regel 6: Full-Body | Regel 7: Prettify
// Fokus: Reaktivierung der Google-Authentifizierung via expo-auth-session

import { useEffect, useState } from 'react';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { Config } from '../constants/Config';

WebBrowser.maybeCompleteAuthSession();

export function useGoogleAuth() {
  const [token, setToken] = useState(null);

  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: Config.GOOGLE_DRIVE.ANDROID_CLIENT_ID,
    iosClientId: Config.GOOGLE_DRIVE.IOS_CLIENT_ID,
    webClientId: Config.GOOGLE_DRIVE.WEB_CLIENT_ID,
    scopes: ['https://www.googleapis.com/auth/drive.file'],
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { access_token } = response.params;
      setToken(access_token);
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