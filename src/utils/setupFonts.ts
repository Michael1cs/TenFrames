import React from 'react';
import {StyleSheet, Text, TextInput, TextStyle} from 'react-native';

const WEIGHT_TO_FAMILY: Record<string, string> = {
  '100': 'Nunito-Regular',
  '200': 'Nunito-Regular',
  '300': 'Nunito-Regular',
  '400': 'Nunito-Regular',
  '500': 'Nunito-Regular',
  '600': 'Nunito-Bold',
  '700': 'Nunito-Bold',
  '800': 'Nunito-ExtraBold',
  '900': 'Nunito-ExtraBold',
  normal: 'Nunito-Regular',
  bold: 'Nunito-Bold',
};

function flattenStyle(style: unknown): TextStyle | null {
  if (!style) return null;
  if (Array.isArray(style)) {
    return StyleSheet.flatten(style) as TextStyle;
  }
  if (typeof style === 'number') {
    return StyleSheet.flatten(style) as TextStyle;
  }
  return style as TextStyle;
}

function resolveFontFamily(style: unknown): string {
  const flat = flattenStyle(style);
  if (flat?.fontFamily) return flat.fontFamily;
  const weight = flat?.fontWeight;
  if (weight != null) {
    const mapped = WEIGHT_TO_FAMILY[String(weight)];
    if (mapped) return mapped;
  }
  return 'Nunito-Regular';
}

function patchComponent(Component: any) {
  const original = Component.render;
  if (typeof original !== 'function') return;
  Component.render = function patched(...args: any[]) {
    const element = original.apply(this, args);
    if (!element || !element.props) return element;
    const family = resolveFontFamily(element.props.style);
    return React.cloneElement(element, {
      style: [{fontFamily: family}, element.props.style],
    });
  };
}

export function setupFonts() {
  patchComponent(Text);
  patchComponent(TextInput);
}
