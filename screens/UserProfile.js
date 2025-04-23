import { StyleSheet, Text, View, SafeAreaView, Pressable, TouchableOpacity, Image, ScrollView } from 'react-native';
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { jwtDecode } from "jwt-decode";
import { Ionicons } from '@expo/vector-icons';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import ipAddress from './ip';

function UserProfile() {
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
        }
      } catch (error) {
        console.error("เกิดข้อผิดพลาดในการแสดงข้อมูลผู้ใช้:", error);
      }
    };

    fetchUser();
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (userId) {
        fetchUserProfile();
      }
    }, [userId])
  );

  const fetchUserProfile = async () => {
    try {
      const response = await axios.get(`https://localhost:5001/profile/${userId}`);
      console.log("ข้อมูลผู้ใช้:", response.data);
      const userData = response.data.user;
      setUser(userData);
    } catch (error) {
      console.log("เกิดข้อผิดพลาดในการแสดงข้อมูลผู้ใช้", error);
    }
  };

  const handleLogout = async () => {
    try {
      // ดึง token จาก AsyncStorage
      const token = await AsyncStorage.getItem("authToken");
      if (!token) {
        console.error("Token not found");
        return;
      }

      // ถอดรหัส token เพื่อดึง userId
      const decodedToken = jwtDecode(token);
      const userId = decodedToken.userId;

      // ส่งคำขอ logout ไปยังเซิร์ฟเวอร์
      await axios.post(`https://localhost:5001/logout`, { userId });

      // ลบ token ออกจาก AsyncStorage
      await AsyncStorage.removeItem("authToken");

      console.log("Auth token cleared, user logged out");

      // รีเซ็ตการนำทางไปยังหน้า Login
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (error) {
      console.error("เกิดข้อผิดพลาดในการออกจากระบบ:", error);
    }
  };


  return (
    <SafeAreaView>
      <View style={styles.topcontainer}>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingLeft: 18 }}>
          <TouchableOpacity
            onPress={() => navigation.goBack('Home')}
            style={{ paddingRight: 20 }}>
            <Ionicons name="arrow-back-outline" size={28} color="white" />
          </TouchableOpacity>
          <Text style={{ color: 'white', fontSize: 24, fontWeight: 'bold' }}>โปรไฟล์</Text>
        </View>

        <View style={styles.profileContainer}>
          {user.profileImage ? (
            <Image source={{ uri: user.profileImage }} style={styles.profileImage} />
          ) : (
            <MaterialCommunityIcons name="account-circle" size={70} color="#D2E3FF" />
          )}
          <View style={styles.userInfo}>
            <View style={styles.nameContainer}>
              <Text style={styles.firstname}>{user.firstname || "ไม่มีข้อมูล"}</Text>
              <Text style={styles.lastname}>{user.lastname || "ไม่มีข้อมูล"}</Text>
            </View>
            <Text style={styles.id}>ID: {user._id || "ไม่มีข้อมูล"}</Text>
          </View>
        </View>
      </View>


      <ScrollView>
        <View>
          <TouchableOpacity style={{ fontSize: 16, marginRight: 20 }} onPress={() => navigation.navigate('UpdateProfile')}>
            <View style={styles.text}>
              <View style={styles.next}>
                <Text style={{ marginTop: 20, fontSize: 16 }}> จัดการโปรไฟล์ </Text>
              </View>
              <View>
                <View style={{ marginTop: 20, fontSize: 16 }}>
                  <MaterialIcons name="navigate-next" size={26} color="#8F9098" />
                </View>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={{ marginTop: 0, fontSize: 16, marginRight: 20 }} onPress={() => navigation.navigate('MyBlog')}>
            <View style={styles.text}>
              <View style={styles.next}>
                <Text style={{ marginTop: 5, fontSize: 16 }}> กระทู้ของฉัน </Text>
              </View>
              <View>
                <View style={{ marginTop: 5, fontSize: 16 }}>
                  <MaterialIcons name="navigate-next" size={26} color="#8F9098" />
                </View>
              </View>
            </View>
          </TouchableOpacity>


          <TouchableOpacity style={{ marginTop: 0, fontSize: 16, marginRight: 20 }} onPress={() => navigation.navigate('FeedbackForm')}>
            <View style={styles.text}>
              <View style={styles.next}>
                <Text style={{ marginTop: 5, fontSize: 16 }}> ศูนย์ความช่วยเหลือ </Text>
              </View>
              <View>
                <View style={{ marginTop: 5, fontSize: 16 }}>
                  <MaterialIcons name="navigate-next" size={26} color="#8F9098" />
                </View>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={{ marginTop: 0, fontSize: 16, marginRight: 20 }} onPress={() => navigation.navigate('ConfirmPassword')}>
            <View style={styles.text}>
              <View style={styles.next}>
                <Text style={{ marginTop: 5, fontSize: 16 }}> เปลี่ยนอีเมล </Text>
              </View>
              <View>
                <View style={{ marginTop: 5, fontSize: 16 }}>
                  <MaterialIcons name="navigate-next" size={26} color="#8F9098" />
                </View>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={{ marginTop: 0, fontSize: 16, marginRight: 20 }} onPress={() => navigation.navigate('UpdatePassword')}>
            <View style={styles.text}>
              <View style={styles.next}>
                <Text style={{ marginTop: 5, fontSize: 16 }}> เปลี่ยนรหัสผ่าน </Text>
              </View>
              <View>
                <View style={{ marginTop: 5, fontSize: 16 }}>
                  <MaterialIcons name="navigate-next" size={26} color="#8F9098" />
                </View>
              </View>
            </View>
          </TouchableOpacity>

          {/* 
        <View style={styles.text}>
          <View style={styles.next}>
            <Text style={{ fontSize: 16 }}>
              คู่มือผู้ใช้
            </Text>
          </View>
          <View>
            <TouchableOpacity style={{ paddingRight: 20 }}>
              <MaterialIcons name="navigate-next" size={26} color="#8F9098" />
            </TouchableOpacity>
          </View>
        </View> */}

          <Pressable onPress={handleLogout}>
            <View style={styles.logout}>
              <Text style={styles.textlogout}>ออกจากระบบ</Text>
            </View>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView >
  );
}

const styles = StyleSheet.create({
  topcontainer: {
    backgroundColor: '#006FFD',
    paddingTop: 70,
    borderBottomEndRadius: 40,
    borderBottomLeftRadius: 40,
    paddingBottom: 10,
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 35,
    marginBottom: 35,
    paddingLeft: 18,
  },
  profileImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  userInfo: {
    marginLeft: 10,
  },
  nameContainer: {
    flexDirection: 'row',
  },
  id: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 3,
    fontWeight: '400'
  },
  firstname: {
    marginEnd: 10,
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: 'bold'
  },
  lastname: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: 'bold'
  },
  text: {
    flexDirection: 'row',
    paddingLeft: 10,
    borderBottomColor: '#D4D6DD',
    borderBottomWidth: 1,
    paddingBottom: 15,
    borderTopColor: '#D4D6DD',
    paddingTop: 20,
    marginLeft: 18,
    marginRight: 18,
    justifyContent: 'space-between',
  },
  logout: {
    backgroundColor: '#C3C4C7',
    marginLeft: 18,
    marginRight: 18,
    marginTop: 40,
    padding: 18,
    borderRadius: 10,
  },
  textlogout: {
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 14,
    color: 'white',
  },
});

export default UserProfile;