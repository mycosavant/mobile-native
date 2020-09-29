import { reaction } from 'mobx';
import { useAsObservableSource, useLocalStore } from 'mobx-react';
import React, { useEffect } from 'react';
import storageService from '../../common/services/storage.service';
import apiService from '../services/api.service';

const getCacheKey = (url: string, params: any) =>
  `@minds:persist:${url}${params ? `?${JSON.stringify(params)}` : ''}`;

const createStore = ({
  url,
  updateState = (newData, _) => newData,
  method = 'get',
}) => ({
  loading: false,
  result: null,
  error: null,
  async hydrate(params: any) {
    if (this.result) {
      return;
    }

    try {
      const data = await storageService.getItem(getCacheKey(url, params));
      this.result = JSON.parse(data);
    } catch (e) {
      console.error(e);
    }
  },
  persist(params: any) {
    return storageService.setItem(
      getCacheKey(url, params),
      JSON.stringify(this.result),
    );
  },
  setResult(v: any) {
    this.result = v;
  },
  setLoading(v: boolean) {
    this.loading = v;
  },
  setError(e) {
    this.error = e;
  },
  async fetch(data: object = {}) {
    this.setLoading(true);
    this.setError(null);
    try {
      const result = await apiService[method](url, data);
      const state = updateState(result, this.result);
      this.setResult(state);
      this.persist(state);
    } catch (err) {
      console.log(err);
      this.setError(err);
    } finally {
      this.setLoading(false);
    }

    return this.result;
  },
});

export interface FetchStore<T> {
  loading: boolean;
  result: T | null;
  error: any;
  setResult: (v: any) => void;
  setLoading: (v: boolean) => void;
  setError: (v: any) => void;
  fetch: (object?) => Promise<any>;
  hydrate: (params: any) => Promise<any>;
}

export interface PostStore<T> extends FetchStore<T> {
  post: (object?) => Promise<any>;
}

/**
 * Fetch the api and return a stable StateStore with
 * loading state, result or error
 *
 * If the parameters changes it automatically cancel the previous call and fetch it again
 *
 * @param url string
 * @param params object
 * @param updateState function
 * @param persist boolean
 */
export default function useApiFetch<T>(
  url: string,
  params: object = {},
  updateState?,
  persist: boolean = false,
): FetchStore<T> {
  const store: FetchStore<T> = useLocalStore(createStore, { url, updateState });
  const observableParams = useAsObservableSource(params);

  // if persist was true, hydrate on the first render
  useEffect(() => {
    if (persist) {
      store.hydrate(params);
    }
  }, []);

  React.useEffect(() => {
    reaction(() => ({ ...observableParams }), store.fetch, {
      fireImmediately: true,
    });
  }, [observableParams, store, url]);

  return store;
}

/**
 * The same hook as above but use to post data
 *
 * @param url string
 * @param method string
 */
export function useApiPost<T>(
  url: string,
  method: string = 'post',
): PostStore<T> {
  const store: FetchStore<T> = useLocalStore(createStore, {
    url,
    method,
  });

  return {
    ...store,
    post: store.fetch,
  };
}
