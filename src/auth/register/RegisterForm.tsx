import React, { useRef } from 'react';
import { ScrollView, View } from 'react-native';

import { observer, useLocalStore } from 'mobx-react';
import { CheckBox } from 'react-native-elements';
import debounce from 'lodash/debounce';
import { useNavigation } from '@react-navigation/core';

import InputContainer, {
  InputContainerImperativeHandle,
} from '~/common/components/InputContainer';
import validatePassword from '~/common/helpers/validatePassword';
import { showNotification } from '~/../AppMessages';
import validatorService from '~/common/services/validator.service';
import Captcha from '~/common/components/Captcha';
import type { registerParams } from '../AuthService';
import delay from '~/common/helpers/delay';
import PasswordInput from '~/common/components/password-input/PasswordInput';
import MText from '~/common/components/MText';
import { BottomSheetButton } from '~/common/components/bottom-sheet';
import FitScrollView from '~/common/components/FitScrollView';
import DismissKeyboard from '~/common/components/DismissKeyboard';
import { IS_IPAD, IS_TENANT, APP_URI, TENANT } from '~/config/Config';
import sp from '~/services/serviceProvider';

type PropsType = {
  // called after registration is finished
  onRegister?: (navigation: any) => void; // TODO type
};

const alphanumericPattern = '^[a-zA-Z0-9_]+$';

