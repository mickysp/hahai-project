import { View, Text, SafeAreaView, StyleSheet, ScrollView, TouchableOpacity, TextInput, KeyboardAvoidingView, Modal } from 'react-native';
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { jwtDecode } from "jwt-decode";
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from "axios";
import { AntDesign } from "@expo/vector-icons";
import ipAddress from './ip';

// CustomAlert Component
const CustomAlert = ({ visible, title, message, onClose }) => (
  <Modal transparent={true} visible={visible} animationType="fade">
    <View style={styles.overlay}>
      <View style={styles.containerpopup}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
        <TouchableOpacity style={styles.button} onPress={onClose}>
          <Text style={styles.buttonText}>ตกลง</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

const UpdateEmail = () => {
  const navigation = useNavigation();
  const [userId, setUserId] = useState("");
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [emailVerify, setEmailVerify] = useState(false);

  // State สำหรับ CustomAlert
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");

  const handleEmail = (e) => {
    const emailVar = e.nativeEvent.text;
    setEmail(emailVar);
    setEmailVerify(false);
    if (/^[\w.%+-]+@[\w.-]+\.[a-zA-Z]{3,}$/.test(emailVar)) {
      setEmailVerify(true);
    }
  };

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

  const fetchUserProfile = async (userId) => {
    try {
      if (!userId) return; // Prevents fetching if userId is undefined

      const response = await axios.get(`https://localhost:5001m/profile/${userId}`);
      console.log("Fetched user profile:", response.data);

      if (response.data && response.data.user) {
        setUser(response.data.user);
      } else {
        console.warn("User data is missing in response");
        setUser({ email: "ไม่มีข้อมูล" }); // Set a fallback value
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      setUser({ email: "ไม่มีข้อมูล" }); // Set a fallback value in case of an error
    }
  };


  const handleUpdateEmail = async () => {
    if (!email) {
      setAlertMessage("กรุณากรอกอีเมล");
      setAlertVisible(true);
      return;
    }

    if (!emailVerify) {
      setAlertMessage("ข้อมูลไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง");
      setAlertVisible(true);
      return;
    }

    try {
      const response = await axios.put(`https://localhost:5001/updateEmail/${userId}`, { email });

      if (response.status === 200) {
        const { email, verificationToken } = response.data;

        if (email && verificationToken) {
          await AsyncStorage.removeItem("authToken");
          navigation.navigate("ChangeEmail", { email: email });
        } else {
          setAlertMessage("ข้อมูลการตอบสนองไม่สมบูรณ์");
          setAlertVisible(true);
        }
      }
    } catch (error) {
      if (error.response && error.response.status === 400) {
        setAlertMessage("ข้อมูลไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง");
      } else {
        setAlertMessage("เกิดข้อผิดพลาดในการอัพเดทอีเมล");
      }
      setAlertVisible(true);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps={'always'}
        style={{ backgroundColor: 'white' }}>
        <KeyboardAvoidingView style={{ flex: 1, marginLeft: 20, marginRight: 20 }}>
          <View style={{ marginTop: 50 }}>
            <TouchableOpacity onPress={() => navigation.goBack("UserProfile")}>
              <AntDesign name="left" size={24} color="black" />
            </TouchableOpacity>
            <Text style={{ fontSize: 30, fontWeight: "bold", marginTop: 18, marginBottom: 18 }}>
              เปลี่ยนอีเมล
            </Text>
            <Text style={{ fontSize: 16, color: '#4D4D4D' }}>
              อีเมลปัจจุบันของคุณคือ <Text style={{ fontWeight: 'bold' }}>{user?.email || "ไม่มีข้อมูล"}</Text>
              คุณต้องการอัพเดตหรือไม่ อีเมลของคุณจะไม่ปรากฏในข้อมูลส่วนตัวแบบสาธารณะบน Hahai
            </Text>

            <Text style={{ fontSize: 16, marginTop: 15, color: '#4D4D4D' }}>
              หากคุณต้องการเปลี่ยนที่อยู่อีเมล การเชื่อมต่อใดๆที่มีอยู่จะถูกลบออก ตรวจสอบบัญชีที่เชื่อมอีกครั้ง
            </Text>
          </View>

          <Text style={{ fontSize: 16, marginTop: 40 }}>อีเมล<Text style={{ color: 'red' }}>*</Text></Text>
          <View style={styles.textinputpass}>
            <TextInput
              style={{ fontSize: 16, color: 'black' }}
              value={email}
              placeholder="ที่อยู่อีเมล"
              onChange={handleEmail}>
            </TextInput>
          </View>
          {email.length < 1 ? null : emailVerify ? null : (
            <Text style={{ width: 500, marginBottom: 10, color: "red" }}>
              ต้องมีเครื่องหมาย @ และโดเมนต้องเป็นอักขระอย่างน้อย 3 ตัว
            </Text>
          )}

          <View style={{ flex: 1, justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 30 }}>
            <TouchableOpacity onPress={handleUpdateEmail} style={styles.containerconfirm}>
              <Text style={styles.textconfirm}>ยืนยัน</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.goBack('UserProfile')}>
              <Text style={{ fontSize: 16, fontWeight: 'bold', textAlign: 'center', textDecorationLine: 'underline' }}>
                ยกเลิก
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </ScrollView>

      {/* CustomAlert */}
      <CustomAlert
        visible={alertVisible}
        title="เกิดข้อผิดพลาด"
        message={alertMessage}
        onClose={() => setAlertVisible(false)}
      />
    </SafeAreaView>
  )
}

export default UpdateEmail

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    flex: 1,
  },
  textinputpass: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: "#F3F8FF",
    paddingVertical: 6,
    paddingHorizontal: 13,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#C5C6CC',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  containerconfirm: {
    backgroundColor: "#006FFD",
    borderRadius: 6,
    padding: 16,
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  textconfirm: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  containerpopup: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#006FFD',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    width: '100%',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
