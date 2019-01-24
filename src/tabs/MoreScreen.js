import React, {
    Component
} from 'react';

import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  Linking,
  Alert,
  Platform,
  ToastAndroid,
} from 'react-native';

import {
  inject
} from 'mobx-react/native'

import {
  MINDS_URI
} from '../config/Config';

import {
  StackActions,
  NavigationActions
} from 'react-navigation';

import CodePush from 'react-native-code-push';

import Icon from 'react-native-vector-icons/MaterialIcons';
import authService from './../auth/AuthService';
import { List, ListItem } from 'react-native-elements'
import FastImage from 'react-native-fast-image';

import { ComponentsStyle } from '../styles/Components';
import { CommonStyle } from '../styles/Common';
import shareService from '../share/ShareService';
import { Version } from '../config/Version';


const ICON_SIZE = 24;

/**
 * More screen (menu)
 */
@inject('user')
export default class MoreScreen extends Component {

  static navigationOptions = {
    title: 'Minds',
  };

  state = {
    active: false,
    activities: [],
    refreshing: false
  }

  render() {
    const list = [
      {
        name: 'Blogs',
        icon: (<Icon name='subject' size={ICON_SIZE} style={ styles.icon }/>),
        onPress: () => {
          this.props.navigation.navigate('BlogList');
        }
      },
      {
        name: 'Groups',
        icon: (<Icon name='group-work' size={ICON_SIZE} style={ styles.icon }/>),
        onPress: () => {
          this.props.navigation.navigate('GroupsList');
        }
      },
      {
        name: 'Help & Support',
        icon: (<Icon name='help-outline' size={ICON_SIZE} style={ styles.icon }/>),
        onPress: () => {
          this.props.navigation.push('GroupView', { guid: '100000000000000681'});
        }
      },
      {
        name: 'Refer your friends',
        icon: (<Icon name='share' size={ICON_SIZE} style={ styles.icon }/>),
        onPress: () => {
          shareService.invite(this.props.user.me.guid);
        }
      },
      {
        name: 'Settings',
        icon: (<Icon name='settings' size={ICON_SIZE} style={ styles.icon }/>),
        onPress: () => {
          this.props.navigation.navigate('Settings');
        }
      },
      {
        name: 'Push Notifications',
        icon: (<Icon name='notifications' size={ICON_SIZE} style={ styles.icon } />),
        onPress: () => {
          this.props.navigation.navigate('NotificationsSettings');
        }
      },
      {
        name: 'Logout',
        icon: (<Icon name='power-settings-new' size={ICON_SIZE} style={ styles.icon } />),
        onPress: () => {
          authService.logout();
          const loginAction = StackActions.reset({
            index: 0,
            actions: [
              NavigationActions.navigate({ routeName: 'Login' })
            ]
          })

          this.props.navigation.dispatch(loginAction);
        }
      },
      {
        name: 'FAQ',
        icon: (<Icon name='open-in-new' size={ICON_SIZE} style={ styles.icon }/>),
        onPress: () => {
          Linking.openURL(MINDS_URI + 'faq');
        }
      }, {
        name: 'Code',
        icon: (<Icon name='open-in-new' size={ICON_SIZE} style={ styles.icon }/>),
        onPress: () => {
          Linking.openURL('https://github.com/Minds');
        }
      }, {
        name: 'Terms',
        icon: (<Icon name='open-in-new' size={ICON_SIZE} style={ styles.icon }/>),
        onPress: () => {
          Linking.openURL(MINDS_URI + 'p/terms');
        }
      }, {
        name: 'Privacy',
        icon: (<Icon name='open-in-new' size={ICON_SIZE} style={ styles.icon }/>),
        onPress: () => {
          Linking.openURL(MINDS_URI + 'p/privacy');
        }
      },
      {
        name: 'Report a bug',
        icon: (<Icon name='bug-report' size={ICON_SIZE} style={ styles.icon } />),
        onPress: () => {
          this.props.navigation.navigate('IssueReport');
        }
      },
      {
        name: 'Check for updates',
        icon: (<Icon name="cloud-download" size={ICON_SIZE} style={ styles.icon }/>),
        onPress: async() => {
          let response = await CodePush.sync({
            updateDialog: Platform.OS !== 'ios',
            installMode:  CodePush.InstallMode.IMMEDIATE,
          }, (status) => {
            switch (status) {
              case CodePush.SyncStatus.UP_TO_DATE:
                ToastAndroid.show('No updates available', ToastAndroid.LONG);
                break;
              case CodePush.SyncStatus.SYNC_IN_PROGRESS:
                ToastAndroid.show('Updating...', ToastAndroid.LONG);
                break;
              case CodePush.SyncStatus.UPDATE_INSTALLED:
                ToastAndroid.show('Updated', ToastAndroid.LONG);
                break;
            }
          });
        }
      }
    ];

    return (
      <ScrollView style={styles.scrollView}>
        <View style={styles.scrollViewContainer}>
          <List containerStyle={styles.container}>
            {
              list.map((l, i) => (
                <ListItem
                  key={i}
                  title={l.name}
                  titleStyle={styles.listTitle}
                  containerStyle={styles.listItem}
                  switchButton={l.switchButton}
                  hideChevron ={l.hideChevron}
                  leftIcon={l.icon}
                  onPress= {l.onPress}
                  noBorder
                />
              ))
            }
          </List>
          <View style={{flexGrow: 1}}>
          </View>
          <View style={styles.logoBackground}>
            { /*<FastImage
              resizeMode={FastImage.resizeMode.cover}
              style={[ComponentsStyle.logo, CommonStyle.marginTop2x]}
              source={require('../assets/logos/medium.png')}
            /> */ }
            <View style={styles.footer}>
              <Text style={styles.version} textAlign={'center'}>v{Version.VERSION} ({Version.BUILD})</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    );
  }

  onPressSettings = () => {
    this.props.navigation.navigate('Settings');
  }
}

const styles = StyleSheet.create({
  scrollView: {
    backgroundColor: '#FFF',
    flexDirection: 'column',
  },
  scrollViewContainer: {
  },
  container: {
    flex: 1,
    marginTop: 0,
    borderTopWidth: 0,
    borderBottomWidth: 0,
  },
  logoBackground: {
    paddingTop: 16,
    backgroundColor: '#FFF'
  },
	screen: {
    //paddingTop: 20,
    backgroundColor: '#FFF',
    flex: 1,
  },
  footer: {
    alignItems: 'stretch',
    width: '100%',
    height: 50,
  },
  listItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingTop: 8,
    paddingBottom: 8,
    //height:20
  },
  listTitle: {
    padding:8,
    fontFamily: 'Roboto',
  },
  icon: {
    color: '#455a64',
    alignSelf: 'center',
  },
  footercol: {
    flexDirection: 'row',
    justifyContent: 'space-around'
  },
  version: {
    marginTop: 16,
    fontSize: 16,
    padding: 8,
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#444'
  }
});
