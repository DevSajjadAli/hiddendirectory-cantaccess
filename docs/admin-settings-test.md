---
title: Admin Settings Test
description: Test page to verify admin settings functionality
---

# Admin Settings Test Page

This page helps verify that the admin panel settings are working correctly.

## Current Configuration Test

### Search Functionality
Try using the search box (if enabled) to search for content on this site.

### Dark Mode Toggle
Look for the dark/light mode toggle in the navigation (if enabled).

### Google Analytics
When Analytics ID is configured, it should be loaded in the page headers.

## Test Instructions

1. **Enable Search Toggle**: Go to Admin Panel → Settings → Advanced Settings
   - Toggle "Enable Search" on/off
   - Verify search box appears/disappears in navigation

2. **Enable Dark Mode Toggle**: In the same Advanced Settings
   - Toggle "Enable Dark Mode Toggle" on/off  
   - Verify dark/light mode switch appears/disappears in navigation

3. **Google Analytics**: In Advanced Settings
   - Enter a valid GA ID (G-XXXXXXXXXX for GA4 or UA-XXXXXXXX-X for Universal Analytics)
   - Check browser dev tools → Network tab → Look for gtag or analytics requests
   - Leave empty to disable analytics

4. **Auto-Save Behavior**: 
   - All checkbox changes save immediately
   - Analytics ID saves when you click outside the input field
   - You should see confirmation messages

## Expected Behavior

✅ **Search Toggle**: Immediately enables/disables search functionality  
✅ **Dark Mode Toggle**: Immediately shows/hides the theme switcher  
✅ **Google Analytics**: Properly configures tracking on next page load  
✅ **Auto-Save**: All settings persist without manual save button  

---

*Last updated: August 14, 2025*
