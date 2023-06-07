import React from 'react';
import { View } from 'react-native';
import { styles as headerStyles } from '~/topbar/Topbar';
import { observer } from 'mobx-react-lite';
import { useNavigation } from '@react-navigation/native';

import { B2, H4, Row, Icon } from '~/common/ui';
import i18nService from '~/common/services/i18n.service';
import MenuSheet from '../bottom-sheet/MenuSheet';
import ThemedStyles from '~/styles/ThemedStyles';
import FeedListInvisibleHeader from '../FeedListInvisibleHeader';
import { RecommendationType } from './types';
import useDismissibility from './hooks/useDismissibility';

type PropsType = {
  type: RecommendationType;
  location: 'feed' | 'channel';
  shadow?: boolean;
};

function RecommendationHeader({ type, location, shadow }: PropsType) {
  const navigation = useNavigation();
  const { dismiss, shouldRender, dismissible } = useDismissibility(
    type,
    location,
  );

  const sheetOptions = React.useMemo(
    () => [
      {
        title: i18nService.t('removeFromFeed'),
        onPress: dismiss,
        iconName: 'close',
        iconType: 'material-community',
      },
    ],
    [dismiss],
  );

  return shouldRender ? (
    <View
      style={
        shadow
          ? [ThemedStyles.style.bgPrimaryBackground, headerStyles.shadow]
          : ThemedStyles.style.bgPrimaryBackground
      }>
      <Row align="centerBetween" vertical="L" horizontal="L">
        <H4>
          {type === 'channel'
            ? i18nService.t('recommendedChannels')
            : i18nService.t('recommendedGroups')}
        </H4>
        <Row align="centerBoth">
          <B2
            color="link"
            onPress={() => navigation.navigate('SuggestedGroups')}>
            {i18nService.t('seeMore')}
          </B2>

          {dismissible && (
            <MenuSheet items={sheetOptions}>
              <Icon name="more" size="large" left="M" />
            </MenuSheet>
          )}
        </Row>
      </Row>
    </View>
  ) : (
    <FeedListInvisibleHeader />
  );
}

export default observer(RecommendationHeader);
