import { showNotification } from '../../../../AppMessages';
import useApiFetch, { useApiCall } from '../../../common/hooks/useApiFetch';
import openUrlService from '../../../common/services/open-url.service';

interface StripeAccount {
  id: string;
  payouts_enabled: boolean;
  charges_enabled: boolean;
  requirements: {
    alternatives: unknown[];
    current_deadline: unknown;
    currently_due: string[];
    disabled_reason: string;
    errors: {
      code: string;
      reason: string;
      requirement: string;
    }[];
    eventually_due: string[];
    past_due: string[];
    pending_verification: unknown[];
  };
}

interface StripeConnectOnboardingResponse {
  redirect_url: string;
}

export default function useStripeConnect() {
  const {
    result: account,
    loading: accountLoading,
  } = useApiFetch<StripeAccount>('api/v3/payments/stripe/connect/account');
  const {
    fetch: getRedirectUrl,
    loading: onboardingLoading,
  } = useApiFetch<StripeConnectOnboardingResponse>(
    'api/v3/payments/stripe/connect/onboarding',
    {
      skip: true,
    },
  );
  const { post: createAccount } = useApiCall(
    'api/v3/payments/stripe/connect/account',
  );

  const openStripe = async () => {
    try {
      const { redirect_url } = await getRedirectUrl();
      openUrlService.openLinkInInAppBrowser(redirect_url);
    } catch (e) {
      console.error(e);
      showNotification(
        'Something went wrong while connecting to stripe',
        'danger',
      );
    }
  };

  return {
    account,
    loading: accountLoading || onboardingLoading,
    /**
     * If the stripe account is in a restricted state
     * https://stripe.com/docs/connect/identity-verification-api for disabled_reasons
     */
    restricted: !!account?.requirements.disabled_reason,
    /**
     * If payments are enabled or not. Ie. they can accept money.
     */
    paymentsEnabled: account?.charges_enabled,
    /**
     * If payouts are enabled.
     * These could be disabled because of due requirements or admin action.
     */
    payoutsEnabled: account?.payouts_enabled,
    /**
     * Maps the reason of a restricted state
     */
    restrictedReason: account?.requirements.disabled_reason,
    /**
     * creates the stripe account in the backend
     */
    createAccount: () => createAccount(),
    /**
     * opens stripe in the in-app-browser
     */
    openStripe,
  };
}
