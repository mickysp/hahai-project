import { StatusBar } from "expo-status-bar";
import { StyleSheet, Platform, Linking } from "react-native";
import StackNavigator from "./navigation/StackNavigator";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useEffect, useRef, useState } from "react";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import ipAddress from './screens/ip';
import Toast from './screens/Toast';
import { jwtDecode } from 'jwt-decode';

export default function App() {
  const notificationListener = useRef();
  const responseListener = useRef();
  const [userId, setUserId] = useState('');
  const [notification, setNotification] = useState(null);  // Track notification data
  const [toastMessage, setToastMessage] = useState('');
  const [user, setUser] = useState({});

  useEffect(() => {
    const checkPermissions = async () => {
      const { status } = await Notifications.getPermissionsAsync();
      console.log("Notification permission status:", status);
      if (status !== "granted") {
        alert("ต้องอนุญาตการแจ้งเตือนเพื่อให้สามารถใช้งานฟีเจอร์นี้ได้");
      }
    };
    checkPermissions();
  }, []);

  const openBatteryOptimizationSettings = () => {
    if (Platform.OS === "android") {
      Linking.openSettings();
    }
  };

  const storePushToken = async (userId) => {
    if (!userId) {
      console.error("User ID is missing");
      return;
    }

    try {
      const { data: token } = await Notifications.getExpoPushTokenAsync();
      if (!token) {
        console.error("Failed to obtain Expo Push Token");
        return;
      }

      console.log("Storing push token:", token);
      await axios.post(`http://${ipAddress}:5001/store-token`, { userId, token });
    } catch (error) {
      //console.error("Error storing push token:", error.response?.data || error.message);
    }
  };

  useEffect(() => {
    const checkToken = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        if (token) {
          const decodedToken = jwtDecode(token);
          console.log("Decoded Token:", decodedToken); // Log the decoded token
          setUserId(decodedToken.userId);
          storePushToken(decodedToken.userId);
        } else {
          navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          });
        }
      } catch (error) {
        console.error('Error checking token:', error);
      }
    };
    checkToken();
  }, []);

  useEffect(() => {
    registerForPushNotificationsAsync(); // เรียกฟังก์ชันเพื่อสมัครรับการแจ้งเตือน

    // ตั้งค่าการฟังเมื่อมีการแจ้งเตือนถูกส่งเข้ามา
    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      console.log("Full Notification Object:", JSON.stringify(notification, null, 2));
      console.log("Notification Received - Title:", notification.request.content.title);
      console.log("Notification Received - Body:", notification.request.content.body);

      // เรียกใช้ฟังก์ชัน showNotification เมื่อได้รับการแจ้งเตือน
      setNotification(notification);
    });

    // ตั้งค่าการฟังเมื่อผู้ใช้แตะที่การแจ้งเตือน
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log("User tapped notification:", response);
    });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener.current);
      Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);

  const showNotification = async (notification) => {
    if (notification) {
      console.log("Notification Data:", notification.request.content.data);

      const senderId = notification.request.content.data?.senderId;
      const messageText = notification.request.content.body;

      if (senderId) {
        try {
          // ดึงข้อมูลผู้ส่งจาก backend
          const response = await axios.get(`http://${ipAddress}:5001/users/${senderId}`);
          const sender = response.data;

          // ถ้ามีข้อมูลผู้ส่ง
          const senderName = `${sender.firstname} ${sender.lastname}`;
          console.log("senderName: ", senderName);

          // สร้างข้อความที่มีชื่อผู้ส่ง
          const message = `${senderName}: ${messageText}`;
          setToastMessage(message);
        } catch (error) {
          console.error("Error fetching sender details:", error);
          // ถ้าดึงข้อมูลผู้ส่งไม่ได้ให้แสดงแค่ข้อความจาก notification
          const fallbackMessage = `Unknown Sender sent: ${messageText}`;
          setToastMessage(fallbackMessage);  // ใช้ fallback message
        }
      } else {
        // กรณีไม่มี senderId, แสดงข้อความว่า "Unknown Sender"
        const fallbackMessage = `Unknown Sender sent: ${messageText}`;
        setToastMessage(fallbackMessage);
      }
    }
  };


  const hideToast = () => {
    setToastMessage('');  // ซ่อน Toast เมื่อข้อความเป็นค่าว่าง
  };

  useEffect(() => {
    showNotification(notification); // Show the notification when it's updated
  }, [notification]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="auto" />
      <StackNavigator />

      <Toast message={toastMessage} onHide={() => setToastMessage(null)} />
    </GestureHandlerRootView>
  );
}

// ฟังก์ชันสำหรับการสมัครรับการแจ้งเตือน
const registerForPushNotificationsAsync = async () => {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log("Failed to get push token for push notification!");
      return;
    }

    const { data: token } = await Notifications.getExpoPushTokenAsync();
    if (!token) {
      console.error("Failed to obtain Expo Push Token");
      return;
    }

    console.log("Expo Push Token:", token);
    await AsyncStorage.setItem("expoPushToken", token);

    const userId = await AsyncStorage.getItem('userId');
    if (!userId) {
      //console.error("User ID not found in AsyncStorage");
      return;
    }

    console.log("Retrieved userId from AsyncStorage:", userId);
    await axios.post(`http://${ipAddress}:5001/store-token`, { token, userId });

    if (Platform.OS === "android") {
      Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      });
    }

  } catch (error) {
    //console.error("Error registering push notifications:", error);
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
