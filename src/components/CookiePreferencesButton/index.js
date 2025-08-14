import React, { useState, useEffect } from 'react';
import { hasConsentBeenGiven, showCookiePreferences } from '../../utils/cookieConsent';
import styles from './CookiePreferencesButton.module.css';

/**
 * 🍪 Floating Cookie Preferences Button
 * Shows a small cookie icon that expands on hover to show full text
 * Only appears after user has given initial consent
 */
const CookiePreferencesButton = () => {
  const [showButton, setShowButton] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Check if user has already given consent
    const checkConsent = () => {
      if (hasConsentBeenGiven()) {
        setShowButton(true);
      }
    };

    checkConsent();

    // Listen for consent updates
    const handleConsentUpdate = () => {
      setShowButton(true);
    };

    const handleConsentReset = () => {
      setShowButton(false);
    };

    window.addEventListener('cookieConsentUpdated', handleConsentUpdate);
    window.addEventListener('cookieConsentReset', handleConsentReset);

    return () => {
      window.removeEventListener('cookieConsentUpdated', handleConsentUpdate);
      window.removeEventListener('cookieConsentReset', handleConsentReset);
    };
  }, []);

  const handleClick = () => {
    showCookiePreferences();
  };

  const handleDismiss = () => {
    setIsVisible(false);
    // Remember dismissal for current session
    sessionStorage.setItem('cookie-preferences-button-dismissed', 'true');
  };

  // Check if button was dismissed this session
  useEffect(() => {
    const dismissed = sessionStorage.getItem('cookie-preferences-button-dismissed');
    if (dismissed) {
      setIsVisible(false);
    }
  }, []);

  if (!showButton || !isVisible) {
    return null;
  }

  return (
    <div className={styles.cookieButton}>
      <div className={styles.buttonContainer}>
        <button
          onClick={handleClick}
          className={styles.mainButton}
          aria-label="Cookie Preferences"
          title="Manage cookie preferences"
        >
          <span className={styles.cookieIcon}>🍪</span>
          <span className={styles.buttonText}>Cookie Preferences</span>
        </button>
        
        <button
          onClick={handleDismiss}
          className={styles.dismissButton}
          aria-label="Dismiss cookie preferences button"
          title="Hide this button for this session"
        >
          ✕
        </button>
      </div>

      {/* Tooltip for small screens */}
      <div className={styles.tooltip}>
        Manage your cookie preferences
      </div>
    </div>
  );
};

export default CookiePreferencesButton;
