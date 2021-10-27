import React, { useRef, useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, StatusBar, ScrollView, Image } from 'react-native';

import { Camera } from 'react-native-vision-camera';
import FIcon from 'react-native-vector-icons/Feather';
import Icon from 'react-native-vector-icons/Ionicons';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { when } from 'mobx';
import { observer, useLocalStore } from 'mobx-react';
import { useSafeArea } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Reanimated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
} from 'react-native-reanimated';
import ThemedStyles from '../../styles/ThemedStyles';
import RecordButton from './RecordButton';

import VideoClock from '../VideoClock';
import FocusIndicator from './FocusIndicator';
import { IS_IOS } from '../../config/Config';
import ZoomIndicator from './ZoomIndicator';
import createCameraStore from './createCameraStore';
import FlashIcon from './FlashIcon';
import CamIcon from './CamIcon';
import HdrIcon from './HdrIcon';
import FadeFrom from '../../common/components/animations/FadeFrom';
import ZoomGesture from './ZoomGesture';
import FocusGesture from './FocusGesture';
import { MotiView } from 'moti';
import useBestCameraAndFormat from './useBestCameraAndFormat';
import useCameraStyle from './useCameraStyle';
import { AppStackParamList } from '../../navigation/NavigationTypes';
import { PermissionsContext } from '../PermissionsCheck';
import Orientation from 'react-native-orientation-locker';
import changeNavigationBarColor from 'react-native-navigation-bar-color';
import MText from '~/common/components/MText';
import i18nService from '~/common/services/i18n.service';
import useIsPortrait from '~/common/hooks/useIsPortrait';
import { useDimensions } from '@react-native-community/hooks';
import FILTERS from '../v2/FiltersList';

type CaptureScreenRouteProp = RouteProp<AppStackParamList, 'Capture'>;

const ReanimatedCamera = Reanimated.createAnimatedComponent(Camera);
Reanimated.addWhitelistedNativeProps({
  zoom: true,
});

const camAnimTransition: any = { type: 'timing', duration: 0 };
const MAX_ZOOM_FACTOR = 20;

type PropsType = {
  onMedia: (media) => void;
  mode: 'photo' | 'video';
  onForceVideo?: () => void;
  onSetPhotoPress?: () => void;
  onSetVideoPress?: () => void;
  onPressGallery: () => void;
  portraitMode?: boolean;
};

const PRESENTATION_ORDER = {
  // first: 50,
  // second: 130,
  // third: 190,

  first: 30,
  second: 110,
  third: 150,
};

/**
 * Camera
 * @param {Object} props
 */
