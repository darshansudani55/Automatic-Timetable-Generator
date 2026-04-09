import React from 'react';
import { Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Collapse, Box, Typography, Divider } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import DashboardIcon from '@mui/icons-material/Dashboard';
import BusinessIcon from '@mui/icons-material/Business';
import PeopleIcon from '@mui/icons-material/People';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import ScienceIcon from '@mui/icons-material/Science';
import SchoolIcon from '@mui/icons-material/School';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import CalendarViewMonthIcon from '@mui/icons-material/CalendarViewMonth';
import BarChartIcon from '@mui/icons-material/BarChart';
import SettingsIcon from '@mui/icons-material/Settings';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useState } from 'react';

const masterItems = [
  { label: 'Departments', icon: <BusinessIcon fontSize="small" />, path: '/masters/departments' },
  { label: 'Faculty', icon: <PeopleIcon fontSize="small" />, path: '/masters/faculty' },
  { label: 'Subjects', icon: <MenuBookIcon fontSize="small" />, path: '/masters/subjects' },
  { label: 'Classrooms', icon: <MeetingRoomIcon fontSize="small" />, path: '/masters/classrooms' },
  { label: 'Labs', icon: <ScienceIcon fontSize="small" />, path: '/masters/labs' },
  { label: 'Classes', icon: <SchoolIcon fontSize="small" />, path: '/masters/classes' },
];

const navItems = [
  { label: 'Dashboard', icon: <DashboardIcon fontSize="small" />, path: '/dashboard' },
  { label: 'Generate', icon: <AutoFixHighIcon fontSize="small" />, path: '/timetable/generate' },
  { label: 'View Timetables', icon: <CalendarViewMonthIcon fontSize="small" />, path: '/timetable/view' },
  { label: 'Reports', icon: <BarChartIcon fontSize="small" />, path: '/reports' },
  { label: 'Settings', icon: <SettingsIcon fontSize="small" />, path: '/settings' },
];

function NavItem({ item }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const selected = pathname === item.path;
  return (
    <ListItem disablePadding>
      <ListItemButton selected={selected} onClick={() => navigate(item.path)}>
        <ListItemIcon sx={{ minWidth: 36, color: selected ? 'primary.main' : 'text.secondary' }}>{item.icon}</ListItemIcon>
        <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: selected ? 700 : 500 }} />
      </ListItemButton>
    </ListItem>
  );
}

function SidebarContent() {
  const { pathname } = useLocation();
  const mastersOpen = pathname.startsWith('/masters');
  const [open, setOpen] = useState(mastersOpen);

  return (
    <Box sx={{ overflow: 'auto', height: '100%', py: 1 }}>
      {/* Logo section */}
      <Box sx={{ px: 3, py: 2, mb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ width: 40, height: 40, borderRadius: '12px', background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: '1.1rem' }}>T</Typography>
          </Box>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.2, background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>TimetableAI</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1 }}>Admin Portal</Typography>
          </Box>
        </Box>
      </Box>

      <Divider sx={{ mx: 2, mb: 1 }} />

      <List dense>
        <NavItem item={navItems[0]} />

        {/* Masters expandable */}
        <ListItem disablePadding>
          <ListItemButton onClick={() => setOpen(!open)} sx={{ borderRadius: 2, mx: 1, px: 2, py: 1.25 }}>
            <ListItemIcon sx={{ minWidth: 36, color: open ? 'primary.main' : 'text.secondary' }}><SchoolIcon fontSize="small" /></ListItemIcon>
            <ListItemText primary="Master Data" primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 600 }} />
            {open ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
          </ListItemButton>
        </ListItem>
        <Collapse in={open} timeout="auto" unmountOnExit>
          <List dense sx={{ pl: 2 }} disablePadding>
            {masterItems.map((item) => <NavItem key={item.path} item={item} />)}
          </List>
        </Collapse>

        {navItems.slice(1).map((item) => <NavItem key={item.path} item={item} />)}
      </List>

      {/* Footer */}
      <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, p: 2, borderTop: '1px solid #F0F0FF' }}>
        <Typography variant="caption" color="text.disabled" display="block" textAlign="center">TimetableAI v1.0</Typography>
        <Typography variant="caption" color="text.disabled" display="block" textAlign="center">© 2024 Academic Scheduler</Typography>
      </Box>
    </Box>
  );
}

export default function Sidebar({ drawerWidth, open, onClose }) {
  return (
    <>
      {/* Mobile drawer */}
      <Drawer variant="temporary" open={open} onClose={onClose} sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box', pt: '64px' } }}>
        <SidebarContent />
      </Drawer>
      {/* Desktop drawer */}
      <Drawer variant="persistent" open={open} sx={{ display: { xs: 'none', md: 'block' }, '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box', pt: '64px', bgcolor: '#FAFBFF' } }}>
        <SidebarContent />
      </Drawer>
    </>
  );
}
