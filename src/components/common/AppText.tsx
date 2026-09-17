import React from 'react';
import {Text as RNText, TextProps} from 'react-native';
import {FREDOKA_FAMILY} from '../../utils/fonts';

const fredoka = {fontFamily: FREDOKA_FAMILY};

/**
 * Every screen imports Text from here rather than from react-native, so the
 * app font is applied in exactly one place.
 *
 * This replaces a monkey-patch of `Text.render` in installFredoka.ts. That
 * patch silently stopped doing anything: RN 0.84 no longer builds Text with
 * forwardRef (`export default TextImpl` is a plain function component), so
 * there is no `render` property to override, the assignment was inert, and the
 * app had been rendering in Roboto / San Francisco all along.
 *
 * The caller's style is applied last, so a component can still override the
 * family — Emoji does, for the colour-emoji face.
 */
// Dynamic Type is honoured up to 1.3x. Above that the ten frame, the number
// pad and the level header break (nothing capped it, and iOS goes to 3.5x),
// and a child's app is used far more by touch than by reading. Callers can
// still pass their own multiplier.
export function Text({style, maxFontSizeMultiplier = 1.3, ...rest}: TextProps) {
  return (
    <RNText
      {...rest}
      maxFontSizeMultiplier={maxFontSizeMultiplier}
      style={[fredoka, style]}
    />
  );
}
