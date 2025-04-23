import { StyleSheet, Text, View, ScrollView, ImageBackground, Dimensions, TouchableOpacity, Modal, TouchableWithoutFeedback, Image, TextInput, Alert } from 'react-native';
import React, { useState, useEffect, useCallback } from 'react';
import { MaterialCommunityIcons, SimpleLineIcons, MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from "jwt-decode";
import axios from 'axios';
import ipAddress from './ip';

const windowHeight = Dimensions.get('window').height;

const DetailBlog = () => {
  const route = useRoute(); // เข้าถึงวัตถุ route
  const navigation = useNavigation(); // เข้าถึงวัตถุ navigation
  const [bottomSheetVisible, setBottomSheetVisible] = useState(false); // สถานะสำหรับการแสดงหรือซ่อน bottom sheet
  const [userId, setUserId] = useState("");
  const [user, setUser] = useState({});

  const { username, firstname, lastname, profileImage } = route.params || {};

  useEffect(() => {
    const checkTokenAndFetchUser = async () => {
      try {
        const token = await AsyncStorage.getItem("authToken");
        if (token) {
          const decodedToken = jwtDecode(token);
          console.log("Decoded token:", decodedToken);
          const userId = decodedToken.userId;
          setUserId(userId);
          fetchUserProfile(userId);
        } else {
          navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          });
        }
      } catch (error) {
        console.error("Error checking token:", error);
      }
    };

    checkTokenAndFetchUser();
  }, []);

  const fetchUserProfile = async (userId) => {
    try {
      const response = await axios.get(`https://localhost:5001/profile/${userId}`);
      const userData = response.data.user;
      setUser(userData);
    } catch (error) {
      console.log("Error fetching user profile", error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (userId) {
        fetchUserProfile(userId);
      }
    }, [userId])
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#F5F5F5' }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>
        <ImageBackground
          style={{
            resizeMode: "cover",
            justifyContent: 'flex-start',
            alignItems: 'center',
            height: windowHeight * 0.4
          }}
          source={{ uri: route.params.obj_picture }}>
          <View style={{ marginTop: 40, marginLeft: 12, position: 'absolute', top: 0, left: 15 }}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <MaterialIcons name="arrow-back-ios" size={40} color="black" />
            </TouchableOpacity>
          </View>
        </ImageBackground>
        <View style={{ backgroundColor: 'white', borderRadius: 10, margin: 20, elevation: 5, padding: 25 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={styles.Profile}>
              {profileImage || user.profileImage ? (
                <Image source={{ uri: profileImage || user.profileImage }} style={styles.profileImage} />
              ) : (
                <MaterialCommunityIcons name="account-circle" size={50} color="#006FFD" />
              )}
              <View style={styles.userInfo}>
                <Text style={styles.username}>{username || user.username || "ไม่พบข้อมูล"}</Text>
                <View style={styles.nameContainer}>
                  <Text style={styles.firstname}>{firstname || user.firstname || "ไม่พบข้อมูล"}</Text>
                  <Text style={styles.lastname}>{lastname || user.lastname || "ไม่พบข้อมูล"}</Text>
                </View>
              </View>
            </View>
          </View>
          <View style={{ marginTop: 15 }}>
            <Text style={styles.textdetail}>วันที่พบ: {route.params.date}</Text>
            <Text style={styles.textdetail}>สิ่งของ: {route.params.object_subtype}</Text>
            <Text style={styles.textdetail}>สี: {route.params.color}</Text>
            <Text style={styles.textdetail}>ตำแหน่งที่ตั้ง: {route.params.locationname || "ไม่พบข้อมูล"}, {route.params.location || "ไม่พบข้อมูล"}</Text>
            <Text style={styles.textdetail}>เบอร์โทรศัพท์: {route.params.phone}</Text>
            <Text style={styles.textdetail}>หมายเหตุ: {route.params.note}</Text>
          </View>

        </View>
      </ScrollView>
    </View>
  )
}

export default DetailBlog

const styles = StyleSheet.create({
  Profile: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  userInfo: {
    marginLeft: 8,
  },
  nameContainer: {
    flexDirection: 'row',
  },
  username: {
    color: 'gray',
    fontWeight: '400',
    fontSize: 16,
  },
  firstname: {
    fontWeight: 'bold',
    marginEnd: 10,
    fontSize: 16,
  },
  lastname: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  textdetail: {
    fontSize: 16,
    marginBottom: 8,
  },
});
