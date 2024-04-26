import React, { useState } from 'react';
import { View, TouchableOpacity } from 'react-native';
import Link from '~/common/components/Link';
import Toggle from '~/common/components/Toggle';
import { B1, H3, IconButton, Row, Screen, ScreenHeader } from '~/common/ui';
import ThemedStyles from '~/styles/ThemedStyles';
import { useChatRoomInfoQuery } from '../hooks/useChatRoomInfoQuery';
import CenteredLoading from '~/common/components/CenteredLoading';
import {
  ChatRoomTypeEnum,
  useDeleteChatRoomAndBlockUserMutation,
  useDeleteChatRoomMutation,
  useLeaveChatRoomMutation,
} from '~/graphql/api';
import { confirm } from '~/common/components/Confirm';
import { ChatStackScreenProps } from '../ChatConversationStack';
import { showNotification } from 'AppMessages';
import MPressable from '~/common/components/MPressable';
import { useRefreshOnFocus } from '~/services/hooks/useRefreshOnFocus';
import ErrorLoading from '~/common/components/ErrorLoading';

type Props = ChatStackScreenProps<'ChatDetails'>;

/**
 * Chat details screen
 */
export default function ChatDetailsScreen({ route, navigation }: Props) {
  const roomGuid = route.params?.roomGuid;
  if (!roomGuid) {
    throw new Error('roomGuid is required');
  }
  const { data, isLoading, error, refetch } = useChatRoomInfoQuery(roomGuid);

  // refetch on screen focus
  useRefreshOnFocus(refetch);

  const deleteChatMutation = useDeleteChatRoomMutation({
    onSuccess: () => {
      showNotification('Chat deleted', 'success');

      // we move back to the main screen
      navigation.getParent()?.goBack();
    },
  });

  const blockAndDeleteMutation = useDeleteChatRoomAndBlockUserMutation({
    onSuccess: () => {
      showNotification('User Blocked and chat deleted', 'success');

      // we move back to the main screen
      navigation.getParent()?.goBack();
    },
  });

  const leaveMutation = useLeaveChatRoomMutation({
    onSuccess: () => {
      // we move back to the main screen
      navigation.getParent()?.goBack();
    },
  });

  const [mute, setMute] = useState(false);

  const deleteChat = async () => {
    const result = await confirm({
      title: 'Delete chat',
      description: 'Are you sure you want to delete this chat?',
    });
    if (result) {
      deleteChatMutation.mutate({ roomGuid });
    }
  };
  const leaveChat = async () => {
    const result = await confirm({
      title: 'Leave room',
      description: 'Are you sure you want to leave this chat?',
    });
    if (result) {
      leaveMutation.mutate({ roomGuid });
    }
  };

  const blockUser = async () => {
    const result = await confirm({
      title: 'Block user',
      description:
        'Are you sure you want to block this user and delete this chat?',
    });
    if (result) {
      blockAndDeleteMutation.mutate({ roomGuid });
    }
  };

  const privateChat =
    data?.chatRoom.node.roomType === ChatRoomTypeEnum.OneToOne;
  const isUserRoomOwner = Boolean(data?.chatRoom.node.isUserRoomOwner);
  return (
    <Screen safe scroll>
      <ScreenHeader border back={true} title="Chat details" />

      {isLoading ? (
        <CenteredLoading />
      ) : error ? (
        <ErrorLoading
          message={
            error instanceof Error ? error.message : 'Error loading data'
          }
          tryAgain={refetch}
        />
      ) : (
        <>
          <H3 left="XXXL" top="XXXL">
            Notifications
          </H3>
          <Row align="centerBetween" vertical="XL" horizontal="XXXL">
            <B1>Mute notifications for this chat</B1>
            <Toggle value={mute} onValueChange={setMute} />
          </Row>
          <MPressable
            onPress={() => {
              if (!data?.chatRoom) return;
              navigation.navigate('ChatMembers', {
                roomGuid,
                chatRoom: data?.chatRoom,
              });
            }}>
            <Row align="centerBetween" vertical="XL" horizontal="XXXL">
              <H3>Chat Members ({data?.chatRoom.totalMembers})</H3>
              <IconButton name={'chevron-right'} size={32} />
            </Row>
          </MPressable>
          <View style={styles.separator} />
          {privateChat && (
            <TouchableOpacity onPress={blockUser}>
              <Link style={styles.dangerLink} decoration={false}>
                Block user
              </Link>
            </TouchableOpacity>
          )}
          {!privateChat && !isUserRoomOwner && (
            <TouchableOpacity onPress={leaveChat}>
              <Link style={styles.dangerLink} decoration={false}>
                Leave chat
              </Link>
            </TouchableOpacity>
          )}
          {(isUserRoomOwner || privateChat) && (
            <TouchableOpacity onPress={deleteChat}>
              <Link style={styles.dangerLink} decoration={false}>
                Delete chat
              </Link>
            </TouchableOpacity>
          )}
        </>
      )}
    </Screen>
  );
}

const styles = ThemedStyles.create({
  container: ['flexContainer', 'marginHorizontal7x', 'marginTopL'],
  separator: ['bcolorPrimaryBorder', 'borderTop1x'],
  simpleLink: [
    'colorSecondaryText',
    'fontXL',
    'marginHorizontal7x',
    'marginVertical4x',
  ],
  dangerLink: [
    'colorAlert',
    'fontXL',
    'marginHorizontal7x',
    'marginVertical4x',
  ],
});
