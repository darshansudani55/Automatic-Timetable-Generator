import React, { useEffect, useState, useCallback } from 'react';
import { Box, Button, Card, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination, IconButton, Chip, TextField, InputAdornment, Dialog, DialogTitle, DialogContent, DialogActions, Grid, Tooltip, CircularProgress, Typography, MenuItem, Select, FormControl, InputLabel, Switch, FormControlLabel } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import PageHeader from '../../components/common/PageHeader';

const LAB_TYPES = ['Computer Lab', 'Physics Lab', 'Chemistry Lab', 'Electronics Lab', 'Mechanical Lab', 'General Lab'];
const defaultValues = { labCode: '', labName: '', department: '', building: '', floor: '', capacity: '', labType: '', hasParts: false, allowSimultaneousUse: false, parts: [{ partName: 'Part A', capacity: '', location: '' }, { partName: 'Part B', capacity: '', location: '' }] };

export default function Labs() {
  const [data, setData] = useState([]); const [total, setTotal] = useState(0); const [page, setPage] = useState(0); const [rowsPerPage, setRowsPerPage] = useState(10); const [search, setSearch] = useState(''); const [loading, setLoading] = useState(false); const [departments, setDepartments] = useState([]); const [dialogOpen, setDialogOpen] = useState(false); const [editItem, setEditItem] = useState(null); const [deleteId, setDeleteId] = useState(null);
  const { register, handleSubmit, reset, control, formState: { errors } } = useForm({ defaultValues });
  const hasParts = useWatch({ control, name: 'hasParts' });

  useEffect(() => { api.get('/master/departments', { params: { limit: 100 } }).then(({ data: r }) => setDepartments(r.data)).catch(() => {}); }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try { const { data: res } = await api.get('/master/labs', { params: { page: page + 1, limit: rowsPerPage, search } }); setData(res.data); setTotal(res.pagination.total); } catch { toast.error('Failed to load labs'); }
    setLoading(false);
  }, [page, rowsPerPage, search]);

  useEffect(() => { fetchData(); }, [fetchData]);
  const openAdd = () => { setEditItem(null); reset(defaultValues); setDialogOpen(true); };
  const openEdit = (item) => { setEditItem(item); reset({ ...item, department: item.department?._id || item.department || '' }); setDialogOpen(true); };
  const onSubmit = async (values) => {
    try {
      const payload = { ...values, parts: values.hasParts ? values.parts : [] };
      if (editItem) { await api.put(`/master/labs/${editItem._id}`, payload); toast.success('Lab updated'); } else { await api.post('/master/labs', payload); toast.success('Lab created'); }
      setDialogOpen(false); fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };
  const handleDelete = async () => { try { await api.delete(`/master/labs/${deleteId}`); toast.success('Deleted'); setDeleteId(null); fetchData(); } catch { toast.error('Delete failed'); } };

  return (
    <Box>
      <PageHeader title="Labs" subtitle="Manage laboratory resources" breadcrumbs={[{ label: 'Masters', path: '/masters/labs' }, { label: 'Labs' }]} action={<Button variant="contained" startIcon={<AddIcon />} onClick={openAdd} sx={{ borderRadius: 3 }}>Add Lab</Button>} />
      <Card>
        <Box sx={{ p: 2 }}><TextField placeholder="Search labs..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }} sx={{ maxWidth: 260 }} /></Box>
        <TableContainer><Table>
          <TableHead><TableRow>{['Code', 'Name', 'Department', 'Capacity', 'Type', 'Parts', 'Simultaneous', 'Actions'].map((h) => <TableCell key={h} sx={{ fontWeight: 700 }}>{h}</TableCell>)}</TableRow></TableHead>
          <TableBody>
            {loading ? <TableRow><TableCell colSpan={8} align="center" sx={{ py: 6 }}><CircularProgress /></TableCell></TableRow>
              : data.length === 0 ? <TableRow><TableCell colSpan={8} align="center" sx={{ py: 6 }}><Typography color="text.secondary">No labs found</Typography></TableCell></TableRow>
              : data.map((row) => (
                <TableRow key={row._id} hover>
                  <TableCell><Chip label={row.labCode} size="small" sx={{ fontWeight: 700, bgcolor: '#ECFDF5', color: '#065F46' }} /></TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{row.labName}</TableCell>
                  <TableCell>{row.department?.departmentCode || '—'}</TableCell>
                  <TableCell><Chip label={`${row.capacity}`} size="small" color="info" /></TableCell>
                  <TableCell>{row.labType || '—'}</TableCell>
                  <TableCell>{row.hasParts ? <Chip label="Part A/B" size="small" color="warning" /> : <Chip label="Single" size="small" />}</TableCell>
                  <TableCell>{row.allowSimultaneousUse ? <Chip label="Yes" size="small" color="success" /> : <Chip label="No" size="small" />}</TableCell>
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
        <DialogTitle sx={{ fontWeight: 700 }}>{editItem ? 'Edit Lab' : 'Add Lab'}</DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 0 }}>
              <Grid item xs={6}><TextField fullWidth label="Lab Code" {...register('labCode', { required: 'Required' })} error={!!errors.labCode} helperText={errors.labCode?.message} inputProps={{ style: { textTransform: 'uppercase' } }} /></Grid>
              <Grid item xs={6}><TextField fullWidth label="Lab Name" {...register('labName', { required: 'Required' })} error={!!errors.labName} helperText={errors.labName?.message} /></Grid>
              <Grid item xs={6}>
                <Controller name="department" control={control} render={({ field }) => (
                  <FormControl fullWidth size="small"><InputLabel>Department</InputLabel><Select {...field} label="Department"><MenuItem value="">None</MenuItem>{departments.map((d) => <MenuItem key={d._id} value={d._id}>{d.departmentName}</MenuItem>)}</Select></FormControl>
                )} />
              </Grid>
              <Grid item xs={6}><TextField fullWidth label="Capacity" type="number" {...register('capacity', { required: 'Required', min: 1 })} error={!!errors.capacity} helperText={errors.capacity?.message} /></Grid>
              <Grid item xs={6}><TextField fullWidth label="Building" {...register('building')} /></Grid>
              <Grid item xs={6}><TextField fullWidth label="Floor" {...register('floor')} /></Grid>
              <Grid item xs={12}>
                <Controller name="labType" control={control} render={({ field }) => (
                  <FormControl fullWidth size="small"><InputLabel>Lab Type</InputLabel><Select {...field} label="Lab Type"><MenuItem value="">Select type</MenuItem>{LAB_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}</Select></FormControl>
                )} />
              </Grid>
              <Grid item xs={6}><Controller name="hasParts" control={control} render={({ field }) => <FormControlLabel control={<Switch {...field} checked={field.value} />} label="Has Parts (A/B)" />} /></Grid>
              {hasParts && <Grid item xs={6}><Controller name="allowSimultaneousUse" control={control} render={({ field }) => <FormControlLabel control={<Switch {...field} checked={field.value} />} label="Allow Simultaneous Use" />} /></Grid>}
              {hasParts && (
                <>
                  <Grid item xs={12}><Typography variant="caption" fontWeight={700} color="text.secondary">PART A</Typography></Grid>
                  <Grid item xs={6}><TextField fullWidth label="Part A Capacity" type="number" {...register('parts.0.capacity')} /></Grid>
                  <Grid item xs={6}><TextField fullWidth label="Part A Location" {...register('parts.0.location')} /></Grid>
                  <Grid item xs={12}><Typography variant="caption" fontWeight={700} color="text.secondary">PART B</Typography></Grid>
                  <Grid item xs={6}><TextField fullWidth label="Part B Capacity" type="number" {...register('parts.1.capacity')} /></Grid>
                  <Grid item xs={6}><TextField fullWidth label="Part B Location" {...register('parts.1.location')} /></Grid>
                </>
              )}
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 1 }}><Button onClick={() => setDialogOpen(false)}>Cancel</Button><Button type="submit" variant="contained" sx={{ borderRadius: 2 }}>{editItem ? 'Update' : 'Create'}</Button></DialogActions>
        </form>
      </Dialog>

      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Confirm Delete</DialogTitle>
        <DialogContent><Typography>Delete this lab?</Typography></DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}><Button onClick={() => setDeleteId(null)}>Cancel</Button><Button onClick={handleDelete} variant="contained" color="error" sx={{ borderRadius: 2 }}>Delete</Button></DialogActions>
      </Dialog>
    </Box>
  );
}
