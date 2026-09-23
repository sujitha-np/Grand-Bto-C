import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  StatusBar,
  I18nManager,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../hooks/useTheme';
import { fs, sw, sh } from '../utils/responsive';
import Header from '../components/common/Header';
import { useAbout } from '../hooks/queries';

interface AboutScreenProps {
  onBack: () => void;
}

const parseParagraphs = (htmlOrText?: string): string[] => {
  if (!htmlOrText) return [];

  // If content contains HTML tags (e.g. <p>...</p>)
  if (/<[a-z][\s\S]*>/i.test(htmlOrText)) {
    const fromHtml = htmlOrText
      .replace(/<br\s*\/?>/gi, '\n')
      .split(/<\/p>/gi)
      .map(p =>
        p
          .replace(/<[^>]+>/g, '')
          .replace(/&nbsp;/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .trim(),
      )
      .filter(p => p.length > 0);
    if (fromHtml.length > 0) return fromHtml;
  }

  // If plain text, split by newlines
  return htmlOrText
    .split(/\n\s*\n/)
    .map(p => p.trim())
    .filter(p => p.length > 0);
};

function AboutScreen({ onBack }: AboutScreenProps) {
  const insets = useSafeAreaInsets();
  const { t, i18n } = useTranslation();
  const colors = useTheme();
  const isArabic = i18n.language?.startsWith('ar') || I18nManager.isRTL;
  const styles = React.useMemo(
    () => createStyles(colors, insets, isArabic),
    [colors, insets, isArabic],
  );

  const { data: aboutResponse, isLoading } = useAbout();
  const aboutData = aboutResponse?.data;
  const rawContent = isArabic
    ? aboutData?.about_ar || aboutData?.about_en || ''
    : aboutData?.about_en || aboutData?.about_ar || '';

  const paragraphs = React.useMemo(
    () => parseParagraphs(rawContent),
    [rawContent],
  );

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle={colors.statusBar}
        backgroundColor={colors.background}
      />

      {/* Header */}
      <Header title={t('account.about', 'About')} onBack={onBack} />

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {paragraphs.map((paragraph, index) => (
            <Text key={index} style={styles.paragraph}>
              {paragraph}
            </Text>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const createStyles = (colors: any, insets: any, isArabic: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      paddingTop: insets.top,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    scrollContent: {
      paddingHorizontal: sw(20),
      paddingTop: sh(16),
      paddingBottom: insets.bottom + sh(24),
    },
    paragraph: {
      fontSize: fs(14),
      fontFamily: colors.fontRegular || 'Manrope-Regular',
      color: colors.text,
      lineHeight: fs(24),
      textAlign: isArabic ? 'right' : 'left',
      marginBottom: sh(16),
    },
  });

export default AboutScreen;
