import React, { useRef } from 'react';
import { observer, useLocalStore } from 'mobx-react';
import { StyleSheet, Text, View } from 'react-native';
import TopBarButtonTabBar, {
  ButtonTabType,
} from '../../../../common/components/topbar-tabbar/TopBarButtonTabBar';
import { TokensOptions } from '../../../v2/WalletTypes';
import ThemedStyles from '../../../../styles/ThemedStyles';
import type { WalletStoreType } from '../../../v2/createWalletStore';
import TokensOverview from '../../../v2/currency-tabs/TokensOverview';
import { ScrollView } from 'react-native-gesture-handler';
import type { BottomOptionsStoreType } from '../../../../common/components/BottomOptionPopup';
import TransactionsListTokens from '../../../v2/TransactionList/TransactionsListTokens';
import ReceiverSettings from '../../../v2/address/ReceiverSettings';
import { WalletScreenNavigationProp } from '../../../v2/WalletScreen';
import i18n from '../../../../common/services/i18n.service';
import TokensRewards from './TokensRewards';
import TokensEarnings from '../Earnings';
import TokenTopBar from './TokenTopBar';
import useUniqueOnchain from '../../useUniqueOnchain';
import useWalletConnect from '../../../../blockchain/v2/walletconnect/useWalletConnect';
import sessionService from '../../../../common/services/session.service';
import apiService from '../../../../common/services/api.service';
import { showNotification } from '../../../../../AppMessages';
import PhoneValidator from './widthdrawal/PhoneValidator';

const options: Array<ButtonTabType<TokensOptions>> = [
  { id: 'rewards', title: 'Rewards' },
  { id: 'earnings', title: 'Earnings' },
  { id: 'overview', title: 'Balance' },
  { id: 'transactions', title: 'Transactions' },
  { id: 'settings', title: 'Settings' },
];

type PropsType = {
  walletStore: WalletStoreType;
  bottomStore: BottomOptionsStoreType;
  navigation: WalletScreenNavigationProp;
};

const createStore = (walletStore: WalletStoreType) => ({
  option: walletStore.initialTab || ('rewards' as TokensOptions),
  setOption(option: TokensOptions) {
    this.option = option;
  },
});

const showPhoneValidator = (bottomStore: BottomOptionsStoreType) => {
  bottomStore.show(
    i18n.t('wallet.phoneVerification'),
    i18n.t('send'),
    <PhoneValidator bottomStore={bottomStore} />,
  );
};

/**
 * Tokens tab
 */
const TokensTab = observer(
  ({ walletStore, navigation, bottomStore }: PropsType) => {
    const store = useLocalStore(createStore, walletStore);
    const theme = ThemedStyles.style;
    const onchainStore = useUniqueOnchain();
    const wc = useWalletConnect();
    const connectWallet = React.useCallback(async () => {
      const user = sessionService.getUser();

      showPhoneValidator(bottomStore);

      const msg = JSON.stringify({
        user_guid: user.guid,
        unix_ts: Date.now() / 1000,
      });

      await wc.connect();

      if (!wc.connected || !wc.web3 || !wc.provider) {
        throw new Error('Connect the wallet first');
      }

      try {
        onchainStore.setLoading(true);

        showNotification(
          'Please complete the step in your wallet app',
          'info',
          0,
        );
        wc.openWalletApp();

        console.log('[TokensTab.connectWallet]: requesting signature');

        const signature = await wc.provider.connector.signPersonalMessage([
          msg,
          wc.address,
        ]);
        console.log('[TokensTab.connectWallet]: signature ' + signature);

        onchainStore.setLoading(true);

        try {
          // Returns signature.
          await apiService.post('api/v3/blockchain/unique-onchain/validate', {
            signature,
            payload: msg,
            address: wc.address,
          });

          setTimeout(() => {
            // reload wallet
            walletStore?.loadWallet();
            // reload unique onchain
            onchainStore?.fetch();
          }, 1000);

          showNotification('Your On-chain address is now setup and verified');
        } catch (error) {
          throw 'Request Failed ' + error;
        }
      } catch (err) {
        console.error('There was an error', err);
        showNotification(err.toString(), 'danger');
      } finally {
        onchainStore.setLoading(false);
      }
    }, [onchainStore, walletStore, wc]);

    const mustVerify = !sessionService.getUser().rewards
      ? () => {
          const onComplete = () => {
            connectWallet();
          };
          //@ts-ignore
          navigation.navigate('PhoneValidation', {
            onComplete,
          });
        }
      : undefined;

    let body;
    switch (store.option) {
      case 'rewards':
        body = <TokensRewards walletStore={walletStore} />;
        break;
      case 'earnings':
        body = (
          <TokensEarnings walletStore={walletStore} currencyType="tokens" />
        );
        break;
      case 'overview':
        body = (
          <TokensOverview
            walletStore={walletStore}
            navigation={navigation}
            bottomStore={bottomStore}
          />
        );
        break;
      case 'transactions':
        const filters: Array<[string, string]> = [
          ['all', i18n.t('wallet.transactions.allFilter')],
          ['offchain:reward', i18n.t('wallet.transactions.rewardsFilter')],
          ['offchain:boost', i18n.t('wallet.transactions.boostsFilter')],
          ['offchain:wire', i18n.t('wallet.transactions.transferFilter')],
        ];
        body = (
          <TransactionsListTokens
            filters={filters}
            navigation={navigation}
            currency="tokens"
            wallet={walletStore}
            bottomStore={bottomStore}
          />
        );
        break;
      case 'settings':
        body = (
          <ReceiverSettings
            navigation={navigation}
            connectWallet={mustVerify || connectWallet}
            onchainStore={onchainStore}
            walletStore={walletStore}
          />
        );
        break;
    }

    const mainBody = (
      <>
        <View style={{ ...theme.paddingTop5x }}>
          <TokenTopBar
            walletStore={walletStore}
            connectWallet={mustVerify || connectWallet}
            onchainStore={onchainStore}
          />
          <TopBarButtonTabBar
            tabs={options}
            current={store.option}
            onChange={store.setOption}
          />
          {body}
        </View>
      </>
    );
    if (store.option !== 'transactions') {
      return <ScrollView>{mainBody}</ScrollView>;
    } else {
      return <View style={theme.flexContainer}>{mainBody}</View>;
    }
  },
);

export default TokensTab;
