import { View } from 'react-native';
import React from 'react';
import ThemedStyles from '~/styles/ThemedStyles';
import { Avatar, B1, B2 } from '~/common/ui';
import { ChatMessage } from '../types';
import i18n from '~/common/services/i18n.service';
import sessionService from '~/common/services/session.service';
import moment from 'moment';

type Props = {
  message: ChatMessage;
};

function Message({ message }: Props) {
  const sender = message.node.sender.node;
  const date = moment(message.node.timeCreatedISO8601);
  return sender.guid !== sessionService.getUser().guid ? (
    <View style={styles.container}>
      <View style={styles.avatarContainer}>
        <Avatar
          size="tiny"
          source={{
            uri: message.node.sender.node.iconUrl,
          }}
        />
      </View>
      <View style={styles.bubbleContainer}>
        <B2 left="S" font="medium">
          {sender.name}
        </B2>
        <View style={styles.bubble}>
          <B1>{message.node.plainText}</B1>
        </View>
        <B2 left="S" font="medium" color="secondary">
          {i18n.date(date, 'friendly')}
        </B2>
      </View>
    </View>
  ) : (
    <View style={styles.containerRight}>
      <View style={styles.bubbleContainer}>
        <View style={styles.bubbleRight}>
          <B1 color="black">{message.node.plainText}</B1>
        </View>
        <B2 font="medium" color="secondary" align="right" right="S">
          {i18n.date(date, 'friendly')}
        </B2>
      </View>
    </View>
  );
}

export default React.memo(Message);

const styles = ThemedStyles.create({
  bubble: [
    'borderRadius15x',
    'bgSecondaryBackground',
    'paddingHorizontal3x',
    'paddingVertical2x',
    'marginVertical',
  ],
  avatarContainer: ['paddingBottom6x', 'paddingRight3x'],
  bubbleRight: [
    'borderRadius15x',
    'bgIconActive',
    'paddingHorizontal3x',
    'paddingVertical2x',
    'marginVertical',
  ],
  bubbleContainer: [
    'paddingTop3x',
    {
      maxWidth: '70%',
    },
  ],
  container: ['fullWidth', 'rowJustifyStart', 'alignEnd'],
  containerRight: ['fullWidth', 'rowJustifyEnd'],
});
