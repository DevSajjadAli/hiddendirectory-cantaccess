/**
 * Third-party script manager with cookie consent integration
 * Handles loading and unloading of external scripts based on consent
 */

import { 
  isCategoryAllowed, 
  onConsentChange, 
  type CookiePreferences 
} from './cookieConsent';

interface ScriptConfig {
  src: string;
  category: keyof CookiePreferences;
  async?: boolean;
  defer?: boolean;
  attributes?: Record<string, string>;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

interface LoadedScript {
  element: HTMLScriptElement;
  config: ScriptConfig;
}

// Keep track of loaded scripts
const loadedScripts = new Map<string, LoadedScript>();
const pendingScripts = new Map<string, ScriptConfig>();

/**
 * Register a third-party script to be loaded when consent is given
 */
export function registerScript(id: string, config: ScriptConfig): void {
  // Store for potential later loading
  pendingScripts.set(id, config);

  // Load immediately if consent is already given
  if (isCategoryAllowed(config.category)) {
    loadScript(id, config);
  }
}

/**
 * Load a script immediately (with consent check)
 */
export function loadScript(id: string, config: ScriptConfig): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check consent
    if (!isCategoryAllowed(config.category)) {
      reject(new Error(`Cannot load script: ${config.category} cookies not allowed`));
      return;
    }

    // Don't load if already loaded
    if (loadedScripts.has(id)) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = config.src;
    script.async = config.async ?? true;
    script.defer = config.defer ?? false;

    // Add custom attributes
    if (config.attributes) {
      Object.entries(config.attributes).forEach(([key, value]) => {
        script.setAttribute(key, value);
      });
    }

    script.onload = () => {
      loadedScripts.set(id, { element: script, config });
      config.onLoad?.();
      resolve();
    };

    script.onerror = () => {
      const error = new Error(`Failed to load script: ${config.src}`);
      config.onError?.(error);
      reject(error);
    };

    document.head.appendChild(script);
  });
}

/**
 * Unload a script and clean up
 */
export function unloadScript(id: string): void {
  const loadedScript = loadedScripts.get(id);
  if (loadedScript) {
    // Remove script element
    if (loadedScript.element.parentNode) {
      loadedScript.element.parentNode.removeChild(loadedScript.element);
    }
    
    // Remove from tracking
    loadedScripts.delete(id);
    
    // Clean up global variables that might have been created
    cleanupScriptGlobals(id, loadedScript.config);
  }
}

/**
 * Clean up global variables created by third-party scripts
 */
function cleanupScriptGlobals(id: string, config: ScriptConfig): void {
  // Common cleanup patterns for popular scripts
  const cleanupPatterns: Record<string, () => void> = {
    'google-analytics': () => {
      if (typeof window !== 'undefined') {
        delete (window as any).gtag;
        delete (window as any).ga;
        delete (window as any).dataLayer;
      }
    },
    'google-tag-manager': () => {
      if (typeof window !== 'undefined') {
        delete (window as any).dataLayer;
      }
    },
    'facebook-pixel': () => {
      if (typeof window !== 'undefined') {
        delete (window as any).fbq;
        delete (window as any)._fbq;
      }
    },
    'hotjar': () => {
      if (typeof window !== 'undefined') {
        delete (window as any).hj;
        delete (window as any)._hjSettings;
      }
    },
    'intercom': () => {
      if (typeof window !== 'undefined') {
        delete (window as any).Intercom;
        delete (window as any).intercomSettings;
      }
    }
  };

  const cleanup = cleanupPatterns[id];
  if (cleanup) {
    cleanup();
  }
}

/**
 * Load all scripts for a specific category
 */
export function loadCategoryScripts(category: keyof CookiePreferences): Promise<void[]> {
  const scriptsToLoad: Promise<void>[] = [];

  pendingScripts.forEach((config, id) => {
    if (config.category === category) {
      scriptsToLoad.push(loadScript(id, config));
    }
  });

  return Promise.all(scriptsToLoad);
}

