import React from 'react';
import {Image, ImageStyle, StyleProp} from 'react-native';

// The mascot is the counter from the ten frame come to life — the dot the
// child drops into every cell, with eyes. One character, six poses, each
// for one moment of the game.
export type MascotPose = 'hello' | 'point' | 'jump' | 'think' | 'sleep' | 'wink';

const POSES: Record<MascotPose, {source: any; aspect: number}> = {
  hello: {source: require('../../../assets/mascot/mascot_hello.png'), aspect: 467 / 512},
  point: {source: require('../../../assets/mascot/mascot_point.png'), aspect: 510 / 512},
  jump: {source: require('../../../assets/mascot/mascot_jump.png'), aspect: 510 / 512},
  think: {source: require('../../../assets/mascot/mascot_think.png'), aspect: 422 / 512},
  sleep: {source: require('../../../assets/mascot/mascot_sleep.png'), aspect: 512 / 293},
  wink: {source: require('../../../assets/mascot/mascot_wink.png'), aspect: 447 / 512},
};

interface MascotProps {
  pose: MascotPose;
  // The pose's height; width follows its artwork. The sleeping pose is wide,
  // so size it by `width` instead.
  height?: number;
  width?: number;
  style?: StyleProp<ImageStyle>;
}

export function Mascot({pose, height, width, style}: MascotProps) {
  const {source, aspect} = POSES[pose];
  const h = height ?? (width ? width / aspect : 80);
  const w = width ?? h * aspect;
  return (
    <Image
      source={source}
      style={[{width: w, height: h}, style]}
      resizeMode="contain"
      accessibilityIgnoresInvertColors
    />
  );
}
