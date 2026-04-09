import React, { useEffect, useState } from 'react';
import { Grid, Card, CardContent, Typography, Box, Avatar, Chip, List, ListItem, ListItemText, ListItemAvatar, Divider, LinearProgress, Button, CircularProgress } from '@mui/material';
import BusinessIcon from '@mui/icons-material/Business';
import PeopleIcon from '@mui/icons-material/People';
import SchoolIcon from '@mui/icons-material/School';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import ScienceIcon from '@mui/icons-material/Science';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../utils/api';
import PageHeader from '../components/common/PageHeader';

const StatCard = ({ label, value, icon, color, sub, onClick }) => (
  <Card onClick={onClick} sx={{ cursor: onClick ? 'pointer' : 'default', transition: 'all 0.2s', '&:hover': onClick ? { transform: 'translateY(-4px)', boxShadow: '0 12px 32px rgba(99,102,241,0.15)' } : {} }}>
    <CardContent sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="body2" color="text.secondary" fontWeight={600} mb={0.5}>{label}</Typography>
          <Typography variant="h3" fontWeight={800} color={color || 'primary.main'}>{value ?? <CircularProgress size={28} />}</Typography>
          {sub && <Chip label={sub} size="small" sx={{ mt: 1, fontWeight: 700, bgcolor: `${color || '#6366F1'}18`, color: color || 'primary.main' }} />}
        </Box>
        <Avatar sx={{ bgcolor: `${color || '#6366F1'}18`, width: 52, height: 52 }}>{React.cloneElement(icon, { sx: { color: color || 'primary.main', fontSize: 26 } })}</Avatar>
      </Box>
    </CardContent>
  </Card>
);

const activityColors = { CREATE: '#10B981', UPDATE: '#3B82F6', DELETE: '#EF4444', GENERATE: '#8B5CF6', PUBLISH: '#6366F1', EXPORT: '#F59E0B', LOGIN: '#6B7280', LOGOUT: '#9CA3AF' };

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/reports/dashboard').then(({ data }) => { setStats(data.data); setLoading(false); }).catch(() => { toast.error('Failed to load dashboard'); setLoading(false); });
  }, []);

  const timetableTotal = stats?.timetables?.total || 0;
  const published = stats?.timetables?.published || 0;
  const draft = stats?.timetables?.draft || 0;

  return (
    <Box>
      <PageHeader title="Dashboard" subtitle="Overview of your timetable system" action={
        <Button variant="contained" startIcon={<AutoFixHighIcon />} onClick={() => navigate('/timetable/generate')} sx={{ borderRadius: 3 }}>Generate Timetable</Button>
      } />

      <Grid container spacing={3} mb={4}>
        {[
          { label: 'Departments', value: stats?.totalDepartments, icon: <BusinessIcon />, color: '#6366F1', sub: 'Active', path: '/masters/departments' },
          { label: 'Faculty Members', value: stats?.totalFaculty, icon: <PeopleIcon />, color: '#8B5CF6', sub: 'Active', path: '/masters/faculty' },
          { label: 'Classes', value: stats?.totalClasses, icon: <SchoolIcon />, color: '#10B981', sub: 'Enrolled', path: '/masters/classes' },
          { label: 'Classrooms', value: stats?.totalClassrooms, icon: <MeetingRoomIcon />, color: '#3B82F6', sub: 'Available', path: '/masters/classrooms' },
          { label: 'Labs', value: stats?.totalLabs, icon: <ScienceIcon />, color: '#F59E0B', sub: 'Available', path: '/masters/labs' },
          { label: 'Timetables', value: timetableTotal, icon: <CalendarMonthIcon />, color: '#EF4444', sub: `${published} Published`, path: '/timetable/view' },
        ].map((stat) => (
          <Grid item xs={12} sm={6} md={4} key={stat.label}>
            <StatCard {...stat} onClick={() => navigate(stat.path)} />
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* Timetable Status */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={700} mb={3}>Timetable Status</Typography>
              {[
                { label: 'Published', value: published, color: '#10B981', total: timetableTotal || 1 },
                { label: 'Draft', value: draft, color: '#F59E0B', total: timetableTotal || 1 },
                { label: 'Archived', value: stats?.timetables?.archived || 0, color: '#9CA3AF', total: timetableTotal || 1 },
              ].map((item) => (
                <Box key={item.label} mb={2.5}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                    <Typography variant="body2" fontWeight={600}>{item.label}</Typography>
                    <Typography variant="body2" color="text.secondary" fontWeight={700}>{item.value}</Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={Math.round((item.value / item.total) * 100)} sx={{ bgcolor: '#F3F4F6', '& .MuiLinearProgress-bar': { bgcolor: item.color } }} />
                </Box>
              ))}
              <Button size="small" endIcon={<ArrowForwardIcon />} onClick={() => navigate('/timetable/view')} sx={{ mt: 1 }}>View All Timetables</Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={700} mb={2}>Quick Actions</Typography>
              {[
                { label: 'Generate New Timetable', path: '/timetable/generate', color: '#6366F1', icon: <AutoFixHighIcon /> },
                { label: 'Add Department', path: '/masters/departments', color: '#8B5CF6', icon: <BusinessIcon /> },
                { label: 'Add Faculty', path: '/masters/faculty', color: '#10B981', icon: <PeopleIcon /> },
                { label: 'Add Class', path: '/masters/classes', color: '#3B82F6', icon: <SchoolIcon /> },
                { label: 'View Reports', path: '/reports', color: '#F59E0B', icon: <CalendarMonthIcon /> },
              ].map((action) => (
                <Box key={action.label} onClick={() => navigate(action.path)} sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 1.5, borderRadius: 2, cursor: 'pointer', mb: 1, transition: 'all 0.2s', '&:hover': { bgcolor: '#F5F7FF', transform: 'translateX(4px)' } }}>
                  <Avatar sx={{ bgcolor: `${action.color}18`, width: 36, height: 36 }}>{React.cloneElement(action.icon, { sx: { color: action.color, fontSize: 18 } })}</Avatar>
                  <Typography variant="body2" fontWeight={600}>{action.label}</Typography>
                  <ArrowForwardIcon fontSize="small" sx={{ ml: 'auto', color: 'text.disabled' }} />
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={700} mb={2}>Recent Activity</Typography>
              {loading ? <CircularProgress size={24} /> : (
                <List dense disablePadding>
                  {(stats?.recentActivity || []).slice(0, 8).map((log, i) => (
                    <React.Fragment key={i}>
                      <ListItem disablePadding sx={{ py: 0.75, alignItems: 'flex-start' }}>
                        <ListItemAvatar sx={{ minWidth: 36, mt: 0.5 }}>
                          <Avatar sx={{ width: 28, height: 28, bgcolor: `${activityColors[log.action] || '#6B7280'}20`, fontSize: '0.65rem', fontWeight: 700, color: activityColors[log.action] || '#6B7280' }}>{log.action?.[0]}</Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={<Typography variant="caption" fontWeight={600}>{log.action} {log.entityType}</Typography>}
                          secondary={<Typography variant="caption" color="text.disabled">{log.user?.fullName} • {new Date(log.timestamp).toLocaleTimeString()}</Typography>}
                        />
                      </ListItem>
                      {i < 7 && <Divider variant="inset" component="li" />}
                    </React.Fragment>
                  ))}
                  {(!stats?.recentActivity || stats.recentActivity.length === 0) && (
                    <Typography variant="body2" color="text.secondary" textAlign="center" mt={3}>No recent activity</Typography>
                  )}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
