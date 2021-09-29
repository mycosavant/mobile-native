import React, { Component } from 'react';
import { TouchableOpacity } from 'react-native';
import { observer } from 'mobx-react';
import { motify, useAnimationState } from 'moti';
import { Icon } from '~ui/icons';
import withClass from '~ui/withClass';
import { IUISizing } from '~styles/Tokens';
import Counter from './Counter';
import withPreventDoubleTap from '../../../common/components/PreventDoubleTap';
import { FLAG_VOTE } from '../../../common/Permissions';
import remoteAction from '../../../common/RemoteAction';
import type ActivityModel from '../../../newsfeed/ActivityModel';
import { actionsContainerStyle } from './styles';

// prevent double tap in touchable
const TouchableOpacityCustom = withPreventDoubleTap(TouchableOpacity);

type PropsType = {
  entity: ActivityModel;
  size: string;
  hideCount?: boolean;
  orientation: 'column' | 'row';
  touchableComponent?: React.ComponentClass;
};

const AnimatedIcon = motify(withClass(Icon))();

const AnimatedThumb = ({
  voted,
  size,
  canVote,
  down,
  name,
}: {
  voted: boolean;
  size: IUISizing;
  canVote: boolean;
  down: boolean;
  name: string;
}) => {
  const initialRender = React.useRef(true);
  const animation = useAnimationState({
    from: {
      scale: 1,
      translateY: 0,
      rotate: '0deg',
    },
    up: {
      scale: [
        { value: 1, type: 'timing', duration: 120 },
        { value: 1.08, type: 'timing', duration: 150 },
        { value: 1, type: 'spring', delay: 80 },
      ],
      rotate: [
        { value: '0deg', type: 'timing', duration: 120 },
        { value: '-12deg', type: 'timing', duration: 160 },
        { value: '0deg', type: 'spring', delay: 150 },
      ],
      translateY: [
        { value: 0, type: 'timing', duration: 150 },
        { value: down ? 6 : -6, type: 'timing', duration: 150 },
        { value: 0, type: 'spring', delay: 150 },
      ],
    },
    down: {
      scale: [
        { value: 0.9, type: 'timing', duration: 80 },
        { value: 1, type: 'spring', delay: 80 },
      ],
      translateX: [
        { value: -2, type: 'timing', duration: 100 },
        { value: 3, type: 'timing', duration: 100 },
        { value: -2, type: 'timing', duration: 100 },
        { value: 0, type: 'timing', duration: 100 },
      ],
    },
  });

  React.useEffect(() => {
    if (initialRender.current) {
      initialRender.current = false;
      return;
    }
    if (voted) {
      animation.transitionTo('up');
    } else {
      animation.transitionTo('down');
    }
  }, [voted]);

  const disabled = !canVote;
  const active: boolean = !!(canVote && voted);

  return (
    <AnimatedIcon
      active={active}
      disabled={disabled}
      name={name}
      size={size}
      state={animation}
      marginRight="1x"
    />
  );
};

/**
 * Thumb Up Action Component
 */
@observer
class ThumbUpAction extends Component<PropsType> {
  /**
   * Default Props
   */
  static defaultProps = {
    size: 21,
    orientation: 'row',
  };

  /**
   * Thumb direction
   */
  direction: 'up' | 'down' = 'up';

  /**
   * Action Icon
   */
  iconName: string = 'thumb-up';

  /**
   * Render
   */
  render() {
    const entity = this.props.entity;

    const count = entity[`thumbs:${this.direction}:count`];

    const canVote = entity.can(FLAG_VOTE);

    const Touchable = this.props.touchableComponent || TouchableOpacityCustom;

    return (
      <Touchable
        style={actionsContainerStyle}
        onPress={this.toggleThumb}
        testID={`Thumb ${this.direction} activity button`}>
        <AnimatedThumb
          canVote={canVote}
          voted={this.voted}
          size={this.props.size}
          name={this.iconName}
          down={this.direction !== 'up'}
        />
        {count && !this.props.hideCount ? (
          <Counter
            // size={this.props.size * 0.7}
            count={count}
            testID={`Thumb ${this.direction} count`}
          />
        ) : undefined}
      </Touchable>
    );
  }

  get voted() {
    return this.props.entity.votedUp;
  }

  /**
   * Toggle thumb
   */
  toggleThumb = async () => {
    if (!this.props.entity.can(FLAG_VOTE, true)) {
      return;
    }

    remoteAction(() => {
      return this.props.entity.toggleVote(this.direction);
    });
  };
}

export default ThumbUpAction;
