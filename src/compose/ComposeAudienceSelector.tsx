import { BottomSheetFlatList } from '@gorhom/bottom-sheet';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { observer } from 'mobx-react';
import React, { useCallback, useState } from 'react';
import { Dimensions, ScrollView, View } from 'react-native';
import { confirm } from '../common/components/Confirm';
import Link from '../common/components/Link';
import OffsetList from '../common/components/OffsetList';
import { pushBottomSheet } from '../common/components/bottom-sheet';
import MenuItem from '../common/components/menus/MenuItem';
import MenuItemOption from '../common/components/menus/MenuItemOption';
import abbrev from '../common/helpers/abbrev';
import { useLegacyStores } from '../common/hooks/use-stores';
import i18n from '../common/services/i18n.service';
import supportTiersService from '../common/services/support-tiers.service';
import {
  B1,
  B2,
  Button,
  Column,
  Icon,
  Row,
  Screen,
  ScreenHeader,
} from '../common/ui';
import { IS_IOS, PRO_PLUS_SUBSCRIPTION_ENABLED } from '../config/Config';
import GroupModel from '../groups/GroupModel';
import NavigationService from '../navigation/NavigationService';
import ThemedStyles from '../styles/ThemedStyles';
import { upgradeToPlus } from '../upgrade/UpgradeScreen';
import type { SupportTiersType } from '../wire/WireTypes';
import { ComposeAudience } from './createComposeStore';
import { ComposeStoreType } from './useComposeStore';

const BOTTOM_SHEET_HEIGHT = Math.floor(Dimensions.get('window').height * 0.8);

interface AudienceSelectorSheetProps {
  store: ComposeStoreType;
  /**
   * whether only monetized options should be shown
   */
  monetizedOnly?: boolean;
  onClose: () => void;
}

const AudienceSelectorSheet = observer((props: AudienceSelectorSheetProps) => {
  const navigation = useNavigation();
  const { store, onClose, monetizedOnly } = props;
  const [supportTiers, setSupportTiers] = useState<SupportTiersType[]>([]);
  const { user } = useLegacyStores();
  const selected = store.audience;

  // TODO: i18n
  const texts = {
    title: 'Select Audience',
    done: i18n.t('done'),
    audience: {
      public: {
        title: 'Public',
      },
      plus: {
        title: 'Minds+',
        subtitle:
          'Submit this post to Minds+ Premium Content and earn a share of our revenue based on how it performs.',
      },
    },
    memberships: 'Memberships',
    groups: 'Groups',
    noGroups: "You aren't a member of any groups",
    plus: {
      title: 'Plus monetization',
      action: 'I agree to the terms',
    },
    manage: 'Manage',
    getStarted: 'Get started',
  };

  const select = useCallback(
    async audience => {
      switch (audience.type) {
        case 'public':
          store.clearWireThreshold();
          break;
        case 'plus':
          if (!user.me.plus) {
            if (!(await upgradeToPlus(navigation))) {
              return;
            }
          }

          if (
            !(await confirm({
              title: texts.plus.title,
              actionText: texts.plus.action,
              description: <PlusTerms />,
            }))
          ) {
            return;
          }

          store.savePlusMonetize(null);
          break;
        case 'membership':
          if (audience.tier) {
            store.saveMembsershipMonetize(audience.tier);
          }
          break;
        case 'group':
          if (audience.group) {
            store.setGroup(audience.group);
          }
          break;
      }

      store.setAudience(audience);
    },
    [navigation, store, texts.plus.action, texts.plus.title, user.me.plus],
  );

  useFocusEffect(
    useCallback(() => {
      supportTiersService
        .getAllFromUser()
        .then(tiers => tiers && setSupportTiers(tiers));
    }, []),
  );

  const renderGroup = useCallback(
    (row: { item: GroupModel; index: number }) => {
      const group = GroupModel.checkOrCreate(row.item);
      return (
        <ComposeAudienceGroupItem
          group={group}
          selected={selected.type === 'group' && selected.value === group.guid}
          onPress={() => select({ type: 'group', value: group.guid, group })}
          index={row.index}
        />
      );
    },
    [selected.type, selected.value, select],
  );

  const content = (
    <>
      {!monetizedOnly && (
        <MenuItemOption
          title={texts.audience.public.title}
          mode="radio"
          icon={selected.type === 'public' ? <Check /> : <CheckBlank />}
          onPress={() => select({ type: 'public' })}
          reversedIcon
          borderless
          selected
        />
      )}

      {!!PRO_PLUS_SUBSCRIPTION_ENABLED && (
        <MenuItemOption
          title={texts.audience.plus.title}
          subtitle={texts.audience.plus.subtitle}
          mode="radio"
          icon={selected.type === 'plus' ? <Check /> : <CheckBlank />}
          onPress={() => select({ type: 'plus' })}
          reversedIcon
          borderless
        />
      )}

      {!IS_IOS && (
        <>
          <Row align="centerBetween">
            <B1 left="XL" top="M" font="bold">
              {texts.memberships}
            </B1>

            {!!supportTiers.length && (
              <Button
                size="tiny"
                mode="flat"
                type="action"
                top="S"
                onPress={() => NavigationService.push('TierManagementScreen')}>
                {texts.manage}
              </Button>
            )}
          </Row>

          {supportTiers.map(tier => (
            <MenuItemOption
              title={tier.name}
              subtitle={`${tier.description}${'\n'}$${tier.usd}+ / month`}
              reversedIcon
              borderless
              selected={
                selected.type === 'membership' && selected.value === tier.guid
              }
              onPress={() =>
                select({
                  type: 'membership',
                  value: tier.guid,
                  tier,
                })
              }
              icon={
                selected.type === 'membership' &&
                selected.value === tier.guid ? (
                  <Check />
                ) : (
                  <CheckBlank />
                )
              }
            />
          ))}
          {!supportTiers.length && (
            <Column horizontal="XL" top="M">
              <B2 color="secondary">
                {i18n.t('monetize.membershipMonetize.noTiers')}.{' '}
                {i18n.t('monetize.membershipMonetize.tiersDescription')}
              </B2>
              <Button
                align="center"
                size="small"
                mode="solid"
                type="action"
                vertical="L"
                onPress={() => NavigationService.push('TierManagementScreen')}>
                {texts.getStarted}
              </Button>
            </Column>
          )}
        </>
      )}

      {!monetizedOnly && (
        <Row align="centerBetween">
          <B1 left="XL" top="L" font="bold">
            {texts.groups}
          </B1>

          <Button
            size="tiny"
            mode="flat"
            type="action"
            top="S"
            onPress={() => NavigationService.navigate('GroupsList')}>
            {texts.manage}
          </Button>
        </Row>
      )}
    </>
  );

  return (
    <Screen safe edges={['bottom']}>
      <ScreenHeader
        title={texts.title}
        back
        onBack={onClose}
        titleType="H3"
        backIcon="close"
        centerTitle
        extra={
          <Button mode="flat" onPress={onClose}>
            {texts.done}
          </Button>
        }
      />
      {monetizedOnly ? (
        <ScrollView style={{ height: BOTTOM_SHEET_HEIGHT }}>
          {content}
        </ScrollView>
      ) : (
        <OffsetList
          ListComponent={BottomSheetFlatList}
          style={styles.list}
          contentContainerStyle={styles.listPadding}
          header={content}
          ListEmptyComponent={() => (
            <B2 horizontal="XL" top="S" color="secondary">
              {texts.noGroups}
            </B2>
          )}
          renderItem={renderGroup}
          fetchEndpoint={'api/v1/groups/member'}
          endpointData={'groups'}
        />
      )}
    </Screen>
  );
});

