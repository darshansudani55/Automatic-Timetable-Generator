import React from 'react';
import { Box, Typography, Breadcrumbs, Link } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';

export default function PageHeader({ title, subtitle, action, breadcrumbs }) {
  const navigate = useNavigate();
  return (
    <Box sx={{ mb: 3 }}>
      {breadcrumbs && (
        <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ mb: 1 }}>
          {breadcrumbs.map((crumb, i) =>
            i < breadcrumbs.length - 1 ? (
              <Link key={i} underline="hover" color="text.secondary" sx={{ cursor: 'pointer', fontSize: '0.8rem' }} onClick={() => navigate(crumb.path)}>{crumb.label}</Link>
            ) : (
              <Typography key={i} color="text.primary" sx={{ fontSize: '0.8rem', fontWeight: 600 }}>{crumb.label}</Typography>
            )
          )}
        </Breadcrumbs>
      )}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={800} gutterBottom={!!subtitle}>{title}</Typography>
          {subtitle && <Typography color="text.secondary" variant="body2">{subtitle}</Typography>}
        </Box>
        {action && <Box>{action}</Box>}
      </Box>
    </Box>
  );
}
