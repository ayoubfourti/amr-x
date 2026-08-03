import { useEffect, useState } from 'react'
import { ThemeContext } from './internalContexts'
const STORAGE_KEY = 'warebot-theme'

const THEME_COLORS = {
  dark: {
    bg: '#040b13',
    bgSecondary: '#07131f',
    card: '#081522',
    cardHover: '#0b1d2d',
    border: '#153246',
    borderHover: '#245771',
    text: '#e8f5fa',
    textSub: '#718a98',
    textMuted: '#385466',
    accent: '#00d4aa',
    accentBlue: '#38bdf8',
    accentPurple: '#7c3aed',
    online: '#00d4aa',
    offline: '#6b7280',
    error: '#ef4444',
    warning: '#f59e0b',

    sidebarBg: '#06101c',
    sidebarBorder: 'rgba(83,190,222,0.11)',
    sidebarText: '#7891a1',
    sidebarHoverBg: 'rgba(53,160,195,0.07)',
    sidebarActiveBgFrom: 'rgba(0,212,170,0.15)',
    sidebarActiveBgTo: 'rgba(0,212,170,0.05)',
    sidebarActiveText: '#00d4aa',
    sidebarActiveBorder: '#00d4aa',
    sidebarLogoShadow: 'rgba(0,212,170,0.35)',
    sidebarSection: 'rgba(255,255,255,0.25)',
    sidebarFooterBg: 'rgba(255,255,255,0.03)',
    sidebarTitle: '#e6f4f8',
    sidebarSubtitle: 'rgba(255,255,255,0.3)',
    inputBg: '#07131f',
    inputBorder: 'rgba(84,177,207,0.16)',
    inputText: '#e8eaf6',
    inputPlaceholder: '#3d4060',
    tableHeaderBg: 'rgba(48,145,179,0.045)',
    tableRowHover: 'rgba(48,159,194,0.055)',
    tableBorder: 'rgba(76,168,198,0.10)',
    modalBg: '#081522',
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
    bg: '#193244',
    bgSecondary: '#213e50',
    card: '#294b5e',
    cardHover: '#31586d',
    border: '#47768c',
    borderHover: '#62a6c0',
    text: '#edf8fb',
    textSub: '#a7c0cb',
    textMuted: '#6f94a5',
    accent: '#58dbb5',
    accentBlue: '#56cee8',
    accentPurple: '#7c3aed',
    online: '#5cddb8',
    offline: '#829da9',
    error: '#ff7b76',
    warning: '#ffb857',

    sidebarBg: '#193244',
    sidebarBorder: 'rgba(93,188,219,0.18)',
    sidebarText: '#98b2be',
    sidebarHoverBg: 'rgba(74,180,214,0.10)',
    sidebarActiveBgFrom: 'rgba(0,168,130,0.10)',
    sidebarActiveBgTo: 'rgba(0,168,130,0.03)',
    sidebarActiveText: '#6ce5c1',
    sidebarActiveBorder: '#61dfb8',
    sidebarLogoShadow: 'rgba(76,208,230,0.24)',
    sidebarSection: 'rgba(180,215,226,0.42)',
    sidebarFooterBg: 'rgba(4,18,29,0.16)',
    sidebarTitle: '#edf8fb',
    sidebarSubtitle: 'rgba(194,224,233,0.48)',
    inputBg: '#244557',
    inputBorder: '#4d788b',
    inputText: '#edf8fb',
    inputPlaceholder: '#7899a8',
    tableHeaderBg: 'rgba(19,51,67,0.34)',
    tableRowHover: 'rgba(79,180,210,0.10)',
    tableBorder: 'rgba(100,169,192,0.18)',
    modalBg: '#294b5e',
    modalOverlay: 'rgba(15,16,32,0.5)',
    btnPrimaryBg: 'linear-gradient(135deg,#59ddb8,#54cde8)',
    btnPrimaryText: '#061923',
    btnGhostBorder: '#507b8e',
    btnGhostText: '#bcd2db',
    btnGhostHover: 'rgba(82,188,219,0.11)',
    progressBg: 'rgba(3,20,31,0.26)',
    progressFill: 'linear-gradient(90deg,#59ddb8,#54cde8)',
    badgeBg: 'rgba(79,180,210,0.12)',
    shadowCard: '0 10px 28px rgba(2,14,23,0.20), inset 0 1px rgba(210,244,252,.08)',
    shadowModal: '0 24px 64px rgba(0,0,0,0.35)',

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
