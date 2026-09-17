import React from 'react';
import {Text, TextStyle, StyleProp, Platform} from 'react-native';

interface EmojiProps {
  children: string;
  size?: number;
  // StyleProp rather than TextStyle[] so callers can pass the usual
  // conditional array — `[base, isTablet && tabletOverride]` — without
  // TypeScript rejecting the `false` branch.
  style?: StyleProp<TextStyle>;
}

const emojiFont: TextStyle =
  Platform.OS === 'ios' ? {fontFamily: 'Apple Color Emoji'} : {};

export function Emoji({children, size, style}: EmojiProps) {
  return (
    // Emoji are sized from the layout (a cell, a card), so system text
    // scaling only breaks them.
    <Text
      allowFontScaling={false}
      style={[emojiFont, size ? {fontSize: size} : undefined, style]}>
      {children}
    </Text>
  );
}
