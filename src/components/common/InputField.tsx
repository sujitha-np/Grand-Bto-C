import React, { useState } from 'react';
import {
  Image,
  ImageSourcePropType,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { fs, sw } from '../../utils/responsive';

interface InputFieldProps extends TextInputProps {
  label?: string;
  leftIcon?: ImageSourcePropType;
  rightIcon?: ImageSourcePropType;
  leftIconComponent?: React.ReactNode;
  rightIconComponent?: React.ReactNode;
  onRightIconPress?: () => void;
  containerStyle?: StyleProp<ViewStyle>;
  inputContainerStyle?: StyleProp<ViewStyle>;
  error?: string;
}

function InputField({
  label,
  leftIcon,
  rightIcon,
  leftIconComponent,
  rightIconComponent,
  onRightIconPress,
  containerStyle,
  inputContainerStyle,
  error,
  secureTextEntry,
  ...rest
}: InputFieldProps) {
  const [focused, setFocused] = useState(false);
  const colors = useTheme();

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label ? (
        <Text
          style={[
            styles.label,
            { color: colors.text, fontFamily: colors.fontMedium },
          ]}
        >
          {label}
        </Text>
      ) : null}
      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: colors.inputBackground,
            borderColor: colors.inputBorder,
          },
          focused && {
            borderColor: colors.inputBorderFocused,
            backgroundColor: colors.primaryLight,
          },
          inputContainerStyle,
          focused && {
            borderColor: colors.inputBorderFocused,
          },
          !!error && styles.inputContainerError,
        ]}
      >
        {leftIconComponent ??
          (leftIcon ? (
            <Image
              source={leftIcon}
              style={[styles.icon, { tintColor: colors.textMuted }]}
              resizeMode="contain"
            />
          ) : null)}
        <TextInput
          style={[
            styles.input,
            { color: colors.text, fontFamily: colors.fontRegular },
          ]}
          placeholderTextColor={colors.textPlaceholder}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          secureTextEntry={secureTextEntry}
          {...rest}
        />
        {rightIconComponent ??
          (rightIcon ? (
            <TouchableOpacity onPress={onRightIconPress} activeOpacity={0.7}>
              <Image
                source={rightIcon}
                style={[
                  styles.icon,
                  { tintColor: colors.textMuted, marginLeft: 10 },
                ]}
                resizeMode="contain"
              />
            </TouchableOpacity>
          ) : null)}
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  label: {
    fontSize: fs(14),
    marginBottom: sw(8),
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: sw(50),
    paddingHorizontal: sw(18),
    paddingVertical: sw(14),
    borderWidth: 1.5,
  },
  inputContainerError: {
    borderColor: '#E53935',
    backgroundColor: '#FFF5F5',
  },
  icon: {
    width: sw(20),
    height: sw(20),
    marginRight: sw(10),
  },
  input: {
    flex: 1,
    fontSize: fs(14),
    fontFamily: 'Inter-Regular',
    padding: 0,
  },
  errorText: {
    marginTop: sw(6),
    marginLeft: sw(12),
    fontSize: fs(12),
    fontFamily: 'Inter-Regular',
    color: '#E53935',
  },
});

export default InputField;