const RegisterForm = observer(({ onRegister }: PropsType) => {
  const navigation = useNavigation();
  const captchaRef = useRef<any>(null);
  const scrollViewRef = useRef<ScrollView>();
  const emailRef = useRef<InputContainerImperativeHandle>(null);
  const passwordRef = useRef<InputContainerImperativeHandle>(null);
  const i18n = sp.i18n;
  const openUrlService = sp.resolve('openURL');
  const store = useLocalStore(() => ({
    focused: false,
    error: {},
    password: '',
    passwordFocused: false,
    username: '',
    email: '',
    termsAccepted: false,
    policiesAccepted: false,
    exclusivePromotions: IS_TENANT ? false : true,
    inProgress: false,
    showErrors: false,
    usernameTaken: false,
    captcha: '',
    validateUser: debounce(async (username: string) => {
      const response = await sp.api.get<any>('api/v3/register/validate', {
        username,
      });
      store.usernameTaken = !response.valid;
    }, 300),
    setCaptcha(value: string) {
      this.captcha = value;
    },
    onCaptchResult: async (captcha: string) => {
      store.captcha = captcha;
      captchaRef.current.hide();
      store.register();
    },
    register: async () => {
      if (store.inProgress) {
        return null;
      }

      store.inProgress = true;

      try {
        const params = {
          username: store.username,
          email: store.email,
          password: store.password,
          exclusive_promotions: store.exclusivePromotions,
          captcha: store.captcha,
        } as registerParams;

        const authService = sp.resolve('auth');
        await authService.register(params);
        await sp.api.clearCookies();
        await delay(100);

        try {
          await authService.login(store.username, store.password, true);
          i18n.setLocaleBackend();
          onRegister?.(navigation);
        } catch (err) {
          try {
            await authService.login(store.username, store.password, true);
          } catch (error) {
            showNotification(i18n.t('auth.failedToLoginNewAccount'));
            sp.log.exception(error);
          }
        }
      } catch (err: any) {
        if (err instanceof Error) {
          showNotification(err.message, 'warning', 3000);
          sp.log.exception(err);
        }
      } finally {
        store.inProgress = false;
      }
    },
    onRegisterPress() {
      this.showErrors = true;
      if (!store.termsAccepted || !store.policiesAccepted) {
        return showNotification(
          i18n.t('auth.termsAcceptedError'),
          'info',
          3000,
        );
      }
      if (!validatePassword(store.password).all) {
        showNotification(
          i18n.t('auth.invalidPasswordDescription'),
          'info',
          2500,
        );
        return;
      }
      if (
        !store.username ||
        store.usernameTaken ||
        !store.email ||
        !validatorService.email(store.email)
      ) {
        return;
      }

      captchaRef.current?.show();
    },
    // on password focus
    focus() {
      this.focused = true;
      scrollViewRef.current?.scrollTo({ x: 0, y: 0, animated: true });
    },
    blur() {
      this.focused = false;
    },
    setPassword(value: string) {
      store.showErrors = false;
      store.password = value;
    },
    setUsername(value: string) {
      store.showErrors = false;
      store.username = value;
      if (!store.username.match(alphanumericPattern)) {
        store.showErrors = true;
      } else {
        store.validateUser(value);
      }
    },
    setEmail(value: string) {
      store.showErrors = false;
      store.email = value;
    },
    toggleTerms() {
      store.termsAccepted = !store.termsAccepted;
    },
    togglePolicies() {
      store.policiesAccepted = !store.policiesAccepted;
    },
    togglePromotions() {
      store.exclusivePromotions = !store.exclusivePromotions;
    },
    emailInputBlur() {
      store.email = store.email.trim();
    },
    get usernameError() {
      if (this.usernameTaken) {
        return i18n.t('auth.userTaken');
      }

      return !this.showErrors
        ? undefined
        : !this.username
        ? i18n.t('auth.fieldRequired')
        : !this.username.match(alphanumericPattern)
        ? i18n.t('auth.matchPattern')
        : undefined;
    },
  }));

  const theme = sp.styles.style;

  const passValidation = validatePassword(store.password);

  const inputs = (
    <View>
      <InputContainer
        placeholder={i18n.t('auth.username')}
        selectionColor={sp.styles.getColor('Link', 1)}
        onChangeText={store.setUsername}
        onSubmitEditing={emailRef.current?.focus}
        value={store.username}
        testID="usernameRegisterInput"
        error={store.usernameError}
        noBottomBorder
        autofocus
        autoCorrect={false}
        returnKeyType="next"
        returnKeyLabel={i18n.t('auth.nextLabel')}
        keyboardType="default"
        autoComplete="username-new"
        textContentType="username"
        maxLength={50}
      />
      <InputContainer
        ref={emailRef}
        placeholder={i18n.t('auth.email')}
        selectionColor={sp.styles.getColor('Link')}
        onChangeText={store.setEmail}
        onSubmitEditing={passwordRef.current?.focus}
        value={store.email}
        autoComplete="email"
        autoCorrect={false}
        autoCapitalize="none"
        keyboardType="email-address"
        textContentType="emailAddress"
        returnKeyType="next"
        returnKeyLabel={i18n.t('auth.nextLabel')}
        testID="emailInput"
        error={
          !store.showErrors
            ? undefined
            : !store.email
            ? i18n.t('auth.fieldRequired')
            : !validatorService.email(store.email)
            ? validatorService.emailMessage(store.email) || ''
            : undefined
        }
        noBottomBorder
        onBlur={store.emailInputBlur}
      />
      <PasswordInput
        ref={passwordRef}
        selectionColor={sp.styles.getColor('Link')}
        tooltipBackground={sp.styles.getColor('TertiaryBackground')}
        showValidator={
          Boolean(store.password) && store.focused && !passValidation.all
        }
        onChangeText={store.setPassword}
        value={store.password}
        testID="passwordInput"
        returnKeyLabel={i18n.t('auth.submitLabel')}
        returnKeyType="send"
        onFocus={store.focus}
        onBlur={store.blur}
        textContentType="newPassword"
        onSubmitEditing={store.onRegisterPress}
        error={
          store.showErrors && !passValidation.all
            ? i18n.t('settings.invalidPassword')
            : undefined
        }
      />
    </View>
  );

  return (
    <FitScrollView
      ref={scrollViewRef}
      keyboardShouldPersistTaps={'always'}
      contentContainerStyle={theme.paddingBottom4x}>
      <DismissKeyboard>
        <>
          {inputs}
          <View style={[theme.paddingHorizontal4x, theme.paddingVertical2x]}>
            <CheckBox
              checkedColor={sp.styles.getColor('Link')}
              containerStyle={styles.checkboxTerm}
              title={
                <MText style={styles.checkboxText}>
                  {i18n.t('auth.accept')}{' '}
                  <MText
                    style={theme.link}
                    onPress={() =>
                      IS_TENANT
                        ? openUrlService.open(
                            `${APP_URI}pages/community-guidelines`,
                          )
                        : openUrlService.open(`${APP_URI}/p/content-policy`)
                    }>
                    {i18n.t('auth.content')}
                  </MText>{' '}
                  {i18n.t('and')}{' '}
                  <MText
                    style={theme.link}
                    onPress={() =>
                      IS_TENANT
                        ? openUrlService.open(`${APP_URI}pages/privacy-policy`)
                        : openUrlService.open(`${APP_URI}p/privacy`)
                    }>
                    {i18n.t('auth.privacyPolicy')}
                  </MText>
                </MText>
              }
              checked={store.policiesAccepted}
              onPress={store.togglePolicies}
            />
            <CheckBox
              checkedColor={sp.styles.getColor('Link')}
              containerStyle={styles.checkboxTerm}
              title={
                <MText style={styles.checkboxText}>
                  {i18n.t('auth.accept')}{' '}
                  <MText
                    style={theme.link}
                    onPress={() =>
                      IS_TENANT
                        ? openUrlService.open(
                            `${APP_URI}pages/terms-of-service`,
                          )
                        : openUrlService.open('https://www.minds.com/p/terms')
                    }>
                    {i18n.t('auth.termsAndConditions')}
                  </MText>
                </MText>
              }
              checked={store.termsAccepted}
              onPress={store.toggleTerms}
            />

            {!IS_TENANT && (
              <CheckBox
                checkedColor={sp.styles.getColor('Link')}
                containerStyle={styles.checkboxPromotions}
                title={
                  <MText style={styles.checkboxText}>
                    {i18n.t('auth.promotions', { TENANT })}
                  </MText>
                }
                checked={store.exclusivePromotions}
                onPress={store.togglePromotions}
              />
            )}
          </View>
          <BottomSheetButton
            solid
            onPress={store.onRegisterPress}
            text={i18n.t('auth.createChannel', { TENANT })}
            disabled={true || store.inProgress}
            loading={store.inProgress}
            testID="registerButton"
            action
            containerStyle={IS_IPAD ? styles.buttonIpad : styles.button}
          />
          <Captcha
            ref={captchaRef}
            onResult={store.onCaptchResult}
            testID="captcha"
          />
        </>
      </DismissKeyboard>
    </FitScrollView>
  );
});

export default RegisterForm;

const styles = sp.styles.create({
  checkboxPromotions: ['checkbox', 'paddingLeft', 'margin0x'],
  checkboxTerm: ['checkbox', 'paddingLeft', 'margin0x', 'paddingBottom0x'],
  checkboxText: ['colorPrimaryText', 'fontL', 'paddingLeft2x'],
  buttonIpad: {
    width: '45%',
    alignSelf: 'center',
  },
  button: {
    alignSelf: 'stretch',
  },
});
