import React, { useEffect, useState, useCallback } from 'react';
import { Box, Card, Grid, Typography, Chip, Button, CircularProgress, Table, TableHead, TableRow, TableCell, TableBody, TableContainer, IconButton, Tooltip, TextField, InputAdornment, Select, MenuItem, FormControl, InputLabel, TablePagination } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PublishIcon from '@mui/icons-material/Publish';
import ArchiveIcon from '@mui/icons-material/Archive';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../utils/api';
import PageHeader from '../components/common/PageHeader';

const STATUS_COLORS = { draft: 'warning', published: 'success', archived: 'default' };

export default function ViewTimetables() {
  const navigate = useNavigate();
  const [data, setData] = useState([]); const [total, setTotal] = useState(0); const [page, setPage] = useState(0); const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(false); const [status, setStatus] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try { const { data: res } = await api.get('/timetable', { params: { page: page + 1, limit: rowsPerPage, status: status || undefined } }); setData(res.data); setTotal(res.pagination.total); }
    catch { toast.error('Failed to load timetables'); }
    setLoading(false);
  }, [page, rowsPerPage, status]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handlePublish = async (id) => {
    try { await api.put(`/timetable/${id}/publish`); toast.success('Timetable published!'); fetchData(); }
    catch (err) { toast.error(err.response?.data?.message || 'Publish failed'); }
  };

  const handleArchive = async (id) => {
    try { await api.put(`/timetable/${id}/archive`); toast.success('Timetable archived'); fetchData(); }
    catch (err) { toast.error('Archive failed'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this timetable?')) return;
    try { await api.delete(`/timetable/${id}`); toast.success('Deleted'); fetchData(); }
    catch { toast.error('Delete failed'); }
  };

  return (
    <Box>
      <PageHeader title="Timetables" subtitle="Manage all generated timetables" action={<Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/timetable/generate')} sx={{ borderRadius: 3 }}>Generate New</Button>} />
      <Card>
        <Box sx={{ p: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Status</InputLabel>
            <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(0); }} label="Status">
              <MenuItem value="">All</MenuItem>
              <MenuItem value="draft">Draft</MenuItem>
              <MenuItem value="published">Published</MenuItem>
              <MenuItem value="archived">Archived</MenuItem>
            </Select>
          </FormControl>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                {['Name', 'Academic Year', 'Semester', 'Classes', 'Fitness Score', 'Algorithm', 'Status', 'Created', 'Actions'].map((h) => <TableCell key={h} sx={{ fontWeight: 700 }}>{h}</TableCell>)}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? <TableRow><TableCell colSpan={9} align="center" sx={{ py: 6 }}><CircularProgress /></TableCell></TableRow>
                : data.length === 0 ? <TableRow><TableCell colSpan={9} align="center" sx={{ py: 6 }}><Typography color="text.secondary">No timetables found. <Button size="small" onClick={() => navigate('/timetable/generate')}>Generate one?</Button></Typography></TableCell></TableRow>
                : data.map((row) => (
                  <TableRow key={row._id} hover>
                    <TableCell sx={{ fontWeight: 600, maxWidth: 200 }}>{row.timetableName}</TableCell>
                    <TableCell>{row.academicYear}</TableCell>
                    <TableCell><Chip label={row.semester} size="small" color="secondary" /></TableCell>
                    <TableCell><Chip label={`${row.schedule?.length || 0}`} size="small" /></TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip label={`${row.fitnessScore || 0}/1000`} size="small" color={row.fitnessScore >= 900 ? 'success' : row.fitnessScore >= 700 ? 'warning' : 'error'} />
                      </Box>
                    </TableCell>
                    <TableCell><Chip label={row.algorithm || 'genetic'} size="small" variant="outlined" /></TableCell>
                    <TableCell><Chip label={row.status} size="small" color={STATUS_COLORS[row.status]} /></TableCell>
                    <TableCell>{new Date(row.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Tooltip title="View"><IconButton size="small" onClick={() => navigate(`/timetable/view/${row._id}`)} sx={{ color: 'primary.main' }}><VisibilityIcon fontSize="small" /></IconButton></Tooltip>
                      {row.status === 'draft' && <Tooltip title="Publish"><IconButton size="small" onClick={() => handlePublish(row._id)} sx={{ color: 'success.main' }}><PublishIcon fontSize="small" /></IconButton></Tooltip>}
                      {row.status !== 'archived' && <Tooltip title="Archive"><IconButton size="small" onClick={() => handleArchive(row._id)} sx={{ color: 'text.secondary' }}><ArchiveIcon fontSize="small" /></IconButton></Tooltip>}
                      <Tooltip title="Delete"><IconButton size="small" onClick={() => handleDelete(row._id)} sx={{ color: 'error.main' }}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination component="div" count={total} page={page} rowsPerPage={rowsPerPage} onPageChange={(_, p) => setPage(p)} onRowsPerPageChange={(e) => { setRowsPerPage(+e.target.value); setPage(0); }} rowsPerPageOptions={[5, 10, 25]} />
      </Card>
    </Box>
  );
}
