import { Audio, ResizeMode, Video, VideoReadyForDisplayEvent } from 'expo-av';
import { toJS } from 'mobx';
import { observer } from 'mobx-react';
import React, { useEffect, useRef } from 'react';
import type CommentModel from '../../../comments/v2/CommentModel';
import type ActivityModel from '../../../newsfeed/ActivityModel';
import ThemedStyles from '../../../styles/ThemedStyles';
import { MindsVideoStoreType } from './createMindsVideoStore';

type PropsType = {
  entity?: ActivityModel | CommentModel;
  localStore: MindsVideoStoreType;
  repeat?: boolean;
  resizeMode?: ResizeMode;
  onReadyForDisplay?: (event: VideoReadyForDisplayEvent) => void;
};

const ExpoVideo = observer(
  ({ localStore, repeat = true, resizeMode, onReadyForDisplay }: PropsType) => {
    const theme = ThemedStyles.style;
    const playbackObject = useRef<Video>(null);

    const source = localStore.video.uri ? toJS(localStore.video) : undefined;

    useEffect(() => {
      if (!localStore.player && playbackObject.current) {
        Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
          shouldDuckAndroid: false,
          interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
        });
        localStore.setPlayer(playbackObject.current);
      }
    }, [localStore]);
    return (
      <Video
        key={`video${localStore.source}`}
        onPlaybackStatusUpdate={localStore.updatePlaybackCallback}
        onLoadStart={localStore.onLoadStart}
        onLoad={localStore.onVideoLoad}
        shouldPlay={!localStore.paused}
        onError={localStore.onError}
        source={source}
        isLooping={repeat}
        resizeMode={resizeMode || 'contain'}
        useNativeControls={false}
        style={theme.flexContainer}
        ref={playbackObject}
        volume={localStore.volume}
        onReadyForDisplay={onReadyForDisplay}
      />
    );
  },
);

export default ExpoVideo;
