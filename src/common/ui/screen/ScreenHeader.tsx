import React, { ReactNode } from 'react';
import { View } from 'react-native';
import { Row, SpacerPropType } from '~ui';
import ThemedStyles from '~/styles/ThemedStyles';
import { IconButton } from '..';
import { useNavigation } from '@react-navigation/native';
import { IconMapNameType } from '../icons/map';
import { Typography, TypographyPropsType } from '../typography/Typography';

export type ScreenHeaderType = {
  title: string;
  extra?: ReactNode;
  back?: boolean;
  leftComponent?: ReactNode;
  backIcon?: IconMapNameType;
  border?: boolean;
  titleType?: TypographyPropsType['type'];
  centerTitle?: boolean;
  onBack?: () => void;
};

export const ScreenHeader = ({
  title,
  extra,
  back,
  leftComponent,
  backIcon = 'chevron-left',
  onBack,
  border,
  titleType = 'H2',
  centerTitle,
  ...more
}: ScreenHeaderType & SpacerPropType) => {
  const navigation = useNavigation();
  return (
    <View style={border ? styles.border : styles.normal}>
      {centerTitle && (
        <View style={styles.titleCenteredContainer}>
          <Typography type={titleType} font="bold">
            {title}
          </Typography>
        </View>
      )}
      <Row align="centerBetween" space="L" {...more}>
        <View style={styles.row}>
          {leftComponent ? leftComponent : null}
          {back && (
            <IconButton
              name={backIcon}
              size="large"
              right="S"
              onPress={onBack || (() => navigation.goBack())}
            />
          )}
          {!centerTitle && (
            <Typography type={titleType} font="bold">
              {title}
            </Typography>
          )}
        </View>
        <View>{extra}</View>
      </Row>
    </View>
  );
};

const styles = ThemedStyles.create({
  titleCenteredContainer: ['absoluteFill', 'centered', { minHeight: 55 }],
  border: ['bcolorPrimaryBorder', 'borderBottom1x', { minHeight: 55 }],
  row: ['rowJustifyStart'],
});
222;
