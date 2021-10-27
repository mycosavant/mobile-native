import React, {
  useEffect,
  useRef,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from 'react';
import {
  StyleSheet,
  Dimensions,
  View,
  TouchableOpacity as RNTouchableOpacity,
  Platform,
  StatusBar,
} from 'react-native';
import MIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { useKeyboard } from '@react-native-community/hooks';
import { observer } from 'mobx-react';
import moment from 'moment';

import ThemedStyles from '../styles/ThemedStyles';
import NavigationService from '../navigation/NavigationService';
import i18n from '../common/services/i18n.service';
import {
  getLicenseText,
  getAccessText,
} from '../common/services/list-options.service';
import featuresService from '../common/services/features.service';
import MText from '../common/components/MText';
import BottomSheet from '~/common/components/bottom-sheet/BottomSheet';
import {
  createStackNavigator,
  TransitionPresets,
} from '@react-navigation/stack';

import TagSelector from '../compose/TagSelector';
import AccessSelector from '../compose/AccessSelector';
import NsfwSelector from '../compose/NsfwSelector';
import ScheduleSelector from '../compose/ScheduleSelector';
import PermawebSelector from '../compose/PermawebSelector';
import MonetizeSelector from '../compose/MonetizeSelector';
import MonetizeScreen from '../compose/monetize/MonetizeScreeen';
import LicenseSelector from '../compose/LicenseSelector';
import { useNavigation } from '@react-navigation/core';
import Handle from '~/common/components/bottom-sheet/Handle';

const Touchable = Platform.select({
  ios: RNTouchableOpacity,
  android: TouchableOpacity,
});

const height = 83;

const Stack = createStackNavigator();

/**
 * Item
 */
const Item = props => {
  return (
    <Touchable
      style={[styles.row, ThemedStyles.style.bcolorPrimaryBorder]}
      onPress={props.onPress}
      testID={props.testID}>
      <MText
        style={[styles.optionTitle, ThemedStyles.style.colorSecondaryText]}>
        {props.title}
      </MText>
      <MText style={styles.optionDescription} numberOfLines={1}>
        {props.description}
      </MText>
      <MIcon
        size={20}
        name="chevron-right"
        style={ThemedStyles.style.colorIcon}
      />
    </Touchable>
  );
};

export function useNavCallback(screen, store, navigation) {
  return useCallback(() => {
    navigation.navigate(screen, { store });
  }, [store, screen, navigation]);
}

const windowHeight = Dimensions.get('window').height;
const snapPoints = [550];

const PosterOptions = props => {
  const theme = ThemedStyles.style;
  const store = props.route.params.store;
  // dereference observables to listen to his changes
  const nsfw = store.nsfw.slice();
  const tags = store.tags.slice();
  const time_created = store.time_created;
  const tokens = store.wire_threshold.min;
  const license = store.attachment.license;
  const hasAttachment = store.attachment.hasAttachment;
  const accessId = store.accessId;

  const onTagPress = useNavCallback('TagSelector', store, props.navigation);
  const onNsfwPress = useNavCallback('NsfwSelector', store, props.navigation);
  const onSchedulePress = useNavCallback(
    'ScheduleSelector',
    store,
    props.navigation,
  );
  const onPermawebPress = useNavCallback(
    'PermawebSelector',
    store,
    props.navigation,
  );
  const onMonetizePress = useNavCallback(
    'MonetizeSelector',
    store,
    props.navigation,
  );
  const onLicensePress = useNavCallback(
    'LicenseSelector',
    store,
    props.navigation,
  );
  const onPressVisibility = useNavCallback(
    'AccessSelector',
    store,
    props.navigation,
  );

  const showSchedule =
    (store.isEdit ? time_created > Date.now() : true) && !store.portraitMode;

  const monetizeDesc = store.wire_threshold.support_tier?.urn
    ? store.wire_threshold.support_tier?.name || 'Plus'
    : '';

  const showMonetize = !store.portraitMode && !store.isRemind;

  const showPermaweb =
    !store.isEdit &&
    !store.group &&
    !store.isRemind &&
    featuresService.has('permaweb');

  const permawebDesc = store.postToPermaweb
    ? i18n.t('permaweb.description')
    : null;

  return (
    <View
      style={[
        theme.flexContainer,
        theme.bgPrimaryBackground,
        theme.fullHeight,
        // { elevation: 13 },
      ]}>
      <Item
        title="Tag"
        description={tags.slice(0, 4).map(t => `#${t} `)}
        onPress={onTagPress}
      />
      <Item
        title={i18n.t('nsfw.button')}
        description={
          nsfw.length !== 0 ? i18n.t('nsfw.notSafe') : i18n.t('nsfw.safe')
        }
        onPress={onNsfwPress}
        testID="nsfwButton"
      />
      {showSchedule && (
        <Item
          title={i18n.t('capture.schedule')}
          description={
            time_created ? moment(time_created).calendar() : i18n.t('now')
          }
          onPress={onSchedulePress}
        />
      )}
      {showMonetize && (
        <Item
          title={i18n.t('monetize.title')}
          description={monetizeDesc}
          onPress={onMonetizePress}
          testID="monetizeButton"
        />
      )}
      {showPermaweb && (
        <Item
          title={i18n.t('permaweb.title')}
          description={permawebDesc}
          onPress={onPermawebPress}
          testID="permawebButton"
        />
      )}
      <Item
        title="License"
        description={getLicenseText(license)}
        onPress={onLicensePress}
      />
      {!store.group && (
        <Item
          title="Visibility"
          description={getAccessText(accessId)}
          onPress={onPressVisibility}
        />
      )}
    </View>
  );
};

/**
 * Options
 * @param {Object} props
 */
export default observer(
  forwardRef((props, ref) => {
    // const keyboard = useKeyboard();
    const sheetRef = useRef();
    const navigation = useNavigation();
    // const onHeaderPress = useCallback(() => {
    //   if (!sheetRef.current) return;
    //   sheetRef.current.close();
    // }, []);

    // useEffect(() => {
    //   if (keyboard.keyboardShown && sheetRef.current) {
    //     sheetRef.current.close();
    //   }
    // }, [keyboard.keyboardShown]);

    useImperativeHandle(ref, () => ({
      show: () => {
        sheetRef.current.expand();
      },
      navigateTo: screen => {
        sheetRef.current.expand();
        // setTimeout(() => {
        navigation.navigate(screen, { store: props.store });
        // }, 100)
      },
    }));
    const screenOptions = React.useMemo(
      () => ({
        ...TransitionPresets.SlideFromRightIOS,
        headerShown: false,
        safeAreaInsets: { top: 0 },
        // headerBackground: ThemedStyles.style.bgSecondaryBackground,
        // cardStyle: ThemedStyles.style.bgDangerBackground,
      }),
      [],
    );

    return (
      <BottomSheet
        ref={sheetRef}
        // topInset={StatusBar.currentHeight || 0}
        // snapPoints={snapPoints}
        handleComponent={() => (
          <Handle style={ThemedStyles.style.bgPrimaryBackground} />
        )}>
        <Stack.Navigator screenOptions={screenOptions}>
          <Stack.Screen
            name="PosterOptions"
            component={PosterOptions}
            initialParams={{
              ...props,
            }}
            // options={hideHeader}
          />
          <Stack.Screen
            name="TagSelector"
            component={TagSelector}
            // options={hideHeader}
          />
          <Stack.Screen
            name="NsfwSelector"
            component={NsfwSelector}
            // options={hideHeader}
          />
          <Stack.Screen
            name="PermawebSelector"
            component={PermawebSelector}
            // options={hideHeader}
          />
          <Stack.Screen
            name="ScheduleSelector"
            component={ScheduleSelector}
            // options={hideHeader}
          />
          <Stack.Screen
            name="MonetizeSelector"
            component={
              featuresService.has('paywall-2020')
                ? MonetizeScreen
                : MonetizeSelector
            }
            // options={hideHeader}
          />
          <Stack.Screen
            name="LicenseSelector"
            component={LicenseSelector}
            // options={hideHeader}
          />
          <Stack.Screen
            name="AccessSelector"
            component={AccessSelector}
            // options={hideHeader}
          />
        </Stack.Navigator>
      </BottomSheet>
    );
  }),
);

const styles = StyleSheet.create({
  headerContainer: {
    overflow: 'hidden',
    paddingTop: 20,
  },
  header: {
    height,
    flexDirection: 'row',
    alignItems: 'center',
    borderTopRightRadius: 20,
    borderTopLeftRadius: 20,
    shadowColor: '#121414',
    shadowOffset: {
      width: 0,
      height: -5,
    },
    shadowOpacity: 0.1,
    shadowRadius: 5.0,
    elevation: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  close: {
    position: 'absolute',
    right: 20,
  },
  optionTitle: {
    width: '40%',
    fontSize: 16,
  },
  optionDescription: {
    flex: 1,
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    height: 55,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
