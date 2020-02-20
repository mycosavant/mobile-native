import React, { Component } from 'react';
import {
  Text,
  StyleSheet,
  Image,
  View,
  Platform,
  TouchableOpacity,
  Dimensions,
} from 'react-native';

import { observer, inject } from 'mobx-react'
import FAIcon from 'react-native-vector-icons/FontAwesome';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Avatar } from 'react-native-elements';

import { MINDS_CDN_URI } from '../config/Config';
import featuresService from '../common/services/features.service';
import isIphoneX from '../common/helpers/isIphoneX';
import testID from '../common/helpers/testID';

import SearchComponent from './SearchComponent';
import navigation from '../navigation/NavigationService';
import ThemedStyles from '../styles/ThemedStyles';
import { SafeAreaConsumer } from 'react-native-safe-area-context';
import MessengerTabIcon from '../messenger/MessengerTabIconNew';

const forceInset = isIphoneX ? {top: 10} : null

@inject('user')
@inject('wallet')
@observer
export default class TopbarNew extends Component {

  componentDidMount() {
    this.props.wallet.refresh();
  }

  listenForSearch = () => this.props.user.searching ? styles.scale0 : {};

  render() {

    const CS = ThemedStyles.style;

    const user = this.props.user;
    return (
      <SafeAreaConsumer>
        {insets => (
          <View style={[styles.container, CS.backgroundSecondary, {paddingTop: insets.top}]}>
            <View style={styles.topbar}>
              <View style={[styles.topbarLeft, CS.marginLeft4x]}>
                <Text style={[CS.titleText, CS.colorPrimaryText, styles.lineHeight0]} >{this.props.title}</Text>
              </View>
              <View style={styles.topbarRight}>
                <MessengerTabIcon navigation={navigation}/>
                <SearchComponent user={this.props.user} navigation={navigation} />
              </View>
            </View>
          </View>
        )}
      </SafeAreaConsumer>

    );
  }
}

let topbarHeight = 50;
let topMargin = 0;

if (Platform.OS == 'ios') {
  topbarHeight = 80;
}

const styles = StyleSheet.create({
  lineHeight0: {
    lineHeight: 28,
  },
  container: {
    height: topbarHeight,
    display: 'flex',
    flexDirection: 'row',
    paddingBottom: 8,
  },
  topbar: {
    flex: 1,
    alignItems: 'flex-end',
    flexDirection: 'row',
  },
  topbarLeft: {
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    flexDirection: 'row'
  },
  topbarRight: {
    flex: 1,
    justifyContent: 'flex-end',
    flexDirection: 'row',
    paddingRight: 4,
    marginRight: 5,
    paddingTop: 4,
  },
  button: {
    paddingHorizontal: 8,
  },
  scale0: {
    transform: [{ scale: 0 }]
  }
});
