import { NavigationProp, RouteProp } from '@react-navigation/native';
import { observer } from 'mobx-react';
import React, { useEffect, useRef } from 'react';
import { FlatList, View } from 'react-native';
import CenteredLoading from '~/common/components/CenteredLoading';

import { H4, IconButton, Screen, ScreenHeader } from '~ui';
import { useTranslation } from '../../locales';
import BoostConsoleStore from '../boost-console.store';
import BoostV3 from '../components/v3/Boost';
import BoostTabBarV3 from '../components/v3/BoostTabBar';
import { BoostConsoleStoreContext } from '../contexts/boost-store.context';
import { IS_IPAD } from '~/config/Config';
import BoostFeed from '../components/v3/BoostFeed';
import OnboardingOverlay from '~/components/OnboardingOverlay';
import sp from '~/services/serviceProvider';

interface BoostConsoleScreenProps {
  route: RouteProp<any>;
  guid: string;
  navigation: NavigationProp<any>;
}

function BoostConsoleScreen({
  route,
  guid,
  navigation,
}: BoostConsoleScreenProps) {
  const { t } = useTranslation();
  const { location: boostLocation, filter, boostGuid } = route?.params ?? {};
  const boostConsoleStore = useRef(new BoostConsoleStore()).current;
  let empty;

  /**
   * Load boosts data
   */
  const loadFeed = () => {
    boostConsoleStore.loadList(!!guid);
  };

  /**
   * Refresh feed data
   */
  const refresh = () => {
    boostConsoleStore.refresh();
  };

  useEffect(() => {
    if (boostLocation) {
      boostConsoleStore.setFilter(boostLocation);
    } else {
      if (filter) {
        boostConsoleStore.setFilter(filter);
      }
    }

    boostConsoleStore.loadList(!!guid);
  }, [boostConsoleStore, boostLocation, guid, filter]);

  // open the single boost screen if the params exists
  useEffect(() => {
    if (boostGuid) {
      navigation.navigate('SingleBoostConsole', { guid: boostGuid });
    }
  }, [boostGuid, navigation]);

  /**
   * Render row
   */
  const renderBoost = row => {
    return <BoostV3 boost={row.item} />;
  };

  if (boostConsoleStore.loading) {
    empty = <CenteredLoading />;
  }

  if (
    boostConsoleStore.list.loaded &&
    !boostConsoleStore.list.refreshing &&
    boostConsoleStore.feedFilter === 'all'
  ) {
    empty = (
      <View style={styles.emptyContent}>
        <H4 color="secondary">{t('No boosts')}</H4>
      </View>
    );
  }

  return (
    <BoostConsoleStoreContext.Provider value={boostConsoleStore}>
      <Screen safe onlyTopEdge>
        <ScreenHeader
          title={t('Boost Console')}
          back={!IS_IPAD}
          extra={
            <IconButton
              name="cog"
              onPress={() =>
                IS_IPAD
                  ? navigation.navigate('BoostSettingsScreen')
                  : navigation.navigate('More', {
                      screen: 'BoostSettingsScreen',
                      initial: false,
                    })
              }
            />
          }
        />
        {boostConsoleStore.filter !== 'explore' ? (
          <FlatList
            ListHeaderComponent={<BoostTabBarV3 />}
            ListEmptyComponent={empty}
            data={boostConsoleStore.list.entities.slice()}
            renderItem={renderBoost}
            keyExtractor={item => item.rowKey}
            onRefresh={refresh}
            refreshing={boostConsoleStore.list.refreshing}
            onEndReached={loadFeed}
            onEndReachedThreshold={0}
            style={styles.list}
          />
        ) : (
          <BoostFeed ListHeaderComponent={<BoostTabBarV3 />} />
        )}
        <OnboardingOverlay type="boost" />
      </Screen>
    </BoostConsoleStoreContext.Provider>
  );
}

export default observer(BoostConsoleScreen);

const styles = sp.styles.create({
  list: ['bgPrimaryBackground', 'flexContainer'],
  emptyContent: ['alignCenter', 'marginTop12x'],
});
