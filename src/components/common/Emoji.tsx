import React from 'react';
import {Text, TextStyle, Platform} from 'react-native';

interface EmojiProps {
  children: string;
  size?: number;
  style?: TextStyle | TextStyle[];
}

const emojiFont: TextStyle =
  Platform.OS === 'ios' ? {fontFamily: 'Apple Color Emoji'} : {};

export function Emoji({children, size, style}: EmojiProps) {
  return (
    <Text style={[emojiFont, size ? {fontSize: size} : undefined, style]}>
      {children}
    </Text>
  );
}
