import { observable, action } from 'mobx'

import { getFeed } from './NewsfeedService';

class NewsfeedStore {
  @observable entities   = []
  @observable offset     = ''
  @observable refreshing = false

  loadFeed() {
    getFeed(this.offset)
      .then(
        feed => {
          this.setFeed(feed);
        }
      )
      .catch(err => {
        console.log('error');
      });
  }

  @action
  setFeed(feed) {
    this.entities = [... this.entities, ...feed.entities];
    this.offset = feed.offset,
    this.loaded = true,
    this.refreshing = false
  }

  @action
  refresh() {
    console.log('refreshing newsfeed');
    this.refreshing = true;
    this.entities = [];
    this.offset = ''
    this.loadFeed()

    setTimeout(() => {
      console.log('refreshing newsfeed false');
      this.refreshing = false;
    }, 1000);
  }
}

export default new NewsfeedStore();