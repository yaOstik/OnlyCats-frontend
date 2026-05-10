import { useCallback, useState } from 'react';
import {
  clearStoredAuth,
  getStoredToken,
  getUserIdFromToken,
  saveAuthToken,
  saveStoredUsername,
} from '../utils/authStorage';

const INITIAL_AUTH_FORM = {
  name: '',
  email: '',
  password: '',
};

export function useAuth(baseUrl) {
  const [authMode, setAuthMode] = useState('login');
  const [authForm, setAuthForm] = useState(INITIAL_AUTH_FORM);
  const [isLoggedIn, setIsLoggedIn] = useState(Boolean(getStoredToken()));

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [welcomeTitle, setWelcomeTitle] = useState('');
  const [welcomeDesc, setWelcomeDesc] = useState('');

  const getMyUserId = useCallback(() => getUserIdFromToken(getStoredToken()), []);

  const updateAuthField = useCallback((field, value) => {
    setAuthForm((current) => ({ ...current, [field]: value }));
  }, []);

  const openAuthModal = useCallback(() => setShowAuthModal(true), []);
  const closeAuthModal = useCallback(() => setShowAuthModal(false), []);
  const closeWelcomeModal = useCallback(() => setShowWelcomeModal(false), []);

  const handleAuthSubmit = useCallback(
    async (event) => {
      event.preventDefault();

      const endpoint = authMode === 'login' ? `${baseUrl}/login` : `${baseUrl}/register`;
      const payload =
        authMode === 'login'
          ? { email: authForm.email, password: authForm.password }
          : { username: authForm.name, email: authForm.email, password: authForm.password };

      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error('Authentication failed. Please check your details.');
        }

        const data = await response.json();
        saveAuthToken(data.access_token || JSON.stringify(data));

        if (authMode === 'register') {
          saveStoredUsername(authForm.name);
        } else if (data.username) {
          saveStoredUsername(data.username);
        }

        setIsLoggedIn(true);
        if (authMode === 'login') {
          setWelcomeTitle('Welcome back!');
          setWelcomeDesc('Your feed is ready.');
        } else {
          setWelcomeTitle('Account created!');
          setWelcomeDesc('Welcome to OnlyCats.');
        }
        setShowWelcomeModal(true);
        setAuthForm(INITIAL_AUTH_FORM);
      } catch (error) {
        alert(error.message);
      }
    },
    [authForm, authMode, baseUrl],
  );

  const logout = useCallback(() => {
    clearStoredAuth();
    setIsLoggedIn(false);
  }, []);

  return {
    authMode,
    setAuthMode,
    authForm,
    updateAuthField,
    handleAuthSubmit,
    isLoggedIn,
    getMyUserId,
    logout,
    showAuthModal,
    setShowAuthModal,
    openAuthModal,
    closeAuthModal,
    showWelcomeModal,
    closeWelcomeModal,
    welcomeTitle,
    welcomeDesc,
  };
}

