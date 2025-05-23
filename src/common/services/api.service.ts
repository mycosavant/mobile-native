import Cancelable from 'promise-cancelable';
import axios, { AxiosInstance, AxiosResponse, CancelTokenSource } from 'axios';

// ignore 401 for this URLs
const EXCEPTIONS_401 = [
  'api/v2/settings/password/validate',
  'api/v3/oauth/token',
];

export const TWO_FACTOR_ERROR =
  'Minds::Core::Security::TwoFactor::TwoFactorRequiredException';
export const TWO_FACTOR_INVALID =
  'Minds::Core::Security::TwoFactor::TwoFactorInvalidCodeException';

export type TwoFactorType = 'sms' | 'email' | 'totp';

import { isTokenExpired } from './TokenExpiredError';
import { IS_IOS, APP_API_URI, NETWORK_TIMEOUT } from '../../config/Config';
import { Version } from '../../config/Version';
import { observable, action } from 'mobx';
import { UserError } from '../UserError';
import CookieManager from '@react-native-cookies/cookies';
import {
  TwoFactorError,
  isApiForbidden,
  NetworkError,
  ApiError,
} from './ApiErrors';
import type { DevModeService } from '~/config/DevModeService';
import type { SessionService } from './session.service';
import type { LogService } from './log.service';
import type { AuthService } from '~/auth/AuthService';
import type { NavigationService } from '~/navigation/NavigationService';
import type { I18nService } from './i18n.service';
import type { ReferrerService } from './referrer.service';
import { ApiResponse } from './ApiResponse';

/**
 * Parameters array (new format)
 * This array is transformed to param[]=value&param[]=value
 */
export class ParamsArray extends Array<any> {}

const isNot401Exception = (url: string) => {
  return !EXCEPTIONS_401.some(e => url.startsWith(e));
};

/**
 * Api service
 */
export class ApiService {
  refreshPromise: null | Promise<any> = null;
  axios: AxiosInstance;
  abortTags = new Map<any, CancelTokenSource>();
  @observable mustVerify = false;
  sessionIndex: number | null;
  APP_API_URI: string;
  STAGING: boolean;
  CANARY: boolean;

  private twoFactorHandlerEnabled: boolean = true;

  setTwoFactorHandlingEnabled(enabled: boolean) {
    this.twoFactorHandlerEnabled = enabled;
    return this;
  }

  @action
  setMustVerify(value) {
    this.mustVerify = value;
  }

