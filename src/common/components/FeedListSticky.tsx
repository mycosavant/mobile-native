import { useLayout } from '@react-native-community/hooks';
import React, { useContext, useEffect, useState } from 'react';
import Animated, {
  SharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import FeedList, { FeedListPropsType } from './FeedList';

/**
 * Animated header
 */
const Header = ({ children, translationY, onHeight }) => {
  const styleAnim = useAnimatedStyle(() => {
    return {
      position: 'absolute',
      top: 0,
      width: '100%',
      transform: [{ translateY: -translationY.value }],
    };
  });
  const { onLayout, ...layout } = useLayout();

  useEffect(() => {
    onHeight(layout.height);
  }, [layout.height, onHeight]);

  return (
    <Animated.View style={styleAnim} onLayout={onLayout}>
      {children}
    </Animated.View>
  );
};

/**
 * Context
 */
const Context = React.createContext<
  { translationY: SharedValue<number> } | undefined
>(undefined);

/**
 * Use Feed List Context hook
 */
export const useFeedListContext = () => {
  return useContext(Context);
};

/**
 * Feed list with reanimated sticky header
 */
function FeedListSticky<T>(props: FeedListPropsType<T>, ref: any) {
  const translationY = useSharedValue(0);
  const scrollY = useSharedValue(0);
  const dragging = useSharedValue(false);
  const { header, ...otherProps } = props;

  /**
   * headerHeight - set by the header layout
   */
  const [headerHeight, setHeaderHeight] = useState(0);

  /**
   * Scroll handler
   */
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: event => {
      // if negative (refresh or bounce)
      if (event.contentOffset.y < 0) {
        translationY.value = event.contentOffset.y;
      } else {
        if (dragging.value) {
          // is down
          const delta = scrollY.value - event.contentOffset.y;
          translationY.value = translationY.value - delta;
          if (translationY.value < 0) {
            translationY.value = 0;
          }
          if (translationY.value > headerHeight) {
            translationY.value = headerHeight;
          }
        }
      }
      scrollY.value = event.contentOffset.y;
    },
    onBeginDrag() {
      dragging.value = true;
    },
    onEndDrag(event) {
      dragging.value = false;
      if (
        event.contentOffset.y > headerHeight &&
        translationY.value > 0 &&
        translationY.value < headerHeight
      ) {
        translationY.value = withTiming(
          translationY.value < headerHeight / 2 ? 0 : headerHeight,
        );
      }
    },
  });

  const contentStyle = React.useMemo(() => ({ paddingTop: headerHeight }), [
    headerHeight,
  ]);

  return (
    <Context.Provider value={{ translationY }}>
      <FeedList
        ref={ref}
        {...otherProps}
        onScroll={scrollHandler}
        contentContainerStyle={contentStyle}
        bottomComponent={
          <Header translationY={translationY} onHeight={setHeaderHeight}>
            {header}
          </Header>
        }
      />
    </Context.Provider>
  );
}

export default React.forwardRef(FeedListSticky);
