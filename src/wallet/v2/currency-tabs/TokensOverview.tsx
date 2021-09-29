import React from 'react';
import { View } from 'react-native';
import { observer } from 'mobx-react';
import ThemedStyles from '../../../styles/ThemedStyles';
import { WalletStoreType } from '../createWalletStore';
import MenuSubtitle from '../../../common/components/menus/MenuSubtitle';
import MenuItem from '../../../common/components/menus/MenuItem';
import { WalletScreenNavigationProp } from '../../v3/WalletScreen';
import i18n from '../../../common/services/i18n.service';
import TokensChart from './TokensChart';
import useWalletConnect from '../../../blockchain/v2/walletconnect/useWalletConnect';
import { navToTokens } from '../../../buy-tokens/BuyTokensScreen';
import { useNavigation } from '@react-navigation/core';
import MText from '../../../common/components/MText';

type PropsType = {
  walletStore: WalletStoreType;
  navigation: WalletScreenNavigationProp;
};

const TokensOverview = observer(({ walletStore }: PropsType) => {
  const wc = useWalletConnect();
  const theme = ThemedStyles.style;
  const balanceStyle = [
    theme.fontL,
    theme.colorSecondaryText,
    theme.paddingBottom,
  ];

  const navigation = useNavigation();

  const walletActions = [
    {
      title: i18n.t('wallet.transferToOnchain'),
      onPress: () => {
        navigation.navigate('WalletWithdrawal');
      },
      noIcon: true,
    },
    {
      title: i18n.t('wallet.leanMore'),
      onPress: navToTokens,
      noIcon: true,
    },
  ];

  return (
    <>
      <TokensChart timespan={walletStore.chart} />
      <View
        style={[
          theme.paddingHorizontal3x,
          theme.paddingTop3x,
          theme.rowJustifySpaceBetween,
        ]}>
        <View>
          <MText style={balanceStyle}>{i18n.t('wallet.walletBalance')}</MText>
          <MText style={theme.fontXL}>{walletStore.balance}</MText>
        </View>
        <View>
          <MText style={balanceStyle}>{i18n.t('blockchain.offchain')}</MText>
          <MText style={theme.fontXL}>
            {walletStore.wallet.offchain.balance}
          </MText>
        </View>
        <View>
          <MText style={balanceStyle}>{i18n.t('blockchain.onchain')}</MText>
          <MText style={theme.fontXL}>
            {walletStore.wallet.onchain.balance}
          </MText>
        </View>
      </View>

      <View style={theme.paddingTop2x}>
        <MenuSubtitle>{i18n.t('wallet.walletActions')}</MenuSubtitle>
        {walletActions.map((item, i) => (
          <MenuItem item={item} key={i} />
        ))}
      </View>
    </>
  );
});

export default TokensOverview;
