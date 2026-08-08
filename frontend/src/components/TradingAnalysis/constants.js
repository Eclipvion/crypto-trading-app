export const NEON_GREEN = '#39FF14';
export const NEON_RED = '#FF5555';
export const NEON_CYAN = '#00e5ff';
export const AMBER = '#f59e0b';

export const glassCard = {
  bgcolor: 'rgba(10, 14, 23, 0.7)',
  backdropFilter: 'blur(12px)',
  border: '1px solid rgba(57, 255, 20, 0.12)',
  borderRadius: '14px',
  boxShadow: '0 4px 24px rgba(0,0,0,0.6)',
  transition: 'all 0.25s ease',
  '&:hover': {
    borderColor: 'rgba(57, 255, 20, 0.35)',
    boxShadow: `0 0 20px rgba(57, 255, 20, 0.12), 0 4px 24px rgba(0,0,0,0.6)`,
  },
};


export const statRow = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  px: 1.5,
  py: 1,
  borderRadius: '8px',
  border: '1px solid rgba(255,255,255,0.04)',
  bgcolor: 'rgba(255,255,255,0.02)',
  transition: 'all 0.2s ease',
  '&:hover': { bgcolor: 'rgba(255,255,255,0.04)', transform: 'translateX(3px)' },
};

export const fmtPrice = (p) => p > 1
  ? `$${p.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  : `$${p.toFixed(6)}`;
