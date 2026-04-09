import React, { useState } from 'react';
import { Box, Card, CardContent, Typography, Grid, TextField, Button, Switch, FormControlLabel, Alert } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import { toast } from 'react-toastify';
import PageHeader from '../components/common/PageHeader';

export default function Settings() {
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState({
    instituteName: 'Technical College of Engineering',
    instituteCode: 'TCE001',
    workingHoursStart: '07:30',
    workingHoursEnd: '13:30',
    breakStart: '10:30',
    breakEnd: '11:00',
    defaultSlotDuration: 60,
    defaultLabDuration: 90,
    noFreeSlotsDefault: true,
    labContinuousDefault: true,
    maxFacultyHoursDefault: 6,
  });

  const handleSave = () => {
    localStorage.setItem('timetable_settings', JSON.stringify(settings));
    setSaved(true);
    toast.success('Settings saved successfully');
    setTimeout(() => setSaved(false), 3000);
  };

  const set = (key, val) => setSettings((s) => ({ ...s, [key]: val }));

  return (
    <Box>
      <PageHeader title="Settings" subtitle="Configure system defaults and preferences" />

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={700} mb={3}>Institute Information</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}><TextField fullWidth label="Institute Name" value={settings.instituteName} onChange={(e) => set('instituteName', e.target.value)} /></Grid>
                <Grid item xs={12}><TextField fullWidth label="Institute Code" value={settings.instituteCode} onChange={(e) => set('instituteCode', e.target.value)} /></Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={700} mb={3}>Default Working Hours</Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}><TextField fullWidth label="Start Time" type="time" value={settings.workingHoursStart} onChange={(e) => set('workingHoursStart', e.target.value)} InputLabelProps={{ shrink: true }} /></Grid>
                <Grid item xs={6}><TextField fullWidth label="End Time" type="time" value={settings.workingHoursEnd} onChange={(e) => set('workingHoursEnd', e.target.value)} InputLabelProps={{ shrink: true }} /></Grid>
                <Grid item xs={6}><TextField fullWidth label="Break Start" type="time" value={settings.breakStart} onChange={(e) => set('breakStart', e.target.value)} InputLabelProps={{ shrink: true }} /></Grid>
                <Grid item xs={6}><TextField fullWidth label="Break End" type="time" value={settings.breakEnd} onChange={(e) => set('breakEnd', e.target.value)} InputLabelProps={{ shrink: true }} /></Grid>
                <Grid item xs={6}><TextField fullWidth label="Slot Duration (min)" type="number" value={settings.defaultSlotDuration} onChange={(e) => set('defaultSlotDuration', +e.target.value)} /></Grid>
                <Grid item xs={6}><TextField fullWidth label="Lab Duration (min)" type="number" value={settings.defaultLabDuration} onChange={(e) => set('defaultLabDuration', +e.target.value)} /></Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={700} mb={3}>Default Constraints</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}><FormControlLabel control={<Switch checked={settings.noFreeSlotsDefault} onChange={(e) => set('noFreeSlotsDefault', e.target.checked)} color="primary" />} label={<Box><Typography fontWeight={600}>No Free Slots by Default</Typography><Typography variant="caption" color="text.secondary">Prevent gaps in class schedules</Typography></Box>} /></Grid>
                <Grid item xs={12}><FormControlLabel control={<Switch checked={settings.labContinuousDefault} onChange={(e) => set('labContinuousDefault', e.target.checked)} color="primary" />} label={<Box><Typography fontWeight={600}>Continuous Lab Sessions by Default</Typography><Typography variant="caption" color="text.secondary">Labs scheduled in consecutive slots</Typography></Box>} /></Grid>
                <Grid item xs={12}><TextField fullWidth label="Default Max Faculty Hours/Day" type="number" value={settings.maxFacultyHoursDefault} onChange={(e) => set('maxFacultyHoursDefault', +e.target.value)} inputProps={{ min: 1, max: 10 }} /></Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={700} mb={2}>System Information</Typography>
              {[
                { label: 'Version', value: 'TimetableAI v1.0.0' },
                { label: 'Stack', value: 'MERN + Genetic Algorithm' },
                { label: 'Database', value: 'MongoDB 6.0+' },
                { label: 'Algorithm', value: 'GA + Backtracking Hybrid' },
              ].map((item) => (
                <Box key={item.label} sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: '1px solid #F0F0FF' }}>
                  <Typography variant="body2" color="text.secondary">{item.label}</Typography>
                  <Typography variant="body2" fontWeight={600}>{item.value}</Typography>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {saved && <Alert severity="success" sx={{ mt: 3, borderRadius: 2 }}>Settings saved successfully!</Alert>}

      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSave} sx={{ borderRadius: 3, px: 4 }}>Save Settings</Button>
      </Box>
    </Box>
  );
}
