// import { useFocusEffect } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/core';
import { observer } from 'mobx-react';
import React, { useCallback, useEffect, useState } from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import { showMessage } from 'react-native-flash-message';
import { useSafeArea } from 'react-native-safe-area-context';
import Button from '~/common/components/Button';
import MText from '~/common/components/MText';
import useIsPortrait from '~/common/hooks/useIsPortrait';
import attachmentService from '~/common/services/attachment.service';
import i18nService from '~/common/services/i18n.service';
import FloatingBackButton from '../../common/components/FloatingBackButton';
import ThemedStyles from '../../styles/ThemedStyles';
import Camera from '../Camera/Camera';
import i18n from '../../common/services/i18n.service';
// import MediaConfirm from '../MediaConfirm';
import PermissionsCheck from '../PermissionsCheck';
import ImageFilter from './ImageFilter';
import MediaPreview from './MediaPreview';
import changeNavigationBarColor from 'react-native-navigation-bar-color';

/**
 * Display an error message to the user.
 * @param {string} message
 */
const showError = message => {
  showMessage({
    position: 'top',
    message: message,
    titleStyle: [
      ThemedStyles.style.fontXL,
      ThemedStyles.style.colorPrimaryText,
    ],
    duration: 3000,
    backgroundColor: ThemedStyles.getColor('TertiaryBackground'),
    type: 'danger',
  });
};

/**
 * Camera Screen
 * @param {Object} props
 */
export default observer(function (props) {
  const navigation = useNavigation();
  const { portraitMode, onGallerySelection, onMediaConfirmed } =
    props.route?.params ?? {};
  const [mode, setMode] = useState<'photo' | 'video'>('photo');
  const [mediaToConfirm, setMediaToConfirm] = useState<any>(null);
  const portrait = useIsPortrait();
  const handleConfirm = useCallback(() => {
    if (!mediaToConfirm) return;

    if (onMediaConfirmed) {
      // if the media confirmed was handled, use the handler
      const shouldCloseScreen = onMediaConfirmed(mediaToConfirm);
      if (shouldCloseScreen) {
        navigation.goBack();
      }
    }

    navigation.navigate('Compose', {
      media: mediaToConfirm,
    });
  }, [mediaToConfirm, navigation, onMediaConfirmed]);

  const handleGallerySelection = useCallback(async () => {
    const media = await attachmentService.gallery(mode, false);

    if (!media) {
      return;
    }

    // we don't support multiple media yet
    if (Array.isArray(media)) {
      return;
    }

    if (portraitMode && media.height < media.width) {
      showError(i18n.t('capture.mediaPortraitError'));
      return;
    }

    // this.acceptMedia();

    setMediaToConfirm(media);
    // onGallerySelection(response);
  }, [mode, portraitMode]);
  const setModePhoto = useCallback(() => setMode('photo'), []);
  const setModeVideo = useCallback(() => setMode('video'), []);
  const theme = ThemedStyles.style;
  const showCamera =
    mode === 'photo' || mode === 'video' || Boolean(mediaToConfirm);

  useEffect(() => {
    changeNavigationBarColor('#000000', false, false);

    return () => {
      return changeNavigationBarColor(
        ThemedStyles.style.bgSecondaryBackground.backgroundColor,
        !ThemedStyles.theme,
        true,
      );
    };
  }, []);

  return (
    <View
      style={[
        theme.flexContainer,
        { backgroundColor: '#000', height: '100%', width: '100%' },
      ]}>
      <StatusBar backgroundColor="#000" barStyle="light-content" />

      <View
        style={[theme.flexContainer, { borderRadius: 20, overflow: 'hidden' }]}>
        {showCamera && (
          <PermissionsCheck>
            <Camera
              onMedia={media => {
                media.key = 1;
                setMediaToConfirm(media);
              }}
              mode={mediaToConfirm ? 'photo' : mode}
              onForceVideo={setModeVideo}
              onPressGallery={handleGallerySelection}
              portraitMode={portraitMode}
            />
          </PermissionsCheck>
        )}

        {Boolean(mediaToConfirm) && (
          <View style={StyleSheet.absoluteFill}>
            {mode === 'photo' ? (
              <ImageFilter
                image={mediaToConfirm}
                onImageChange={changedImage => {
                  console.log('changedImage', changedImage);
                  changedImage.key = 2;
                  setMediaToConfirm(changedImage);
                }}
              />
            ) : (
              <MediaPreview mediaToConfirm={mediaToConfirm} />
            )}
          </View>
        )}
      </View>

      {!mediaToConfirm && portrait && (
        <BottomBar
          onSetPhotoPress={setModePhoto}
          onSetVideoPress={setModeVideo}
          mode={mode}
        />
      )}
      {Boolean(mediaToConfirm) && (
        <BottomBarMediaConfirm
          mode={mode}
          onRetake={() => {
            setMediaToConfirm(null);
          }}
          onConfirm={handleConfirm}
        />
      )}

      <FloatingBackButton
        onPress={
          mediaToConfirm
            ? () => setMediaToConfirm(null)
            : props.navigation.goBack
        }
        light
        shadow
        style={theme.paddingLeft3x}
      />
    </View>
  );
});

