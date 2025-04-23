import { StyleSheet, Text, View, ScrollView, ImageBackground, Dimensions, TouchableOpacity, Modal, TouchableWithoutFeedback, Image, TextInput, Alert } from 'react-native';
import React, { useState, useEffect, useCallback } from 'react';
import { MaterialCommunityIcons, SimpleLineIcons, MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from "jwt-decode";
import axios from 'axios';
import ipAddress from './ip';

// รับความสูงของหน้าต่างอุปกรณ์
const windowHeight = Dimensions.get('window').height;

const Bloginfo = () => {
  const route = useRoute(); // เข้าถึงวัตถุ route
  const navigation = useNavigation(); // เข้าถึงวัตถุ navigation
  const [bottomSheetVisible, setBottomSheetVisible] = useState(false); // สถานะสำหรับการแสดงหรือซ่อน bottom sheet
  const [userId, setUserId] = useState("");
  const [user, setUser] = useState({});
  const [receivedStatus, setReceivedStatus] = useState(false); // Track the received status

  const {
    blogId = '', obj_picture = '', object_subtype = '', color = '',
    note = '', date = '', location = '', locationname = '', username = '',
    firstname = '', lastname = '', profileImage = '', ownerId = '',
    userId: postUserId = ''
  } = route.params || {};

  useEffect(() => {
    console.log('Bloginfo route params:', route.params);
  }, [route.params]);

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
      console.log("ข้อมูลผู้ใช้:", response.data);
      const userData = response.data.user;
      setUser(userData);
    } catch (error) {
      console.log("เกิดข้อผิดพลาดในการแสดงข้อมูลผู้ใช้", error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (userId) {
        fetchUserProfile(userId);
      }
    }, [userId])
  );

  const confirmReceipt = async () => {
    try {
      console.log('Navigating to Received with data:', route.params); // ตรวจสอบข้อมูลที่ส่งไป
      navigation.navigate('Received', {
        blogId: route.params.blogId,
        obj_picture: route.params.obj_picture,
        object_subtype: route.params.object_subtype,
        color: route.params.color,
        location: route.params.location,
        locationname: route.params.locationname,
        note: route.params.note,
        date: route.params.date,
        username: route.params.username,
        firstname: route.params.firstname,
        lastname: route.params.lastname,
        profileImage: route.params.profileImage,
      });
    } catch (error) {
      console.error('Error navigating to Received page:', error);
    }
  };
  
  // ฟังก์ชันในการจัดการเมื่อกดปุ่มเมนู
  const handleMenuPress = () => {
    setBottomSheetVisible(true);
  };

  const handleCloseBottomSheet = () => {
    setBottomSheetVisible(false);
  };

  const reportPost = () => {
    handleCloseBottomSheet();

    if (isOwner) {
      Alert.alert("คุณไม่สามารถรายงานกระทู้ของตัวเองได้");
      return;
    }

    const blogId = route.params.blogId;

    navigation.navigate('Report', {
      blogId: blogId,
      obj_picture: route.params.obj_picture,
      object_subtype: route.params.object_subtype,
      color: route.params.color,
      location: route.params.location,
      locationname: route.params.locationname,
      note: route.params.note,
      date: route.params.date,
      username: route.params.username,
      firstname: route.params.firstname,
      lastname: route.params.lastname,
      profileImage: route.params.profileImage,
      userId: route.params.userId,
      blogOwner: {
        id: ownerId,
        username: username,
        firstname: firstname,
        lastname: lastname,
        profileImage: profileImage,
      }
    });
  };

  const contactOwner = () => {
    handleCloseBottomSheet();
    const receiverId = route.params.ownerId;
    const blogId = route.params.blogId;

    if (receiverId) {
      navigation.navigate('Chat', {
        userId: userId, // ส่ง ID ของผู้ใช้ที่เข้าสู่ระบบ
        receiverId: receiverId, // ส่ง ID ของผู้รับ
        senderId: userId, // ส่ง ID ของผู้ส่ง
        receiver: {
          firstname: route.params.firstname, // ส่งชื่อของเจ้าของ
          lastname: route.params.lastname, // ส่งนามสกุลของเจ้าของ
        },
        profileImage: route.params.profileImage, // ส่งภาพโปรไฟล์
        obj_picture: route.params.obj_picture, // ส่งภาพวัตถุ
        object_subtype: route.params.object_subtype, // ส่งประเภทของวัตถุ
        color: route.params.color, // ส่งสี
        location: route.params.location, // ส่งตำแหน่ง
        locationname: route.params.locationname,
        note: route.params.note, // ส่งหมายเหตุ
        blogId: blogId, // ส่ง ID ของบล็อก
        initialChat: true, // ระบุว่านี่เป็นแชทเริ่มต้น
        currentUserFirstname: user.firstname, // ส่งชื่อผู้ใช้ที่เข้าสู่ระบบ
        currentUserLastname: user.lastname, // ส่งนามสกุลผู้ใช้ที่เข้าสู่ระบบ
      });
    } else {
      Alert.alert("ไม่พบข้อมูลผู้ติดต่อ");
    }
  };

  // ตรวจสอบว่าผู้ใช้ปัจจุบันเป็นเจ้าของโพสต์หรือไม่
  const isOwner = userId === route.params.userId;

  useEffect(() => {
    console.log("Current User ID:", userId);
    console.log("Post User ID:", route.params.userId);
    console.log("Is Owner:", isOwner);
  }, [userId, route.params.userId, isOwner]);

  useEffect(() => {
    console.log("route params:", route.params);
  }, [route.params]);

  useEffect(() => {
    console.log('Latitude:', route.params.latitude);
    console.log('Longitude:', route.params.longitude);
  }, [route.params]);

  // เพิ่มฟังก์ชันในการแสดงตำแหน่งที่ตั้ง
  const handleShowLocation = () => {
    if (!route.params.latitude || !route.params.longitude) {
      Alert.alert("ตำแหน่งที่ตั้งไม่พร้อมใช้งาน");
      return;
    }

    // พิมพ์ค่า latitude และ longitude เพื่อตรวจสอบ
    console.log("Latitude:", route.params.latitude);
    console.log("Longitude:", route.params.longitude);

    // ส่งค่าที่จำเป็นไปยังหน้า Mappoint
    navigation.navigate('Mappoint', {
      destinationLocation: {
        latitude: route.params.latitude,
        longitude: route.params.longitude,
        name: route.params.location || 'Unknown Location',
      },
    });
  };

  // แสดงคอมโพเนนต์
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
              {route.params.profileImage ? (
                <Image source={{ uri: route.params.profileImage }} style={styles.profileImage} />
              ) : (
                <MaterialCommunityIcons name="account-circle" size={50} color="#006FFD" />
              )}
              <View style={styles.userInfo}>
                <Text style={styles.username}>{route.params.username || "ไม่พบข้อมูล"}</Text>
                <View style={styles.nameContainer}>
                  <Text style={styles.firstname}>{route.params.firstname || "ไม่พบข้อมูล"}</Text>
                  <Text style={styles.lastname}>{route.params.lastname || "ไม่พบข้อมูล"}</Text>
                </View>
              </View>
            </View>
            <TouchableOpacity onPress={handleMenuPress}>
              <SimpleLineIcons name="menu" size={24} color="black" />
            </TouchableOpacity>
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

      <View style={styles.commentSection}>
        <TouchableOpacity style={styles.commentButton} onPress={handleShowLocation}>
          <Text style={styles.commentButtonText}>แสดงตำแหน่งที่ตั้ง</Text>
        </TouchableOpacity>
      </View>

      <BottomSheetModal
        visible={bottomSheetVisible}
        onClose={handleCloseBottomSheet}
        onReport={reportPost}
        onContactOwner={contactOwner}
        receivedStatus={receivedStatus}
        isOwner={isOwner}
        confirmReceipt={confirmReceipt} // Passing confirmReceipt to BottomSheetModal
      />
    </View>
  );
};

