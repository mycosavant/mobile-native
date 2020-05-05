import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleProp,
  TextStyle,
  StyleSheet,
} from 'react-native';
import ThemedStyles from '../../../styles/ThemedStyles';

export type TabType<T> = {
  id: T;
  title: string;
  subtitle?: string;
};

type PropsType<T> = {
  tabs: Array<TabType<T>>;
  current: T;
  onChange: (id: T) => void;
  titleStyle?: StyleProp<TextStyle>;
  subtitleStyle?: StyleProp<TextStyle>;
};

/**
 * Tab bar
 */
function TopbarTabbar<T>(props: PropsType<T>) {
  const theme = ThemedStyles.style;
  const tabStyle = [
    theme.paddingVertical,
    theme.marginHorizontal4x,
    theme.borderBottom4x,
  ];

  return (
    <View
      style={[theme.rowJustifyStart, theme.borderBottom, theme.borderPrimary]}>
      {props.tabs.map((tab) => (
        <TouchableOpacity
          onPress={() => props.onChange(tab.id)}
          style={[
            tabStyle,
            tab.id === props.current
              ? theme.borderTab
              : theme.borderTransparent,
          ]}>
          <Text style={[theme.fontL, props.titleStyle]}>{tab.title}</Text>
          {!!tab.subtitle && (
            <Text
              style={[
                theme.fontL,
                theme.colorSecondaryText,
                styles.subtitle,
                props.subtitleStyle,
              ]}>
              {tab.subtitle}
            </Text>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default TopbarTabbar;

const styles = StyleSheet.create({
  subtitle: {
    paddingVertical: 2,
  },
});
