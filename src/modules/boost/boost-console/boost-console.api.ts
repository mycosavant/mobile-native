import api, {
  ApiResponse,
  isNetworkError,
} from '~/common/services/api.service';
import i18n from '~/common/services/i18n.service';
import logService from '~/common/services/log.service';
import { BoostConsoleBoost } from './types/BoostConsoleBoost';

type BoostsResponse = {
  boosts: BoostConsoleBoost[];
  has_more: boolean;
} & ApiResponse;

export async function getBoosts(offset, filter, peer_filter) {
  try {
    const data: any = await api.get(
      'api/v2/boost/' + filter + '/' + peer_filter,
      {
        offset: offset,
        limit: 15,
      },
    );

    return {
      entities: data.boosts || [],
      offset: data['load-next'],
    };
  } catch (err) {
    if (!isNetworkError(err)) {
      logService.exception('[BoostConsoleService]', err);
    }
    throw new Error(i18n.t('boosts.errorGet'));
  }
}

export async function getBoostsV3(offset) {
  try {
    const data = await api.get<BoostsResponse>('api/v3/boosts/', {
      offset: offset,
      limit: 15,
    });

    return {
      entities: data.boosts || [],
      offset: data['load-next'],
    };
  } catch (err) {
    if (!isNetworkError(err)) {
      logService.exception('[BoostConsoleService]', err);
    }
    throw new Error(i18n.t('boosts.errorGet'));
  }
}

export function revokeBoost(guid, filter) {
  return api.delete('api/v2/boost/' + filter + '/' + guid + '/revoke');
}

export function rejectBoost(guid) {
  return api.delete('api/v2/boost/peer/' + guid);
}

export function acceptBoost(guid) {
  return api.put('api/v2/boost/peer/' + guid);
}

export function getRates() {
  return api.get('api/v2/boost/rates');
}