// กำหนดโมดัลสำหรับ bottom sheet เพื่อรายงานหรือการติดต่อเจ้าของ
const BottomSheetModal = ({ visible, onClose, onReport, onContactOwner, isOwner, receivedStatus, confirmReceipt }) => {
  return (
    <Modal transparent={true} animationType="slide" visible={visible} onRequestClose={onClose}>
      <View style={styles.bottomSheet}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.bottomSheetOverlay}></View>
        </TouchableWithoutFeedback>
        <View style={styles.bottomSheetContainer}>
          <View style={styles.bottomSheetContent}>
            {!isOwner && (
              <TouchableOpacity style={styles.bottomSheetItem} onPress={onContactOwner}>
                <Ionicons name="chatbubble-outline" size={20} color="#006FFD" />
                <Text style={styles.bottomSheetText}>ติดต่อกับเจ้าของกระทู้</Text>
              </TouchableOpacity>
            )}

            {!isOwner && (
              <TouchableOpacity style={styles.bottomSheetItem} onPress={onReport}>
                <Ionicons name="flag-outline" size={20} color="red" />
                <Text style={styles.bottomSheetTextCancel}>รายงานกระทู้</Text>
              </TouchableOpacity>
            )}

            {isOwner && (
              <View style={styles.bottomSheetItem}>
                <Ionicons name="person-outline" size={20} color="gray" />
                <Text style={styles.bottomSheetText}>คุณเป็นเจ้าของกระทู้นี้</Text>
              </View>
            )}

            {isOwner && (
              <TouchableOpacity style={styles.bottomSheetItem} onPress={confirmReceipt}>
                <Ionicons name="checkmark-circle" size={20} color="#006FFD" />
                <Text style={styles.bottomSheetText}>ยืนยันการรับสิ่งของ</Text>
              </TouchableOpacity>
            )}
            
          </View>
        </View>
      </View>
    </Modal>
  );
};

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
    fontSize: 15,
  },
  firstname: {
    fontWeight: 'bold',
    marginEnd: 10,
    fontSize: 15,
  },
  lastname: {
    fontWeight: 'bold',
    fontSize: 15,
  },
  bottomSheet: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  bottomSheetOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  bottomSheetContainer: {
    overflow: 'hidden',
    backgroundColor: 'white',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    elevation: 20,
    shadowColor: '#00000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  bottomSheetContent: {
    backgroundColor: 'white',
    padding: 16,
  },
  bottomSheetItem: {
    flexDirection: 'row',
    paddingVertical: 16,
    alignItems: 'center',
  },
  bottomSheetText: {
    fontSize: 16,
    color: 'black',
    textAlign: 'center',
    marginLeft: 10,
  },
  bottomSheetTextCancel: {
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
    marginLeft: 10,
  },
  textdetail: {
    color: 'black',
    marginBottom: 10,
    fontSize: 15,
  },
  commentSection: {
    backgroundColor: 'white',
    borderRadius: 10,
    elevation: 5,
    padding: 10,
  },
  commentButton: {
    backgroundColor: '#006FFD',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  commentButtonText: {
    color: 'white',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default Bloginfo;
