# Cookie Consent Test Page

This page demonstrates the cookie consent system in action.

## Current Status

import CookieConsentDemo from '@site/src/components/CookieConsentDemo';

<CookieConsentDemo />

## Instructions

1. If you haven't seen the cookie consent banner yet, clear your browser's localStorage and refresh the page
2. Try different consent options:
   - **Accept All** - Enables all cookie categories
   - **Decline All** - Only allows essential cookies
   - **Cookie Preferences** - Customize individual categories
3. Notice how the demo above changes based on your consent choices
4. Test theme switching (dark/light mode) to verify the banner adapts

## Testing Scenarios

### Scenario 1: Fresh Visit
1. Open browser developer tools
2. Go to Application > Local Storage > localhost:3000
3. Delete `cookie-consent` and `cookie-preferences` entries
4. Refresh the page
5. Cookie banner should appear

### Scenario 2: Analytics Consent
1. Click "Cookie Preferences" 
2. Enable "Analytics" cookies
3. Notice the demo shows "Analytics Enabled"
4. Check that tracking events work in the demo

### Scenario 3: Consent Changes
1. Change your preferences multiple times
2. Notice immediate UI updates
3. Verify localStorage is updated accordingly

## Privacy Policy Integration

The cookie consent system integrates with our [Privacy Policy](/privacy-policy) page, which includes:

- Detailed cookie explanations
- User rights information
- Contact information for privacy inquiries
- Legal compliance details

## Developer Tools

Open your browser's developer console to see:
- Consent change events
- Analytics tracking calls (when enabled)
- Debug information about cookie management

The system provides comprehensive logging for development and debugging purposes.
