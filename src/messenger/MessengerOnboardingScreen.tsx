//@ts-nocheck
import React, { Component } from 'react';

import { View, Text, StyleSheet } from 'react-native';

import { inject, observer } from 'mobx-react';

import api from './../common/services/api.service';

import NavNextButton from '../common/components/NavNextButton';

import { ComponentsStyle } from '../styles/Components';
import stylesheet from '../onboarding/stylesheet';
import i18n from '../common/services/i18n.service';
import ActivityIndicator from '../common/components/ActivityIndicator';
import ThemedStyles from '../styles/ThemedStyles';
import TextInput from '../common/components/TextInput';

@inject('messengerList')
@observer
export default class MessengerOnboardingScreen extends Component {
  state = {
    inProgress: false,
    password: null,
    password2: null,
  };

  componentDidMount() {
    this.didChange();
  }

  getNextButton = () => {
    let next = (
      <NavNextButton
        onPress={this.props.onNext}
        title={i18n.t('done').toUpperCase()}
        color={ThemedStyles.style.colorPrimaryText}
      />
    );

    if (this.state.password && this.state.password2) {
      next = (
        <NavNextButton
          onPress={this.setup.bind(this)}
          title={i18n.t('done')}
          color={ThemedStyles.style.colorLink}
        />
      );
    }

    if (this.state.inProgress) {
      next = <ActivityIndicator size="small" />;
    }

    return next;
  };

  didChange() {
    // this.props.onSetNavNext(this.getNextButton());
  }

  async setup() {
    try {
      this.setState({ inProgress: true });
      setTimeout(() => this.didChange());

      const { key } = await api.post('api/v2/messenger/keys/setup', {
        password: this.state.password,
        download: true,
      });
      this.props.messengerList.setPrivateKey(key);

      this.setState({ inProgress: false });
      setTimeout(() => this.didChange());

      this.props.onNext();
    } catch (err) {
      this.setState({ inProgress: false });
      setTimeout(() => this.didChange());

      alert(err.message);
    }

    this.setState({ inProgress: false });
  }

  render() {
    const theme = ThemedStyles.style;
    return (
      <View>
        <MText style={style.h1}>{i18n.t('messenger.messenger')}</MText>

        <MText style={style.p}>{i18n.t('messenger.onboardingText')}</MText>

        <View style={[theme.flexContainer, theme.padding2x]}>
          <View style={{ flexDirection: 'row', alignItems: 'stretch' }}>
            <TextInput
              ref="password"
              editable={!this.state.inProgress}
              style={[ComponentsStyle.passwordinput, { flex: 1 }]}
              underlineColorAndroid="transparent"
              placeholder={i18n.t('auth.password')}
              secureTextEntry={true}
              onChangeText={password => {
                this.setState({ password });
                this.props.onSetNavNext(this.getNextButton());
              }}
            />
          </View>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'stretch',
              marginTop: 16,
            }}>
            <TextInput
              ref="password2"
              editable={!this.state.inProgress}
              style={[ComponentsStyle.passwordinput, { flex: 1 }]}
              underlineColorAndroid="transparent"
              placeholder={i18n.t('auth.confirmpassword')}
              secureTextEntry={true}
              onChangeText={password2 => {
                this.setState({ password2 });
                this.props.onSetNavNext(this.getNextButton());
              }}
            />
          </View>
        </View>
      </View>
    );
  }
}

const style = StyleSheet.create(stylesheet);
