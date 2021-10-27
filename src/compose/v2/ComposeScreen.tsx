import React, { useCallback, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Dimensions,
  Keyboard,
  Platform,
  InteractionManager,
} from 'react-native';
import { observer, useLocalStore } from 'mobx-react';
import { Icon } from '~ui/icons';
import ThemedStyles from '../../styles/ThemedStyles';
import i18n from '../../common/services/i18n.service';
import MetaPreview from '../MetaPreview';
import TitleInput from '../TitleInput';
import NavigationService from '../../navigation/NavigationService';
import RemindPreview from '../RemindPreview';
import PosterOptions from '../PosterOptions2';
import TopBar from '../TopBar';
import { ScrollView } from 'react-native-gesture-handler';
import BottomBar from '../BottomBar';
import MediaPreview from '../MediaPreview';
import Tags from '../../common/components/Tags';
import KeyboardSpacingView from '../../common/components/KeyboardSpacingView';
import SoftInputMode from 'react-native-set-soft-input-mode';
import TextInput from '../../common/components/TextInput';
import BottomSheet from '../../common/components/bottom-sheet/BottomSheetModal';
import BottomSheetButton from '../../common/components/bottom-sheet/BottomSheetButton';
import sessionService from '~/common/services/session.service';
import FastImage from 'react-native-fast-image';
import { useBackHandler } from '@react-native-community/hooks';
import useComposeStore from '../useComposeStore';
import { useFocusEffect } from '@react-navigation/core';
import { BottomSheetModal } from '@gorhom/bottom-sheet';

const { width } = Dimensions.get('window');

/**
 * Compose Screen
 * @param {Object} props
 */
