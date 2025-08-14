import React from 'react';
import { useCookieConsent, useConsentGate, useAnalytics } from '../../hooks/useCookieConsent';
import { showCookiePreferences } from '../../utils/cookieConsent';

/**
 * Example component showing how to use cookie consent in other components
 */
const CookieConsentDemo: React.FC = () => {
  const { hasConsent, preferences, consentStatus } = useCookieConsent();
  const { isAllowed: analyticsAllowed, isLoading } = useConsentGate('analytics');
  const { trackEvent, isEnabled } = useAnalytics();

  if (isLoading) {
    return <div>Loading consent information...</div>;
  }

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px', margin: '20px 0' }}>
      <h3>Cookie Consent Status</h3>
      
      <div style={{ marginBottom: '15px' }}>
        <strong>Consent Given:</strong> {hasConsent ? 'Yes' : 'No'}
      </div>

      {consentStatus && (
        <div style={{ marginBottom: '15px' }}>
          <strong>Consent Type:</strong> {consentStatus.type}<br />
          <strong>Date:</strong> {new Date(consentStatus.timestamp).toLocaleDateString()}
        </div>
      )}

      {preferences && (
        <div style={{ marginBottom: '15px' }}>
          <strong>Current Preferences:</strong>
          <ul style={{ margin: '10px 0', paddingLeft: '20px' }}>
            <li>Essential: {preferences.essential ? '✅' : '❌'}</li>
            <li>Analytics: {preferences.analytics ? '✅' : '❌'}</li>
            <li>Marketing: {preferences.marketing ? '✅' : '❌'}</li>
            <li>Functional: {preferences.functional ? '✅' : '❌'}</li>
          </ul>
        </div>
      )}

      <div style={{ marginBottom: '15px' }}>
        <button 
          onClick={() => showCookiePreferences()}
          style={{ 
            background: 'var(--ifm-color-primary)', 
            color: 'white', 
            border: 'none', 
            padding: '10px 15px', 
            borderRadius: '5px',
            cursor: 'pointer',
            marginRight: '10px'
          }}
        >
          Manage Cookie Preferences
        </button>
        
        {isEnabled && (
          <button 
            onClick={() => trackEvent('demo_button_click', 'Cookie Demo', 'Test Event')}
            style={{ 
              background: 'var(--ifm-color-success)', 
              color: 'white', 
              border: 'none', 
              padding: '10px 15px', 
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Track Test Event (Analytics)
          </button>
        )}
      </div>

      {analyticsAllowed && (
        <div style={{ 
          background: '#e8f5e8', 
          padding: '10px', 
          borderRadius: '5px',
          color: '#2d5a2d'
        }}>
          <strong>✅ Analytics Enabled:</strong> This section is only visible when analytics cookies are allowed.
        </div>
      )}

      {!analyticsAllowed && hasConsent && (
        <div style={{ 
          background: '#f5f5f5', 
          padding: '10px', 
          borderRadius: '5px',
          color: '#666'
        }}>
          <strong>📊 Analytics Disabled:</strong> Enable analytics cookies to see additional insights.
        </div>
      )}
    </div>
  );
};

export default CookieConsentDemo;
