import React, {
  Component
} from 'react';

import {
  NavigationActions
} from 'react-navigation';

import {
  Text,
  TextInput,
  KeyboardAvoidingView,
  View,
  Linking,
  Alert,
} from 'react-native';

import authService from '../auth/AuthService';
import { CommonStyle } from '../styles/Common';
import { ComponentsStyle } from '../styles/Components';

import { observer, inject } from 'mobx-react/native';

import {
  CheckBox,
  Button
} from 'react-native-elements'

import i18n from '../common/services/i18n.service';
import sessionService from '../common/services/session.service';
import { ADDRGETNETWORKPARAMS } from 'dns';

/**
 * Register Form
 */
@inject('user')
@observer
export default class RegisterForm extends Component {
  state = {
    error: {},
    password: '',
    username: '',
    confirmPassword: '',
    email: '',
    termsAccepted: false,
    exclusive_promotions: false,
    inProgress: false,
  };

  validatePassword(value) {
    let error = this.state.error;
    if (this.state.password !== value) {
      error.confirmPasswordError = 'Passwords should match';
    } else {
      error.confirmPasswordError = '';
    }
    this.setState({ error });
  }

  validateTerms(value) {
    let error = this.state.error;
    if(!this.state.termsAccepted && this.state.username.length > 4){
      error.termsAcceptedError = 'You should accept the terms and conditions';
    } else {
      error.termsAcceptedError = '';
    }
    this.setState({ termsAccepted: !!value, error });
  }

  render() {
    return (
      <KeyboardAvoidingView behavior='padding'>
        <View>
          <Text style={{color: '#F00', textAlign: 'center', paddingTop:4, paddingLeft:4}}>
            {this.state.error.termsAcceptedError}
          </Text>
        </View>
        <TextInput
          style={[ComponentsStyle.loginInput, CommonStyle.marginTop2x]}
          placeholder={i18n.t('auth.username')}
          placeholderTextColor="#444"
          returnKeyType={'done'}
          underlineColorAndroid='transparent'
          onChangeText={(value) => this.setState({ username: value })}
          value={this.state.username}
          editable={!this.state.inProgress}
        />
        <TextInput
          style={[ComponentsStyle.loginInput, CommonStyle.marginTop2x]}
          placeholder={i18n.t('auth.email')}
          returnKeyType={'done'}
          placeholderTextColor="#444"
          underlineColorAndroid='transparent'
          onChangeText={(value) => this.setState({ email: value })}
          value={this.state.email}
          editable={!this.state.inProgress}
        />
        <TextInput
          style={[ComponentsStyle.loginInput, CommonStyle.marginTop2x]}
          placeholder={i18n.t('auth.password')}
          secureTextEntry={true}
          returnKeyType={'done'}
          placeholderTextColor="#444"
          underlineColorAndroid='transparent'
          onChangeText={(value) => this.setState({ password: value })}
          value={this.state.password}
          editable={!this.state.inProgress}
        />
        { this.state.password ?
          <TextInput
            style={[ComponentsStyle.loginInput, CommonStyle.marginTop2x]}
            placeholder={i18n.t('auth.confirmpassword')}
            secureTextEntry={true}
            returnKeyType={'done'}
            placeholderTextColor="#444"
            underlineColorAndroid='transparent'
            onChangeText={(value) => this.setState({ confirmPassword: value })}
            value={this.state.confirmPassword}
            editable={!this.state.inProgress}
          /> : null }
        <CheckBox
          right
          iconRight
          containerStyle={ComponentsStyle.registerCheckbox}
          title={<Text style={[ComponentsStyle.terms, CommonStyle.textRight]}>{`Receive exclusive promotions from Minds\n(recommended)`}</Text>}
          checked={this.state.exclusive_promotions}
          textStyle={[ComponentsStyle.registerCheckboxText, CommonStyle.textRight]}
          onPress={() => { this.setState({ exclusive_promotions: !this.state.exclusive_promotions }) }}
          disabled={this.state.inProgress}
        />
        <CheckBox
          right
          iconRight
          containerStyle={ComponentsStyle.registerCheckbox}
          title={<Text style={ComponentsStyle.terms}>I accept the <Text style={ComponentsStyle.link} onPress={ ()=> Linking.openURL('https://www.minds.com/p/terms') }>terms and conditions</Text></Text>}
          checked={this.state.termsAccepted}
          textStyle={ComponentsStyle.registerCheckboxText}
          onPress={() => { this.setState({ termsAccepted: !this.state.termsAccepted }) }}
          disabled={this.state.inProgress}
        />
        <View style={[CommonStyle.rowJustifyEnd, CommonStyle.marginTop2x]}>
            <Button
              onPress={() => this.onPressBack()}
              title={i18n.t('goback')}
              borderRadius={4}
              backgroundColor="transparent"
              containerViewStyle={ComponentsStyle.loginButton}
              textStyle={ComponentsStyle.loginButtonText}
              disabled={this.state.inProgress}
              disabledStyle={CommonStyle.backgroundTransparent}
            />
            <Button
              onPress={() => this.onPressRegister()}
              title={i18n.t('auth.create')}
              backgroundColor="transparent"
              borderRadius={4}
              containerViewStyle={ComponentsStyle.loginButton}
              textStyle={ComponentsStyle.loginButtonText}
              loading={this.state.inProgress}
              loadingRight={true}
              disabled={this.state.inProgress}
              disabledStyle={CommonStyle.backgroundTransparent}
            />
        </View>
      </KeyboardAvoidingView>
    );
  }

  /**
   * On press back
   */
  onPressBack() {
    this.props.onBack();
  }

  /**
   * On press register
   */
  async onPressRegister() {
    this.validatePassword(this.state.confirmPassword);

    if (!this.state.termsAccepted) {
      return Alert.alert(
        'Oooopps',
        'Please accept the Terms & Conditions'
      );
    }

    if (this.state.error.confirmPasswordError) {
      return Alert.alert(
        'Oooopps',
        'Please ensure your passwords match'
      );
    }

    this.setState({ inProgress: true });

    try {
      const params = {
        username: this.state.username,
        email: this.state.email,
        password: this.state.password,
        exclusive_promotions: this.state.exclusive_promotions
      };
      await authService.register(params)
      await authService.login(this.state.username ,this.state.password)
      await this.props.user.load();
      this.props.onRegister(sessionService.guid);
    } catch (err) {
      Alert.alert(
        'Oooopps',
        err.message
      );
    }

    this.setState({ inProgress: false });
  }
}
