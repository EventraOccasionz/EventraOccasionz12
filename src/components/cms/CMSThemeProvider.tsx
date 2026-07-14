import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { CMSThemeTokens, CMSGlobalVariables } from '../../types';
import { cmsService } from '../../services/cmsService';

interface CMSThemeContextType {
  tokens: CMSThemeTokens;
  globals: CMSGlobalVariables;
  isLoading: boolean;
  updateTokens: (newTokens: CMSThemeTokens) => void;
  updateGlobals: (newGlobals: CMSGlobalVariables) => void;
}

const CMSThemeContext = createContext<CMSThemeContextType | undefined>(undefined);

export function CMSThemeProvider({ children }: { children: ReactNode }) {
  const [tokens, setTokens] = useState<CMSThemeTokens>(cmsService.getDefaultThemeTokens());
  const [globals, setGlobals] = useState<CMSGlobalVariables>(cmsService.getDefaultGlobalVariables());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadCMSConfig() {
      try {
        const [loadedTokens, loadedGlobals] = await Promise.all([
          cmsService.getThemeTokens(),
          cmsService.getGlobalVariables()
        ]);
        setTokens(loadedTokens);
        setGlobals(loadedGlobals);
      } catch (err) {
        console.error('Failed to load CMS foundation configurations:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadCMSConfig();
  }, []);

  const updateTokens = (newTokens: CMSThemeTokens) => {
    setTokens(newTokens);
  };

  const updateGlobals = (newGlobals: CMSGlobalVariables) => {
    setGlobals(newGlobals);
  };

  // Generate CSS custom properties to inject theme styles dynamically
  const cssVariables = {
    '--cms-color-primary': tokens.colors.primary,
    '--cms-color-secondary': tokens.colors.secondary,
    '--cms-color-accent': tokens.colors.accent,
    '--cms-color-success': tokens.colors.success,
    '--cms-color-warning': tokens.colors.warning,
    '--cms-color-danger': tokens.colors.danger,
    '--cms-color-background': tokens.colors.background,
    '--cms-color-surface': tokens.colors.surface,
    '--cms-color-text-primary': tokens.colors.text_primary,
    '--cms-color-text-secondary': tokens.colors.text_secondary,
    '--cms-font-headings': tokens.typography.headings_font,
    '--cms-font-body': tokens.typography.body_font,
    '--cms-base-font-size': tokens.typography.base_size,
    '--cms-border-radius-button': tokens.spacing.button_radius === 'none' ? '0px' : tokens.spacing.button_radius === 'sm' ? '4px' : tokens.spacing.button_radius === 'md' ? '8px' : '16px',
    '--cms-border-radius-card': tokens.spacing.card_radius === 'none' ? '0px' : tokens.spacing.card_radius === 'sm' ? '8px' : tokens.spacing.card_radius === 'md' ? '12px' : '24px',
    '--cms-transition-speed': tokens.spacing.animation_speed === 'fast' ? '150ms' : tokens.spacing.animation_speed === 'slow' ? '450ms' : '300ms',
  } as React.CSSProperties;

  return (
    <CMSThemeContext.Provider value={{ tokens, globals, isLoading, updateTokens, updateGlobals }}>
      <div style={cssVariables} className="min-h-screen flex flex-col font-sans text-stone-900" id="cms-theme-root">
        {/* Font loader matching selected Google Fonts */}
        <FontLoader fonts={[tokens.typography.headings_font, tokens.typography.body_font]} />
        {children}
      </div>
    </CMSThemeContext.Provider>
  );
}

export function useCMSTheme() {
  const context = useContext(CMSThemeContext);
  if (!context) {
    throw new Error('useCMSTheme must be used within a CMSThemeProvider');
  }
  return context;
}

// Helper to load dynamic Google Fonts based on CMS selection
function FontLoader({ fonts }: { fonts: string[] }) {
  useEffect(() => {
    const uniqueFonts = Array.from(new Set(fonts)).filter(Boolean);
    if (uniqueFonts.length === 0) return;

    const fontFamiliesQuery = uniqueFonts
      .map((f) => `family=${f.replace(/\s+/g, '+')}:wght@300;400;500;600;700`)
      .join('&');

    const linkId = 'cms-dynamic-google-fonts';
    let link = document.getElementById(linkId) as HTMLLinkElement;
    if (!link) {
      link = document.createElement('link');
      link.id = linkId;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
    link.href = `https://fonts.googleapis.com/css2?${fontFamiliesQuery}&display=swap`;
  }, [fonts]);

  return null;
}
