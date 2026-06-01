import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
} from 'react-native';
import { fs, sw, sh } from '../../utils/responsive';
import { Images } from '../../assets/images';

interface SpecialRequestSectionProps {
  colors: any;
  onAddPress?: () => void;
  onSave?: (text: string) => void;
}

export default function SpecialRequestSection({
  colors,
  onAddPress,
  onSave,
}: SpecialRequestSectionProps) {
  const [showInput, setShowInput] = useState(false);
  const [requestText, setRequestText] = useState('');

  const handleAddPress = () => {
    setRequestText('');
    setShowInput(true);
    if (onAddPress) onAddPress();
  };

  const handleSave = () => {
    if (onSave && requestText.trim()) {
      onSave(requestText.trim());
    }
    // setRequestText('');
    setShowInput(false);
  };

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
          Any special request
        </Text>
      </View>

      {!showInput ? (
        <TouchableOpacity
          style={[styles.addBtn, { borderColor: colors.borderSubtle }]}
          onPress={handleAddPress}
        >
          <Text
            style={[
              styles.addBtnText,
              { color: colors.darkBrown, fontFamily: colors.fontRegular },
            ]}
          >
            Add+
          </Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.inputContainer}>
          <TextInput
            style={[
              styles.textInput,
              {
                borderColor: colors.borderSubtle,
                color: colors.text,
                fontFamily: colors.fontRegular,
              },
            ]}
            placeholder="Type your special request here..."
            placeholderTextColor={colors.textMuted}
            value={requestText}
            onChangeText={setRequestText}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            autoFocus
          />
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.cancelBtn, { borderColor: colors.borderSubtle }]}
              onPress={() => {
                setShowInput(false);
                setRequestText('');
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
                Cancel
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
                Save
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
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
    backgroundColor: '#FFFFFF',
  },
  addBtnText: {
    fontSize: fs(14),
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
    backgroundColor: '#FFFFFF',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: sh(12),
    gap: sw(12),
  },
  cancelBtn: {
    borderWidth: 1,
    borderRadius: sw(8),
    paddingHorizontal: sw(20),
    paddingVertical: sh(8),
    backgroundColor: '#FFFFFF',
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
});
