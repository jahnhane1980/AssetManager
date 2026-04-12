// Theme.js
// Fokus auf Struktur und Lesbarkeit (Regel 7)

export const Theme = {
  colors: {
    primary: '#007AFF',
    background: '#f5f5f7',
    surface: '#ffffff',
    text: '#333333',
    textSecondary: '#666666',
    border: '#e5e5e5',
    white: '#ffffff',
    placeholder: '#999999',
    shadow: '#000000',
    error: '#FF3B30',
    success: '#4CD964',
    overlay: 'rgba(0,0,0,0.5)',
    overlayStrong: 'rgba(0,0,0,0.7)',
    overlayLight: 'rgba(0,0,0,0.3)',
    overlayMedium: 'rgba(0,0,0,0.6)',
  },
  fontSize: {
    hint: 12,
    description: 13,
    caption: 14,
    body: 16,
    subHeader: 18,
    header: 20,
    display: 32,
  },
  fontWeight: {
    light: '300',
    regular: '400',
    medium: '500', // MenuModal, PortfolioList
    semibold: '600', // Chart, PortfolioList, Header Labels
    bold: 'bold', // Haupt-Beträge, Primär-Buttons
  },
  spacing: {
    xs: 5,
    s: 10,
    m: 15,
    l: 20,
    xl: 25,
  },
  borderRadius: {
    s: 8,
    m: 12,
    l: 15,
    round: 30,
  }
};