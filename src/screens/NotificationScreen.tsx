import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../hooks/useTheme';
import { useNotifications } from '../hooks/queries';
import { NotificationItem } from '../services/api/notification';
import { fs, sw, sh } from '../utils/responsive';
import Header from '../components/common/Header';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Images } from '../assets/images';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { markNotificationsAsRead, getReadNotificationIds } from '../utils/notifications';
import { useQueryClient } from '@tanstack/react-query';

interface NotificationScreenProps {
  onBack: () => void;
  customerId?: string | number;
}

function NotificationScreen({ onBack, customerId: propCustomerId }: NotificationScreenProps) {
  const { t } = useTranslation();
  const colors = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [customerId, setCustomerId] = useState<string | undefined>(
    propCustomerId ? String(propCustomerId) : undefined,
  );
  const [refreshing, setRefreshing] = useState(false);
  const [readIds, setReadIds] = useState<number[]>([]);

  useEffect(() => {
    if (!customerId) {
      const getCustomerId = async () => {
        const id = await AsyncStorage.getItem('customerId');
        if (id) setCustomerId(id);
      };
      getCustomerId();
    }
  }, [customerId]);

  useEffect(() => {
    const loadReadIds = async () => {
      const ids = await getReadNotificationIds();
      setReadIds(ids);
    };
    loadReadIds();
  }, []);

  const { data, isLoading, error, refetch } = useNotifications(customerId);

  const notifications = data?.data?.notifications || [];

  useEffect(() => {
    if (notifications.length > 0) {
      const ids = notifications.map(n => n.id);
      markNotificationsAsRead(ids).then(updatedIds => {
        setReadIds(updatedIds);
      });

      // Update query client cache so unread_count is 0
      if (customerId) {
        queryClient.setQueryData(['notifications', customerId], (prev: any) => {
          if (!prev?.data) return prev;
          return {
            ...prev,
            data: {
              ...prev.data,
              unread_count: 0,
              notifications: prev.data.notifications.map((n: any) => ({
                ...n,
                is_read: true,
              })),
            },
          };
        });
      }
    }
  }, [notifications.length, customerId, queryClient]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'order_placed':
      case 'order_status':
      case 'order':
        return Images.orderActive;
      case 'offer':
      case 'promo':
        return Images.coupon;
      default:
        return Images.notification;
    }
  };

  const renderNotificationItem = ({ item }: { item: NotificationItem }) => {
    const isUnread = !item.is_read && !readIds.includes(item.id);

    return (
      <View
        style={[
          styles.notificationCard,
          isUnread && styles.unreadCard,
        ]}
      >
        <View style={styles.iconCircle}>
          <Image
            source={getNotificationIcon(item.type)}
            style={styles.cardIcon}
            resizeMode="contain"
          />
        </View>

        <View style={styles.contentContainer}>
          <View style={styles.titleRow}>
            <Text
              style={[
                styles.title,
                isUnread && styles.unreadTitle,
              ]}
              numberOfLines={1}
            >
              {item.title}
            </Text>
            {isUnread && <View style={styles.unreadDot} />}
          </View>

          <Text style={styles.message}>{item.message}</Text>

          {item.created_time ? (
            <Text style={styles.timeText}>{item.created_time}</Text>
          ) : item.created_at ? (
            <Text style={styles.timeText}>
              {new Date(item.created_at).toLocaleDateString()}
            </Text>
          ) : null}
        </View>
      </View>
    );
  };

  if (isLoading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <Header
          title={t('settings.notifications')}
          onBack={onBack}
          containerStyle={{
            backgroundColor: colors.background,
            paddingBottom: sh(16),
            paddingTop: insets.top + sh(12),
          }}
        />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <Header
          title={t('settings.notifications')}
          onBack={onBack}
          containerStyle={{
            backgroundColor: colors.background,
            paddingBottom: sh(16),
            paddingTop: insets.top + sh(12),
          }}
        />
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Failed to load notifications</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => refetch()}
            activeOpacity={0.8}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title={t('settings.notifications')}
        onBack={onBack}
        containerStyle={{
          backgroundColor: colors.background,
          paddingBottom: sh(16),
          paddingTop: insets.top + sh(12),
        }}
      />

      <FlatList
        data={notifications}
        renderItem={renderNotificationItem}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.centerContainer}>
            <View style={styles.emptyIconCircle}>
              <Image
                source={Images.notification}
                style={styles.emptyIcon}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.emptyTitle}>No Notifications</Text>
            <Text style={styles.emptySubtitle}>
              You don't have any notifications right now.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    centerContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: sw(30),
      paddingVertical: sh(60),
    },
    listContent: {
      paddingHorizontal: sw(20),
      paddingTop: sh(12),
      paddingBottom: sh(30),
    },
    notificationCard: {
      flexDirection: 'row',
      backgroundColor: colors.card,
      borderRadius: sw(16),
      padding: sw(16),
      marginBottom: sh(12),
      alignItems: 'flex-start',
      gap: sw(14),
      borderWidth: 1,
      borderColor: colors.borderSubtle || '#EEEEEE',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 6,
      elevation: 2,
    },
    unreadCard: {
      borderColor: '#FFDDB3',
      backgroundColor: colors.primaryLight || '#FFF8F2',
    },
    iconCircle: {
      width: sw(42),
      height: sw(42),
      borderRadius: sw(21),
      backgroundColor: '#FFE9D5',
      justifyContent: 'center',
      alignItems: 'center',
    },
    cardIcon: {
      width: sw(22),
      height: sw(22),
      tintColor: colors.primary,
    },
    contentContainer: {
      flex: 1,
    },
    titleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: sh(4),
    },
    title: {
      fontSize: fs(14),
      color: colors.text,
      fontFamily: colors.fontSemiBold,
      flex: 1,
    },
    unreadTitle: {
      fontFamily: colors.fontBold,
      color: colors.text,
    },
    unreadDot: {
      width: sw(8),
      height: sw(8),
      borderRadius: sw(4),
      backgroundColor: colors.primary,
      marginLeft: sw(6),
    },
    message: {
      fontSize: fs(13),
      color: colors.textSecondary,
      fontFamily: colors.fontRegular,
      lineHeight: fs(18),
      marginBottom: sh(6),
    },
    timeText: {
      fontSize: fs(11),
      color: colors.textMuted || '#888888',
      fontFamily: colors.fontMedium,
    },
    emptyIconCircle: {
      width: sw(80),
      height: sw(80),
      borderRadius: sw(40),
      backgroundColor: '#FFF4E5',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: sh(16),
    },
    emptyIcon: {
      width: sw(40),
      height: sw(40),
      tintColor: colors.primary,
    },
    emptyTitle: {
      fontSize: fs(18),
      color: colors.text,
      fontFamily: colors.fontBold,
      marginBottom: sh(6),
      textAlign: 'center',
    },
    emptySubtitle: {
      fontSize: fs(13),
      color: colors.textMuted || '#888888',
      fontFamily: colors.fontRegular,
      textAlign: 'center',
      lineHeight: fs(18),
    },
    errorText: {
      fontSize: fs(15),
      color: '#FF3B30',
      fontFamily: colors.fontMedium,
      textAlign: 'center',
      marginBottom: sh(16),
    },
    retryButton: {
      backgroundColor: colors.primary,
      paddingVertical: sh(10),
      paddingHorizontal: sw(24),
      borderRadius: sw(8),
    },
    retryButtonText: {
      color: '#FFFFFF',
      fontSize: fs(14),
      fontFamily: colors.fontSemiBold,
    },
  });

export default NotificationScreen;
