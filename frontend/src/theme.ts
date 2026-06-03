import type React from 'react';

/** Brand colour palette */
export const C = {
  bg:          '#c8e6c9',
  white:       '#ffffff',
  black:       '#000000',
  green:       '#4caf50',
  greenDark:   '#388e3c',
  greenDeep:   '#1b5e20',
  yellow:      '#ffc107',
  gray:        '#757575',
  grayLight:   '#f5f5f5',
  lightGreen:  '#e8f5e9',
  errorRed:    '#c0392b',
  errorBg:     '#fdecea',
  errorBorder: '#ef9a9a',
  successBg:   '#e8f5e9',
  successBorder:'#a5d6a7',
  warningBg:   '#fff9e6',
  warningText: '#7a5800',
  cardShadow:  '0 12px 30px rgba(0,0,0,0.08)',
  dashShadow:  '0 2px 12px rgba(0,0,0,0.07)',
} as const;

/** Reusable button CSSProperties */
export const Btn: Record<string, React.CSSProperties> = {
  primary: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    minHeight: 54, padding: '0 28px', borderRadius: 999,
    fontWeight: 700, fontSize: 16, cursor: 'pointer',
    background: C.green, color: C.black, border: 'none',
    fontFamily: "'Inter', sans-serif", transition: 'opacity .15s',
  },
  primaryLarge: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    width: 443, maxWidth: '100%', minHeight: 120,
    borderRadius: 76, fontFamily: "'Carter One', cursive",
    fontSize: 'clamp(28px,3vw,44px)', cursor: 'pointer',
    background: C.green, color: C.black, border: 'none', lineHeight: 1.1,
  },
  secondary: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    minHeight: 54, padding: '0 28px', borderRadius: 999,
    fontWeight: 700, fontSize: 16, cursor: 'pointer',
    background: 'transparent', color: C.black,
    border: `2px solid ${C.greenDark}`, fontFamily: "'Inter', sans-serif",
  },
  full: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: '100%', minHeight: 56, borderRadius: 999,
    fontWeight: 700, fontSize: 16, cursor: 'pointer',
    background: C.green, color: C.black, border: 'none',
    fontFamily: "'Inter', sans-serif",
  },
};

/** Card wrapper */
export const Card: React.CSSProperties = {
  background: C.white,
  borderRadius: 36,
  boxShadow: C.cardShadow,
};

/** Input field */
export const Input: React.CSSProperties = {
  width: '100%', minHeight: 56,
  border: '1.5px solid #d9d9d9', borderRadius: 16,
  padding: '0 16px', fontSize: 16, outline: 'none',
  fontFamily: "'Inter', sans-serif", background: C.white,
  boxSizing: 'border-box',
};
