import { useDimensions } from '@react-native-community/hooks';
import { ResizeMode } from 'expo-av';
import { observer } from 'mobx-react';
import React, { useState } from 'react';
import { Platform } from 'react-native';
import MindsVideo from '../../media/v2/mindsVideo/MindsVideo';
import ImagePreview from '../ImagePreviewV2';

type PropsType = {
  // store: any;
  // width: number;
  // height: number;
  mediaToConfirm: any;
  entity?: any;
};

type VideoSizeType = {
  width: number;
  height: number;
} | null;

export default observer(function MediaPreview({
  mediaToConfirm,
  // uploading,
  // progress,
  // onCancelOrDeletePress,
  // portraitMode,
  // isEdit,
  entity,
}: PropsType) {
  // const theme = ThemedStyles.style;

  const { width } = useDimensions().window;
  const [videoSize, setVideoSize] = useState<VideoSizeType>(null);

  const onVideoLoaded = React.useCallback(e => {
    if (e.naturalSize.orientation === 'portrait' && Platform.OS === 'ios') {
      const w = e.naturalSize.width;
      e.naturalSize.width = e.naturalSize.height;
      e.naturalSize.height = w;
    }
    setVideoSize(e.naturalSize);
  }, []);

  // if (!props.store.attachment.hasAttachment) {
  //   return null;
  // }

  const isImage = mediaToConfirm && mediaToConfirm.type.startsWith('image');

  let aspectRatio,
    videoHeight = 300;

  if (!isImage && (mediaToConfirm?.width || videoSize)) {
    const vs = videoSize || mediaToConfirm;

    aspectRatio = vs.width / vs.height;
    videoHeight = Math.round(width / aspectRatio);
  }

  const previewStyle = {
    height: videoHeight,
    width: width,
  };

  return (
    <>
      {/* {uploading && (
        <Progress.Bar
          indeterminate={true}
          progress={progress}
          width={width}
          color={ThemedStyles.getColor('Green')}
          borderWidth={0}
          borderRadius={0}
          useNativeDriver={true}
        />
      )} */}
      {isImage ? (
        // <View>
        //   {!isEdit && !portraitMode && (
        //     <TouchableOpacity
        //       testID="AttachmentDeleteButton"
        //       onPress={() => onCancelOrDeletePress(!isEdit)}
        //       style={[styles.removeMedia, theme.bgSecondaryBackground]}>
        //       <Icon
        //         name="trash"
        //         size={26}
        //         style={(styles.icon, theme.colorIcon)}
        //       />
        //     </TouchableOpacity>
        //   )}
        //   <ImagePreview image={mediaToConfirm} />
        // </View>
        <ImagePreview image={mediaToConfirm} />
      ) : (
        // <View style={previewStyle}>
        //   {!isEdit && (
        //     <TouchableOpacity
        //       onPress={onCancelOrDeletePress}
        //       style={[styles.removeMedia, theme.bgSecondaryBackground]}>
        //       <Icon
        //         name="trash"
        //         size={26}
        //         style={(styles.icon, theme.colorIcon)}
        //       />
        //     </TouchableOpacity>
        //   )}
        //   <MindsVideo
        //     entity={entity}
        //     video={mediaToConfirm}
        //     containerStyle={previewStyle}
        //     resizeMode={ResizeMode.CONTAIN}
        //     autoplay
        //     onReadyForDisplay={onVideoLoaded}
        //   />
        // </View>
        <MindsVideo
          entity={entity}
          video={mediaToConfirm}
          containerStyle={previewStyle}
          resizeMode={ResizeMode.CONTAIN}
          autoplay
          onReadyForDisplay={onVideoLoaded}
        />
      )}
    </>
  );
});

// const styles = StyleSheet.create({
//   icon: {
//     color: '#FFFFFF',
//   },
//   removeMedia: {
//     zIndex: 10000,
//     position: 'absolute',
//     top: 15,
//     right: 15,
//     width: 38,
//     height: 38,
//     alignItems: 'center',
//     justifyContent: 'center',
//     borderRadius: 19,
//     elevation: 2,
//     shadowOffset: { width: 1, height: 1 },
//     shadowColor: 'black',
//     shadowOpacity: 0.65,
//   },
// });
