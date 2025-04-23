import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from "jwt-decode";
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import ipAddress from './ip';
import Icon from 'react-native-vector-icons/FontAwesome'; // Import FontAwesome Icon

const Notification = () => {
  const [notifications, setNotifications] = useState([]);
  const [userId, setUserId] = useState("");
  const [user, setUser] = useState({});
  const navigation = useNavigation();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = await AsyncStorage.getItem("authToken");
        if (token) {
          const decodedToken = jwtDecode(token);
          console.log("Decoded token:", decodedToken);
          const userId = decodedToken.userId;
          setUserId(userId);
          storePushToken(decodedToken.userId);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUser();
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (userId) {
        fetchUserProfile();
        fetchNotifications(); // Re-fetch notifications when focus is on the screen
      }
    }, [userId])
  );

  const fetchUserProfile = async () => {
    try {
      const response = await axios.get(`https://localhost:5001/profile/${userId}`);
      console.log("User data:", response.data);
      const userData = response.data.user;
      setUser(userData);
    } catch (error) {
      //console.log("Error fetching user profile:", error);
    }
  };

  const fetchNotifications = async () => {
    console.log("Fetching notifications for userId:", userId);
    if (!userId) return;

    try {
      const response = await axios.get(`https://localhost:5001/notifications/${userId}`);
      console.log("Response Data:", response.data);
      if (response.data && Array.isArray(response.data)) {
        setNotifications(response.data);
        if (response.data.length > 0) {
          await AsyncStorage.setItem('notificationCount', response.data.length.toString());
        } else {
          await AsyncStorage.removeItem('notificationCount');
        }
      }
    } catch (error) {
      //console.error("Error fetching notifications:", error);
    }
  };

  // Format relative time for notifications
  const getRelativeTime = (date) => {
    const now = new Date();
    const timeDiff = Math.abs(now - new Date(date));
    const seconds = Math.floor(timeDiff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);
    const months = Math.floor(days / 30);

    if (seconds < 60) return `${seconds} วินาทีที่แล้ว`;
    if (minutes < 60) return `${minutes} นาทีที่แล้ว`;
    if (hours < 24) return `${hours} ชั่วโมงที่แล้ว`;
    if (days < 7) return `${days} วันที่แล้ว`;
    if (weeks < 5) return `${weeks} สัปดาห์ที่แล้ว`;
    return `${months} เดือนที่แล้ว`;
  };

  // Render each notification item with icon on the left side
  const renderNotification = ({ item }) => {
    const { description, user, createdAt } = item;
    console.log("Rendering notification:", item);

    return (
      <View style={styles.notificationCard}>
        <View style={styles.iconContainer}>
          <Icon name="comments" size={60} color="#006FFD" />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.userName}>{`${user.firstname} ${user.lastname}`}</Text>
          <Text style={styles.notificationDescription}>{description}</Text>
          <Text style={styles.notificationTime}>{getRelativeTime(createdAt)}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>การแจ้งเตือน</Text>
      {notifications.length === 0 ? (
        <Text style={styles.noNotifications}>ไม่มีการแจ้งเตือน</Text>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item._id.toString()}
          renderItem={renderNotification}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    paddingTop: 50,
    backgroundColor: '#f8f8f8',
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'left',
  },
  notificationCard: {
    flexDirection: 'row',  // Added flexDirection for horizontal layout
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 12,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },
  iconContainer: {
    justifyContent: 'center', // Center the icon vertically
    alignItems: 'center',
    marginRight: 15, // Add space between icon and text
  },
  textContainer: {
    flex: 1, // This will make sure text takes remaining space
  },
  userName: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 8,
  },
  notificationDescription: {
    fontSize: 16,
    marginBottom: 8,
  },
  notificationTime: {
    fontSize: 12,
    color: '#888',
  },
  noNotifications: {
    textAlign: 'center',
    fontSize: 18,
    color: '#888',
    marginTop: 20,
  },
});

export default Notification;
