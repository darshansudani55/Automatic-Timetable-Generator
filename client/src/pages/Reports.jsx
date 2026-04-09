import React, { useEffect, useState } from 'react';
import { Box, Card, CardContent, Grid, Typography, CircularProgress, Select, MenuItem, FormControl, InputLabel, LinearProgress, Chip, Table, TableHead, TableRow, TableCell, TableBody, TableContainer, Avatar } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { toast } from 'react-toastify';
import api from '../utils/api';
import PageHeader from '../components/common/PageHeader';

const COLORS = ['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#8B5CF6'];

export default function Reports() {
  const [timetables, setTimetables] = useState([]);
  const [selectedTT, setSelectedTT] = useState('');
  const [workload, setWorkload] = useState([]);
  const [roomUtil, setRoomUtil] = useState([]);
  const [labUtil, setLabUtil] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/timetable', { params: { limit: 50 } }).then(({ data: r }) => {
      setTimetables(r.data);
      if (r.data.length) setSelectedTT(r.data[0]._id);
    }).catch(() => toast.error('Failed to load timetables'));
  }, []);

  useEffect(() => {
    if (!selectedTT) return;
    setLoading(true);
    Promise.all([
      api.get(`/reports/timetable/${selectedTT}/faculty-workload`),
      api.get(`/reports/timetable/${selectedTT}/classroom-utilization`),
      api.get(`/reports/timetable/${selectedTT}/lab-utilization`),
    ]).then(([w, r, l]) => {
      setWorkload(w.data.data);
      setRoomUtil(r.data.data);
      setLabUtil(l.data.data);
    }).catch(() => toast.error('Failed to load report data'))
      .finally(() => setLoading(false));
  }, [selectedTT]);

  const workloadChartData = workload.slice(0, 10).map((w) => ({ name: w.faculty?.fullName?.split(' ').slice(-1)[0] || 'Unknown', hours: Math.round(w.totalHours * 10) / 10, theory: Math.round(w.theory * 10) / 10, lab: Math.round(w.lab * 10) / 10 }));
  const roomChartData = roomUtil.slice(0, 8).map((r) => ({ name: r.room?.roomNumber || 'Unknown', util: r.utilizationPercent }));

  return (
    <Box>
      <PageHeader title="Reports & Analytics" subtitle="Resource utilization and faculty workload insights" />

      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 2 }}>
          <FormControl size="small" sx={{ minWidth: 300 }}>
            <InputLabel>Select Timetable</InputLabel>
            <Select value={selectedTT} onChange={(e) => setSelectedTT(e.target.value)} label="Select Timetable">
              {timetables.map((t) => <MenuItem key={t._id} value={t._id}>{t.timetableName} ({t.status})</MenuItem>)}
            </Select>
          </FormControl>
        </CardContent>
      </Card>

      {loading ? <Box textAlign="center" py={6}><CircularProgress /></Box> : (
        <Grid container spacing={3}>
          {/* Faculty Workload Chart */}
          <Grid item xs={12} md={7}>
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={700} mb={2}>Faculty Weekly Workload (hours)</Typography>
                {workloadChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={workloadChartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(v, n) => [`${v} hrs`, n]} />
                      <Bar dataKey="theory" name="Theory" stackId="a" fill="#6366F1" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="lab" name="Lab" stackId="a" fill="#10B981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <Typography color="text.secondary" textAlign="center" py={4}>No data available</Typography>}
              </CardContent>
            </Card>
          </Grid>

          {/* Faculty Workload Table */}
          <Grid item xs={12} md={5}>
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={700} mb={2}>Workload Details</Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead><TableRow>{['Faculty', 'Theory', 'Lab', 'Total'].map((h) => <TableCell key={h} sx={{ fontWeight: 700 }}>{h}</TableCell>)}</TableRow></TableHead>
                    <TableBody>
                      {workload.slice(0, 8).map((w, i) => (
                        <TableRow key={i} hover>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Avatar sx={{ width: 28, height: 28, bgcolor: COLORS[i % COLORS.length] + '30', color: COLORS[i % COLORS.length], fontSize: '0.7rem', fontWeight: 700 }}>{w.faculty?.fullName?.[0]}</Avatar>
                              <Typography variant="caption" fontWeight={600}>{w.faculty?.fullName}</Typography>
                            </Box>
                          </TableCell>
                          <TableCell><Chip label={`${Math.round(w.theory * 10) / 10}h`} size="small" sx={{ bgcolor: '#DBEAFE', color: '#1D4ED8', fontWeight: 700 }} /></TableCell>
                          <TableCell><Chip label={`${Math.round(w.lab * 10) / 10}h`} size="small" sx={{ bgcolor: '#D1FAE5', color: '#065F46', fontWeight: 700 }} /></TableCell>
                          <TableCell><Typography fontWeight={700}>{Math.round(w.totalHours * 10) / 10}h</Typography></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Classroom Utilization */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={700} mb={2}>Classroom Utilization</Typography>
                {roomChartData.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={roomChartData} layout="vertical" margin={{ top: 0, right: 20, left: 20, bottom: 0 }}>
                        <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={50} />
                        <Tooltip formatter={(v) => [`${v}%`, 'Utilization']} />
                        <Bar dataKey="util" radius={[0, 4, 4, 0]} label={{ position: 'right', fontSize: 10, formatter: (v) => `${v}%` }}>
                          {roomChartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </>
                ) : <Typography color="text.secondary" textAlign="center" py={4}>No classroom data</Typography>}
              </CardContent>
            </Card>
          </Grid>

          {/* Lab Utilization */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={700} mb={2}>Lab Utilization</Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead><TableRow>{['Lab', 'Type', 'Used Slots', 'Utilization'].map((h) => <TableCell key={h} sx={{ fontWeight: 700 }}>{h}</TableCell>)}</TableRow></TableHead>
                    <TableBody>
                      {labUtil.length === 0 ? (
                        <TableRow><TableCell colSpan={4} align="center"><Typography color="text.secondary" variant="body2" py={2}>No lab sessions scheduled</Typography></TableCell></TableRow>
                      ) : labUtil.map((l, i) => (
                        <TableRow key={i} hover>
                          <TableCell sx={{ fontWeight: 600 }}>{l.lab?.labCode}</TableCell>
                          <TableCell>{l.lab?.labType || '—'}</TableCell>
                          <TableCell>{l.usedSlots}/{l.totalSlots}</TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <LinearProgress variant="determinate" value={l.utilizationPercent} sx={{ flexGrow: 1, bgcolor: '#F0FFF4', '& .MuiLinearProgress-bar': { bgcolor: '#10B981' } }} />
                              <Typography variant="caption" fontWeight={700}>{l.utilizationPercent}%</Typography>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
}
