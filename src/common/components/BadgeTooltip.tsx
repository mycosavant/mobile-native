import React, { FC } from 'react';
import { Popable } from 'react-native-popable';
import { B3 } from '~ui';
import sp from '~/services/serviceProvider';

/**
 * Badge tooltip using Poppable because react-native-elements/Tooltip
 * doesn't have a way to show the Tooltip on top
 **/
const BadgeTooltip: FC<any> = ({
  label,
  color,
  children,
  position = 'top',
}) => {
  const fontColor = sp.styles.theme === 1 ? 'black' : 'white';
  return (
    <Popable
      backgroundColor={color}
      position={position}
      animationType={'spring'}
      content={
        <B3 color={fontColor} align="center" vertical="XS">
          {label}
        </B3>
      }>
      {children}
    </Popable>
  );
};

export default BadgeTooltip;
