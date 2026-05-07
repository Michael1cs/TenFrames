import {TextStyle} from 'react-native';

export function getFredokaFamily(weight?: TextStyle['fontWeight']): string {
  if (weight === 'bold' || weight === '700' || weight === '800' || weight === '900') {
    return 'Fredoka-Bold';
  }
  if (weight === '600') {
    return 'Fredoka-SemiBold';
  }
  if (weight === '500') {
    return 'Fredoka-Medium';
  }
  return 'Fredoka-Regular';
}
