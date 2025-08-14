import React, { useState, useEffect } from 'react';
import './styles.css';

interface CookieCategory {
  name: string;
  description: string;
  required: boolean;
  enabled: boolean;
}

interface CookieConsentConfig {
  enabled: boolean;
  title: string;
  message: string;
  acceptButtonText: string;
  declineButtonText: string;
  manageButtonText: string;
  privacyPolicyUrl: string;
  position: 'bottom' | 'top';
  theme: 'modern' | 'classic';
  showDeclineButton: boolean;
  showManageButton: boolean;
  categories: Record<string, CookieCategory>;
}

const STORAGE_KEY = 'cookie-consent';
const PREFERENCES_KEY = 'cookie-preferences';

interface CookieConsentProps {
  config: CookieConsentConfig;
}

const CookieConsent: React.FC<CookieConsentProps> = ({ config }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState<Record<string, boolean>>({});
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    if (!config.enabled) return;

    // Detect dark mode
    const detectDarkMode = () => {
      const htmlElement = document.documentElement;
      const isDark = htmlElement.getAttribute('data-theme') === 'dark' ||
                     htmlElement.classList.contains('dark') ||
                     (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
      setIsDarkMode(isDark);
    };

    // Initial detection
    detectDarkMode();

    // Listen for theme changes
    const observer = new MutationObserver(detectDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'class']
    });

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleMediaChange = () => detectDarkMode();
    mediaQuery.addListener(handleMediaChange);

    // Check if user has already made a choice
    const savedConsent = localStorage.getItem(STORAGE_KEY);
    const savedPreferences = localStorage.getItem(PREFERENCES_KEY);

    if (!savedConsent) {
      setIsVisible(true);
    }

    // Load saved preferences
    if (savedPreferences) {
      setPreferences(JSON.parse(savedPreferences));
    } else {
      // Initialize with default values
      const defaultPrefs: Record<string, boolean> = {};
      Object.entries(config.categories).forEach(([key, category]) => {
        defaultPrefs[key] = category.enabled;
      });
      setPreferences(defaultPrefs);
    }

    // Cleanup
    return () => {
      observer.disconnect();
      mediaQuery.removeListener(handleMediaChange);
    };
  }, [config]);

  const handleAcceptAll = () => {
    const allAccepted: Record<string, boolean> = {};
    Object.keys(config.categories).forEach((key) => {
      allAccepted[key] = true;
    });

    saveConsent('accepted', allAccepted);
    setIsVisible(false);
  };

  const handleDeclineAll = () => {
    const onlyEssential: Record<string, boolean> = {};
    Object.entries(config.categories).forEach(([key, category]) => {
      onlyEssential[key] = category.required;
    });

    saveConsent('declined', onlyEssential);
    setIsVisible(false);
  };

  const handleSavePreferences = () => {
    saveConsent('customized', preferences);
    setShowPreferences(false);
    setIsVisible(false);
  };

  const saveConsent = (type: string, prefs: Record<string, boolean>) => {
    const consentData = {
      type,
      timestamp: Date.now(),
      preferences: prefs,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(consentData));
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(prefs));

    // Dispatch custom event for other parts of the app to listen to
    window.dispatchEvent(new CustomEvent('cookieConsentChange', {
      detail: consentData
    }));

    // Apply consent immediately
    applyCookieConsent(prefs);
  };

  const applyCookieConsent = (prefs: Record<string, boolean>) => {
    // Handle analytics
    if (prefs.analytics) {
      // Enable analytics tracking
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('consent', 'update', {
          'analytics_storage': 'granted'
        });
      }
    } else {
      // Disable analytics tracking
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('consent', 'update', {
          'analytics_storage': 'denied'
        });
      }
    }

    // Handle marketing
    if (prefs.marketing) {
      // Enable marketing cookies
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('consent', 'update', {
          'ad_storage': 'granted'
        });
      }
    } else {
      // Disable marketing cookies
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('consent', 'update', {
          'ad_storage': 'denied'
        });
      }
    }

    // Clear non-essential cookies if declined
    if (!prefs.functional) {
      clearNonEssentialCookies();
    }
  };

  const clearNonEssentialCookies = () => {
    // Get all cookies
    const cookies = document.cookie.split(';');
    
    // Essential cookie patterns that should not be deleted
    const essentialPatterns = [
      'theme',
      'locale',
      STORAGE_KEY,
      PREFERENCES_KEY,
      'docusaurus'
    ];

    cookies.forEach(cookie => {
      const [name] = cookie.trim().split('=');
      
      // Check if this is an essential cookie
      const isEssential = essentialPatterns.some(pattern => 
        name.includes(pattern)
      );

      if (!isEssential) {
        // Delete the cookie
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`;
      }
    });
  };

  const handleCategoryToggle = (categoryKey: string) => {
    if (config.categories[categoryKey].required) return;

    setPreferences(prev => ({
      ...prev,
      [categoryKey]: !prev[categoryKey]
    }));
  };

  if (!config.enabled || !isVisible) {
    return null;
  }

  const themeClass = `cookie-consent--${config.theme}`;
  const positionClass = `cookie-consent--${config.position}`;
  const darkModeClass = isDarkMode ? 'cookie-consent--dark' : '';

  return (
    <>
      <div className={`cookie-consent ${themeClass} ${positionClass} ${darkModeClass}`}>
        <div className="cookie-consent__container">
          <div className="cookie-consent__content">
            <h3 className="cookie-consent__title">{config.title}</h3>
            <p className="cookie-consent__message">
              {config.message}
              {config.privacyPolicyUrl && (
                <>
                  {' '}
                  <a
                    href={config.privacyPolicyUrl}
                    className="cookie-consent__privacy-link"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Learn more
                  </a>
                </>
              )}
            </p>
          </div>
          <div className="cookie-consent__actions">
            {config.showManageButton && (
              <button
                className="cookie-consent__button cookie-consent__button--secondary"
                onClick={() => setShowPreferences(true)}
                type="button"
              >
                {config.manageButtonText}
              </button>
            )}
            {config.showDeclineButton && (
              <button
                className="cookie-consent__button cookie-consent__button--decline"
                onClick={handleDeclineAll}
                type="button"
              >
                {config.declineButtonText}
              </button>
            )}
            <button
              className="cookie-consent__button cookie-consent__button--primary"
              onClick={handleAcceptAll}
              type="button"
            >
              {config.acceptButtonText}
            </button>
          </div>
        </div>
      </div>

      {showPreferences && (
        <div className="cookie-preferences-modal">
          <div className="cookie-preferences-modal__backdrop" onClick={() => setShowPreferences(false)} />
          <div className={`cookie-preferences-modal__content ${darkModeClass}`}>
            <div className="cookie-preferences-modal__header">
              <h2>Cookie Preferences</h2>
              <button
                className="cookie-preferences-modal__close"
                onClick={() => setShowPreferences(false)}
                type="button"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className="cookie-preferences-modal__body">
              <p>Choose which cookies you want to accept. You can change these settings at any time.</p>
              
              {Object.entries(config.categories).map(([key, category]) => (
                <div key={key} className="cookie-category">
                  <div className="cookie-category__header">
                    <div className="cookie-category__info">
                      <h4 className="cookie-category__name">{category.name}</h4>
                      <p className="cookie-category__description">{category.description}</p>
                    </div>
                    <label className="cookie-category__toggle">
                      <input
                        type="checkbox"
                        checked={preferences[key] || false}
                        disabled={category.required}
                        onChange={() => handleCategoryToggle(key)}
                      />
                      <span className="cookie-category__toggle-slider" />
                    </label>
                  </div>
                </div>
              ))}
            </div>
            <div className="cookie-preferences-modal__footer">
              <button
                className="cookie-consent__button cookie-consent__button--secondary"
                onClick={() => setShowPreferences(false)}
                type="button"
              >
                Cancel
              </button>
              <button
                className="cookie-consent__button cookie-consent__button--primary"
                onClick={handleSavePreferences}
                type="button"
              >
                Save Preferences
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CookieConsent;
