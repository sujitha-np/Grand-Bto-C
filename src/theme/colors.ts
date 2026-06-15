import { StatusBarStyle } from 'react-native';

export interface AppColors {
  primary: string;
  primaryLight: string;
  background: string;
  surface: string;
  card: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  textPlaceholder: string;
  border: string;
  borderSubtle: string;
  inputBackground: string;
  inputBorder: string;
  inputBorderFocused: string;
  success: string;
  white: string;
  statusBar: StatusBarStyle;
  headerBackground: string;
  fontBold: string;
  fontSemiBold: string;
  fontMedium: string;
  fontRegular: string;
  fontInterMedium: string;
  fontInterSemiBold: string;
  fontInterRegular: string;
  darkBrown: string;
  lightBrown: string;
  lightGray: string;
  offWhite: string;
  placeholderGray: string;
}

export const lightColors: AppColors = {
  primary: '#FF7B00',
  primaryLight: '#FFF8F2',
  background: '#FFFFFF',
  surface: '#F5F5F5',
  card: '#FFFFFF',
  text: '#3B2B20',
  textSecondary: '#252525',
  textMuted: '#888888',
  textPlaceholder: '#AAAAAA',
  border: '#CCCCCC',
  borderSubtle: '#EEEEEE',
  inputBackground: '#F5F5F5',
  inputBorder: 'transparent',
  inputBorderFocused: '#FF7B00',
  success: '#448C07',
  white: '#FFFFFF',
  statusBar: 'dark-content',
  headerBackground: '#FFFFFF',
  fontBold: 'Manrope-Bold',
  fontSemiBold: 'Manrope-SemiBold',
  fontMedium: 'Manrope-Medium',
  fontRegular: 'Manrope-Regular',
  fontInterMedium: 'Inter-Medium',
  fontInterSemiBold: 'Inter-SemiBold',
  fontInterRegular: 'Inter-Regular',
  darkBrown: '#3B2B20',
  lightBrown: '#B88A52',
  lightGray: '#252525',
  offWhite: '#F7F5F1',
  placeholderGray: '#252525',
};

export const darkColors: AppColors = {
  primary: '#FF7B00',
  primaryLight: '#2A1A00',
  background: '#0F0F0F',
  surface: '#1C1C1C',
  card: '#1A1A1A',
  text: '#F0F0F0',
  textSecondary: '#BBBBBB',
  textMuted: '#777777',
  textPlaceholder: '#555555',
  border: '#333333',
  borderSubtle: '#2A2A2A',
  inputBackground: '#1C1C1C',
  inputBorder: 'transparent',
  inputBorderFocused: '#FF7B00',
  success: '#448C07',
  white: '#FFFFFF',
  statusBar: 'light-content',
  headerBackground: '#1A1A1A',
  fontBold: 'Manrope-Bold',
  fontSemiBold: 'Manrope-SemiBold',
  fontMedium: 'Manrope-Medium',
  fontRegular: 'Manrope-Regular',
  fontInterMedium: 'Inter-Medium',
  fontInterSemiBold: 'Inter-SemiBold',
  fontInterRegular: 'Inter-Regular',
  darkBrown: '#F0F0F0',
  lightBrown: '#B88A52',
  lightGray: '#252525',
  offWhite: '#222222',
  placeholderGray: '#777777',
};
