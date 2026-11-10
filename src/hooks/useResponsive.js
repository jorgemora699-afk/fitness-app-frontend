import { Platform, useWindowDimensions } from 'react-native';

export default function useResponsive() {
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  return {
    width,
    isDesktop: isWeb && width >= 900,
    columnas: width >= 1200 ? 3 : width >= 700 ? 2 : 1,
  };
}