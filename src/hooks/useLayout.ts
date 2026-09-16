import {useWindowDimensions} from 'react-native';

// One layout for the whole 4-7 audience: the former "young" values (bigger
// touch targets, friendlier type) are simply the app's values now — ability,
// not age, drives difficulty, and it does so through the per-mode levels.
export function useLayout() {
  const {width, height} = useWindowDimensions();
  const isLandscape = width > height;
  const isTablet = Math.min(width, height) >= 600;
  const maxGridWidth = isLandscape
    ? Math.min(width * 0.45, 500)
    : isTablet
    ? Math.min(width - 60, 700)
    : width - 60;
  const gridWidth = maxGridWidth;
  const phoneCap = 80;
  const tabletCap = 132;
  const cellSize = Math.min((gridWidth - 60) / 5, isTablet ? tabletCap : phoneCap);

  return {
    width,
    height,
    isLandscape,
    isTablet,
    cellSize,
    gridWidth,
    // Font scale: tablets bump everything; phones get the friendly bump.
    fontScale: isTablet ? 1.4 : 1.15,
  };
}
