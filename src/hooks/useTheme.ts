import { useAppSelector } from '../store/hooks';
import { lightColors, darkColors, AppColors } from '../theme/colors';

export function useTheme(): AppColors {
  const mode = useAppSelector(state => state.theme.mode);
  return mode === 'dark' ? darkColors : lightColors;
}
