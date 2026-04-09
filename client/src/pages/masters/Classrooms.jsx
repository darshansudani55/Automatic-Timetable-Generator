import React, { useEffect, useState, useCallback } from 'react';
import { Box, Button, Card, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination, IconButton, Chip, TextField, InputAdornment, Dialog, DialogTitle, DialogContent, DialogActions, Grid, Tooltip, CircularProgress, Typography, MenuItem, Select, FormControl, InputLabel, Checkbox, ListItemText, OutlinedInput } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import { useForm, Controller } from 'react-hook-form';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import PageHeader from '../../components/common/PageHeader';

const ROOM_TYPES = ['Lecture Hall', 'Classroom', 'Smart Classroom', 'Auditorium'];
const FACILITIES = ['Projector', 'Smart Board', 'AC', 'Audio System', 'Microphone'];
const defaultValues = { roomNumber: '', roomName: '', building: '', floor: '', capacity: '', roomType: 'Classroom', facilities: [] };

export default function Classrooms() {
  const [data, setData] = useState([]); const [total, setTotal] = useState(0); const [page, setPage] = useState(0); const [rowsPerPage, setRowsPerPage] = useState(10); const [search, setSearch] = useState(''); const [loading, setLoading] = useState(false); const [dialogOpen, setDialogOpen] = useState(false); const [editItem, setEditItem] = useState(null); const [deleteId, setDeleteId] = useState(null);
  const { register, handleSubmit, reset, control, formState: { errors } } = useForm({ defaultValues });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try { const { data: res } = await api.get('/master/classrooms', { params: { page: page + 1, limit: rowsPerPage, search } }); setData(res.data); setTotal(res.pagination.total); } catch { toast.error('Failed to load classrooms'); }
    setLoading(false);
  }, [page, rowsPerPage, search]);

  useEffect(() => { fetchData(); }, [fetchData]);
  const openAdd = () => { setEditItem(null); reset(defaultValues); setDialogOpen(true); };
  const openEdit = (item) => { setEditItem(item); reset({ ...item, facilities: item.facilities || [] }); setDialogOpen(true); };
  const onSubmit = async (values) => {
    try {
      if (editItem) { await api.put(`/master/classrooms/${editItem._id}`, values); toast.success('Classroom updated'); } else { await api.post('/master/classrooms', values); toast.success('Classroom created'); }
      setDialogOpen(false); fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };
  const handleDelete = async () => { try { await api.delete(`/master/classrooms/${deleteId}`); toast.success('Deleted'); setDeleteId(null); fetchData(); } catch (err) { toast.error('Delete failed'); } };

  return (
    <Box>
      <PageHeader title="Classrooms" subtitle="Manage lecture halls and classrooms" breadcrumbs={[{ label: 'Masters', path: '/masters/classrooms' }, { label: 'Classrooms' }]} action={<Button variant="contained" startIcon={<AddIcon />} onClick={openAdd} sx={{ borderRadius: 3 }}>Add Classroom</Button>} />
      <Card>
        <Box sx={{ p: 2 }}><TextField placeholder="Search..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }} sx={{ maxWidth: 260 }} /></Box>
        <TableContainer><Table>
          <TableHead><TableRow>{['Room No.', 'Name', 'Building', 'Floor', 'Capacity', 'Type', 'Facilities', 'Actions'].map((h) => <TableCell key={h} sx={{ fontWeight: 700 }}>{h}</TableCell>)}</TableRow></TableHead>
          <TableBody>
            {loading ? <TableRow><TableCell colSpan={8} align="center" sx={{ py: 6 }}><CircularProgress /></TableCell></TableRow>
              : data.length === 0 ? <TableRow><TableCell colSpan={8} align="center" sx={{ py: 6 }}><Typography color="text.secondary">No classrooms found</Typography></TableCell></TableRow>
              : data.map((row) => (
                <TableRow key={row._id} hover>
                  <TableCell><Chip label={row.roomNumber} size="small" sx={{ fontWeight: 700, bgcolor: '#EEF2FF', color: 'primary.dark' }} /></TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{row.roomName || '—'}</TableCell>
                  <TableCell>{row.building || '—'}</TableCell>
                  <TableCell>{row.floor || '—'}</TableCell>
                  <TableCell><Chip label={`${row.capacity} seats`} size="small" color="info" /></TableCell>
                  <TableCell><Chip label={row.roomType} size="small" variant="outlined" /></TableCell>
                  <TableCell><Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>{(row.facilities || []).map((f) => <Chip key={f} label={f} size="small" sx={{ fontSize: '0.65rem' }} />)}</Box></TableCell>
                  <TableCell>
                    <Tooltip title="Edit"><IconButton size="small" onClick={() => openEdit(row)} sx={{ color: 'primary.main' }}><EditIcon fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title="Delete"><IconButton size="small" onClick={() => setDeleteId(row._id)} sx={{ color: 'error.main' }}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table></TableContainer>
        <TablePagination component="div" count={total} page={page} rowsPerPage={rowsPerPage} onPageChange={(_, p) => setPage(p)} onRowsPerPageChange={(e) => { setRowsPerPage(+e.target.value); setPage(0); }} rowsPerPageOptions={[5, 10, 25]} />
      </Card>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>{editItem ? 'Edit Classroom' : 'Add Classroom'}</DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 0 }}>
              <Grid item xs={6}><TextField fullWidth label="Room Number" {...register('roomNumber', { required: 'Required' })} error={!!errors.roomNumber} helperText={errors.roomNumber?.message} /></Grid>
              <Grid item xs={6}><TextField fullWidth label="Room Name" {...register('roomName')} /></Grid>
              <Grid item xs={6}><TextField fullWidth label="Building" {...register('building')} /></Grid>
              <Grid item xs={6}><TextField fullWidth label="Floor" {...register('floor')} /></Grid>
              <Grid item xs={6}><TextField fullWidth label="Capacity" type="number" {...register('capacity', { required: 'Required', min: 1 })} error={!!errors.capacity} helperText={errors.capacity?.message} /></Grid>
              <Grid item xs={6}>
                <Controller name="roomType" control={control} render={({ field }) => (
                  <FormControl fullWidth size="small"><InputLabel>Room Type</InputLabel><Select {...field} label="Room Type">{ROOM_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}</Select></FormControl>
                )} />
              </Grid>
              <Grid item xs={12}>
                <Controller name="facilities" control={control} render={({ field }) => (
                  <FormControl fullWidth size="small"><InputLabel>Facilities</InputLabel>
                    <Select {...field} multiple input={<OutlinedInput label="Facilities" />} renderValue={(s) => s.join(', ')}>
                      {FACILITIES.map((f) => <MenuItem key={f} value={f}><Checkbox checked={(field.value || []).includes(f)} /><ListItemText primary={f} /></MenuItem>)}
                    </Select>
                  </FormControl>
                )} />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 1 }}><Button onClick={() => setDialogOpen(false)}>Cancel</Button><Button type="submit" variant="contained" sx={{ borderRadius: 2 }}>{editItem ? 'Update' : 'Create'}</Button></DialogActions>
        </form>
      </Dialog>

      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Confirm Delete</DialogTitle>
        <DialogContent><Typography>Delete this classroom?</Typography></DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}><Button onClick={() => setDeleteId(null)}>Cancel</Button><Button onClick={handleDelete} variant="contained" color="error" sx={{ borderRadius: 2 }}>Delete</Button></DialogActions>
      </Dialog>
    </Box>
  );
}
