# Cookie Consent Implementation

This documentation site includes a comprehensive cookie consent system that helps ensure compliance with privacy regulations like GDPR and CCPA.

## Features

The cookie consent system provides:

- ✅ **Customizable UI** with modern and classic themes
- ✅ **Consent Categories** (Essential, Analytics, Marketing, Functional)
- ✅ **Local Storage** of user preferences
- ✅ **Privacy Policy Integration**
- ✅ **Google Analytics Integration** with consent management
- ✅ **React Hooks** for easy integration
- ✅ **TypeScript Support**
- ✅ **Dark Mode Support**
- ✅ **Mobile Responsive Design**

## Cookie Categories

### Essential Cookies
These cookies are necessary for the website to function and cannot be disabled:
- Session management and security
- Theme preferences (dark/light mode)
- Language settings
- Cookie consent preferences

### Analytics Cookies
Help us understand how visitors use our site:
- Google Analytics tracking
- Page view statistics
- User behavior analysis
- Site performance metrics

### Marketing Cookies  
Used for advertising and personalization:
- Advertising network cookies
- Social media integration
- Conversion tracking
- Personalized content

### Functional Cookies
Enhance site functionality and user experience:
- User preference storage
- Feature toggles
- Form data persistence
- Enhanced functionality

## Usage Examples

### Basic Consent Checking

```typescript
import { isCategoryAllowed } from '../utils/cookieConsent';

// Check if analytics is allowed
if (isCategoryAllowed('analytics')) {
  // Load analytics script
  trackEvent('page_view', 'documentation');
}
```

### React Hook Integration

```tsx
import { useCookieConsent } from '../hooks/useCookieConsent';

function MyComponent() {
  const { hasConsent, isAnalyticsAllowed } = useCookieConsent();
  
  return (
    <div>
      {hasConsent && (
        <p>Thank you for your consent preferences!</p>
      )}
      {isAnalyticsAllowed() && (
        <AnalyticsWidget />
      )}
    </div>
  );
}
```

### Conditional Rendering

```tsx
import { useConsentGate } from '../hooks/useCookieConsent';

function AnalyticsComponent() {
  const { isAllowed, isLoading } = useConsentGate('analytics');
  
  if (isLoading) return <div>Loading...</div>;
  if (!isAllowed) return <div>Analytics disabled</div>;
  
  return <div>Analytics content here</div>;
}
```

## Configuration

The cookie consent system can be configured via the `admin-data/settings.json` file:

```json
{
  "cookieConsent": {
    "enabled": true,
    "title": "Cookie Consent",
    "message": "We use cookies to enhance your experience...",
    "acceptButtonText": "Accept All",
    "declineButtonText": "Decline All",
    "manageButtonText": "Cookie Preferences",
    "privacyPolicyUrl": "/privacy-policy",
    "position": "bottom",
    "theme": "modern",
    "showDeclineButton": true,
    "showManageButton": true,
    "categories": {
      "essential": {
        "name": "Essential",
        "description": "Necessary for website function",
        "required": true,
        "enabled": true
      },
      "analytics": {
        "name": "Analytics", 
        "description": "Help us understand site usage",
        "required": false,
        "enabled": false
      }
    }
  }
}
```

## Live Demo

Below is a live demonstration of the cookie consent system status and functionality:

import CookieConsentDemo from '@site/src/components/CookieConsentDemo';

<CookieConsentDemo />

## Privacy Compliance

This implementation helps ensure compliance with:

- **GDPR** (General Data Protection Regulation)
- **CCPA** (California Consumer Privacy Act) 
- **ePrivacy Directive** (EU Cookie Law)
- **Other regional privacy laws**

## Integration with Analytics

The system automatically manages Google Analytics consent:

```javascript
// Analytics is only loaded when consent is given
gtag('consent', 'update', {
  'analytics_storage': preferences.analytics ? 'granted' : 'denied'
});
```

## User Rights

Users can:
- View current consent status
- Change preferences at any time
- Understand what each cookie category does
- Access the privacy policy
- Withdraw consent entirely

## Technical Details

- **Storage**: Uses localStorage for consent preferences
- **Events**: Dispatches custom events for consent changes  
- **Cleanup**: Automatically removes non-essential cookies when declined
- **Accessibility**: Supports keyboard navigation and screen readers
- **Performance**: Minimal impact with lazy loading

The cookie consent system is designed to be both user-friendly and developer-friendly, providing clear consent management while maintaining excellent user experience.