  constructor(
    devModeService: DevModeService,
    private session: SessionService,
    private log: LogService,
    private auth: AuthService,
    private navigation: NavigationService,
    private i18n: I18nService,
    private referrerService: ReferrerService,
    sessionIndex: number | null = null,
    axiosInstance = null,
  ) {
    this.sessionIndex = sessionIndex;
    this.APP_API_URI = devModeService.isActive
      ? devModeService.getApiURL() || APP_API_URI
      : APP_API_URI;

    this.STAGING = devModeService.isActive
      ? devModeService.getStaging()
      : false;
    this.CANARY = devModeService.isActive ? devModeService.getCanary() : false;

    if (this.CANARY) {
      CookieManager.set(this.APP_API_URI, {
        name: 'canary',
        value: '1',
        path: '/',
      }).then(done => {
        console.log('CookieManager.set =>', done);
      });
    } else {
      if (IS_IOS) {
        CookieManager.clearByName(this.APP_API_URI, 'canary');
      }
    }
    if (this.STAGING) {
      CookieManager.set(this.APP_API_URI, {
        name: 'staging',
        value: '1',
        path: '/',
      }).then(done => {
        console.log('CookieManager.set =>', done);
      });
    } else {
      if (IS_IOS) {
        CookieManager.clearByName(this.APP_API_URI, 'staging');
      }
    }

    this.axios =
      axiosInstance ||
      axios.create({
        baseURL: this.APP_API_URI,
      });

    this.axios.interceptors.request.use(config => {
      config.headers = this.buildHeaders(config.headers);
      config.timeout = NETWORK_TIMEOUT;

      return config;
    });

    this.axios.interceptors.response.use(
      response => {
        this.checkResponse(response);
        return response;
      },
      async error => {
        const { config: originalReq, response, request } = error;

        if (response) {
          // 2FA authentication interceptor
          if (
            response.data &&
            (response.data.errorId === TWO_FACTOR_ERROR ||
              response.data.errorId === TWO_FACTOR_INVALID)
          ) {
            let smsKey,
              emailKey,
              oldCode = '';

            if (response.data.errorId === TWO_FACTOR_ERROR) {
              smsKey = response.headers['x-minds-sms-2fa-key'];
              emailKey = response.headers['x-minds-email-2fa-key'];
              // We store the keys on the original request in case the code is invalid (The invalid response doesn't include it)
              originalReq.smsKey = smsKey;
              originalReq.emailKey = emailKey;
            } else {
              smsKey = originalReq.smsKey;
              emailKey = originalReq.emailKey;
              oldCode = originalReq.oldCode;
            }

            let mfaType: TwoFactorType = 'email';

            if (smsKey) {
              mfaType = 'sms';
            } else if (emailKey) {
              // already set above
            } else {
              mfaType = 'totp';
            }

            let data: any = {};

            if (originalReq.data) {
              data = JSON.parse(originalReq.data);
            }

            const hasRecovery =
              mfaType === 'totp' && data.password && data.username;

            const state = this.navigation.getCurrentState();

            if (
              state?.name === 'TwoFactorConfirmation' ||
              !this.twoFactorHandlerEnabled
            ) {
              // here, we've made a request and the server is requiring 2fa but
              // we're already on the 2fa screen so we'll just throw an error
              throw new TwoFactorError(emailKey);
            }

            try {
              const code = await new Promise<string>((resolve, reject) => {
                this.navigation.navigate('TwoFactorConfirmation', {
                  onConfirm: async (confirmationCode?: string) => {
                    // if confirmation code was received successfully,
                    // resolve the promise and continue the original request
                    if (confirmationCode) {
                      return resolve(confirmationCode);
                    }

                    // if the code wasn't received, it's a resend confirmation code attempt,
                    // so make another request similar to the original request (while keeping the original request pending)
                    // as a means of resending the confirmation code
                    return this.axios.request(originalReq);
                  },
                  onCancel: reject,
                  mfaType,
                  oldCode,
                  showRecovery: hasRecovery,
                });
              });

              // is a recovery code?
              if (hasRecovery && code.length > 6) {
                const recoveryResponse = await this.post<any>(
                  'api/v3/security/totp/recovery',
                  {
                    username: data.username,
                    password: data.password,
                    recovery_code: code,
                  },
                );
                if (!recoveryResponse.matches) {
                  throw new UserError(this.i18n.t('auth.recoveryFail'));
                }
              } else {
                originalReq.headers['X-MINDS-2FA-CODE'] = code;

                if (smsKey) {
                  originalReq.headers['X-MINDS-SMS-2FA-KEY'] = smsKey;
                }

                if (emailKey) {
                  originalReq.headers['X-MINDS-EMAIL-2FA-KEY'] = emailKey;
                }
              }

              originalReq.oldCode = code;
              return this.axios.request(originalReq);
            } catch (err) {
              throw new UserError('Canceled');
            }
          }

          // refresh token if possible and repeat the call
          if (
            response.status === 401 &&
            !originalReq._isRetry &&
            isNot401Exception(originalReq.url)
          ) {
            this.log.info(
              `[ApiService] refreshing token for ${originalReq.url}`,
            );
            await this.tokenRefresh(() => {
              originalReq._isRetry = true;
              this.log.info('[ApiService] retrying request ' + originalReq.url);
              this.axios.request(originalReq);
            });

            this.log.info(
              `[ApiService] refreshed token for ${originalReq.url}`,
            );

            originalReq._isRetry = true;
            this.log.info('[ApiService] retrying request ' + originalReq.url);
            return this.axios.request(originalReq);
          }

          // prompt the user if email verification is needed for this endpoint
          if (isApiForbidden(response) && response.data.must_verify) {
            this.setMustVerify(true);
            throw new UserError(
              this.i18n.t('emailConfirm.confirm'),
              'info',
              () => this.navigation.navigate('VerifyEmail'),
            );
          }

          this.checkResponse(response, originalReq.url);
        } else if (request) {
          throw new NetworkError(error.message); // server down or there is not connectivity
        }

        throw error;
      },
    );
  }

  setSessionIndex(index) {
    this.sessionIndex = index;
  }

  get accessToken() {
    return this.sessionIndex !== null
      ? this.session.getAccessTokenFrom(this.sessionIndex)
      : this.session.token;
  }

  get refreshToken() {
    return this.sessionIndex !== null
      ? this.session.getRefreshTokenFrom(this.sessionIndex)
      : this.session.refreshToken;
  }

  get refreshAuthTokenPromise() {
    return this.sessionIndex !== null
      ? this.session.refreshAuthTokenFrom(this.sessionIndex)
      : this.session.refreshAuthToken();
  }

