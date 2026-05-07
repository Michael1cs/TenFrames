import React from 'react';
import {Text, TextInput, StyleSheet} from 'react-native';
import {getFredokaFamily} from './fonts';

let installed = false;

export function installFredoka() {
  if (installed) return;
  installed = true;

  const TextAny = Text as any;
  const originalTextRender = TextAny.render;
  TextAny.render = function (...args: any[]) {
    const element = originalTextRender.apply(this, args);
    const flat = StyleSheet.flatten(element.props.style) || {};
    const family = getFredokaFamily(flat.fontWeight as any);
    return React.cloneElement(element, {
      style: [{fontFamily: family}, element.props.style],
    });
  };

  // Same treatment for TextInput so input fields render Fredoka.
  const InputAny = TextInput as any;
  if (InputAny.defaultProps == null) {
    InputAny.defaultProps = {};
  }
  InputAny.defaultProps.style = [
    {fontFamily: 'Fredoka-Regular'},
    InputAny.defaultProps.style,
  ];
}
