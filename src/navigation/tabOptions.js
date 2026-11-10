import { COLORS } from '../utils/constants';

export function buildTabOptions({ isDesktop, insets }) {
  const base = {
    headerShown: false,
    tabBarActiveTintColor: COLORS.silver,
    tabBarInactiveTintColor: COLORS.gray,
    tabBarLabelStyle: { fontSize: isDesktop ? 14 : 11, fontWeight: '500' },
  };

  if (isDesktop) {
    return {
      ...base,
      tabBarPosition: 'left',
      tabBarVariant: 'material',
      tabBarLabelPosition: 'beside-icon',
      tabBarStyle: {
        backgroundColor: COLORS.card,
        borderRightWidth: 1,
        borderRightColor: COLORS.border,
        paddingTop: 16,
      },
    };
  }

  return {
    ...base,
    tabBarStyle: {
      backgroundColor: COLORS.card,
      borderTopWidth: 1,
      borderTopColor: COLORS.border,
      paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
      paddingTop: 8,
      height: 60 + insets.bottom,
    },
  };
}