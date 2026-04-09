import React from 'react';
import { AppBar, Toolbar, IconButton, Typography, Box, Avatar, Chip, Tooltip } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { logout } from '../../redux/slices/authSlice';
import api from '../../utils/api';

export default function Navbar({ drawerWidth, onMenuToggle }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);

  const handleLogout = async () => {
    try { await api.post('/auth/logout'); } catch (_) {}
    dispatch(logout());
    navigate('/login');
    toast.info('Logged out successfully');
  };

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        background: 'rgba(255,255,255,0.9)',
        backdropFilter: 'blur(12px)',
        color: 'text.primary',
        borderBottom: '1px solid #E5E7EB',
      }}
    >
      <Toolbar sx={{ minHeight: 64, px: { xs: 2, sm: 3 } }}>
        <IconButton onClick={onMenuToggle} edge="start" sx={{ mr: 2, color: 'primary.main' }}>
          <MenuIcon />
        </IconButton>

        {/* Logo */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexGrow: 1 }}>
          <Box
            sx={{
              width: 36, height: 36, borderRadius: '10px',
              background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: '1rem' }}>T</Typography>
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 800, background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', display: { xs: 'none', sm: 'block' } }}>
            TimetableAI
          </Typography>
        </Box>

        {/* Right actions */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Tooltip title="Notifications">
            <IconButton sx={{ color: 'text.secondary' }}><NotificationsNoneIcon /></IconButton>
          </Tooltip>
          <Chip
            avatar={<Avatar sx={{ bgcolor: 'primary.main', width: 28, height: 28, fontSize: '0.75rem' }}>{user?.fullName?.[0]?.toUpperCase()}</Avatar>}
            label={user?.fullName?.split(' ')[0] || 'Admin'}
            sx={{ fontWeight: 600, bgcolor: '#EEF2FF', color: 'primary.dark', cursor: 'default', display: { xs: 'none', sm: 'flex' } }}
          />
          <Tooltip title="Logout">
            <IconButton onClick={handleLogout} sx={{ color: 'error.main', bgcolor: '#FFF5F5', '&:hover': { bgcolor: '#FEE2E2' } }}>
              <LogoutIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
