import { observer } from 'mobx-react';
import React from 'react';
import FastImage from 'react-native-fast-image';
import SmartImage from '../../src/common/components/SmartImage';

/**
 * Image preview with max and min aspect ratio support
 * @param {Object} props
 */
export default observer(function (props) {
  const imageStyle = {
    height: '100%',
    width: '100%',
  };

  // workaround: we use sourceURL for the preview on iOS because the image is not displayed with the uri
  const uri = props.image.sourceURL || props.image.uri || props.image.path;

  return (
    <SmartImage
      key={props.image.key || 'imagePreview'}
      source={{ uri: uri + `?${props.image.key}` }} // we need to change the uri in order to force the reload of the image
      style={[imageStyle, props.style]}
      resizeMode={FastImage.resizeMode.cover}
    />
  );
});
