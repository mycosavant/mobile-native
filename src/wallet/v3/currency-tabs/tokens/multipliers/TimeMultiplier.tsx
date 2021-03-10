import React, { useRef } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Tooltip } from 'react-native-elements';
import ThemedStyles from '../../../../../styles/ThemedStyles';

const ToolTipText = () => (
  <Text style={styles.tooltipTitle}>
    The longer you stake tokens, the more the time multiplier will increase. The
    maximum time multiplier is 3.0 (52 weeks)
  </Text>
);

/**
 * Returns the number of days from the current multiplier provided
 * NOTE: this is only using tokenomicsV2.. changes the tokenomics manifest will need to be reflected here
 * @param multiplier
 */
const calculateDaysFromMultiplier = (multiplier: number): number => {
  const maxDays = 365;
  const maxMultiplier = 3;
  const minMultiplier = 1;
  const multiplierRange = maxMultiplier - minMultiplier;
  const dailyIncrement = multiplierRange / maxDays; // 0.0054794520

  return (multiplier - minMultiplier) / dailyIncrement;
};

type PropsType = {
  multiplier: number;
};

const TimeMultiplier = ({ multiplier }: PropsType) => {
  const tooltipRef = useRef<any>();
  const theme = ThemedStyles.style;
  const progressBar = {
    flex: 1,
    width: `${(multiplier / 3) * 100}%`,
    backgroundColor: '#A3C000',
  };

  return (
    <TouchableOpacity
      style={styles.mainContainer}
      onPress={() => tooltipRef.current.toggleTooltip()}>
      <View style={[styles.multiplierContainer, theme.backgroundPrimary]}>
        <View style={[styles.multiplierRow]}>
          <Text style={theme.fontS}>{multiplier}.0</Text>
          <View
            style={[
              theme.flexContainer,
              theme.backgroundSecondary,
              theme.marginHorizontal,
            ]}>
            <View style={progressBar} />
          </View>
          <Text style={theme.fontS}>3.0</Text>
        </View>
      </View>
      <Tooltip
        ref={tooltipRef}
        skipAndroidStatusBar={true}
        withOverlay={false}
        containerStyle={theme.borderRadius}
        width={225}
        height={100}
        backgroundColor={ThemedStyles.getColor('link')}
        popover={<ToolTipText />}>
        <View />
      </Tooltip>
      <View style={[styles.infoContainer, theme.backgroundTertiary]}>
        <Text style={styles.infoText}>
          {calculateDaysFromMultiplier(multiplier)} / 365 days
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    flexDirection: 'row',
    paddingRight: 10,
  },
  multiplierContainer: {
    flex: 1,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderBottomLeftRadius: 6,
    borderTopLeftRadius: 5,
  },
  multiplierRow: {
    flex: 1,
    borderRadius: 2,
    flexDirection: 'row',
  },
  multiplierLevel: {
    flex: 1,
  },
  infoContainer: {
    flex: 1,
    paddingVertical: 5,
    borderBottomRightRadius: 6,
    borderTopRightRadius: 6,
  },
  infoText: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'Roboto-Medium',
    alignSelf: 'center',
  },
  tooltipTitle: {
    color: 'white',
    fontWeight: '500',
    fontFamily: 'Roboto-Medium',
  },
  tooltipText: {
    color: 'white',
    marginBottom: 10,
  },
});

export default TimeMultiplier;
