import { observer } from 'mobx-react';
import React from 'react';
import FitScrollView from '../../../common/components/FitScrollView';
import Slider from '../../../common/components/Slider';
import TopbarTabbar from '../../../common/components/topbar-tabbar/TopbarTabbar';
import {
  B1,
  B2,
  Button,
  Column,
  H2,
  H3,
  HairlineRow,
  Screen,
  ScreenHeader,
} from '../../../common/ui';
import ThemedStyles from '../../../styles/ThemedStyles';
import { IPaymentType, useBoostStore } from '../boost.store';
import { useTranslation } from '../locales';
import { BoostStackScreenProps } from '../navigator';

type BoostComposerScreenProps = BoostStackScreenProps<'BoostComposer'>;

function BoostComposerScreen({ navigation }: BoostComposerScreenProps) {
  const { t } = useTranslation();
  const boostStore = useBoostStore();

  const textMapping = {
    cash: {
      minBudget: `$${boostStore.config.min.cash.toLocaleString()}`,
      maxBudget: `$${boostStore.config.max.cash.toLocaleString()}`,
    },
    offchain_tokens: {
      minBudget: t('tokenWithCount', {
        count: boostStore.config.min.offchain_tokens,
      }),
      maxBudget: t('tokenWithCount', {
        count: boostStore.config.max.offchain_tokens,
      }),
    },
    onchain_tokens: {
      minBudget: t('tokenWithCount', {
        count: boostStore.config.min.onchain_tokens,
      }),
      maxBudget: t('tokenWithCount', {
        count: boostStore.config.max.onchain_tokens,
      }),
    },
  };

  const onNext = () => {
    navigation.push('BoostReview');
  };

  return (
    <Screen safe>
      <ScreenHeader
        title={
          boostStore.boostType === 'channel'
            ? t('boostChannel')
            : t('boostPost')
        }
        back
        shadow
      />
      <FitScrollView>
        <TopbarTabbar
          containerStyle={ThemedStyles.style.marginTop}
          tabs={[
            {
              id: 'cash',
              title: t('Cash'),
              testID: 'BoostComposerScreen:tab:cash',
            },
            {
              id: 'offchain_tokens',
              title: t('Token'),
              testID: 'BoostComposerScreen:tab:token',
            },
          ]}
          onChange={id => boostStore.setPaymentType(id as IPaymentType)}
          current={boostStore.paymentType}
        />
        <Column align="centerBoth" vertical="L">
          <H2 bottom="S" top="M">
            {t(
              boostStore.paymentType === 'cash'
                ? 'usdTotalSpend'
                : 'tokenTotalSpend',
              {
                amount: boostStore.total,
                duration: boostStore.duration,
              },
            )}
          </H2>
          <B1 bottom="L2" color="secondary">
            {t('Total Spend')}
          </B1>

          <H2 bottom="S">{t('Unknown')}</H2>
          <B1 color="secondary">{t('Estimated reach')}</B1>
        </Column>

        <Column top="L" horizontal="L2">
          <H3>{t('Daily budget')}</H3>
          <Slider
            stepSize={1}
            defaultValue={1}
            currentValue={boostStore.amount}
            maximumRangeValue={boostStore.config.max[boostStore.paymentType]}
            minimumRangeValue={boostStore.config.min[boostStore.paymentType]}
            minimumStepLabel={textMapping[boostStore.paymentType].minBudget}
            maximumStepLabel={textMapping[boostStore.paymentType].maxBudget}
            onAnswer={boostStore.setAmount}
          />
        </Column>

        <HairlineRow />

        <Column top="L" horizontal="L2">
          <H3>{t('Duration')}</H3>
          <Slider
            stepSize={1}
            defaultValue={1}
            currentValue={boostStore.duration}
            maximumRangeValue={boostStore.config.duration.max}
            minimumRangeValue={boostStore.config.duration.min}
            maximumStepLabel={t('dayWithCount', {
              count: boostStore.config.duration.max,
            })}
            minimumStepLabel={t('dayWithCount', {
              count: boostStore.config.duration.min,
            })}
            onAnswer={boostStore.setDuration}
          />
        </Column>

        <HairlineRow />

        <B2
          color="secondary"
          horizontal="L"
          vertical="L"
          bottom="XL"
          align="justify">
          {t('estimatedReachDescription')}
        </B2>

        <Button
          onPress={onNext}
          mode="solid"
          type="action"
          horizontal="L"
          bottom="L2">
          {t('Next')}
        </Button>
      </FitScrollView>
    </Screen>
  );
}

export default observer(BoostComposerScreen);
