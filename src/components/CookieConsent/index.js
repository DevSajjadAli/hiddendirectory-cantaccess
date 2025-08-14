import React, { useState, useEffect } from 'react';
import {
  getConsentPreferences,
  saveConsentPreferences,
  getConsentSettings,
  hasConsentBeenGiven,
  resetConsent
} from '../../utils/cookieConsent';
import styles from './CookieConsent.module.css';

/**
 * 🍪 Cookie Consent Banner & Preferences Modal
 * GDPR & CCPA Compliant Cookie Management Component
 */
const CookieConsent = () => {
  const [settings, setSettings] = useState(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [preferences, setPreferences] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    initializeCookieConsent();
    
    // Listen for preference modal requests
    const handleShowPreferences = () => setShowModal(true);
    window.addEventListener('showCookiePreferences', handleShowPreferences);
    
    return () => {
      window.removeEventListener('showCookiePreferences', handleShowPreferences);
    };
  }, []);

  const initializeCookieConsent = async () => {
    try {
      const consentSettings = await getConsentSettings();
      setSettings(consentSettings);
      
      const existingPreferences = getConsentPreferences();
      
      if (consentSettings.enabled && !existingPreferences) {
        setShowBanner(true);
        // Initialize with default preferences
        const defaultPrefs = {};
        Object.keys(consentSettings.categories).forEach(category => {
          const categorySettings = consentSettings.categories[category];
          defaultPrefs[category] = categorySettings.required || categorySettings.enabled;
        });
        setPreferences({ categories: defaultPrefs });
      } else if (existingPreferences) {
        setPreferences(existingPreferences);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Failed to initialize cookie consent:', error);
      setLoading(false);
    }
  };

  const handleAcceptAll = () => {
    if (!settings) return;
    
    const allCategories = {};
    Object.keys(settings.categories).forEach(category => {
      allCategories[category] = true;
    });
    
    const newPreferences = {
      categories: allCategories,
      consentType: 'accepted-all',
      timestamp: Date.now()
    };
    
    saveConsentPreferences(newPreferences);
    setPreferences(newPreferences);
    setShowBanner(false);
    setShowModal(false);
  };

  const handleDeclineAll = () => {
    if (!settings) return;
    
    const essentialOnly = {};
    Object.keys(settings.categories).forEach(category => {
      const categorySettings = settings.categories[category];
      essentialOnly[category] = categorySettings.required || false;
    });
    
    const newPreferences = {
      categories: essentialOnly,
      consentType: 'declined-all',
      timestamp: Date.now()
    };
    
    saveConsentPreferences(newPreferences);
    setPreferences(newPreferences);
    setShowBanner(false);
    setShowModal(false);
  };

  const handleSavePreferences = () => {
    const newPreferences = {
      categories: preferences.categories,
      consentType: 'customized',
      timestamp: Date.now()
    };
    
    saveConsentPreferences(newPreferences);
    setShowBanner(false);
    setShowModal(false);
  };

  const handleCategoryToggle = (category) => {
    const categorySettings = settings.categories[category];
    if (categorySettings.required) return; // Cannot toggle required categories
    
    setPreferences(prev => ({
      ...prev,
      categories: {
        ...prev.categories,
        [category]: !prev.categories[category]
      }
    }));
  };

  const handleResetConsent = () => {
    resetConsent();
    setPreferences({ categories: {} });
    setShowBanner(true);
    setShowModal(false);
  };

  if (loading || !settings || !settings.enabled) {
    return null;
  }

  return (
    <>
      {/* Cookie Consent Banner */}
      {showBanner && (
        <div className={`${styles.banner} ${styles[settings.theme]} ${styles[settings.position]}`}>
          <div className={styles.bannerContent}>
            <div className={styles.bannerText}>
              <h3 className={styles.bannerTitle}>🍪 Cookie Preferences</h3>
              <p className={styles.bannerMessage}>{settings.consentMessage}</p>
            </div>
            
            <div className={styles.bannerActions}>
              <button
                onClick={() => setShowModal(true)}
                className={`${styles.button} ${styles.buttonSecondary}`}
              >
                {settings.managePreferencesText}
              </button>
              
              <button
                onClick={handleDeclineAll}
                className={`${styles.button} ${styles.buttonDecline}`}
              >
                {settings.declineAllText}
              </button>
              
              <button
                onClick={handleAcceptAll}
                className={`${styles.button} ${styles.buttonPrimary}`}
              >
                {settings.acceptAllText}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cookie Preferences Modal */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>🍪 Cookie Preferences</h2>
              <button
                onClick={() => setShowModal(false)}
                className={styles.modalClose}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className={styles.modalTabs}>
              <button
                onClick={() => setActiveTab('overview')}
                className={`${styles.tab} ${activeTab === 'overview' ? styles.tabActive : ''}`}
              >
                📋 Overview
              </button>
              <button
                onClick={() => setActiveTab('categories')}
                className={`${styles.tab} ${activeTab === 'categories' ? styles.tabActive : ''}`}
              >
                🎯 Categories
              </button>
              <button
                onClick={() => setActiveTab('details')}
                className={`${styles.tab} ${activeTab === 'details' ? styles.tabActive : ''}`}
              >
                📄 Details
              </button>
            </div>

            <div className={styles.modalContent}>
              {activeTab === 'overview' && (
                <div className={styles.tabContent}>
                  <div className={styles.overviewSection}>
                    <h3>Why do we use cookies?</h3>
                    <p>
                      We use cookies to enhance your browsing experience, analyze site traffic, 
                      and provide personalized content. You can choose which types of cookies 
                      to allow below.
                    </p>
                  </div>

                  <div className={styles.quickActions}>
                    <button
                      onClick={handleAcceptAll}
                      className={`${styles.button} ${styles.buttonPrimary}`}
                    >
                      ✅ Accept All Cookies
                    </button>
                    <button
                      onClick={handleDeclineAll}
                      className={`${styles.button} ${styles.buttonDecline}`}
                    >
                      ❌ Decline Non-Essential
                    </button>
                  </div>

                  {hasConsentBeenGiven() && (
                    <div className={styles.resetSection}>
                      <h4>Current Consent Status</h4>
                      <p>You have already made cookie choices. You can change them below or reset to start fresh.</p>
                      <button
                        onClick={handleResetConsent}
                        className={`${styles.button} ${styles.buttonSecondary}`}
                      >
                        🔄 Reset All Preferences
                      </button>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'categories' && (
                <div className={styles.tabContent}>
                  <div className={styles.categoriesGrid}>
                    {Object.entries(settings.categories).map(([category, categorySettings]) => {
                      const isEnabled = preferences.categories?.[category] || false;
                      const isRequired = categorySettings.required;
                      
                      return (
                        <div
                          key={category}
                          className={`${styles.categoryCard} ${isEnabled ? styles.categoryEnabled : ''} ${isRequired ? styles.categoryRequired : ''}`}
                        >
                          <div className={styles.categoryHeader}>
                            <h4 className={styles.categoryTitle}>
                              {getCategoryIcon(category)} {categorySettings.label}
                            </h4>
                            <div className={styles.categoryToggle}>
                              <input
                                type="checkbox"
                                id={`category-${category}`}
                                checked={isEnabled}
                                onChange={() => handleCategoryToggle(category)}
                                disabled={isRequired}
                                className={styles.toggleInput}
                              />
                              <label
                                htmlFor={`category-${category}`}
                                className={`${styles.toggleLabel} ${isRequired ? styles.toggleDisabled : ''}`}
                              >
                                <span className={styles.toggleSlider}></span>
                              </label>
                            </div>
                          </div>
                          
                          <p className={styles.categoryDescription}>
                            {categorySettings.description}
                            {isRequired && (
                              <span className={styles.requiredBadge}>Required</span>
                            )}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  <div className={styles.modalActions}>
                    <button
                      onClick={handleSavePreferences}
                      className={`${styles.button} ${styles.buttonPrimary}`}
                    >
                      💾 Save Preferences
                    </button>
                    <button
                      onClick={() => setShowModal(false)}
                      className={`${styles.button} ${styles.buttonSecondary}`}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'details' && (
                <div className={styles.tabContent}>
                  <div className={styles.detailsSection}>
                    <h3>Cookie Policy Details</h3>
                    <div className={styles.policyGrid}>
                      <div className={styles.policyCard}>
                        <h4>🔒 Data Protection</h4>
                        <p>
                          Your privacy is important to us. We comply with GDPR, CCPA, 
                          and other privacy regulations to ensure your data is protected.
                        </p>
                      </div>
                      
                      <div className={styles.policyCard}>
                        <h4>⚙️ Cookie Management</h4>
                        <p>
                          You can change your cookie preferences at any time by 
                          clicking the cookie preferences button or revisiting this page.
                        </p>
                      </div>
                      
                      <div className={styles.policyCard}>
                        <h4>🗑️ Data Retention</h4>
                        <p>
                          Non-essential cookies are automatically removed when you 
                          decline them or change your preferences.
                        </p>
                      </div>
                    </div>
                    
                    {settings.privacyPolicyUrl && (
                      <div className={styles.privacyLink}>
                        <a
                          href={settings.privacyPolicyUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.linkButton}
                        >
                          📄 {settings.privacyPolicyText || 'Privacy Policy'}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Helper function to get category icons
function getCategoryIcon(category) {
  const icons = {
    essential: '🔧',
    analytics: '📊',
    marketing: '🎯',
    functional: '⚙️'
  };
  return icons[category] || '🍪';
}

export default CookieConsent;