/**
 * Unload all scripts for a specific category
 */
export function unloadCategoryScripts(category: keyof CookiePreferences): void {
  loadedScripts.forEach((loadedScript, id) => {
    if (loadedScript.config.category === category) {
      unloadScript(id);
    }
  });
}

/**
 * Get all loaded scripts
 */
export function getLoadedScripts(): Record<string, ScriptConfig> {
  const result: Record<string, ScriptConfig> = {};
  loadedScripts.forEach((loadedScript, id) => {
    result[id] = loadedScript.config;
  });
  return result;
}

/**
 * Check if a script is loaded
 */
export function isScriptLoaded(id: string): boolean {
  return loadedScripts.has(id);
}

/**
 * Initialize the script manager with consent change listener
 */
export function initializeScriptManager(): void {
  onConsentChange((consentData) => {
    const preferences = consentData.preferences;

    // Load newly consented scripts
    Object.entries(preferences).forEach(([category, allowed]) => {
      if (allowed) {
        loadCategoryScripts(category as keyof CookiePreferences).catch(console.error);
      } else {
        unloadCategoryScripts(category as keyof CookiePreferences);
      }
    });
  });
}

// Common third-party scripts with pre-configured settings
export const commonScripts = {
  googleAnalytics: (trackingId: string): ScriptConfig => ({
    src: `https://www.googletagmanager.com/gtag/js?id=${trackingId}`,
    category: 'analytics',
    async: true,
    onLoad: () => {
      (window as any).dataLayer = (window as any).dataLayer || [];
      function gtag(...args: any[]) {
        (window as any).dataLayer.push(args);
      }
      (window as any).gtag = gtag;
      gtag('js', new Date());
      gtag('config', trackingId);
    }
  }),

  googleTagManager: (containerId: string): ScriptConfig => ({
    src: `https://www.googletagmanager.com/gtm.js?id=${containerId}`,
    category: 'marketing',
    async: true,
    onLoad: () => {
      (window as any).dataLayer = (window as any).dataLayer || [];
      (window as any).dataLayer.push({
        'gtm.start': new Date().getTime(),
        event: 'gtm.js'
      });
    }
  }),

  facebookPixel: (pixelId: string): ScriptConfig => ({
    src: 'https://connect.facebook.net/en_US/fbevents.js',
    category: 'marketing',
    onLoad: () => {
      (window as any).fbq = function(...args: any[]) {
        if ((window as any).fbq.callMethod) {
          (window as any).fbq.callMethod.apply((window as any).fbq, args);
        } else {
          (window as any).fbq.queue = (window as any).fbq.queue || [];
          (window as any).fbq.queue.push(args);
        }
      };
      (window as any).fbq('init', pixelId);
      (window as any).fbq('track', 'PageView');
    }
  }),

  hotjar: (hjid: string, hjsv: string): ScriptConfig => ({
    src: `https://static.hotjar.com/c/hotjar-${hjid}.js?sv=${hjsv}`,
    category: 'analytics',
    onLoad: () => {
      (window as any).hj = (window as any).hj || function(...args: any[]) {
        ((window as any).hj.q = (window as any).hj.q || []).push(args);
      };
      (window as any)._hjSettings = { hjid, hjsv };
    }
  }),

  intercom: (appId: string): ScriptConfig => ({
    src: `https://widget.intercom.io/widget/${appId}`,
    category: 'functional',
    onLoad: () => {
      (window as any).intercomSettings = { app_id: appId };
    }
  }),

  crisp: (websiteId: string): ScriptConfig => ({
    src: 'https://client.crisp.chat/l.js',
    category: 'functional',
    async: true,
    onLoad: () => {
      (window as any).$crisp = [];
      (window as any).CRISP_WEBSITE_ID = websiteId;
    }
  })
};

// Auto-initialize when module is loaded
if (typeof window !== 'undefined') {
  initializeScriptManager();
}