  /**
   * Refresh token (only one call at the time)
   */
  async tokenRefresh(onLogin: Function) {
    if (!this.refreshPromise) {
      this.refreshPromise = this.refreshAuthTokenPromise;
    }
    try {
      await this.refreshPromise;
      this.refreshPromise = null;
    } catch (error: any) {
      this.refreshPromise = null;
      if (
        (isTokenExpired(error) ||
          (error.response && error.response.status === 401)) &&
        (this.accessToken || this.session.sessionToken)
      ) {
        if (this.sessionIndex !== null) {
          this.session.setSessionExpiredFor(true, this.sessionIndex);
        } else {
          this.session.setSessionExpired(true);

          this.auth.tryToRelog(onLogin);
        }
      }
      throw error;
    }
  }

  checkResponse<T extends ApiResponse>(
    response: AxiosResponse<T>,
    url?: string,
  ): T {
    const data = response.data;

    // Failed on API side
    if (data && data.status && data.status !== 'success') {
      const msg = data && data.message ? data.message : 'Server error';
      const errId = data && data.errorId ? data.errorId : '';

      const apiError = new ApiError(
        msg,
        response.status,
        response.data?.errors,
      );
      apiError.errId = errId;
      apiError.headers = response.headers;
      throw apiError;
    }
    if (response.status >= 500) {
      this.log.info(
        '[ApiService] server error',
        response.status,
        response.request?.url || url,
      );
      throw new ApiError('Server error ' + response.status, response.status);
    }

    return data;
  }

  /**
   * Abort the calls attached to the tag
   * @param tag
   */
  abort(tag: any) {
    const source = this.abortTags.get(tag);
    if (source) {
      source.cancel();
      this.abortTags.delete(tag);
    }
  }

  /**
   * Clear cookies
   */
  clearCookies() {
    const NativeModules = require('react-native').NativeModules;
    return new Promise(success => {
      NativeModules.Networking.clearCookies(d => {
        success(d);
      });
    });
  }

  /**
   * Build headers
   */
  buildHeaders(customHeaders: any = {}) {
    let headers: any = {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Pragma: 'no-cache',
      'no-cache': '1',
      'App-Version': Version.VERSION,
      ...customHeaders,
    };

    const sessionToken = this.session.sessionToken;
    if (this.session.sessionToken) {
      headers['X-SESSION-TOKEN'] = sessionToken;
    }

    const referrer = this.referrerService.get();
    if (referrer) {
      headers.minds_referrer = referrer;
    }

    if (this.accessToken && !sessionToken) {
      headers = {
        ...this.buildAuthorizationHeader(this.accessToken),
        ...headers,
      };
    }

    return headers;
  }

  buildAuthorizationHeader(token?: string) {
    return { Authorization: `Bearer ${token || this.accessToken}` };
  }

  /**
   * Build url
   * @param {string} url
   * @param {any} params
   */
  buildUrl(url, _params: any = {}) {
    const params = Object.assign({}, _params);
    if (process.env.JEST_WORKER_ID === undefined) {
      params.cb = Date.now(); //bust the cache every time
    }

    if (this.STAGING) {
      params.staging = '1';
    }
    if (this.CANARY) {
      params.canary = '1';
    }

    const paramsString = this.getParamsString(params);
    const sep = paramsString ? (url.indexOf('?') > -1 ? '&' : '?') : '';

    return `${url}${sep}${paramsString}`;
  }

  getParamsString(params) {
    return Object.keys(params)
      .map(k => {
        if (params[k] instanceof ParamsArray) {
          return params[k]
            .map(
              (value, index) =>
                `${encodeURIComponent(k)}[${index}]=${encodeURIComponent(
                  value,
                )}`,
            )
            .join('&');
        }
        return encodeURIComponent(k) + '=' + encodeURIComponent(params[k]);
      })
      .join('&');
  }

  /**
   * Api get with abort support
   * @param {string} url
   * @param {object} params
   * @param {mixed} tag this is used to abort the fetch when another fetch is done.
   * For the get request, we auto-cancel the previous request if another one is made.
   * Very useful if the parameters change often and we are making new calls (like a search or autocomplete)
   */
  async get<T>(
    url: string,
    params: object = {},
    tag: any = null,
    headers: any = null,
  ): Promise<T & ApiResponse> {
    let opt: any = {};
    if (tag) {
      const source = this.abortTags.get(tag);
      // cancel previous if exists
      if (source && source.cancel) {
        source.cancel();
      }
      const s = axios.CancelToken.source();
      opt = { cancelToken: s.token };
      this.abortTags.set(tag, opt.cancelToken);
    }
    if (headers) {
      opt.headers = headers;
    }
    const response = await this.axios.get(this.buildUrl(url, params), opt);

    return response.data;
  }