const ComposeAudienceGroupItem = ({ group, selected, onPress, index }) => {
  const avatarSource = group?.getAvatar?.();

  const commonProps = {
    title: group.name,
    subtitle: i18n.t('groups.listMembersCount', {
      count: abbrev(group['members:count']),
    }),
    borderless: true,
    onPress,
    avatarSize: 30,
    noBorderTop: typeof index === 'number' && index > 0,
  };

  if (selected) {
    return <MenuItem {...commonProps} icon={<Check />} reversedIcon />;
  }

  return <MenuItem {...commonProps} avatar={avatarSource?.source} noIcon />;
};

const Check = () => (
  <View style={styles.check}>
    <Icon name="check" color="White" size="small" />
  </View>
);

const CheckBlank = () => <View style={styles.checkBlank} />;

// TODO: i18n
const PlusTerms = () => (
  <>
    <B2 bottom="L">
      I agree to the{' '}
      <Link url="https://www.minds.com/p/monetization-terms">
        Minds monetization terms{' '}
      </Link>
      and have the rights to monetize this content.
    </B2>
    <B2>• This content is my original content</B2>
    <B2 bottom="L">• This content is exclusive to Minds+</B2>
    <B2>
      I understand that violation of these requirements may result in losing the
      ability to publish Premium Content for Minds+ members.
    </B2>
  </>
);

export const pushAudienceSelector = (
  props: Omit<AudienceSelectorSheetProps, 'onClose'>,
) =>
  new Promise(resolve =>
    pushBottomSheet({
      snapPoints: [BOTTOM_SHEET_HEIGHT],
      onClose: () => resolve(false),
      component: (bottomSheetRef, handleContentLayout) => (
        <View onLayout={handleContentLayout}>
          <AudienceSelectorSheet
            {...props}
            onClose={() => {
              resolve(true);
              bottomSheetRef.close();
            }}
          />
        </View>
      ),
    }),
  );

const ComposeAudienceSelector = ({ store }: { store: ComposeStoreType }) => {
  // TODO: i18n
  const audienceMapping: Record<ComposeAudience['type'], string> = {
    public: 'Public',
    plus: 'Minds+',
    group: 'Group',
    membership: 'Membership',
  };

  return (
    <Button
      fit
      font="regular"
      size="pill"
      right="XL"
      onPress={() => pushAudienceSelector({ store })}>
      {audienceMapping[store.audience.type]}
    </Button>
  );
};

export default observer(ComposeAudienceSelector);

const styles = ThemedStyles.create({
  list: { height: BOTTOM_SHEET_HEIGHT },
  rounded: {
    width: 30,
    height: 30,
    borderRadius: 30,
  },
  get check() {
    return [this.rounded, 'bgLink', 'centered'];
  },
  get checkBlank() {
    return [this.rounded, 'border2x', 'bcolorActive'];
  },
  listPadding: { paddingBottom: 200 },
});
