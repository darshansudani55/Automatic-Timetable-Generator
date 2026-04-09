import React from 'react';
import { Outlet } from 'react-router-dom';
import { Box } from '@mui/material';
import { useSelector, useDispatch } from 'react-redux';
import { toggleSidebar } from '../../redux/slices/uiSlice';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

const DRAWER_WIDTH = 260;

export default function MainLayout() {
  const dispatch = useDispatch();
  const { sidebarOpen } = useSelector((s) => s.ui);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Navbar drawerWidth={DRAWER_WIDTH} onMenuToggle={() => dispatch(toggleSidebar())} />
      <Sidebar drawerWidth={DRAWER_WIDTH} open={sidebarOpen} onClose={() => dispatch(toggleSidebar())} />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          pt: '72px',
          px: { xs: 2, sm: 3 },
          pb: 4,
          ml: { md: sidebarOpen ? `${DRAWER_WIDTH}px` : 0 },
          transition: 'margin 0.3s ease',
          maxWidth: '100%',
          overflowX: 'hidden',
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}
