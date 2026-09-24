import { Chip, Tooltip } from '@mui/material';
import CloudDoneIcon from '@mui/icons-material/CloudDone';
import CloudSyncIcon from '@mui/icons-material/CloudSync';
import CloudOffIcon from '@mui/icons-material/CloudOff';
import { useSync } from '@/hooks/useSync';

const CONFIG = {
  synced: { icon: <CloudDoneIcon fontSize="small" />, label: 'Synchronisé', color: 'success' as const },
  pending: { icon: <CloudSyncIcon fontSize="small" />, label: 'En attente', color: 'default' as const },
  error: { icon: <CloudOffIcon fontSize="small" />, label: 'Erreur de sync', color: 'error' as const },
};

export function SyncBadge() {
  const { status, syncNow } = useSync();
  const cfg = CONFIG[status];

  return (
    <Tooltip title={status === 'error' ? 'Toucher pour réessayer' : cfg.label}>
      <Chip
        icon={cfg.icon}
        label={cfg.label}
        color={cfg.color}
        size="small"
        variant="outlined"
        onClick={() => syncNow()}
        sx={{ cursor: 'pointer' }}
      />
    </Tooltip>
  );
}
