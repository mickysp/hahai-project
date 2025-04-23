import {
  StyleSheet, Text, View, SafeAreaView, FlatList,
  TouchableOpacity, Alert, Image, ActivityIndicator
} from 'react-native';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';
import ipAddress from './ip';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import io from 'socket.io-client';
import axios from 'axios';

const ChatPeople = () => {
  const [userId, setUserId] = useState('');
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();
  const socket = useRef(null);

  useEffect(() => {
    const checkToken = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        if (token) {
          const decodedToken = jwtDecode(token);
          console.log('Decoded Token:', decodedToken);
          setUserId(decodedToken.userId);
        } else {
          console.warn('Token not found, redirecting to login');
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        }
      } catch (error) {
        console.error('Error checking token:', error);
        Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถตรวจสอบข้อมูลผู้ใช้ได้ กรุณาลองใหม่');
      }
    };
    checkToken();
  }, [navigation]);

  useEffect(() => {
    if (userId) {
      socket.current = io(`http://${ipAddress}:3000`);
      socket.current.emit('join', userId);

      socket.current.on('new_message', () => {
        fetchConversations();
      });

      return () => {
        socket.current.disconnect();
      };
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      if (userId) {
        fetchConversations();
      }
    }, [userId])
  );

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('authToken');
      if (!token) return;

      const response = await axios.get(`https://localhost:5001/conversations`, {
        params: { senderId: userId },
      });

      if (Array.isArray(response.data)) {
        console.log('Conversations fetched:', response.data);
        setConversations(response.data);
      } else {
        console.log('Unexpected response format:', response.data);
        setConversations([]);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return isNaN(date.getTime()) ? '' : date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
  };

  const renderItem = ({ item }) => {
    if (!item || !item.users || !item.blogId) {
      console.warn('Invalid item format:', item);
      return null;
    }

    const chatPartner = item.users.find(user => user._id !== userId) || {};
    const lastMessageSender = item.lastMessage.senderId._id === userId ? 'คุณ' : `${item.lastMessage.senderId.firstname} ${item.lastMessage.senderId.lastname}`;
    const lastMessageTime = formatTime(item.lastMessage.createdAt);
    const maxLength = 30;
    const lastMessageText = item.lastMessage.text.length > maxLength
      ? `${item.lastMessage.text.substring(0, maxLength - lastMessageTime.length - 5)}...`
      : item.lastMessage.text;

    return (
      <TouchableOpacity
        style={styles.userItem}
        onPress={() => {
          if (!chatPartner._id || !item.blogId._id) {
            Alert.alert('ไม่สามารถเปิดแชท', 'ข้อมูลไม่ครบถ้วน');
            return;
          }

          navigation.navigate('Chat', {
            receiverId: chatPartner._id,
            blogId: item.blogId._id,
            receiver: chatPartner,
          });
        }}
      >
        {chatPartner.profileImage ? (
          <Image source={{ uri: chatPartner.profileImage }} style={styles.profileImage} />
        ) : (
          <MaterialCommunityIcons name="account-circle" size={50} color="#D2E3FF" />
        )}

        <View style={styles.userInfo}>
          <Text style={styles.userName}>
            {chatPartner ? `${chatPartner.firstname} ${chatPartner.lastname}` : 'ไม่พบผู้ใช้'}
          </Text>
          <Text style={{ fontSize: 15 }}>
            จากกระทู้ {item.blogId ? `${item.blogId.object_subtype} ${item.blogId.color}` : 'ไม่พบกระทู้'}
          </Text>
          <Text style={{ color: 'gray', fontSize: 15 }} numberOfLines={1} ellipsizeMode="tail">
            {item.lastMessage && item.lastMessage.senderId
              ? `${lastMessageSender}: ${lastMessageText} • ${lastMessageTime}`
              : 'ไม่มีข้อความล่าสุด'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View>
        <Text style={styles.header}>แชท</Text>
      </View>
      {loading ? (
        <ActivityIndicator size="large" color="#4A90E2" style={styles.loader} />
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item._id?.toString() || Math.random().toString()}
          renderItem={renderItem}
          ListEmptyComponent={
            <Text style={styles.emptyMessage}>
              ไม่มีการสนทนา
            </Text>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: {
    fontSize: 30,
    fontWeight: 'bold',
    marginLeft: 20,
    marginTop: 20,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 10,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 17,
    color: 'black',
    fontWeight: 'bold',
  },
  emptyMessage: {
    textAlign: 'center',
    color: 'gray',
    fontSize: 16,
    marginTop: 20,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
  },
  unreadBadge: {
    backgroundColor: 'red',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    position: 'absolute',
    top: 10,
    right: 10,
  },
});

export default ChatPeople;