import React, { useState, useEffect } from 'react';

interface CookieConsentSettings {
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
  categories: {
    [key: string]: {
      name: string;
      description: string;
      required: boolean;
      enabled: boolean;
    };
  };
}

const defaultSettings: CookieConsentSettings = {
  enabled: true,
  title: "Cookie Consent",
  message: "We use cookies to enhance your browsing experience and provide personalized content. By continuing to use our site, you consent to our use of cookies.",
  acceptButtonText: "Accept All",
  declineButtonText: "Decline All",
  manageButtonText: "Cookie Preferences",
  privacyPolicyUrl: "/privacy-policy",
  position: "bottom",
  theme: "modern",
  showDeclineButton: true,
  showManageButton: true,
  categories: {
    essential: {
      name: "Essential",
      description: "These cookies are necessary for the website to function properly.",
      required: true,
      enabled: true
    },
    analytics: {
      name: "Analytics",
      description: "These cookies help us understand how visitors interact with our website.",
      required: false,
      enabled: false
    },
    marketing: {
      name: "Marketing",
      description: "These cookies are used to deliver personalized advertisements.",
      required: false,
      enabled: false
    },
    functional: {
      name: "Functional",
      description: "These cookies enhance the functionality and personalization of our site.",
      required: false,
      enabled: false
    }
  }
};

const CookieConsentAdmin: React.FC = () => {
  const [settings, setSettings] = useState<CookieConsentSettings>(defaultSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await fetch('/admin-data/settings.json');
      if (response.ok) {
        const data = await response.json();
        if (data.cookieConsent) {
          setSettings(prev => ({ ...prev, ...data.cookieConsent }));
        }
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const saveSettings = async () => {
    setIsSaving(true);
    setSaveStatus('idle');

    try {
      // In a real implementation, this would make an API call to save settings
      // For demo purposes, we'll just simulate a save operation
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cookieConsent: settings
        })
      });

      if (response.ok) {
        setSaveStatus('success');
        setTimeout(() => setSaveStatus('idle'), 3000);
      } else {
        setSaveStatus('error');
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  const updateSetting = (key: keyof CookieConsentSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const updateCategory = (categoryKey: string, field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      categories: {
        ...prev.categories,
        [categoryKey]: {
          ...prev.categories[categoryKey],
          [field]: value
        }
      }
    }));
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h1>Cookie Consent Settings</h1>
      <p>Configure the cookie consent banner and preferences for your site.</p>

      <form onSubmit={(e) => { e.preventDefault(); saveSettings(); }}>
        {/* General Settings */}
        <div style={{ marginBottom: '30px' }}>
          <h2>General Settings</h2>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input
                type="checkbox"
                checked={settings.enabled}
                onChange={(e) => updateSetting('enabled', e.target.checked)}
              />
              Enable Cookie Consent
            </label>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Title</label>
            <input
              type="text"
              value={settings.title}
              onChange={(e) => updateSetting('title', e.target.value)}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Message</label>
            <textarea
              value={settings.message}
              onChange={(e) => updateSetting('message', e.target.value)}
              rows={3}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Privacy Policy URL</label>
            <input
              type="text"
              value={settings.privacyPolicyUrl}
              onChange={(e) => updateSetting('privacyPolicyUrl', e.target.value)}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px' }}>Position</label>
              <select
                value={settings.position}
                onChange={(e) => updateSetting('position', e.target.value)}
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
              >
                <option value="bottom">Bottom</option>
                <option value="top">Top</option>
              </select>
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '5px' }}>Theme</label>
              <select
                value={settings.theme}
                onChange={(e) => updateSetting('theme', e.target.value)}
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
              >
                <option value="modern">Modern</option>
                <option value="classic">Classic</option>
              </select>
            </div>
          </div>
        </div>

        {/* Button Settings */}
        <div style={{ marginBottom: '30px' }}>
          <h2>Button Settings</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px' }}>Accept Button Text</label>
              <input
                type="text"
                value={settings.acceptButtonText}
                onChange={(e) => updateSetting('acceptButtonText', e.target.value)}
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '5px' }}>Decline Button Text</label>
              <input
                type="text"
                value={settings.declineButtonText}
                onChange={(e) => updateSetting('declineButtonText', e.target.value)}
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '5px' }}>Manage Button Text</label>
              <input
                type="text"
                value={settings.manageButtonText}
                onChange={(e) => updateSetting('manageButtonText', e.target.value)}
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '20px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <input
                type="checkbox"
                checked={settings.showDeclineButton}
                onChange={(e) => updateSetting('showDeclineButton', e.target.checked)}
              />
              Show Decline Button
            </label>
            
            <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <input
                type="checkbox"
                checked={settings.showManageButton}
                onChange={(e) => updateSetting('showManageButton', e.target.checked)}
              />
              Show Manage Button
            </label>
          </div>
        </div>

        {/* Cookie Categories */}
        <div style={{ marginBottom: '30px' }}>
          <h2>Cookie Categories</h2>
          
          {Object.entries(settings.categories).map(([key, category]) => (
            <div key={key} style={{ 
              border: '1px solid #ddd', 
              borderRadius: '8px', 
              padding: '15px', 
              marginBottom: '15px' 
            }}>
              <h3 style={{ margin: '0 0 10px 0' }}>{category.name} Cookies</h3>
              
              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Name</label>
                <input
                  type="text"
                  value={category.name}
                  onChange={(e) => updateCategory(key, 'name', e.target.value)}
                  style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #ccc' }}
                />
              </div>
              
              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Description</label>
                <textarea
                  value={category.description}
                  onChange={(e) => updateCategory(key, 'description', e.target.value)}
                  rows={2}
                  style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #ccc' }}
                />
              </div>
              
              <div style={{ display: 'flex', gap: '20px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <input
                    type="checkbox"
                    checked={category.required}
                    onChange={(e) => updateCategory(key, 'required', e.target.checked)}
                  />
                  Required
                </label>
                
                <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <input
                    type="checkbox"
                    checked={category.enabled}
                    onChange={(e) => updateCategory(key, 'enabled', e.target.checked)}
                  />
                  Enabled by Default
                </label>
              </div>
            </div>
          ))}
        </div>

        {/* Save Button */}
        <div style={{ textAlign: 'center' }}>
          <button
            type="submit"
            disabled={isSaving}
            style={{
              background: 'var(--ifm-color-primary, #007bff)',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '6px',
              fontSize: '16px',
              cursor: isSaving ? 'not-allowed' : 'pointer',
              opacity: isSaving ? 0.7 : 1
            }}
          >
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
          
          {saveStatus === 'success' && (
            <div style={{ color: 'green', marginTop: '10px' }}>
              Settings saved successfully!
            </div>
          )}
          
          {saveStatus === 'error' && (
            <div style={{ color: 'red', marginTop: '10px' }}>
              Failed to save settings. Please try again.
            </div>
          )}
        </div>
      </form>
    </div>
  );
};

export default CookieConsentAdmin;