const TabButton = ({ onPress, active, children }) => {
  const theme = ThemedStyles.style;

  return (
    <MText
      style={[
        theme.fontXL,
        theme.flexContainer,
        theme.textCenter,
        styles.tabText,
        active ? theme.colorLink : null,
      ]}
      onPress={onPress}>
      {children}
    </MText>
  );
};

const BottomBar = ({ mode, onSetPhotoPress, onSetVideoPress }) => {
  const theme = ThemedStyles.style;
  const insets = useSafeArea();
  const tabStyle = {
    paddingBottom: insets.bottom || 16,
    backgroundColor: '#000',
  };

  return (
    <View style={[styles.tabContainer, theme.paddingVertical2x, tabStyle]}>
      <View style={styles.tabs}>
        <TabButton onPress={onSetPhotoPress} active={mode === 'photo'}>
          {i18nService.t('capture.photo').toUpperCase()}
        </TabButton>

        <TabButton onPress={onSetVideoPress} active={mode === 'video'}>
          {i18nService.t('capture.video').toUpperCase()}
        </TabButton>
      </View>
    </View>
  );
};

const BottomBarMediaConfirm = ({ mode, onRetake, onConfirm }) => {
  const theme = ThemedStyles.style;
  const insets = useSafeArea();
  const tabStyle = {
    paddingBottom: insets.bottom || 16,
    backgroundColor: '#000',
  };

  return (
    <View style={[styles.tabContainer, theme.paddingVertical2x, tabStyle]}>
      <View style={styles.tabs}>
        {/* <TabButton onPress={onRetake} active={mode === 'photo'}>
          Retake
        </TabButton> */}
        <Button
          onPress={onRetake}
          text={'Retake'}
          // active={mode === 'photo'}
          // borderRadius={3}
          // backgroundColor="transparent"
          transparent
          small
          // action
          // containerStyle={[theme.bgLink]}
          // textColor={'#fff'}
          // containerViewStyle={ComponentsStyle.loginButton}
          // textStyle={ComponentsStyle.loginButtonText}
          // key={1}
        />

        <Button
          onPress={onConfirm}
          text={'Use ' + mode}
          // borderRadius={3}
          // backgroundColor="transparent"
          small
          action
          containerStyle={[theme.bgLink]}
          textColor={'#fff'}
          // containerViewStyle={ComponentsStyle.loginButton}
          // textStyle={ComponentsStyle.loginButtonText}
          // key={1}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  tabContainer: {
    width: '100%',
    paddingHorizontal: 50,
  },
  tabText: {
    fontWeight: '400',
    color: '#fff',
    paddingVertical: 8,
    flex: 1,
    // backgroundColor: 'blue',
  },
  tabs: {
    // backgroundColor: 'red',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
