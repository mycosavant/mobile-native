import React from 'react';
import { observer } from 'mobx-react';
import { View, StyleSheet } from 'react-native';
import FastImage from 'react-native-fast-image';

import ThemedStyles from '../styles/ThemedStyles';
import excerpt from '../common/helpers/excerpt';
import PressableScale from '../common/components/PressableScale';
import navigationService from '../navigation/NavigationService';
import MText from '../common/components/MText';
import { Icon } from '~/common/ui/icons';

type PropsType = {
  avatarUrl?: any;
  unseen?: boolean;
  title: string;
  index?: number;
  onPress?: any;
  withPlus?: boolean;
};

/**
 * Portrait content bar items
 * @param props Props
 */
export default observer(function PortraitContentBarItem(props: PropsType) {
  const onPress = React.useCallback(() => {
    navigationService.push('PortraitViewerScreen', {
      index: props.index,
    });
  }, [props.index]);

  return (
    <View style={containerStyle}>
      <PressableScale
        onPress={props.index ? onPress : props.onPress}
        activeOpacity={0.5}>
        <FastImage source={props.avatarUrl} style={styles.avatar} />
        {props.unseen ? <View style={styles.unseen} /> : null}
        {props.withPlus && (
          <Icon
            style={{
              position: 'absolute',
              right: 0,
              bottom: 0,
              backgroundColor: '#fff',
              borderRadius: 100,
              // padding: -5,
              // margin: -4,
            }}
            name="plus-circle"
            color="Link"
          />
        )}
      </PressableScale>
      <MText style={textStyle}>{excerpt(props.title, 10)}</MText>
    </View>
  );
});

const styles = ThemedStyles.create({
  container: {
    padding: 10,
    overflow: 'visible',
  },
  text: {
    marginTop: 8,
  },
  unseen: {
    zIndex: 9990,
    top: -1,
    left: -1,
    right: -1,
    bottom: -1,
    borderWidth: 2.2,
    borderRadius: 30,
    position: 'absolute',
    borderColor: '#ECDA51',
  },
  avatar: [
    'bgTertiaryBackground',
    {
      height: 55,
      width: 55,
      borderRadius: 27.5,
    },
  ],
});

const textStyle = ThemedStyles.combine(
  'fontM',
  styles.text,
  'colorSecondaryText',
);

const containerStyle = ThemedStyles.combine(
  'columnAlignCenter',
  styles.container,
  'bgTransparent',
  'centered',
);
