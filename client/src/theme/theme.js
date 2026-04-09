import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#6366F1', light: '#A5B4FC', dark: '#4F46E5', contrastText: '#FFFFFF' },
    secondary: { main: '#8B5CF6', light: '#C4B5FD', dark: '#7C3AED', contrastText: '#FFFFFF' },
    success: { main: '#10B981', light: '#6EE7B7', dark: '#059669' },
    warning: { main: '#F59E0B', light: '#FCD34D', dark: '#D97706' },
    error: { main: '#EF4444', light: '#FCA5A5', dark: '#DC2626' },
    info: { main: '#3B82F6', light: '#93C5FD', dark: '#2563EB' },
    background: { default: '#F5F7FF', paper: '#FFFFFF' },
    text: { primary: '#111827', secondary: '#6B7280', disabled: '#9CA3AF' },
    divider: '#E5E7EB',
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontSize: '2.5rem', fontWeight: 800, lineHeight: 1.2 },
    h2: { fontSize: '2rem', fontWeight: 700, lineHeight: 1.3 },
    h3: { fontSize: '1.75rem', fontWeight: 700, lineHeight: 1.4 },
    h4: { fontSize: '1.5rem', fontWeight: 600, lineHeight: 1.5 },
    h5: { fontSize: '1.25rem', fontWeight: 600, lineHeight: 1.5 },
    h6: { fontSize: '1rem', fontWeight: 600, lineHeight: 1.5 },
    button: { fontWeight: 600, textTransform: 'none', fontSize: '0.875rem' },
  },
  shape: { borderRadius: 12 },
  shadows: [
    'none',
    '0 1px 3px 0 rgba(99,102,241,0.08)',
    '0 4px 6px -1px rgba(99,102,241,0.1)',
    '0 10px 15px -3px rgba(99,102,241,0.1)',
    '0 20px 25px -5px rgba(99,102,241,0.1)',
    ...Array(20).fill('none'),
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 10, padding: '8px 20px', fontWeight: 600, boxShadow: 'none', '&:hover': { boxShadow: '0 4px 12px rgba(99,102,241,0.3)' } },
        containedPrimary: { background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)' },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: { borderRadius: 16, boxShadow: '0 4px 24px rgba(99,102,241,0.08)', border: '1px solid #F0F0FF' },
      },
    },
    MuiTextField: {
      defaultProps: { size: 'small' },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 10,
            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#6366F1' },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#6366F1', borderWidth: 2 },
          },
        },
      },
    },
    MuiChip: { styleOverrides: { root: { borderRadius: 8, fontWeight: 600 } } },
    MuiTableHead: { styleOverrides: { root: { '& .MuiTableCell-root': { backgroundColor: '#F5F7FF', fontWeight: 700, color: '#374151' } } } },
    MuiTableCell: { styleOverrides: { root: { borderBottom: '1px solid #F0F0FF' } } },
    MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } },
    MuiAppBar: { styleOverrides: { root: { boxShadow: '0 1px 8px rgba(99,102,241,0.12)' } } },
    MuiDrawer: { styleOverrides: { paper: { borderRight: '1px solid #F0F0FF' } } },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 10, margin: '2px 8px', padding: '10px 16px',
          '&.Mui-selected': { backgroundColor: '#EEF2FF', color: '#6366F1', '& .MuiListItemIcon-root': { color: '#6366F1' } },
          '&:hover': { backgroundColor: '#F5F3FF' },
        },
      },
    },
    MuiLinearProgress: { styleOverrides: { root: { borderRadius: 4, height: 8 } } },
  },
});

export default theme;
