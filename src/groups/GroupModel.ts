import { observable, decorate, action } from 'mobx';
import BaseModel from '../common/BaseModel';
import groupsService from './GroupsService';

/**
 * Group model
 */
export default class GroupModel extends BaseModel {
  @observable conversationDisabled = false;
  name!: string;

  @action
  async toggleConversationDisabled() {
    await groupsService.toggleConversationDisabled(
      this.guid,
      !this.conversationDisabled,
    );
    this.conversationDisabled = !this.conversationDisabled;
  }
}

/**
 * Define model observables
 */
decorate(GroupModel, {
  //@ts-ignore
  briefdescription: observable,
  name: observable,
  'is:member': observable,
  'members:count': observable,
});
