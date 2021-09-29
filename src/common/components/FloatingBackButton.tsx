import React from 'react';
import { StyleSheet } from 'react-native';
import { IconButton } from '~ui/icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type PropsType = {
  onPress: () => void;
  style?: any;
  size?: number;
};

const FloatingBackButton = (props: PropsType) => {
  const insets = useSafeAreaInsets();
  const iconStyle = { top: insets.top || 5 };
  return (
    <IconButton
      size={props.size || 'huge'}
      name="chevronLeft"
      style={[iconStyle, styles.backIcon, props.style]}
      onPress={props.onPress}
      testID="floatingBackButton"
    />
  );
};

export default FloatingBackButton;

const styles = StyleSheet.create({
  backIcon: {
    position: 'absolute',
    left: 0,
    shadowOpacity: 0.2,
    shadowRadius: 3,
    shadowOffset: { width: 1, height: 1 },
    elevation: 4,
  },
});
