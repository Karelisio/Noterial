import { ToggleButton, ToggleButtonGroup } from '@mui/material';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import SettingsBrightnessIcon from '@mui/icons-material/SettingsBrightness';
import { useThemeMode, type ThemeMode } from '@/theme/ThemeProvider';

export function ThemeToggle() {
  const { mode, setMode } = useThemeMode();

  return (
    <ToggleButtonGroup
      value={mode}
      exclusive
      size="small"
      onChange={(_, next: ThemeMode | null) => next && setMode(next)}
      aria-label="thème"
    >
      <ToggleButton value="light" aria-label="clair">
        <LightModeIcon fontSize="small" />
      </ToggleButton>
      <ToggleButton value="auto" aria-label="auto">
        <SettingsBrightnessIcon fontSize="small" />
      </ToggleButton>
      <ToggleButton value="dark" aria-label="sombre">
        <DarkModeIcon fontSize="small" />
      </ToggleButton>
    </ToggleButtonGroup>
  );
}
