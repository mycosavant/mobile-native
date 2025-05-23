import React, { useCallback, useState } from 'react';
import type { TextInput as TextInputType } from 'react-native';
import {
  Dimensions,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from '@expo/vector-icons/Ionicons';
import { observer } from 'mobx-react';
import { useBackHandler } from '@react-native-community/hooks';
import { action, observable } from 'mobx';
import { Flow } from 'react-native-animated-spinkit';
import { KeyboardStickyView } from 'react-native-keyboard-controller';
import Animated, {
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { BottomSheetFlatList } from '@gorhom/bottom-sheet';

import type CommentsStore from './CommentsStore';
import MediaPreview from './MediaPreview';
import MetaPreview from '../../compose/MetaPreview';
import GroupModel from '../../groups/GroupModel';
import CommentInputBottomMenu from './CommentInputBottomMenu';
import preventDoubleTap from '../../common/components/PreventDoubleTap';
import { CHAR_LIMIT } from '../../config/Config';
import TextInput from '../../common/components/TextInput';
import MText from '../../common/components/MText';

import Tags from '~/common/components/Tags';
import AutoComplete from '~/common/components/AutoComplete/AutoComplete';
import onImageInput from '~/common/helpers/onImageInput';
import sp from '~/services/serviceProvider';

const { height } = Dimensions.get('window');

class StoreProvider {
  @observable.ref store: CommentsStore | null = null;
  @action
  setStore = (s: CommentsStore) => (this.store = s);
}

const storeProvider = new StoreProvider();

const Touchable = preventDoubleTap(TouchableOpacity);

export const CommentInputContext = React.createContext(storeProvider);

/**
 * Floating Input component
 */
const CommentInput = observer(() => {
  const navigation = useNavigation();
  const bottomInset = useSafeAreaInsets().bottom;
  const theme = sp.styles.style;
  const ref = React.useRef<TextInputType>(null);
  const [autoCompleteVisible, setAutoCompleteVisible] = useState(false);
  const provider = React.useContext(CommentInputContext);

  /**
   * hides the comment input
   */
  const hideInput = useCallback(
    () => provider.store?.setShowInput(false),
    [provider.store],
  );

  /**
   * hide the input when back is pressed if it was visible
   */
  useBackHandler(
    useCallback(() => {
      if (provider.store?.showInput) {
        hideInput();
        return true;
      }
      return false;
    }, [hideInput, provider.store?.showInput]),
  );

  const afterSelected = () => setTimeout(() => ref.current?.focus(), 400);
  const beforeSelect = () => ref.current?.blur();

  const autoCompleteAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: withSpring(autoCompleteVisible ? 0 : height, {
          mass: 0.3,
        }),
      },
    ],
  }));

  if (!provider.store || !provider.store.showInput) {
    return null;
  }

  const placeHolder =
    provider.store.entity instanceof GroupModel
      ? sp.i18n.t('messenger.typeYourMessage')
      : sp.i18n.t('activity.typeComment');

  const inputMaxHeight = {
    maxHeight:
      height * 0.2 - (provider.store.parent || provider.store.edit ? 50 : 0),
  };

  return (
    <KeyboardStickyView pointerEvents="box-none">
      <View style={[theme.justifyEnd, theme.flexContainer]}>
        <View style={theme.flexContainer}>
          <Touchable
            style={[theme.flexContainer, theme.bgBlack, theme.opacity25]}
            activeOpacity={0.15}
            onPress={hideInput}
          />
          <MediaPreview attachment={provider.store.attachment} />
          {!provider.store.attachment.hasAttachment &&
            provider.store.embed.meta && (
              <MetaPreview
                meta={provider.store.embed.meta}
                onRemove={provider.store.embed.clearRichEmbed}
                containerStyle={styles.meta}
              />
            )}
          <Animated.View
            style={[
              theme.absoluteFill,
              { top: 35 }, // TODO: logic of number
              autoCompleteAnimatedStyle,
            ]}>
            <AutoComplete
              selection={provider.store?.selection || { start: 0, end: 0 }}
              onSelectionChange={selection =>
                provider.store?.setSelection(selection)
              }
              text={provider.store?.text || ''}
              onTextChange={text => provider.store?.setText(text)}
              flatListComponent={BottomSheetFlatList}
              onVisible={setAutoCompleteVisible}
            />
          </Animated.View>
        </View>
      </View>
      <View
        style={[
          theme.bgPrimaryBackground,
          styles.inputContainer,
          {
            paddingBottom: Platform.select({
              android: bottomInset + 9,
              ios: bottomInset - 16,
            }),
          },
        ]}>
        {(provider.store.parent || provider.store.edit) && (
          <View
            style={[
              theme.borderBottomHair,
              theme.bcolorPrimaryBorder,
              theme.paddingBottom2x,
              theme.paddingHorizontal4x,
              theme.marginBottom2x,
            ]}>
            <MText style={theme.colorSecondaryText}>
              {provider.store.edit
                ? sp.i18n.t('edit')
                : sp.i18n.t('activity.replyTo', {
                    user: provider.store.parent?.ownerObj.username,
                  })}
            </MText>
          </View>
        )}

        <View
          style={[
            theme.rowJustifyStart,
            theme.alignEnd,
            theme.paddingHorizontal4x,
          ]}>
          <TextInput
            testID="CommentTextInput"
            ref={ref}
            autoFocus={true}
            multiline={true}
            editable={!provider.store.saving}
            scrollEnabled={true}
            placeholderTextColor={sp.styles.getColor('TertiaryText')}
            placeholder={placeHolder}
            underlineColorAndroid="transparent"
            onChangeText={provider.store?.setText}
            keyboardType={'default'}
            maxLength={CHAR_LIMIT}
            onImageChange={
              provider.store
                ? onImageInput(provider.store.onAttachedMedia)
                : undefined
            }
            onSelectionChange={e =>
              provider.store?.setSelection(e.nativeEvent.selection)
            }
            style={[
              theme.fullWidth,
              theme.colorPrimaryText,
              theme.fontL,
              styles.input,
              inputMaxHeight,
            ]}>
            <Tags navigation={navigation} selectable={true}>
              {provider.store.text}
            </Tags>
          </TextInput>
          {!provider.store.saving ? (
            <View>
              <View
                style={[
                  theme.rowJustifySpaceBetween,
                  styles.sendIconCont,
                  theme.alignCenter,
                ]}>
                <Touchable
                  onPress={provider.store.post}
                  style={theme.paddingRight2x}
                  testID="PostCommentButton">
                  <Icon
                    name="send"
                    size={18}
                    style={theme.colorSecondaryText}
                  />
                </Touchable>
                <CommentInputBottomMenu
                  store={provider.store}
                  containerStyle={styles.sendIconCont}
                  afterSelected={afterSelected}
                  beforeSelect={beforeSelect}
                />
              </View>
              <MText style={[theme.fontXS, theme.colorSecondaryText]}>
                {provider.store.text.length} / {CHAR_LIMIT}
              </MText>
            </View>
          ) : (
            <View style={[theme.alignSelfCenter, theme.justifyEnd]}>
              <Flow color={sp.styles.getColor('PrimaryText')} />
            </View>
          )}
        </View>
      </View>
    </KeyboardStickyView>
  );
});

export default CommentInput;

const styles = StyleSheet.create({
  meta: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    marginBottom: 20,
    shadowColor: 'black',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 16,
  },
  preview: {
    minHeight: 80,
    margin: 10,
  },
  sendIconCont: {
    paddingBottom: Platform.select({
      android: 13,
      ios: 8,
    }),
  },
  input: {
    minHeight: 35,
    flex: 3,
    lineHeight: 22,
  },
  inputContainer: {
    shadowColor: 'black',
    maxHeight: height * 0.4,
    width: '100%',
    borderColor: 'transparent',
    ...Platform.select({
      android: { paddingTop: 7 },
      ios: { paddingTop: 10 },
    }),
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 16,
  },
});