export default observer(function (props: PropsType) {
  const permissions = React.useContext(PermissionsContext);
  const theme = ThemedStyles.style;
  const camera = useRef<Camera>(null);
  const route = useRoute<CaptureScreenRouteProp>();
  const navigation = useNavigation();
  const zoom = useSharedValue(0);
  const zoomVisible = useSharedValue<boolean>(false);
  const width = useDimensions().screen.width;

  // local store
  const store = useLocalStore(createCameraStore, { navigation, ...props });

  const [devices, device, formats, format] = useBestCameraAndFormat(store);

  const supportsCameraFlipping = React.useMemo(
    () => devices.back != null && devices.front != null,
    [devices.back, devices.front],
  );

  const supportsFlash = device?.hasFlash ?? false;
  const supportsHdr = React.useMemo(
    () => formats.some(f => f.supportsVideoHDR || f.supportsPhotoHDR),
    [formats],
  );

  const insets = useSafeAreaInsets();
  const cleanTop = { marginTop: insets.top || 0 };
  const minZoom = device?.minZoom ?? 1;
  const maxZoom = Math.min(device?.maxZoom ?? 1, MAX_ZOOM_FACTOR);

  const cameraAnimatedProps = useAnimatedProps(() => {
    const z = Math.max(Math.min(zoom.value, maxZoom), minZoom);
    return {
      zoom: z,
    };
  }, [maxZoom, minZoom, zoom]);

  // capture press handler
  const onPress = useCallback(async () => {
    if (props.mode === 'photo') {
      store.takePicture(camera);
    } else {
      store.recordVideo(false, format, camera);
    }
  }, [props, store, format, camera]);

  const neutralZoom = device?.neutralZoom ?? 1;
  useEffect(() => {
    zoom.value = neutralZoom;
  }, [neutralZoom, zoom]);

  useEffect(() => {
    Orientation.unlockAllOrientations();
    return () => Orientation.lockToPortrait();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      store.showCam();
    }, 50);

    let unlisten;

    if (route.params && route.params.start) {
      unlisten = when(
        () => store.ready,
        () => {
          setTimeout(() => {
            onPress && onPress();
            navigation.setParams({ start: false });
          }, 100);
        },
      );
    }

    return () => {
      clearTimeout(t);
      unlisten && unlisten();
    };
  }, [store, onPress, route.params, navigation]);

  // capture long press handler
  const onLongPress = useCallback(async () => {
    if (!store.recording) {
      if (props.onForceVideo) {
        props.onForceVideo();
      }
      store.recordVideo(true, format, camera);
    }
  }, [props, store, format, camera]);

  const animateCamPreview = React.useMemo(
    () => (store.ready ? { opacity: 1 } : { opacity: 0 }),
    [store.ready],
  );

  const orientationStyle = useCameraStyle(insets);
  // const portrait = useIsPortrait();

  // const imageStyle = {
  //   width,
  //   height: 200,
  //   position: 'absolute',
  //   top: 0,
  //   // left: 0,
  //   right: 0,
  // };
  // const createImg = (source: any) => (
  //   <Image style={imageStyle} resizeMode="cover" source={source} />
  // );
  // const createVw = () => (
  //   <View
  //     style={{
  //       width,
  //       height: 200,
  //       overflow: 'hidden',
  //     }}></View>
  // );

  // const [offset, setOffset] = useState(0);

  // const generateFilters = () => {
  //   return (
  //     <View
  //       style={{
  //         position: 'absolute',
  //         top: 0,
  //         left: 0,
  //         right: 0,
  //         height: 200,
  //       }}>
  //       {FILTERS.map(({ filterComponent: FilterComponent }, index) => (
  //         <View
  //           style={[
  //             {
  //               ...StyleSheet.absoluteFillObject,
  //               left: Math.max(
  //                 offset - width * (FILTERS.length - (index + 1)),
  //                 0,
  //               ),
  //               overflow: 'hidden',
  //             },
  //           ]}>
  //           <FilterComponent
  //             extractImageEnabled={true}
  //             image={createImg(require('../../assets/images/MAMAD3.jpg'))}
  //           />
  //         </View>
  //       ))}
  //     </View>
  //   );
  // };

  // return (
  //   <View>
  //     {generateFilters()}
  //     <ScrollView
  //       horizontal
  //       pagingEnabled
  //       onScroll={event => {
  //         setOffset(event.nativeEvent.contentOffset.x);
  //       }}>
  //       {FILTERS.map(() => createVw())}
  //     </ScrollView>
  //   </View>
  // );

  return [
    <View style={theme.flexContainer}>
      <MotiView
        style={theme.flexContainer}
        animate={animateCamPreview}
        transition={camAnimTransition}>
        {device != null && (
          <ZoomGesture
            zoom={zoom}
            zoomVisible={zoomVisible}
            minZoom={minZoom}
            maxZoom={maxZoom}
            store={store}>
            <FocusGesture store={store} device={device} camera={camera}>
              <ReanimatedCamera
                ref={camera}
                style={StyleSheet.absoluteFill}
                device={device}
                format={format}
                fps={30}
                lowLightBoost={
                  device.supportsLowLightBoost && store.lowLightBoost
                }
                hdr={store.hdr}
                isActive={store.show}
                onInitialized={store.isReady}
                onError={e => console.log(e)}
                enableZoomGesture={false}
                animatedProps={cameraAnimatedProps}
                photo={true}
                video={true}
                audio={permissions !== null && permissions[0] === 'authorized'}
              />
            </FocusGesture>
          </ZoomGesture>
        )}
        <MotiView
          from={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          // delay={600}
          transition={{ type: 'timing', duration: 2000 }}
          style={StyleSheet.absoluteFill}>
          <View
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor: '#000',
              },
            ]}></View>
        </MotiView>
        {store.focusPoint && (
          <FocusIndicator x={store.focusPoint.x} y={store.focusPoint.y} />
        )}
        <ZoomIndicator
          zoomVisible={zoomVisible}
          zoom={zoom}
          maxZoom={maxZoom}
          minZoom={minZoom}
          style={orientationStyle.zoomIndicator}
        />
        <FadeFrom
          direction="right"
          delay={PRESENTATION_ORDER.third}
          style={orientationStyle.lowLight}>
          <Icon
            size={30}
            name={store.lowLightBoost ? 'moon-sharp' : 'moon-outline'}
            style={orientationStyle.galleryIcon}
            onPress={() => store.toggleLowLightBoost()}
          />
        </FadeFrom>
      </MotiView>
      {store.recording && (
        <VideoClock
          style={[orientationStyle.clock, cleanTop]}
          timer={store.videoLimit}
          onTimer={onPress}
        />
      )}
      {device && store.ready && (
        <View style={orientationStyle.buttonContainer}>
          <View style={orientationStyle.leftIconContainer}>
            <FadeFrom delay={PRESENTATION_ORDER.third}>
              <FIcon
                size={30}
                name="image"
                style={orientationStyle.galleryIcon}
                onPress={props.onPressGallery}
              />
            </FadeFrom>
            {supportsHdr ? (
              <FadeFrom delay={PRESENTATION_ORDER.second}>
                <HdrIcon store={store} style={orientationStyle.icon} />
              </FadeFrom>
            ) : (
              <View />
            )}
          </View>
          <View style={orientationStyle.rightButtonsContainer}>
            {supportsFlash ? (
              <FadeFrom delay={PRESENTATION_ORDER.second}>
                <FlashIcon store={store} style={orientationStyle.icon} />
              </FadeFrom>
            ) : (
              <View />
            )}
            {supportsCameraFlipping && (!store.recording || IS_IOS) ? (
              <FadeFrom delay={PRESENTATION_ORDER.third}>
                <CamIcon store={store} style={orientationStyle.icon} />
              </FadeFrom>
            ) : (
              <View />
            )}
          </View>
          <FadeFrom delay={PRESENTATION_ORDER.first}>
            <RecordButton
              size={70}
              store={store}
              onLongPress={onLongPress}
              onPressOut={onPress}
              pulse={store.pulse}
              isPhoto={props.mode === 'photo'}
            />
          </FadeFrom>
        </View>
      )}
    </View>,
    // portrait && (
    //   <BottomBar
    //     mode={props.mode}
    //     onSetPhotoPress={props.onSetPhotoPress}
    //     onSetVideoPress={props.onSetVideoPress}
    //   />
    // ),
  ];
});

