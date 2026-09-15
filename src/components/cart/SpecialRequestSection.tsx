import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { useTranslation } from 'react-i18next';
import { fs, sw, sh } from '../../utils/responsive';
import { Images } from '../../assets/images';
import { BASE_URL } from '../../constants/api';

export interface SpecialRequestImageFile {
  uri: string;
  name?: string;
  type?: string;
}

interface SpecialRequestSectionProps {
  colors: any;
  specialRequest?: string;
  specialRequestImage?: string | null;
  onAddPress?: () => void;
  onSave?: (
    text: string,
    imageFile?: SpecialRequestImageFile | null,
  ) => void;
}

export default function SpecialRequestSection({
  colors,
  specialRequest = '',
  specialRequestImage = null,
  onAddPress,
  onSave,
}: SpecialRequestSectionProps) {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language?.startsWith('ar');

  const [showInput, setShowInput] = useState(false);
  const [requestText, setRequestText] = useState(specialRequest);
  const [selectedImage, setSelectedImage] = useState<SpecialRequestImageFile | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(specialRequestImage);
  const [imageRemoved, setImageRemoved] = useState(false);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [previewImageUri, setPreviewImageUri] = useState<string | null>(null);

  useEffect(() => {
    if (specialRequest !== undefined) {
      setRequestText(specialRequest || '');
      if (!specialRequest) {
        setShowInput(false);
      }
    }
  }, [specialRequest]);

  useEffect(() => {
    if (specialRequestImage !== undefined) {
      setExistingImageUrl(specialRequestImage);
      if (!specialRequestImage) {
        setSelectedImage(null);
        setImageRemoved(false);
      } else {
        setImageRemoved(false);
      }
    }
  }, [specialRequestImage]);

  const getImageUri = (imgSource: string | null): string | null => {
    if (!imgSource) return null;
    if (
      imgSource.startsWith('http://') ||
      imgSource.startsWith('https://') ||
      imgSource.startsWith('file:') ||
      imgSource.startsWith('content:')
    ) {
      return imgSource;
    }
    return `${BASE_URL}${imgSource.startsWith('/') ? '' : '/'}${imgSource}`;
  };

  const handleAddPress = () => {
    setRequestText(specialRequest);
    setSelectedImage(null);
    setExistingImageUrl(specialRequestImage);
    setImageRemoved(false);
    setShowInput(true);
    if (onAddPress) onAddPress();
  };

  const handleTakePhoto = () => {
    launchCamera(
      {
        mediaType: 'photo',
        includeBase64: false,
        maxHeight: 1200,
        maxWidth: 1200,
        quality: 0.8,
        saveToPhotos: false,
      },
      response => {
        if (response.didCancel) {
          console.log('User cancelled camera');
        } else if (response.errorMessage) {
          console.log('Camera Error: ', response.errorMessage);
          Alert.alert('Error', response.errorMessage);
        } else if (response.assets && response.assets.length > 0) {
          const asset = response.assets[0];
          if (asset.uri) {
            setSelectedImage({
              uri: asset.uri,
              name: asset.fileName || `special_request_${Date.now()}.jpg`,
              type: asset.type || 'image/jpeg',
            });
            setExistingImageUrl(null);
            setImageRemoved(false);
          }
        }
      },
    );
  };

  const handleChooseFromLibrary = () => {
    launchImageLibrary(
      {
        mediaType: 'photo',
        includeBase64: false,
        maxHeight: 1200,
        maxWidth: 1200,
        quality: 0.8,
      },
      response => {
        if (response.didCancel) {
          console.log('User cancelled image picker');
        } else if (response.errorMessage) {
          console.log('ImagePicker Error: ', response.errorMessage);
          Alert.alert('Error', response.errorMessage);
        } else if (response.assets && response.assets.length > 0) {
          const asset = response.assets[0];
          if (asset.uri) {
            setSelectedImage({
              uri: asset.uri,
              name: asset.fileName || `special_request_${Date.now()}.jpg`,
              type: asset.type || 'image/jpeg',
            });
            setExistingImageUrl(null);
            setImageRemoved(false);
          }
        }
      },
    );
  };

  const handleImagePickerPress = () => {
    Alert.alert(
      isArabic ? 'رفع صورة' : 'Upload Image',
      isArabic ? 'اختر طريقة رفع الصورة' : 'Choose an option to upload an image',
      [
        {
          text: isArabic ? 'التقاط صورة' : 'Take Photo',
          onPress: handleTakePhoto,
        },
        {
          text: isArabic ? 'اختيار من المعرض' : 'Choose from Library',
          onPress: handleChooseFromLibrary,
        },
        {
          text: isArabic ? 'إلغاء' : 'Cancel',
          style: 'cancel',
        },
      ],
    );
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setExistingImageUrl(null);
    setImageRemoved(true);
  };

  const handleSave = () => {
    if (onSave) {
      const imgParam = selectedImage
        ? selectedImage
        : imageRemoved
        ? null
        : undefined;
      onSave(requestText.trim(), imgParam);
    }
    setShowInput(false);
  };

  const currentDisplayImageUri =
    selectedImage?.uri || getImageUri(existingImageUrl);

  const hasSavedContent =
    (specialRequest && specialRequest.trim().length > 0) ||
    !!specialRequestImage;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Image
          source={Images.chatBubble}
          style={[styles.icon, { tintColor: colors.text }]}
        />
        <Text
          style={[
            styles.title,
            { color: colors.text, fontFamily: colors.fontBold },
          ]}
        >
          {isArabic ? 'أي طلب خاص' : 'Any special request'}
        </Text>
      </View>

      {!showInput ? (
        hasSavedContent ? (
          <View
            style={[
              styles.savedContainer,
              {
                borderColor: colors.borderSubtle,
                backgroundColor: colors.inputBackground || colors.background,
              },
            ]}
          >
            <View style={styles.savedContent}>
              {specialRequest ? (
                <Text
                  style={[
                    styles.savedText,
                    { color: colors.text, fontFamily: colors.fontRegular },
                  ]}
                >
                  {specialRequest}
                </Text>
              ) : null}

              {specialRequestImage ? (
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={styles.savedImageThumbWrapper}
                  onPress={() => {
                    const uri = getImageUri(specialRequestImage);
                    if (uri) {
                      setPreviewImageUri(uri);
                      setPreviewModalVisible(true);
                    }
                  }}
                >
                  <Image
                    source={{ uri: getImageUri(specialRequestImage)! }}
                    style={styles.savedImageThumb}
                    resizeMode="cover"
                  />
                  <Text
                    style={[
                      styles.savedImageLabel,
                      { color: colors.textMuted, fontFamily: colors.fontRegular },
                    ]}
                  >
                    {isArabic ? 'صورة مرفقة' : 'Image attached'} 🔍
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>

            <TouchableOpacity
              style={[
                styles.editBtn,
                {
                  borderColor: colors.borderSubtle,
                  backgroundColor: colors.background,
                },
              ]}
              onPress={() => {
                setRequestText(specialRequest);
                setSelectedImage(null);
                setExistingImageUrl(specialRequestImage);
                setImageRemoved(false);
                setShowInput(true);
              }}
            >
              <Text
                style={[
                  styles.editBtnText,
                  { color: colors.primary, fontFamily: colors.fontRegular },
                ]}
              >
                {isArabic ? 'تعديل' : 'Edit'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={[
              styles.addBtn,
              {
                borderColor: colors.borderSubtle,
                backgroundColor: colors.background,
              },
            ]}
            onPress={handleAddPress}
          >
            <Text
              style={[
                styles.addBtnText,
                { color: colors.darkBrown, fontFamily: colors.fontRegular },
              ]}
            >
              {isArabic ? '+ إضافة' : 'Add+'}
            </Text>
          </TouchableOpacity>
        )
      ) : (
        <View style={styles.inputContainer}>
          <TextInput
            style={[
              styles.textInput,
              {
                borderColor: colors.borderSubtle,
                color: colors.text,
                fontFamily: colors.fontRegular,
                backgroundColor: colors.inputBackground || colors.background,
              },
            ]}
            placeholder={
              isArabic
                ? 'حدد اسم المنتج لطلبك (مثال: إضافة بهارات إضافية للحساء)'
                : 'Specify the product name for your request (e.g. Add extra spice to soup)'
            }
            placeholderTextColor={colors.textMuted}
            value={requestText}
            onChangeText={setRequestText}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            autoFocus
          />

          {/* Image Attachment Row */}
          {currentDisplayImageUri ? (
            <View
              style={[
                styles.imagePreviewContainer,
                {
                  borderColor: colors.borderSubtle,
                  backgroundColor: colors.card,
                },
              ]}
            >
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  setPreviewImageUri(currentDisplayImageUri);
                  setPreviewModalVisible(true);
                }}
              >
                <Image
                  source={{ uri: currentDisplayImageUri }}
                  style={styles.imagePreviewThumb}
                  resizeMode="cover"
                />
              </TouchableOpacity>
              <View style={styles.imageInfo}>
                <Text
                  style={[
                    styles.imageNameText,
                    { color: colors.text, fontFamily: colors.fontMedium },
                  ]}
                  numberOfLines={1}
                >
                  {selectedImage?.name || (isArabic ? 'صورة الطلب' : 'Special request photo')}
                </Text>
                <TouchableOpacity
                  onPress={handleImagePickerPress}
                  style={styles.changeImageBtn}
                >
                  <Text style={[styles.changeImageText, { color: colors.primary }]}>
                    {isArabic ? 'تغيير' : 'Change'}
                  </Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                onPress={handleRemoveImage}
                style={styles.removeIconBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.removeIconText}>✕</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[
                styles.uploadImageBtn,
                {
                  borderColor: colors.borderSubtle,
                  backgroundColor: colors.inputBackground || colors.background,
                },
              ]}
              onPress={handleImagePickerPress}
              activeOpacity={0.7}
            >
              <Text style={styles.uploadIcon}>📷</Text>
              <Text
                style={[
                  styles.uploadImageText,
                  { color: colors.primary, fontFamily: colors.fontMedium },
                ]}
              >
                {isArabic ? 'رفع صورة' : 'Upload Image'}
              </Text>
            </TouchableOpacity>
          )}

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[
                styles.cancelBtn,
                {
                  borderColor: colors.borderSubtle,
                  backgroundColor: colors.background,
                },
              ]}
              onPress={() => {
                setShowInput(false);
                setRequestText(specialRequest);
                setSelectedImage(null);
                setExistingImageUrl(specialRequestImage);
                setImageRemoved(false);
              }}
            >
              <Text
                style={[
                  styles.cancelBtnText,
                  {
                    color: colors.textSecondary,
                    fontFamily: colors.fontRegular,
                  },
                ]}
              >
                {isArabic ? 'إلغاء' : 'Cancel'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: colors.primary }]}
              onPress={handleSave}
            >
              <Text
                style={[
                  styles.saveBtnText,
                  { color: '#FFFFFF', fontFamily: colors.fontSemiBold },
                ]}
              >
                {isArabic ? 'حفظ' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Image Preview Modal */}
      <Modal
        visible={previewModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setPreviewModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            style={styles.modalCloseBtn}
            onPress={() => setPreviewModalVisible(false)}
          >
            <Text style={styles.modalCloseText}>✕</Text>
          </TouchableOpacity>
          {previewImageUri ? (
            <Image
              source={{ uri: previewImageUri }}
              style={styles.modalFullImage}
              resizeMode="contain"
            />
          ) : null}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: sh(24),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: sh(12),
  },
  icon: {
    width: sw(20),
    height: sw(20),
    resizeMode: 'contain',
    marginRight: sw(8),
  },
  title: {
    fontSize: fs(16),
  },
  addBtn: {
    borderWidth: 1,
    borderRadius: sw(20),
    paddingHorizontal: sw(24),
    paddingVertical: sh(8),
    alignSelf: 'flex-start',
  },
  addBtnText: {
    fontSize: fs(14),
  },
  savedContainer: {
    borderWidth: 1,
    borderRadius: sw(12),
    padding: sw(14),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  savedContent: {
    flex: 1,
    marginRight: sw(12),
  },
  savedText: {
    fontSize: fs(14),
    lineHeight: fs(20),
  },
  savedImageThumbWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: sh(8),
    gap: sw(8),
  },
  savedImageThumb: {
    width: sw(48),
    height: sw(48),
    borderRadius: sw(8),
    backgroundColor: '#EEEEEE',
  },
  savedImageLabel: {
    fontSize: fs(12),
  },
  editBtn: {
    borderWidth: 1,
    borderRadius: sw(16),
    paddingHorizontal: sw(16),
    paddingVertical: sh(6),
  },
  editBtnText: {
    fontSize: fs(12),
  },
  inputContainer: {
    marginTop: sh(8),
  },
  textInput: {
    borderWidth: 1,
    borderRadius: sw(12),
    padding: sw(12),
    fontSize: fs(14),
    minHeight: sh(80),
  },
  uploadImageBtn: {
    marginTop: sh(10),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: sh(10),
    paddingHorizontal: sw(14),
    borderRadius: sw(10),
    borderWidth: 1,
    borderStyle: 'dashed',
    gap: sw(8),
  },
  uploadIcon: {
    fontSize: fs(16),
  },
  uploadImageText: {
    fontSize: fs(13),
  },
  imagePreviewContainer: {
    marginTop: sh(10),
    flexDirection: 'row',
    alignItems: 'center',
    padding: sw(10),
    borderRadius: sw(10),
    borderWidth: 1,
    gap: sw(12),
  },
  imagePreviewThumb: {
    width: sw(56),
    height: sw(56),
    borderRadius: sw(8),
    backgroundColor: '#EEEEEE',
  },
  imageInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  imageNameText: {
    fontSize: fs(13),
    marginBottom: sh(4),
  },
  changeImageBtn: {
    paddingVertical: sh(2),
    alignSelf: 'flex-start',
  },
  changeImageText: {
    fontSize: fs(12),
    fontWeight: '600',
  },
  removeIconBtn: {
    width: sw(26),
    height: sw(26),
    borderRadius: sw(13),
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeIconText: {
    fontSize: fs(12),
    color: '#6B7280',
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: sh(14),
    gap: sw(12),
  },
  cancelBtn: {
    borderWidth: 1,
    borderRadius: sw(8),
    paddingHorizontal: sw(20),
    paddingVertical: sh(8),
  },
  cancelBtnText: {
    fontSize: fs(14),
  },
  saveBtn: {
    borderRadius: sw(8),
    paddingHorizontal: sw(20),
    paddingVertical: sh(8),
  },
  saveBtnText: {
    fontSize: fs(14),
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: sw(20),
  },
  modalCloseBtn: {
    position: 'absolute',
    top: sh(50),
    right: sw(20),
    width: sw(40),
    height: sw(40),
    borderRadius: sw(20),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  modalCloseText: {
    color: '#FFFFFF',
    fontSize: fs(20),
    fontWeight: 'bold',
  },
  modalFullImage: {
    width: '100%',
    height: '80%',
  },
});
