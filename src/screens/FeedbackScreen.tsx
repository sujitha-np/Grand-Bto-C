import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../hooks/useTheme';
import { fs, sw, sh } from '../utils/responsive';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSubmitFeedback } from '../hooks/queries';
import Toast from 'react-native-toast-message';

interface FeedbackScreenProps {
  onBack?: () => void;
  productId?: string; // Optional - if not provided, it's general feedback
}

type RatingType = 'angry' | 'sad' | 'neutral' | 'happy' | 'love' | null;

const FeedbackScreen: React.FC<FeedbackScreenProps> = ({
  onBack,
  productId: propProductId,
}) => {
  const { t } = useTranslation();
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const [selectedRating, setSelectedRating] = useState<RatingType>('happy');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [feedbackText, setFeedbackText] = useState('');
  const [customerId, setCustomerId] = useState<string>('');
  // Use provided productId - undefined if not provided
  const productId = propProductId;

  const submitFeedbackMutation = useSubmitFeedback();

  const styles = React.useMemo(
    () => createStyles(colors, insets),
    [colors, insets],
  );

  // Load customer ID from AsyncStorage
  useEffect(() => {
    const loadCustomerId = async () => {
      try {
        const storedCustomerId = await AsyncStorage.getItem('customerId');
        if (storedCustomerId) {
          setCustomerId(storedCustomerId);
        }
      } catch (error) {
        console.error('Error loading customerId:', error);
      }
    };
    loadCustomerId();
  }, []);

  const ratings = [
    { type: 'angry' as RatingType, emoji: '😡', label: '' },
    { type: 'sad' as RatingType, emoji: '😑', label: '' },
    { type: 'neutral' as RatingType, emoji: '🙂', label: '' },
    { type: 'happy' as RatingType, emoji: '😃', label: t('feedback.veryGood') },
    { type: 'love' as RatingType, emoji: '😍', label: '' },
  ];

  const tags = [
    t('feedback.greatQuality'),
    t('feedback.lovePackaging'),
    t('feedback.arrivedOnTime'),
    t('feedback.minorIssue'),
    t('feedback.wouldOrderAgain'),
  ];

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag],
    );
  };

  const getRatingValue = (rating: RatingType): string => {
    const ratingMap: Record<string, string> = {
      angry: '1',
      sad: '2',
      neutral: '3',
      happy: '4',
      love: '5',
    };
    return rating ? ratingMap[rating] : '3';
  };

  const handleSubmit = () => {
    if (!customerId) {
      console.error('Customer ID not found');
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Customer ID not found. Please login again.',
      });
      return;
    }

    console.log('=== FEEDBACK SUBMISSION START ===');
    console.log('Raw customerId:', customerId, 'Type:', typeof customerId);
    console.log(
      'Raw productId:',
      productId || '(not provided)',
      'Type:',
      typeof productId,
    );
    console.log('Selected rating:', selectedRating);
    console.log(
      'Rating value:',
      getRatingValue(selectedRating),
      'Type:',
      typeof getRatingValue(selectedRating),
    );
    console.log('Selected tags:', selectedTags);
    console.log('Feedback text:', feedbackText);

    const feedbackType = selectedTags.join(', ');
    const currentDate = new Date().toISOString().split('T')[0];

    const feedbackData: any = {
      customer_id: String(customerId),
      feedback: feedbackText.trim() || 'No detailed feedback provided',
      rating: String(getRatingValue(selectedRating)),
      feedback_type: feedbackType || 'General Feedback',
      feedback_date: currentDate,
    };

    // Only include product_id if provided
    if (productId) {
      feedbackData.product_id = String(productId);
    }

    console.log('=== FEEDBACK DATA PREPARED ===');
    console.log(
      'customer_id:',
      feedbackData.customer_id,
      'Type:',
      typeof feedbackData.customer_id,
    );
    console.log(
      'product_id:',
      feedbackData.product_id || '(not provided - will send 0)',
      'Type:',
      typeof feedbackData.product_id,
    );
    console.log(
      'feedback:',
      feedbackData.feedback,
      'Type:',
      typeof feedbackData.feedback,
    );
    console.log(
      'rating:',
      feedbackData.rating,
      'Type:',
      typeof feedbackData.rating,
    );
    console.log(
      'feedback_type:',
      feedbackData.feedback_type,
      'Type:',
      typeof feedbackData.feedback_type,
    );
    console.log(
      'feedback_date:',
      feedbackData.feedback_date,
      'Type:',
      typeof feedbackData.feedback_date,
    );
    console.log('Full feedback data:', JSON.stringify(feedbackData, null, 2));
    console.log('=== CALLING API ===');

    submitFeedbackMutation.mutate(feedbackData, {
      onSuccess: () => {
        console.log('=== SUBMISSION SUCCESS ===');
        if (onBack) {
          onBack();
        }
      },
    });
  };

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
        <Text style={styles.headerTitle}>{t('feedback.title')}</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Rating Section */}
        <Text style={styles.questionText}>{t('feedback.questionTitle')}</Text>

        <View style={styles.ratingsContainer}>
          {ratings.map(rating => (
            <TouchableOpacity
              key={rating.type}
              style={styles.ratingButton}
              onPress={() => setSelectedRating(rating.type)}
            >
              <View
                style={[
                  styles.emojiContainer,
                  selectedRating === rating.type &&
                    styles.emojiContainerSelected,
                ]}
              >
                <Text style={styles.emojiText}>{rating.emoji}</Text>
              </View>
              {rating.label ? (
                <Text style={styles.ratingLabel}>{rating.label}</Text>
              ) : null}
            </TouchableOpacity>
          ))}
        </View>

        {/* Tags Section */}
        <Text style={styles.sectionTitle}>{t('feedback.whatDoYouThink')}</Text>

        <View style={styles.tagsContainer}>
          {tags.map(tag => (
            <TouchableOpacity
              key={tag}
              style={[
                styles.tag,
                selectedTags.includes(tag) && styles.tagSelected,
              ]}
              onPress={() => toggleTag(tag)}
            >
              <Text
                style={[
                  styles.tagText,
                  selectedTags.includes(tag) && styles.tagTextSelected,
                ]}
              >
                {tag}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Text Input Section */}
        <Text style={styles.sectionTitle}>{t('feedback.tellUsAbout')}</Text>

        <TextInput
          style={styles.textInput}
          placeholder={t('feedback.placeholder')}
          placeholderTextColor={colors.textMuted}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
          value={feedbackText}
          onChangeText={setFeedbackText}
        />

        {/* Submit Button */}
        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit}
          disabled={submitFeedbackMutation.isPending}
        >
          {submitFeedbackMutation.isPending ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>{t('feedback.submit')}</Text>
          )}
        </TouchableOpacity>
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
    header: {
      flexDirection: 'row',
      alignItems: 'center',
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
      marginLeft: sw(8),
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: sw(20),
      paddingTop: sh(20),
      paddingBottom: sh(100),
    },
    questionText: {
      fontSize: fs(26),
      fontFamily: colors.fontBold,
      color: colors.text,
      marginBottom: sh(30),
      lineHeight: fs(34),
    },
    ratingsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: sh(40),
    },
    ratingButton: {
      alignItems: 'center',
    },
    emojiContainer: {
      width: sw(60),
      height: sw(60),
      borderRadius: sw(30),
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: sh(8),
    },
    emojiContainerSelected: {
      borderWidth: 3,
      borderColor: colors.primary,
      borderRadius: sw(30),
    },
    emojiText: {
      fontSize: fs(32),
    },
    ratingLabel: {
      fontSize: fs(12),
      fontFamily: colors.fontMedium,
      color: colors.text,
      marginTop: sh(4),
    },
    sectionTitle: {
      fontSize: fs(18),
      fontFamily: colors.fontSemiBold,
      color: colors.text,
      marginBottom: sh(16),
    },
    tagsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginBottom: sh(30),
      gap: sw(10),
    },
    tag: {
      paddingHorizontal: sw(16),
      paddingVertical: sh(10),
      borderRadius: sw(20),
      borderWidth: 1,
      borderColor: colors.border || '#E5E5E5',
      //   backgroundColor: colors.background,
    },
    tagSelected: {
      backgroundColor: colors.background,
      borderColor: '#FF7B00',
      borderWidth: 2,
    },
    tagText: {
      fontSize: fs(14),
      fontFamily: colors.fontInterRegular,
      color: colors.text,
    },
    tagTextSelected: {
      color: colors.text,
      fontFamily: colors.fontMedium,
    },
    textInput: {
      backgroundColor: 'transparent',
      borderRadius: sw(16),
      padding: sw(16),
      fontSize: fs(14),
      fontFamily: colors.fontRegular,
      color: colors.text,
      minHeight: sh(150),
      marginBottom: sh(30),
      borderWidth: 0.5,
      borderColor: colors.text,
    },
    submitButton: {
      backgroundColor: colors.primary,
      paddingVertical: sh(16),
      borderRadius: sw(30),
      alignItems: 'center',
    },
    submitButtonText: {
      fontSize: fs(16),
      fontFamily: colors.fontSemiBold,
      color: colors.white,
    },
  });

export default FeedbackScreen;
