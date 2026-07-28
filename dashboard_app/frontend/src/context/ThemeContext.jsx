import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext(null)
const STORAGE_KEY = 'warebot-theme'

const THEME_COLORS = {
  dark: {
    bg: '#07080f',
    bgSecondary: '#0d0e1a',
    card: '#0f1020',
    cardHover: '#141528',
    border: '#1e2040',
    borderHover: '#2e3060',
    text: '#e8eaf6',
    textSub: '#6b7280',
    textMuted: '#3d4060',
    accent: '#00d4aa',
    accentBlue: '#38bdf8',
    accentPurple: '#7c3aed',
    online: '#00d4aa',
    offline: '#6b7280',
    error: '#ef4444',
    warning: '#f59e0b',

    sidebarBg: '#0d0f1e',
    sidebarBorder: 'rgba(255,255,255,0.06)',
    sidebarText: '#94a3b8',
    sidebarHoverBg: 'rgba(255,255,255,0.06)',
    sidebarActiveBgFrom: 'rgba(0,212,170,0.15)',
    sidebarActiveBgTo: 'rgba(0,212,170,0.05)',
    sidebarActiveText: '#00d4aa',
    sidebarActiveBorder: '#00d4aa',
    sidebarLogoShadow: 'rgba(0,212,170,0.35)',
    sidebarSection: 'rgba(255,255,255,0.25)',
    sidebarFooterBg: 'rgba(255,255,255,0.03)',
    sidebarTitle: '#e2e8f0',
    sidebarSubtitle: 'rgba(255,255,255,0.3)',
    inputBg: '#0d0e1a',
    inputBorder: 'rgba(255,255,255,0.1)',
    inputText: '#e8eaf6',
    inputPlaceholder: '#3d4060',
    tableHeaderBg: 'rgba(255,255,255,0.03)',
    tableRowHover: 'rgba(255,255,255,0.04)',
    tableBorder: 'rgba(255,255,255,0.06)',
    modalBg: '#0f1020',
    modalOverlay: 'rgba(0,0,0,0.7)',
    btnPrimaryBg: 'linear-gradient(135deg,#00d4aa,#38bdf8)',
    btnPrimaryText: '#000000',
    btnGhostBorder: 'rgba(255,255,255,0.12)',
    btnGhostText: '#94a3b8',
    btnGhostHover: 'rgba(255,255,255,0.08)',
    progressBg: 'rgba(255,255,255,0.08)',
    progressFill: 'linear-gradient(90deg,#00d4aa,#38bdf8)',
    badgeBg: 'rgba(255,255,255,0.08)',
    shadowCard: '0 4px 24px rgba(0,0,0,0.4)',
    shadowModal: '0 24px 64px rgba(0,0,0,0.6)',

    mapBg: '#07080f',
    mapGridMinor: '#1a1a28',
    mapGridMajor: '#1c1c36',
  },
  light: {
    bg: '#e8edf5',
    bgSecondary: '#dce3f0',
    card: '#ffffff',
    cardHover: '#f8f9ff',
    border: '#dde1f0',
    borderHover: '#c5cbdf',
    text: '#0f1020',
    textSub: '#4b5563',
    textMuted: '#9ca3af',
    accent: '#00a882',
    accentBlue: '#0ea5e9',
    accentPurple: '#7c3aed',
    online: '#059669',
    offline: '#9ca3af',
    error: '#dc2626',
    warning: '#d97706',

    sidebarBg: '#ffffff',
    sidebarBorder: 'rgba(15,16,32,0.08)',
    sidebarText: '#64748b',
    sidebarHoverBg: 'rgba(15,16,32,0.04)',
    sidebarActiveBgFrom: 'rgba(0,168,130,0.10)',
    sidebarActiveBgTo: 'rgba(0,168,130,0.03)',
    sidebarActiveText: '#00a882',
    sidebarActiveBorder: '#00a882',
    sidebarLogoShadow: 'rgba(0,168,130,0.25)',
    sidebarSection: 'rgba(15,16,32,0.3)',
    sidebarFooterBg: 'rgba(15,16,32,0.02)',
    sidebarTitle: '#0f1020',
    sidebarSubtitle: 'rgba(15,16,32,0.4)',
    inputBg: '#ffffff',
    inputBorder: '#dde1f0',
    inputText: '#0f1020',
    inputPlaceholder: '#9ca3af',
    tableHeaderBg: '#f8f9ff',
    tableRowHover: '#f0f4ff',
    tableBorder: '#e8ecf8',
    modalBg: '#ffffff',
    modalOverlay: 'rgba(15,16,32,0.5)',
    btnPrimaryBg: 'linear-gradient(135deg,#00a882,#0ea5e9)',
    btnPrimaryText: '#ffffff',
    btnGhostBorder: '#dde1f0',
    btnGhostText: '#4b5563',
    btnGhostHover: '#f0f2f8',
    progressBg: '#e8ecf8',
    progressFill: 'linear-gradient(90deg,#00a882,#0ea5e9)',
    badgeBg: '#f0f2f8',
    shadowCard: '0 2px 16px rgba(15,16,32,0.10), 0 1px 4px rgba(15,16,32,0.06)',
    shadowModal: '0 24px 64px rgba(0,0,0,0.2)',

    mapBg: '#1a1e2e',
    mapGridMinor: '#222840',
    mapGridMajor: '#2a3050',
  },
}

function toKebabCase(key) {
  return key.replace(/([A-Z])/g, '-$1').toLowerCase()
}

function readStoredTheme() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored === 'light' || stored === 'dark' ? stored : 'dark'
  } catch {
    return 'dark'
  }
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(readStoredTheme)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, theme)
    document.documentElement.setAttribute('data-theme', theme)
    const colors = THEME_COLORS[theme]
    Object.entries(colors).forEach(([key, value]) => {
      document.documentElement.style.setProperty(`--${toKebabCase(key)}`, value)
    })
  }, [theme])

  function toggleTheme() {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }

  const value = {
    theme,
    toggleTheme,
    colors: THEME_COLORS[theme],
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider')
  return ctx
}
