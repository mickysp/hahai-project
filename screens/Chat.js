import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { StyleSheet, Text, View, KeyboardAvoidingView, TextInput, Pressable, Alert, FlatList } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from 'react-native-vector-icons/Ionicons';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { io } from 'socket.io-client';
import ipAddress from './ip';
import * as Notifications from 'expo-notifications';

const Chat = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { receiverId, blogId, receiver, chatRoomId } = route.params;
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [userId, setUserId] = useState('');
  const [userName, setUserName] = useState('');
  const [socket, setSocket] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const flatListRef = useRef();
  const [storedReceiver, setStoredReceiver] = useState(null);

  useEffect(() => {
    // Reset the notification when the chat is opened
    const resetNotificationCount = async () => {
      await AsyncStorage.setItem('newMessage', 'false');
    };

    resetNotificationCount();
  }, []);

  useEffect(() => {
       const storePushToken = async (userId) => {
      try {
        const pushToken = await AsyncStorage.getItem("expoPushToken");
        if (!pushToken) {
          console.error("Push token not found in AsyncStorage");
          return;
        }
    
        await axios.post(`https://localhost:5001/store-token`, { token: pushToken, userId });
        console.log("Push token stored successfully.");
      } catch (error) {
        console.error("Error storing push token:", error);
      }
    };
  
    if (userId) {
      storePushToken();
    }
  }, [userId]);  // Run when userId is available
  

  const receiverToShow = receiver || storedReceiver;

  useLayoutEffect(() => {
    if (receiverToShow) {
      navigation.setOptions({
        headerTitle: `${receiverToShow.firstname} ${receiverToShow.lastname}`,
        headerTitleStyle: { fontSize: 18, fontWeight: 'bold' },
        headerTitleAlign: 'left',
      });
    }
  }, [navigation, receiverToShow]);

  useEffect(() => {
    const checkToken = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        if (token) {
          const decodedToken = jwtDecode(token);
          setUserId(decodedToken.userId);
          setUserName(`${decodedToken.firstname} ${decodedToken.lastname}`);
          storePushToken(decodedToken.userId);
        } else {
          navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          });
        }
      } catch (error) {
        //console.error('Error checking token:', error);
        //Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถตรวจสอบข้อมูลผู้ใช้ได้ กรุณาลองอีกครั้ง');
      }
    };
    checkToken();
  }, []);

  useEffect(() => {
    const loadStoredReceiver = async () => {
      if (!receiver) {
        const storedData = await AsyncStorage.getItem('chat_receiver');
        if (storedData) {
          setStoredReceiver(JSON.parse(storedData));
        }
      }
    };
    loadStoredReceiver();
  }, []);

  useEffect(() => {
    if (userId) {
      const socketInstance = io(`https://localhost:5001/`, { query: { userId } });
      setSocket(socketInstance);

      socketInstance.on('connect', () => {
        console.log('Socket connected with ID:', socketInstance.id);
      });

      socketInstance.on('receiveMessage', async (newMessage) => {
        setMessages((prevMessages) => {
          const updatedMessages = [...prevMessages, newMessage];
          flatListRef.current?.scrollToEnd({ animated: true });
          return updatedMessages;
        });

        if (newMessage.senderId !== userId) {
          const pushMessage = {
            to: newMessage.receiverPushToken,
            sound: 'default',
            title: 'คุณมีข้อความใหม่',
            body: `${newMessage.senderName || 'Unknown sender'}: ${newMessage.text}`,
            data: { chatRoomId, senderId: newMessage.senderId },
          };

          try {
            await Notifications.scheduleNotificationAsync({
              content: pushMessage,
              trigger: { seconds: 1 },
            });
            // Store that a new message has arrived
            await AsyncStorage.setItem('newMessage', 'true');
          } catch (error) {
            console.error('Error sending push notification:', error);
          }
        }
      });

      return () => {
        socketInstance.disconnect();
        console.log('Socket disconnected');
      };
    }
  }, [userId]);

  useEffect(() => {
    const loadCachedMessages = async () => {
      if (!userId) return;

      try {
        const cachedMessages = await AsyncStorage.getItem(`chat_${userId}_${receiverId}_${blogId}`);
        if (cachedMessages) {
          setMessages(JSON.parse(cachedMessages));
        }
      } catch (error) {
        console.error('Error loading cached messages:', error);
      }
    };
    loadCachedMessages();
  }, [userId, receiverId, blogId]);

  useEffect(() => {
    const fetchMessagesFromServer = async () => {
      if (!userId || !receiverId || !blogId) return;

      try {
        const response = await axios.get(`https://localhost:5001/messages`, {
          params: { senderId: userId, receiverId, blogId },
        });

        if (response.data) {
          const validMessages = response.data[0]?.messages || [];
          setMessages(validMessages);
          await AsyncStorage.setItem(`chat_${userId}_${receiverId}_${blogId}`, JSON.stringify(validMessages));
        }
      } catch (error) {
        //console.error('Error fetching messages:', error);
      }
    };

    fetchMessagesFromServer();
  }, [userId, receiverId, blogId]);


  const sendMessage = async () => {
    if (!message.trim() || isSending) {
      return Alert.alert('Error', 'กรุณาพิมพ์ข้อความ');
    }

    setIsSending(true);

    const messageData = {
      senderId: userId,
      senderName: userName,
      receiverId,
      blogId,
      text: message.trim(),
      createdAt: new Date().toISOString(),
      isRead: false,
    };

    try {
      if (socket) {
        socket.emit('sendMessage', messageData);
      } else {
        await axios.post(`https://localhost:5001/send-message`, messageData);
      }

      setMessages((prevMessages) => {
        const updatedMessages = [...prevMessages, messageData];
        AsyncStorage.setItem(`chat_${userId}_${receiverId}_${blogId}`, JSON.stringify(updatedMessages));

        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);

        return updatedMessages;
      });

      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return 'Unknown Time';
    const date = new Date(timestamp);
    return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }

    // Adjust for Thailand timezone (UTC +7)
    const options = {
      timeZone: 'Asia/Bangkok',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };

    const thaiDate = date.toLocaleString('th-TH', options);

    // Return full date in Thai format
    return thaiDate;
  };

  const groupedMessages = messages.reduce((groups, message) => {
    const createdAt = message.createdAt ? message.createdAt.substring(0, 10) : 'Unknown Date';
    if (!groups[createdAt]) {
      groups[createdAt] = { date: createdAt, messages: [] };
    }
    groups[createdAt].messages.push(message);
    return groups;
  }, {});

  const groupedMessagesArray = Object.values(groupedMessages).map(group => {
    return {
      ...group,
      key: `${group.date}-${group.messages.map(msg => msg._id).join('-')}`
    };
  });

  useEffect(() => {
    flatListRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: 'white' }} behavior="padding">
      <FlatList
        ref={flatListRef}
        data={groupedMessagesArray}
        keyExtractor={(item) => `${item.date}-${item.messages[0]?.createdAt}-${item.messages.map(msg => msg._id)}`}
        renderItem={({ item }) => (
          <View key={item.date}>
            <Text style={styles.dateHeader}>{formatDate(item.date)}</Text>
            {item.messages.map((msg, index) => {
              const isUserMessage = String(msg.senderId) === String(userId);

              return (
                <View key={`${msg._id}-${index}`}>
                  <View
                    style={[styles.bubbleContainer, isUserMessage ? { alignSelf: 'flex-end' } : { alignSelf: 'flex-start' }]}>
                    <View style={isUserMessage ? styles.bubbleRight : styles.bubbleLeft}>
                      <Text style={isUserMessage ? styles.balloonTextRight : styles.balloonTextLeft}>
                        {msg.text}
                      </Text>

                      <Text
                        style={[styles.timeText, isUserMessage ? styles.timeTextRight : styles.timeTextLeft]}>
                        {formatTime(msg.createdAt).slice(0, 5)}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
        onContentSizeChange={() => flatListRef.current && flatListRef.current.scrollToEnd({ animated: true })}
        onLayout={() => flatListRef.current && flatListRef.current.scrollToEnd({ animated: true })}
      />

      <View style={styles.inputContainer}>
        <TextInput
          placeholder="ส่งข้อความ..."
          value={message}
          onChangeText={setMessage}
          style={styles.input}
        />
        <Pressable onPress={sendMessage} disabled={!message.trim() || isSending}>
          <Ionicons name="send" size={24} color={message.trim() && !isSending ? "#006FFD" : "#ccc"} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  dateHeader: {
    textAlign: 'center',
    color: 'gray',
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 5,
    marginTop: 10
  },
  bubbleContainer: {
    flexDirection: 'row',
    maxWidth: '80%',
    marginBottom: 5,
  },
  bubbleRight: {
    backgroundColor: '#006FFD',
    borderRadius: 15,
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignSelf: 'flex-end',
    marginRight: 4,
    fontSize: 15
  },
  bubbleLeft: {
    backgroundColor: '#E5E5EA',
    borderRadius: 15,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignSelf: 'flex-start',
    marginLeft: 4,
    fontSize: 15
  },
  balloonTextRight: {
    color: 'white',
    fontSize: 15
  },
  balloonTextLeft: {
    color: 'black',
    fontSize: 15
  },
  timeText: {
    fontSize: 10,
    color: 'gray',
    alignSelf: 'flex-end'
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8
  },
  emojiButton: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    paddingHorizontal: 10,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ccc',
    marginRight: 5,
  },
  timeTextRight: {
    fontSize: 11,
    color: 'white',
    alignSelf: 'flex-end',
    textAlign: 'right',
  },
  timeTextLeft: {
    fontSize: 11,
    color: 'gray',
    alignSelf: 'flex-start',
    textAlign: 'left',
  },
  emptyMessage: {
    textAlign: 'center',
    color: 'gray',
    fontSize: 16,
    marginTop: 20,
  },
});

export default Chat;
