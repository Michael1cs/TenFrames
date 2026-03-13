import {useWindowDimensions} from 'react-native';

export function useLayout() {
  const {width, height} = useWindowDimensions();
  const isLandscape = width > height;
  const isTablet = Math.min(width, height) >= 600;

  // Cell size adapts to available space
  const gridWidth = isLandscape ? Math.min(width * 0.45, 500) : width - 60;
  const cellSize = Math.min((gridWidth - 60) / 5, isTablet ? 80 : 64);

  return {
    width,
    height,
    isLandscape,
    isTablet,
    cellSize,
    gridWidth,
    // Font scale for tablets
    fontScale: isTablet ? 1.3 : 1,
  };
}
