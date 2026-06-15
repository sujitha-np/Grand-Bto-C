import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StatusBar,
  RefreshControl,
  ImageBackground,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../hooks/useTheme';
import { fs, sw, sh } from '../utils/responsive';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLoyaltyPoints, useCustomerProfile } from '../hooks/queries';
import { PointHistory } from '../services/api/loyalty';
import { Images } from '../assets/images';

interface LoyaltyPointsScreenProps {
  onBack?: () => void;
}

const LoyaltyPointsScreen: React.FC<LoyaltyPointsScreenProps> = ({
  onBack,
}) => {
  const { t } = useTranslation();
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const [customerId, setCustomerId] = useState<string | undefined>(undefined);
  const [refreshing, setRefreshing] = useState(false);

  console.log('LoyaltyPointsScreen rendered');

  const styles = React.useMemo(
    () => createStyles(colors, insets),
    [colors, insets],
  );

  useEffect(() => {
    const fetchCustomer = async () => {
      const id = await AsyncStorage.getItem('customerId');
      if (id) {
        setCustomerId(id);
      }
    };
    fetchCustomer();
  }, []);

  const {
    data: loyaltyResponse,
    isLoading,
    refetch,
  } = useLoyaltyPoints(customerId);

  const { data: profileResponse } = useCustomerProfile(customerId);
  const userName = profileResponse?.data?.name_en || 'Sara';

  const [showAll, setShowAll] = useState(false);

  const totalPoints = loyaltyResponse?.data?.total_loyalty_points || 0;
  const pointsHistory = loyaltyResponse?.data?.points_history || [];

  const isToday = (dateString?: string) => {
    if (!dateString) return false;
    try {
      const date = new Date(dateString);
      const today = new Date();
      return (
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear()
      );
    } catch (e) {
      return false;
    }
  };

  const todayHistory = pointsHistory.filter(item => isToday(item.created_at));
  const historyToDisplay = showAll
    ? pointsHistory
    : todayHistory.length > 0
    ? todayHistory
    : pointsHistory.slice(0, 5);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      if (refetch) {
        await refetch();
      }
    } catch (error) {
      console.error('Error refreshing loyalty points:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      const isTodayVal = isToday(dateString);
      const day = date.getDate();
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = months[date.getMonth()];
      
      if (isTodayVal) {
        return `Today ${day} ${month}`;
      } else {
        return `${day} ${month} ${date.getFullYear()}`;
      }
    } catch (e) {
      return dateString || '';
    }
  };

  const renderHistoryItem = (item: PointHistory) => {
    const isCredit = item.points_earned >= 0;
    const points = Math.abs(item.points_earned || 0);

    return (
      <View key={item.id} style={styles.historyItem}>
        <View style={styles.historyIconContainer}>
          <Image source={Images.account} style={styles.historyIcon} />
        </View>
        <View style={styles.historyDetails}>
          <Text style={styles.historyName}>
            {item.order?.unique_id || userName}
          </Text>
          <Text style={styles.historyDate}>
            {formatDate(item.created_at)}
          </Text>
        </View>
        <Text
          style={[
            styles.historyPoints,
            isCredit ? styles.creditPoints : styles.debitPoints,
          ]}
        >
          {isCredit ? '+' : '-'}
          {points} {t('loyaltyPoints.points')}
        </Text>
      </View>
    );
  };

  if (isLoading && !refreshing) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle={colors.statusBar}
        backgroundColor={colors.background}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={onBack}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Text style={styles.backIcon}>{'<'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('loyaltyPoints.title')}</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Points Card */}
        <View style={styles.pointsCardContainer}>
          <ImageBackground
            source={Images.loyalityBg}
            style={styles.pointsCard}
            imageStyle={styles.pointsCardImage}
            resizeMode="cover"
          >
            <View style={styles.pointsCardContent}>
              <Text style={styles.pointsValue}>
                {totalPoints}{' '}
                <Text style={styles.pointsLabel}>
                  {t('loyaltyPoints.points')}
                </Text>
              </Text>
            </View>
          </ImageBackground>
        </View>

        {/* Point History Section */}
        <View style={styles.historySection}>
          <View style={styles.historySectionHeader}>
            <Text style={styles.historySectionTitle}>
              {t('loyaltyPoints.pointHistory')}
            </Text>
            <TouchableOpacity onPress={() => setShowAll(prev => !prev)}>
              <Text style={styles.seeAllButton}>
                {showAll ? 'Show less <' : `${t('loyaltyPoints.seeAll')} >`}
              </Text>
            </TouchableOpacity>
          </View>

          {historyToDisplay.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                {t('loyaltyPoints.noHistory')}
              </Text>
            </View>
          ) : (
            <View style={styles.historyList}>
              {historyToDisplay.map(item => renderHistoryItem(item))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const createStyles = (colors: any, insets: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    centerContent: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: sw(16),
      paddingTop: insets.top + sh(10),
      paddingBottom: sh(16),
      backgroundColor: colors.background,
    },
    backButton: {
      width: sw(40),
      height: sw(40),
      borderRadius: sw(20),
      backgroundColor: colors.card,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    backIcon: {
      fontSize: fs(24),
      fontFamily: colors.fontRegular,
      color: colors.text,
    },
    headerTitle: {
      fontSize: fs(18),
      fontFamily: colors.fontSemiBold,
      color: colors.text,
      flex: 1,
      textAlign: 'center',
    },
    headerRight: {
      width: sw(40),
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: sw(20),
      paddingTop: sh(20),
      paddingBottom: sh(40),
    },
    pointsCardContainer: {
      marginBottom: sh(32),
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 6,
      borderRadius: sw(20),
    },
    pointsCard: {
      width: '100%',
      minHeight: sh(220),
      borderRadius: sw(20),
      overflow: 'hidden',
    },
    pointsCardImage: {
      borderRadius: sw(20),
    },
    pointsCardContent: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: sh(40),
      paddingHorizontal: sw(24),
      borderRadius: sw(20),
    },
    pointsValue: {
      fontSize: fs(64),
      fontFamily: colors.fontBold,
      color: '#3B2B20',
      marginBottom: sh(12),
    },
    pointsLabel: {
      fontSize: fs(32),
      fontFamily: colors.fontSemiBold,
      color: '#3B2B20',
    },
    pointsDescription: {
      fontSize: fs(12),
      fontFamily: colors.fontRegular,
      color: '#3B2B20',
      textAlign: 'center',
      opacity: 0.7,
      lineHeight: fs(18),
      paddingHorizontal: sw(20),
    },
    historySection: {
      marginTop: sh(8),
    },
    historySectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: sh(16),
    },
    historySectionTitle: {
      fontSize: fs(18),
      fontFamily: colors.fontSemiBold,
      color: colors.text,
    },
    seeAllButton: {
      fontSize: fs(14),
      fontFamily: colors.fontMedium,
      color: colors.textMuted,
    },
    historyList: {
      backgroundColor: colors.card,
      borderRadius: sw(12),
      padding: sw(4),
    },
    historyItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: sh(16),
      paddingHorizontal: sw(12),
    },
    historyIconContainer: {
      width: sw(48),
      height: sw(48),
      borderRadius: sw(24),
      backgroundColor: colors.offWhite,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: sw(12),
    },
    historyIcon: {
      width: sw(24),
      height: sw(24),
      tintColor: colors.text,
    },
    historyDetails: {
      flex: 1,
    },
    historyName: {
      fontSize: fs(14),
      fontFamily: colors.fontSemiBold,
      color: colors.text,
      marginBottom: sh(4),
    },
    historyDate: {
      fontSize: fs(12),
      fontFamily: colors.fontRegular,
      color: colors.textMuted,
    },
    historyPoints: {
      fontSize: fs(14),
      fontFamily: colors.fontSemiBold,
    },
    creditPoints: {
      color: '#4CAF50',
    },
    debitPoints: {
      color: '#FF3B30',
    },
    emptyState: {
      paddingVertical: sh(40),
      alignItems: 'center',
    },
    emptyStateText: {
      fontSize: fs(14),
      fontFamily: colors.fontMedium,
      color: colors.textMuted,
    },
  });

export default LoyaltyPointsScreen;
