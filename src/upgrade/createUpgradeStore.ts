import { IS_FROM_STORE, IS_IOS } from '~/config/Config';
import type UserModel from '../channel/UserModel';
import {
  SubscriptionType,
  PayMethodType,
  PaymentPlanType,
  SettingsSubscriptionsType,
} from './types';
import sp from '~/services/serviceProvider';

// TODO: move to the backend
export const IAP_SKUS_PLUS = {
  monthly: IS_IOS ? 'plus.monthly.01' : 'plus.monthly.001',
  yearly: IS_IOS ? 'plus.yearly.01' : 'plus.yearly.001',
};
export const IAP_SKUS_PRO = {
  monthly: IS_IOS ? 'pro.monthly.01' : 'pro.monthly.001',
};

const createUpgradeStore = () => {
  return {
    loaded: false,
    method: 'usd' as PayMethodType,
    settings: null as null | SettingsSubscriptionsType,
    plansTokens: [] as Array<PaymentPlanType>,
    plansUSD: [] as Array<PaymentPlanType>,
    monthly: false,
    owner: {} as UserModel,
    selectedOption: {} as PaymentPlanType,
    isPro: false,
    generatePaymentPlans() {
      for (const key in this.settings) {
        const current = this.settings[key];
        // yearly and monthly are disabled for tokens
        if (current.tokens && !['yearly', 'monthly'].includes(key)) {
          this.plansTokens.push({
            id: key as SubscriptionType,
            cost: current.tokens,
            can_have_trial: Boolean(current.can_have_trial),
          });
        }
        if (current.usd) {
          const skus = this.isPro ? IAP_SKUS_PRO : IAP_SKUS_PLUS;

          // for store apps only show options with SKUs (in-app purchase)
          if (!IS_FROM_STORE || skus[key]) {
            this.plansUSD.push({
              id: key as SubscriptionType,
              cost: current.usd,
              iapSku: skus[key] || '',
              can_have_trial: Boolean(current.can_have_trial),
            });
          }
        }
      }
      this.plansUSD = [...this.plansUSD];
      this.plansTokens = [...this.plansTokens];
    },
    get canHaveTrial(): boolean {
      return this.method === 'usd' && this.selectedOption.can_have_trial;
    },
    init(pro: boolean = false) {
      this.getSettings(pro);
    },
    setMonthly(monthly: boolean) {
      this.monthly = monthly;
    },

    async getSettings(pro: boolean) {
      if (this.loaded) return;

      // update the settings
      await sp.config.update();

      const settings = sp.config.getSettings();

      this.settings = (
        pro ? settings.upgrades.pro : settings.upgrades.plus
      ) as SettingsSubscriptionsType;

      // used to pay plus by wire
      const handler = pro ? settings.handlers.pro : settings.handlers.plus;

      this.owner = (await sp
        .resolve('entities')
        .single(`urn:user:${handler}`)) as UserModel;

      this.isPro = pro;

      this.generatePaymentPlans();
      this.selectedOption = this.plansUSD[0];

      this.loaded = true;
    },
    toogleMethod() {
      this.method = this.method === 'usd' ? 'tokens' : 'usd';
      this.selectedOption =
        this.method !== 'usd' ? this.plansTokens[0] : this.plansUSD[0];
    },
    setSettings(settings) {
      this.settings = settings;
    },
    setSelectedOption(option: PaymentPlanType) {
      this.selectedOption = option;
    },
  };
};

export default createUpgradeStore;

export type UpgradeStoreType = ReturnType<typeof createUpgradeStore>;
