import React, { useEffect, useState, useCallback } from 'react';
import { Box, Button, Card, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination, IconButton, Chip, TextField, InputAdornment, Dialog, DialogTitle, DialogContent, DialogActions, Grid, Tooltip, CircularProgress, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import BusinessIcon from '@mui/icons-material/Business';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import PageHeader from '../../components/common/PageHeader';

const defaultValues = { departmentCode: '', departmentName: '', hodName: '', contactEmail: '', contactPhone: '' };

export default function Departments() {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const { register, handleSubmit, reset, formState: { errors } } = useForm({ defaultValues });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: res } = await api.get('/master/departments', { params: { page: page + 1, limit: rowsPerPage, search } });
      setData(res.data); setTotal(res.pagination.total);
    } catch { toast.error('Failed to load departments'); }
    setLoading(false);
  }, [page, rowsPerPage, search]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openAdd = () => { setEditItem(null); reset(defaultValues); setDialogOpen(true); };
  const openEdit = (item) => { setEditItem(item); reset(item); setDialogOpen(true); };

  const onSubmit = async (values) => {
    try {
      if (editItem) { await api.put(`/master/departments/${editItem._id}`, values); toast.success('Department updated'); }
      else { await api.post('/master/departments', values); toast.success('Department created'); }
      setDialogOpen(false); fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Operation failed'); }
  };

  const handleDelete = async () => {
    try { await api.delete(`/master/departments/${deleteId}`); toast.success('Department deleted'); setDeleteId(null); fetchData(); }
    catch (err) { toast.error(err.response?.data?.message || 'Delete failed'); }
  };

  return (
    <Box>
      <PageHeader title="Departments" subtitle="Manage academic departments" breadcrumbs={[{ label: 'Masters', path: '/masters/departments' }, { label: 'Departments' }]}
        action={<Button variant="contained" startIcon={<AddIcon />} onClick={openAdd} sx={{ borderRadius: 3 }}>Add Department</Button>} />

      <Card>
        <Box sx={{ p: 2, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField placeholder="Search departments..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }} sx={{ maxWidth: 300 }} />
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                {['Code', 'Name', 'HOD', 'Contact Email', 'Phone', 'Status', 'Actions'].map((h) => (
                  <TableCell key={h} sx={{ fontWeight: 700 }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} align="center" sx={{ py: 6 }}><CircularProgress /></TableCell></TableRow>
              ) : data.length === 0 ? (
                <TableRow><TableCell colSpan={7} align="center" sx={{ py: 6 }}><BusinessIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} /><br /><Typography color="text.secondary">No departments found</Typography></TableCell></TableRow>
              ) : data.map((row) => (
                <TableRow key={row._id} hover>
                  <TableCell><Chip label={row.departmentCode} size="small" sx={{ fontWeight: 700, bgcolor: '#EEF2FF', color: 'primary.dark' }} /></TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{row.departmentName}</TableCell>
                  <TableCell>{row.hodName || '—'}</TableCell>
                  <TableCell>{row.contactEmail || '—'}</TableCell>
                  <TableCell>{row.contactPhone || '—'}</TableCell>
                  <TableCell><Chip label={row.isActive ? 'Active' : 'Inactive'} size="small" color={row.isActive ? 'success' : 'default'} /></TableCell>
                  <TableCell>
                    <Tooltip title="Edit"><IconButton size="small" onClick={() => openEdit(row)} sx={{ color: 'primary.main' }}><EditIcon fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title="Delete"><IconButton size="small" onClick={() => setDeleteId(row._id)} sx={{ color: 'error.main' }}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination component="div" count={total} page={page} rowsPerPage={rowsPerPage} onPageChange={(_, p) => setPage(p)} onRowsPerPageChange={(e) => { setRowsPerPage(+e.target.value); setPage(0); }} rowsPerPageOptions={[5, 10, 25]} />
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>{editItem ? 'Edit Department' : 'Add Department'}</DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 0 }}>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Department Code" {...register('departmentCode', { required: 'Required' })} error={!!errors.departmentCode} helperText={errors.departmentCode?.message} inputProps={{ style: { textTransform: 'uppercase' } }} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Department Name" {...register('departmentName', { required: 'Required' })} error={!!errors.departmentName} helperText={errors.departmentName?.message} />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label="HOD Name" {...register('hodName')} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Contact Email" type="email" {...register('contactEmail')} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Contact Phone" {...register('contactPhone')} />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 1 }}>
            <Button onClick={() => setDialogOpen(false)} sx={{ borderRadius: 2 }}>Cancel</Button>
            <Button type="submit" variant="contained" sx={{ borderRadius: 2 }}>{editItem ? 'Update' : 'Create'}</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Confirm Delete</DialogTitle>
        <DialogContent><Typography>Are you sure you want to delete this department? This action cannot be undone.</Typography></DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button onClick={handleDelete} variant="contained" color="error" sx={{ borderRadius: 2 }}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
