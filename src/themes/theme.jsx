export const theme = {
  colors: {
    background: '#0d1117',
    surface: '#161b22',
    surfaceAlt: '#21262d',
    textPrimary: '#f0f6fc',
    textSecondary: '#8b949e',
    border: '#30363d',
    primary: '#1f6feb',
    secondary: '#238636',
    danger: '#da3633',
  },
  // 1. Padrão de 3 Botões Reutilizáveis em todo o projeto
  buttons: {
    primary: {
      background: '#1f6feb',
      color: '#ffffff',
      border: 'none',
      hoverBackground: '#388bfd',
      padding: '10px 18px',
      borderRadius: '6px',
    },
    secondary: {
      background: '#21262d',
      color: '#c9d1d9',
      border: '1px solid #30363d',
      hoverBackground: '#30363d',
      padding: '10px 18px',
      borderRadius: '6px',
    },
    outline: {
      background: 'transparent',
      color: '#58a6ff',
      border: '1px solid #58a6ff',
      hoverBackground: 'rgba(88, 166, 255, 0.1)',
      padding: '10px 18px',
      borderRadius: '6px',
    },
  },
  // 2. Padrão de Tipografia (Títulos, Subtítulos e Texto)
  typography: {
    title: {
      fontSize: '2rem',
      fontWeight: '700',
      lineHeight: '1.25',
      color: '#f0f6fc',
    },
    subtitle: {
      fontSize: '1.25rem',
      fontWeight: '500',
      lineHeight: '1.4',
      color: '#8b949e',
    },
    body: {
      fontSize: '1rem',
      fontWeight: '400',
      lineHeight: '1.5',
      color: '#c9d1d9',
    },
    caption: {
      fontSize: '0.85rem',
      fontWeight: '400',
      lineHeight: '1.4',
      color: '#8b949e',
    },
  },
  // 3. Padrão de 2 Gradientes Reutilizáveis
  gradients: {
    primary: 'linear-gradient(135deg, #1f6feb 0%, #a371f7 100%)',
    surface: 'linear-gradient(180deg, #161b22 0%, #0d1117 100%)',
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
  },
  borderRadius: {
    sm: '4px',
    md: '6px',
    lg: '12px',
    full: '9999px',
  },
};