// const BottomBar = ({ mode, onSetPhotoPress, onSetVideoPress }) => {
//   const theme = ThemedStyles.style;
//   const insets = useSafeArea();
//   const tabStyle = {
//     paddingBottom: insets.bottom || 16,
//     backgroundColor: '#000',
//   };

//   return (
//     <View
//       style={[
//         styles.tabContainer,
//         theme.paddingVertical4x,
//         tabStyle,
//         // theme.bgSecondaryBackground,
//       ]}>
//       <View style={styles.tabs}>
//         <MText
//           style={[
//             theme.fontXL,
//             theme.flexContainer,
//             theme.textCenter,
//             styles.tabText,
//             mode === 'photo' ? theme.colorLink : null,
//           ]}
//           onPress={onSetPhotoPress}>
//           {i18nService.t('capture.photo').toUpperCase()}
//         </MText>
//         <MText
//           style={[
//             theme.fontXL,
//             theme.flexContainer,
//             theme.textCenter,
//             styles.tabText,
//             mode === 'video' ? theme.colorLink : null,
//           ]}
//           onPress={onSetVideoPress}>
//           {i18nService.t('capture.video').toUpperCase()}
//         </MText>
//       </View>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   tabContainer: {
//     width: '100%',
//     paddingHorizontal: 50,
//   },
//   tabText: {
//     fontWeight: '400',
//     color: '#fff',
//   },
//   tabs: {
//     // backgroundColor: 'red',
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//   },
// });
