import React from 'react';
import CookieConsent from '../components/CookieConsent';
import CookiePreferencesButton from '../components/CookiePreferencesButton';

// Root component wrapper for all pages
export default function Root({children}) {
  return (
    <>
      {children}
      <CookieConsent />
      <CookiePreferencesButton />
    </>
  );
}