  /**
   * Api post
   * @param {string} url
   * @param {object} body
   */
  async post<T>(
    url: string,
    body: any = {},
    headers: any = {},
    signal?: AbortSignal,
  ): Promise<T & ApiResponse> {
    const response = await this.axios.post(this.buildUrl(url), body, {
      headers,
      signal,
    });

    return response.data;
  }

  /**
   * Api post
   * @param {string} url
   * @param {object} body
   */
  async rawPost<T>(
    url: string,
    body: any = {},
    headers: any = {},
  ): Promise<AxiosResponse<T>> {
    const response = await this.axios.post(this.buildUrl(url), body, {
      headers,
    });

    return response;
  }

  /**
   * Api put
   * @param {string} url
   * @param {object} body
   */
  async put<T>(url: string, body: any = {}): Promise<T & ApiResponse> {
    const response = await this.axios.put(this.buildUrl(url), body);

    return response.data;
  }

  /**
   * Api delete
   * @param {string} url
   * @param {object} data
   */
  async delete<T>(
    url: string,
    data: any = {},
    headers: any = {},
  ): Promise<T & ApiResponse> {
    const response = await this.axios.delete(this.buildUrl(url), {
      data,
      headers,
    });

    return response.data;
  }

  /**
   * Upload file to s3, differences with generic upload are headers and formData (which are not necessary)
   * @param {any} lease
   * @param {any} file
   * @param {function} progress
   */
  uploadToS3(
    lease: { presigned_url: string },
    file: any,
    progress: (event: Event) => any,
  ): Cancelable<ApiResponse> {
    return new Cancelable((resolve, reject, onCancel) => {
      let xhr = new XMLHttpRequest();

      // handle cancel
      onCancel(cb => {
        xhr.abort();
        cb();
      });

      if (progress) {
        xhr.upload.addEventListener('progress', progress);
      }
      const url = lease.presigned_url;
      xhr.open('PUT', url);
      xhr.setRequestHeader('Content-Type', file.type);
      xhr.onload = () => {
        if (xhr.status === 200) {
          resolve(true);
        } else {
          reject('Ooops: upload error');
        }
      };
      xhr.onerror = function () {
        reject(new NetworkError('Network request failed'));
      };

      xhr.send(file);
    }).catch(error => {
      if (error.name !== 'CancelationError') {
        this.log.exception('[ApiService] upload', error);
        throw error;
      }
    });
  }

  /**
   * Upload files
   * @param {string} url
   * @param {object} file
   * @param {object} data
   * @param {Function} progress
   */
  upload(
    url: string,
    files: {
      [key: string]: any;
    },
    data: any | null = null,
    progress?: (event: Event) => any,
  ) {
    var formData = new FormData();

    if (data) {
      for (const key in data) {
        formData.append(key, data[key]);
      }
    }

    for (const key in files) {
      formData.append(key, files[key]);
    }

    return new Cancelable((resolve, reject, onCancel) => {
      let xhr = new XMLHttpRequest();

      // handle cancel
      onCancel(cb => {
        xhr.abort();
        cb();
      });

      if (progress) {
        xhr.upload.addEventListener('progress', progress);
      }
      xhr.open('POST', this.APP_API_URI + this.buildUrl(url));

      if (this.session.sessionToken) {
        xhr.setRequestHeader('X-SESSION-TOKEN', this.session.sessionToken);
      } else {
        xhr.setRequestHeader('Authorization', `Bearer ${this.accessToken}`);
      }
      xhr.setRequestHeader('Accept', 'application/json');
      xhr.setRequestHeader('Content-Type', 'multipart/form-data;');
      xhr.setRequestHeader('App-Version', Version.VERSION);
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status <= 399) {
          let response: ApiResponse;
          try {
            response = JSON.parse(xhr.responseText);
          } catch (e) {
            response = {
              status: 'error',
              message: 'Error parsing server response',
            };
          }
          if (response.status === 'error' || xhr.status === 403) {
            return reject(response);
          }
          resolve(response);
        } else {
          let response: ApiResponse;
          try {
            response = JSON.parse(xhr.responseText);
          } catch (e) {
            response = {
              status: 'error',
              message: 'Upload failed',
            };
          }
          console.log('Upload Error', xhr.status, response);
          reject(
            new ApiError(
              response.message || 'Upload failed',
              xhr.status,
              response.errors,
            ),
          );
        }
      };
      xhr.onerror = function () {
        reject(new NetworkError('Network request failed'));
      };

      xhr.send(formData);
    }).catch(error => {
      if (error.name !== 'CancelationError') {
        this.log.exception('[ApiService] upload', error);
        throw error;
      }
    });
  }
}
