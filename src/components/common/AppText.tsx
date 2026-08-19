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
export function Text({style, ...rest}: TextProps) {
  return <RNText {...rest} style={[fredoka, style]} />;
}
