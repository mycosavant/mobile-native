import React, { forwardRef, useCallback } from 'react';
import {
  BottomSheetModal,
  BottomSheetModalProps,
  BottomSheetBackdrop,
  useBottomSheetDynamicSnapPoints,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import { StatusBar, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Handle from './Handle';
import useBackHandler from './useBackHandler';
import { H3, B1, IconButton } from '~ui';
import { HORIZONTAL } from '~/styles/Tokens';
import sp from '~/services/serviceProvider';
import { useStyle } from '~/styles/hooks';

interface PropsType extends Omit<BottomSheetModalProps, 'snapPoints'> {
  title?: string;
  subtitle?: string;
  detail?: string;
  autoShow?: boolean;
  snapPoints?: Array<number | string>;
  forceHeight?: number;
  onBack?: () => void;
  onDismissBtn?: () => void;
}

export type BottomSheetModalHandle = BottomSheetModal;

const MBottomSheetModal = forwardRef<BottomSheetModal, PropsType>(
  (props, ref) => {
    const {
      title,
      detail,
      snapPoints,
      autoShow,
      onBack,
      onDismissBtn,
      children,
      ...other
    } = props;
    const { onAnimateHandler } = useBackHandler(
      // @ts-ignore
      useCallback(() => ref?.current?.close(), [ref]),
      props,
    );

    const insets = useSafeAreaInsets();

    const {
      animatedHandleHeight,
      animatedSnapPoints,
      animatedContentHeight,
      handleContentLayout,
    } = useBottomSheetDynamicSnapPoints(
      (snapPoints as (string | number)[]) ?? ['CONTENT_HEIGHT'],
    );

    const contStyle = useStyle(styles.contentContainer, {
      paddingBottom: insets.bottom || 24,
    });

    React.useEffect(() => {
      //@ts-ignore
      if (ref?.current && autoShow) {
        //@ts-ignore
        ref.current.present();
      }
    }, [autoShow, ref]);

    const renderHandle = useCallback(() => <Handle />, []);

    const renderBackdrop = useCallback(
      backdropProps => (
        <BottomSheetBackdrop
          {...backdropProps}
          pressBehavior="close"
          opacity={0.5}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
        />
      ),
      [],
    );

    return (
      <BottomSheetModal
        ref={ref}
        topInset={StatusBar.currentHeight || 0}
        handleComponent={renderHandle}
        enableDynamicSizing
        handleHeight={animatedHandleHeight}
        contentHeight={animatedContentHeight}
        // @ts-ignore until we remove the deprecated useBottomSheetDynamicSnapPoints
        snapPoints={animatedSnapPoints}
        stackBehavior="push"
        backdropComponent={renderBackdrop}
        enablePanDownToClose={true}
        backgroundComponent={null}
        style={styles.sheetContainer as any}
        {...other}
        onAnimate={onAnimateHandler}>
        <BottomSheetView style={contStyle} onLayout={handleContentLayout}>
          {Boolean(title) && (
            <View style={styles.header}>
              <H3 vertical="M" align="center">
                {title}
              </H3>
              {Boolean(onBack) && (
                <View style={styles.backIcon}>
                  <IconButton
                    size="large"
                    name="chevron-left"
                    onPress={onBack}
                  />
                </View>
              )}
              {Boolean(onDismissBtn) && (
                <View style={styles.closeIcon}>
                  <IconButton
                    size="large"
                    name="close"
                    onPress={onDismissBtn}
                  />
                </View>
              )}
            </View>
          )}

          {Boolean(detail) && (
            <B1
              horizontal="L"
              bottom="M"
              align="center"
              color="secondary"
              font="medium">
              {detail}
            </B1>
          )}
          <>{children}</>
        </BottomSheetView>
      </BottomSheetModal>
    );
  },
);

const styles = sp.styles.create({
  contentContainer: ['bgPrimaryBackgroundHighlight'],
  title: ['fontXXL', 'bold', 'textCenter', 'marginVertical3x'],
  detail: [
    'fontL',
    'fontMedium',
    'textCenter',
    'marginTop3x',
    'marginBottom5x',
    'colorSecondaryText',
  ],
  sheetContainer: [
    'shadowBlack',
    {
      shadowOffset: {
        width: 0,
        height: -3,
      },
      shadowOpacity: 0.58,
      shadowRadius: 4.0,
      elevation: 16,
    },
  ],
  header: [
    {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: HORIZONTAL,
    },
    'paddingVertical2x',
  ],
  backIcon: [
    {
      position: 'absolute',
      left: HORIZONTAL,
    },
  ],
  closeIcon: [
    {
      position: 'absolute',
      right: HORIZONTAL,
    },
  ],
});

export default MBottomSheetModal;
