import { useDimensions } from '@react-native-community/hooks';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Image,
  InteractionManager,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import ThemedStyles from '~/styles/ThemedStyles';
import FILTERS from './FiltersList';
import ImagePreview from '../ImagePreviewV2';
import MText from '~/common/components/MText';
import { debounce } from 'lodash';
import { cleanExtractedImagesCache } from 'react-native-image-filter-kit';

const createImg = (source: any, imageStyle) => (
  <Image style={imageStyle} resizeMode="cover" source={source} />
);
const createVw = width => (
  <View
    style={{
      height: '100%',
      width,
      overflow: 'hidden',
      // backgroundColor: 'rgba(0, 0, 0, 0.5)',
    }}></View>
);

export default function ImageFilter({
  image: imageInput,
  onImageChange: _onImageChange,
}) {
  const image = useRef(imageInput).current;
  const width = useDimensions().window.width;
  const height = useDimensions().window.height;
  const offset = useSharedValue(0);
  const [filtersToLoad, setFiltersToLoad] = useState<any>(5);
  const [activeIndex, setActiveIndex] = useState(0);

  const onImageChange = useCallback(
    debounce(changedImage => _onImageChange(changedImage), 500),
    [],
  );

  const style0 = useAnimatedStyle(() => ({
    right: Math.max(offset.value - width * (filtersToLoad - 1), 0),
  }));
  const style1 = useAnimatedStyle(() => ({
    right: Math.max(offset.value - width * (filtersToLoad - 2), 0),
  }));
  const style2 = useAnimatedStyle(() => ({
    right: Math.max(offset.value - width * (filtersToLoad - 3), 0),
  }));
  const style3 = useAnimatedStyle(() => ({
    right: Math.max(offset.value - width * (filtersToLoad - 4), 0),
  }));
  const style4 = useAnimatedStyle(() => ({
    right: Math.max(offset.value - width * (filtersToLoad - 5), 0),
  }));
  const style5 = useAnimatedStyle(() => ({
    right: Math.max(offset.value - width * (filtersToLoad - 6), 0),
  }));
  const style6 = useAnimatedStyle(() => ({
    right: Math.max(offset.value - width * (filtersToLoad - 7), 0),
  }));
  const style7 = useAnimatedStyle(() => ({
    right: Math.max(offset.value - width * (filtersToLoad - 8), 0),
  }));
  const style8 = useAnimatedStyle(() => ({
    right: Math.max(offset.value - width * (filtersToLoad - 9), 0),
  }));
  const style9 = useAnimatedStyle(() => ({
    right: Math.max(offset.value - width * (filtersToLoad - 10), 0),
  }));
  const style10 = useAnimatedStyle(() => ({
    right: Math.max(offset.value - width * (filtersToLoad - 11), 0),
  }));
  const style11 = useAnimatedStyle(() => ({
    right: Math.max(offset.value - width * (filtersToLoad - 12), 0),
  }));
  const style12 = useAnimatedStyle(() => ({
    right: Math.max(offset.value - width * (filtersToLoad - 13), 0),
  }));
  const style13 = useAnimatedStyle(() => ({
    right: Math.max(offset.value - width * (filtersToLoad - 14), 0),
  }));
  const style14 = useAnimatedStyle(() => ({
    right: Math.max(offset.value - width * (filtersToLoad - 15), 0),
  }));
  const style15 = useAnimatedStyle(() => ({
    right: Math.max(offset.value - width * (filtersToLoad - 16), 0),
  }));
  const style16 = useAnimatedStyle(() => ({
    right: Math.max(offset.value - width * (filtersToLoad - 17), 0),
  }));
  const style17 = useAnimatedStyle(() => ({
    right: Math.max(offset.value - width * (filtersToLoad - 18), 0),
  }));
  const style18 = useAnimatedStyle(() => ({
    right: Math.max(offset.value - width * (filtersToLoad - 19), 0),
  }));
  const style19 = useAnimatedStyle(() => ({
    right: Math.max(offset.value - width * (filtersToLoad - 20), 0),
  }));
  const style20 = useAnimatedStyle(() => ({
    right: Math.max(offset.value - width * (filtersToLoad - 21), 0),
  }));
  const style21 = useAnimatedStyle(() => ({
    right: Math.max(offset.value - width * (filtersToLoad - 22), 0),
  }));
  const style22 = useAnimatedStyle(() => ({
    right: Math.max(offset.value - width * (filtersToLoad - 23), 0),
  }));
  const style23 = useAnimatedStyle(() => ({
    right: Math.max(offset.value - width * (filtersToLoad - 24), 0),
  }));
  const style24 = useAnimatedStyle(() => ({
    right: Math.max(offset.value - width * (filtersToLoad - 25), 0),
  }));
  const style25 = useAnimatedStyle(() => ({
    right: Math.max(offset.value - width * (filtersToLoad - 26), 0),
  }));
  const style26 = useAnimatedStyle(() => ({
    right: Math.max(offset.value - width * (filtersToLoad - 27), 0),
  }));
  const style27 = useAnimatedStyle(() => ({
    right: Math.max(offset.value - width * (filtersToLoad - 28), 0),
  }));
  const style28 = useAnimatedStyle(() => ({
    right: Math.max(offset.value - width * (filtersToLoad - 29), 0),
  }));

  const imageStyle = {
    height: height - 50,
    width,
    position: 'absolute',
    top: 0,
    // right: 0,
    left: 0,
    // bottom: 0,
  };

  const extractedUris = useRef({});
  const Filters = useMemo(() => {
    return FILTERS.map(({ filterComponent: FilterComponent }, index) => {
      // console.log('activeIndex', activeIndex);
      // console.log('index === activeIndex', index === activeIndex);

      return (
        <FilterComponent
          // extractImageEnabled={true}
          // extractImageEnabled={true}
          // onExtractImage={() => onExtractImage(index)}
          onExtractImage={({ nativeEvent }) => {
            console.log('nativeEvent.uri', nativeEvent.uri);
            extractedUris.current[index] = nativeEvent.uri;
          }}
          extractImageEnabled={index === activeIndex}
          image={createImg(image, imageStyle)}
        />
      );
    });
  }, [activeIndex]);

  // const generateFilters = () => {
  //   return (

  //   );
  // };

  // useEffect(() => {
  //   // const filterComponents = [];
  //   // setFiltersToLoad(filterComponents.slice(0, 3));
  //   const inter = setInterval(() => {
  //     if (filtersToLoad === FILTERS.length) {
  //       clearInterval(inter);
  //       return;
  //     }
  //     InteractionManager.runAfterInteractions(() => {
  //       setFiltersToLoad(filtersToLoad + 3);
  //     });
  //   }, 2000);

  //   return () => clearInterval(inter);
  // }, [filtersToLoad]);

  const [showingTitle, _setShowingTitle] = useState('');

  const setShowingTitle = useCallback(
    debounce(title => _setShowingTitle(title), 100),
    [],
  );

  const mamadIof = (
    <View
      style={useMemo(
        () => ({
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '100%',
          // backgroundColor: 'rgba(144, 144, 12, 0.3)',
          width,
        }),
        [width],
      )}>
      {[
        <Animated.View style={[styles.ali, style0]}>
          {Filters[0]}
        </Animated.View>,
        <Animated.View style={[styles.ali, style1]}>
          {Filters[1]}
        </Animated.View>,
        <Animated.View style={[styles.ali, style2]}>
          {Filters[2]}
        </Animated.View>,
        <Animated.View style={[styles.ali, style3]}>
          {Filters[3]}
        </Animated.View>,
        <Animated.View style={[styles.ali, style4]}>
          <ImagePreview style={imageStyle} image={image} />
          {/* {Filters[4]} */}
        </Animated.View>,
        <Animated.View style={[styles.ali, style5]}>
          {Filters[5]}
        </Animated.View>,
        <Animated.View style={[styles.ali, style6]}>
          {Filters[6]}
        </Animated.View>,
        <Animated.View style={[styles.ali, style7]}>
          {Filters[7]}
        </Animated.View>,
        <Animated.View style={[styles.ali, style8]}>
          {Filters[8]}
        </Animated.View>,
        <Animated.View style={[styles.ali, style9]}>
          {Filters[9]}
        </Animated.View>,
        <Animated.View style={[styles.ali, style10]}>
          {Filters[10]}
        </Animated.View>,
        <Animated.View style={[styles.ali, style11]}>
          {Filters[11]}
        </Animated.View>,
        <Animated.View style={[styles.ali, style12]}>
          {Filters[12]}
        </Animated.View>,
        <Animated.View style={[styles.ali, style13]}>
          {Filters[13]}
        </Animated.View>,
        <Animated.View style={[styles.ali, style14]}>
          {Filters[14]}
        </Animated.View>,
        <Animated.View style={[styles.ali, style15]}>
          {Filters[15]}
        </Animated.View>,
        <Animated.View style={[styles.ali, style16]}>
          {Filters[16]}
        </Animated.View>,
        <Animated.View style={[styles.ali, style17]}>
          {Filters[17]}
        </Animated.View>,
        <Animated.View style={[styles.ali, style18]}>
          {Filters[18]}
        </Animated.View>,
        <Animated.View style={[styles.ali, style19]}>
          {Filters[19]}
        </Animated.View>,
        <Animated.View style={[styles.ali, style20]}>
          {Filters[20]}
        </Animated.View>,
        <Animated.View style={[styles.ali, style21]}>
          {Filters[21]}
        </Animated.View>,
        <Animated.View style={[styles.ali, style22]}>
          {Filters[22]}
        </Animated.View>,
        <Animated.View style={[styles.ali, style23]}>
          {Filters[23]}
        </Animated.View>,
        <Animated.View style={[styles.ali, style24]}>
          {Filters[24]}
        </Animated.View>,
        <Animated.View style={[styles.ali, style25]}>
          {Filters[25]}
        </Animated.View>,
        <Animated.View style={[styles.ali, style26]}>
          {Filters[26]}
        </Animated.View>,
        <Animated.View style={[styles.ali, style27]}>
          {Filters[27]}
        </Animated.View>,
        <Animated.View style={[styles.ali, style28]}>
          {Filters[28]}
        </Animated.View>,
      ].slice(0, filtersToLoad)}
      {/* {FILTERS.map((_whatever, index) => (
        <Animated.View style={[styles.ali, style1]}>
          {Fijlte[index]}
        </Animated.View>
      ))} */}
    </View>
  );

  useEffect(() => {
    return () => cleanExtractedImagesCache();
  }, []);

  const timeout = useRef();

  // console.log('IMAGEFILTER RENDER ===>');

  return (
    <View style={[ThemedStyles.style.flexContainer]}>
      {mamadIof}
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={useCallback(
          event => {
            cancelAnimation(offset);
            offset.value = event.nativeEvent.contentOffset.x;

            const index = Math.round(event.nativeEvent.contentOffset.x / width);

            setActiveIndex(index);

            // don't apply Normal filter
            // console.log('extractedUris.current', extractedUris.current);
            console.log(
              'extractedUris.current[index]',
              extractedUris.current[index],
            );

            if (index > 0 && extractedUris.current[index]) {
              console.log('WE HAVE');

              onImageChange({
                ...image,
                type: image.type,
                uri: extractedUris.current[index],
                path: extractedUris.current[index],
              });
            }

            if (index === 0) {
              // onImageChange(image);
            }

            if (timeout.current) {
              clearTimeout(timeout.current);
            }
            setShowingTitle(FILTERS[index].title);

            setTimeout(() => {
              setShowingTitle('');
            }, 2000);
          },
          [extractedUris],
        )}>
        {useMemo(
          () => new Array(filtersToLoad).fill(null).map(() => createVw(width)),
          [filtersToLoad, width],
        )}
      </ScrollView>

      {Boolean(showingTitle) && (
        <View style={[ThemedStyles.style.centered, StyleSheet.absoluteFill]}>
          <MText
            style={[
              ThemedStyles.style.textCenter,
              ThemedStyles.style.colorWhite,
              ThemedStyles.style.fontXL,
            ]}>
            {showingTitle}
          </MText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  ali: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    // backgroundColor: '#fff',
    right: 0,
    // right: Math.max(
    //   offset - width * (FILTERS.length - (index + 1)),
    //   0,
    // ),
  },
});