export default observer(function (props) {
  const store = useComposeStore(props);

  useFocusEffect(store.onScreenFocused);

  const theme = ThemedStyles.style;
  const inputRef = useRef(null);
  const optionsRef = useRef<BottomSheetModal>(null);
  const confirmRef = useRef(null);

  // On post press
  const onPost = useCallback(async () => {
    if (store.attachment.uploading) {
      return;
    }
    const isEdit = store.isEdit;
    const entity = await store.submit();

    if (entity) {
      store.onPost(entity, isEdit);
    }
  }, [store]);

  const discard = useCallback(() => {
    // if (store.isRemind || store.isEdit) {
    store.clear();
    closeConfirm();
    setImmediate(() => {
      NavigationService.goBack();
    });
    // } else {
    // store.setModePhoto();
    // }
  }, [store]);

  // On press back
  const onPressBack = useCallback(() => {
    if (
      store.text ||
      store.attachment.hasAttachment ||
      store.embed.hasRichEmbed
    ) {
      Keyboard.dismiss();
      showConfirm();
    } else {
      discard();
    }
  }, [discard, store, showConfirm]);

  const localStore = useLocalStore(() => ({
    height: 50, // input height
    onSizeChange(e) {
      localStore.height = e.nativeEvent.contentSize.height * 1.15;
    },
  }));

  useBackHandler(
    useCallback(() => {
      onPressBack();
      return true;
    }, [onPressBack]),
  );

  React.useEffect(() => {
    if (Platform.OS === 'android') {
      SoftInputMode.set(SoftInputMode.ADJUST_RESIZE);
      return () => SoftInputMode.set(SoftInputMode.ADJUST_PAN);
    }
  }, []);

  const showEmbed = store.embed.hasRichEmbed && store.embed.meta;

  const fontSize =
    store.attachment.hasAttachment || store.text.length > 85
      ? theme.fontXL
      : theme.fontXXL;

  const placeholder = store.attachment.hasAttachment
    ? i18n.t('description')
    : i18n.t('capture.placeholder');

  const rightButton = store.isEdit ? (
    i18n.t('save')
  ) : (
    <Icon
      name="send"
      size={25}
      disabled={!store.isValid}
      color={store.isValid ? 'Link' : 'Icon'}
      style={[
        // theme.colorPrimaryText,
        // { color: 'red' },
        store.attachment.uploading ? theme.opacity25 : null,
      ]}
    />
  );

  // useEffect(() => {
  //   Keyboard.addListener('keyboardWillHide', () => {
  //     // inputRef.current!.
  //   });
  // }, [])

  useEffect(() => {
    InteractionManager.runAfterInteractions(() => {
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 300);
    });
  }, [inputRef]);

  const closeConfirm = React.useCallback(() => {
    confirmRef.current?.dismiss();
  }, []);
  const showConfirm = React.useCallback(() => {
    confirmRef.current?.present();
  }, []);

  const showBottomBar = !optionsRef.current || !optionsRef.current.opened;

  const channel = sessionService.getUser();

  const avatar =
    channel && channel.getAvatarSource ? channel.getAvatarSource('medium') : {};

  return (
    <View
      style={[
        theme.flexContainer,
        theme.bgPrimaryBackground,
        styles.container,
      ]}>
      <TopBar
        containerStyle={theme.paddingLeft}
        // backIconSize={45}
        rightText={rightButton}
        onPressRight={onPost}
        onPressBack={onPressBack}
        store={store}
      />

      <ScrollView
        keyboardShouldPersistTaps={'handled'}
        contentContainerStyle={styles.bodyContainer}>
        <View style={{ flexDirection: 'row' }}>
          <View
            style={{
              // backgroundColor: 'red',
              paddingHorizontal: 10,
              paddingTop: 5,
            }}>
            <FastImage source={avatar} style={styles.wrappedAvatar} />
          </View>
          <View style={{ flex: 1 }}>
            {!store.noText && (
              <>
                {store.attachment.hasAttachment && <TitleInput store={store} />}
                <TextInput
                  // onKeyPress={({ nativeEvent }) => {
                  //   if (nativeEvent.key === 'Backspace') {
                  //     //your code
                  //     // if you want to remove focus then you can use a ref
                  //     // Keyboard.dismiss();
                  //     // this.inputRef.blur();
                  //     Alert.alert('hey no!')
                  //   }
                  // }}
                  style={[
                    theme.fullWidth,
                    theme.colorPrimaryText,
                    fontSize,
                    // theme.paddingHorizontal4x,
                    styles.input,
                    Platform.OS === 'ios'
                      ? fontSize
                      : [fontSize, { height: localStore.height }],
                  ]}
                  onContentSizeChange={localStore.onSizeChange}
                  ref={inputRef}
                  scrollEnabled={false}
                  placeholder={placeholder}
                  placeholderTextColor={ThemedStyles.getColor('TertiaryText')}
                  onChangeText={store.setText}
                  textAlignVertical="top"
                  multiline={true}
                  selectTextOnFocus={false}
                  underlineColorAndroid="transparent"
                  testID="PostInput">
                  <Tags>{store.text}</Tags>
                </TextInput>
              </>
            )}
            <MediaPreview store={store} />
            {store.isRemind && <RemindPreview entity={store.entity} />}
            {store.isEdit && store.entity.remind_object && (
              <RemindPreview entity={store.entity.remind_object} />
            )}
            {showEmbed && (
              <MetaPreview
                meta={store.embed.meta}
                onRemove={store.embed.clearRichEmbed}
                isEdit={store.isEdit}
              />
            )}
          </View>
        </View>
      </ScrollView>

      {showBottomBar && (
        <KeyboardSpacingView
          enabled={Platform.OS === 'ios'}
          style={[theme.bgPrimaryBackground, styles.bottomBarContainer]}>
          <BottomBar
            store={store}
            onHashtag={() => {
              console.log('onHashtag');

              // navigation.navigate('MonetizeSelector', { store: props.store })
              optionsRef.current.navigateTo('MonetizeSelector');
            }}
            onMoney={() => {
              // navigation.navigate('TagSelector', { store: props.store })
              optionsRef.current.navigateTo('TagSelector');
            }}
            onOptions={() => {
              Keyboard.dismiss();
              optionsRef.current.show();

              // setImmediate(() => {
              //   InteractionManager.runAfterInteractions(() => {
              //     optionsRef.current.show();
              //   });
              // });
            }}
          />
        </KeyboardSpacingView>
      )}

      <PosterOptions ref={optionsRef} store={store} />
      <BottomSheet
        ref={confirmRef}
        title={i18n.t('capture.discardPost')}
        detail={i18n.t('capture.discardPostDescription')}>
        <BottomSheetButton
          text={i18n.t('capture.yesDiscard')}
          onPress={discard}
          action
        />
        <BottomSheetButton
          text={i18n.t('capture.keepEditing')}
          onPress={closeConfirm}
        />
      </BottomSheet>
    </View>
  );
});

const styles = ThemedStyles.create({
  bottomBarContainer: [
    'borderTopHair',
    'bcolorPrimaryBorder',
    {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: -2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 3.0,

      // elevation: 12,
    },
  ],
  input: {
    // minHeight: 100,
    textAlignVertical: 'top',
    // backgroundColor: 'red'
  },
  remindPreview: {
    marginHorizontal: 10,
    width: width - 20,
    height: width / 3,
  },
  topBar: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    shadowOpacity: 2,
    textShadowRadius: 4,
    textShadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  postButton: {
    textAlign: 'right',
    textAlignVertical: 'center',
    fontSize: 20,
    paddingRight: 20,
  },
  container: {
    flex: 1,
    paddingBottom: 0,
    marginBottom: 0,
  },
  bodyContainer: {
    // minHeight: '100%',
    paddingBottom: 75,
  },
  icon: {
    color: '#FFFFFF',
  },
  removeMedia: {
    zIndex: 10000,
    position: 'absolute',
    top: 15,
    right: 15,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
    elevation: 2,
    shadowOffset: { width: 1, height: 1 },
    shadowColor: 'black',
    shadowOpacity: 0.65,
  },
  wrappedAvatar: {
    height: 40,
    width: 40,
    borderRadius: 40,
  },
});
