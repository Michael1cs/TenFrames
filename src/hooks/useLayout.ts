import {useWindowDimensions} from 'react-native';
import {AgeGroup} from '../types/game';

export function useLayout(ageGroup: AgeGroup = 'older') {
  const {width, height} = useWindowDimensions();
  const isLandscape = width > height;
  const isTablet = Math.min(width, height) >= 600;
  const isYoung = ageGroup === 'young';

  // Cell size adapts to available space; young profile gets bigger touch targets.
  const maxGridWidth = isLandscape
    ? Math.min(width * 0.45, 500)
    : isTablet
    ? Math.min(width - 60, 700)
    : width - 60;
  const gridWidth = maxGridWidth;
  const phoneCap = isYoung ? 80 : 72;
  const tabletCap = isYoung ? 132 : 120;
  const cellSize = Math.min((gridWidth - 60) / 5, isTablet ? tabletCap : phoneCap);

  return {
    width,
    height,
    isLandscape,
    isTablet,
    cellSize,
    gridWidth,
    // Font scale: tablets bump everything; young profile bumps further on phones.
    fontScale: isTablet ? 1.4 : isYoung ? 1.15 : 1,
  };
}
