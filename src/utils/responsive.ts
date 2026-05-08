import { Dimensions, PixelRatio } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Base design dimensions (iPhone 14 / 390×844)
const BASE_WIDTH = 390;
const BASE_HEIGHT = 844;

/** Scale a value relative to screen width */
export const scaleW = (size: number): number =>
  Math.round((size / BASE_WIDTH) * SCREEN_WIDTH);

/** Scale a value relative to screen height */
export const scaleH = (size: number): number =>
  Math.round((size / BASE_HEIGHT) * SCREEN_HEIGHT);

/**
 * Moderate scale — scales less aggressively than scaleW.
 * factor 0.5 means it only scales halfway. Good for font sizes.
 */
export const moderateScale = (size: number, factor = 0.5): number =>
  Math.round(size + (scaleW(size) - size) * factor);

/** Shorthand aliases */
export const fs = moderateScale;   // font size
export const sw = scaleW;          // width / horizontal spacing
export const sh = scaleH;          // height / vertical spacing

export { SCREEN_WIDTH, SCREEN_HEIGHT };
