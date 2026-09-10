import React from 'react';
import {View, StyleSheet} from 'react-native';

interface TenFrameMotifProps {
  // How many of the ten mini cells are filled. A full top row (5) reads as
  // the app's friendly five-structure; 10 is reserved for the big moments.
  filled: number;
  fillColor: string;
  borderColor: string;
}

// A miniature 1x10 ten-frame strip — the app's own signature, used as the
// decorative element on celebration cards instead of generic sparkles. No
// other app draws this; a parent recognizes it instantly as "our frame".
export function TenFrameMotif({filled, fillColor, borderColor}: TenFrameMotifProps) {
  return (
    <View style={styles.row}>
      {Array.from({length: 10}).map((_, i) => (
        <View
          key={i}
          style={[
            styles.cell,
            {borderColor},
            i < filled && {backgroundColor: fillColor},
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 3,
  },
  cell: {
    width: 12,
    height: 12,
    borderRadius: 3,
    borderWidth: 1.5,
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
});
