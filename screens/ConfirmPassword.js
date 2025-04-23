import { StyleSheet, Text, View, SafeAreaView, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Modal } from "react-native";
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from "jwt-decode";
import { Ionicons } from '@expo/vector-icons';
import { AntDesign } from '@expo/vector-icons';
import axios from 'axios';
import ipAddress from "./ip";

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

const ConfirmPassword = () => {
  const navigation = useNavigation();
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");

  const toggleShowPassword = () => setShowPassword(!showPassword);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = await AsyncStorage.getItem("authToken");
        if (token) {
          const decodedToken = jwtDecode(token);
          setUserId(decodedToken.userId);
        }
      } catch (error) {
        //console.error("เกิดข้อผิดพลาดในการแสดงข้อมูลผู้ใช้:", error);
      }
    };
    fetchUser();
  }, []);

  const handleConfirmPassword = async () => {
    if (!password) {
      setAlertMessage("กรุณากรอกรหัสผ่านก่อนเข้าสู่ระบบ");
      setAlertVisible(true);
      return;
    }

    try {
      const response = await axios.post(`https://localhost:5001/confirmPassword/${userId}`, { password });
      if (response.data.message === "ยืนยันรหัสผ่านสำเร็จ") {
        navigation.navigate('UpdateEmail');
      }
    } catch (error) {
      setAlertMessage("ข้อมูลไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง");
      setAlertVisible(true);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps={'always'}
        style={{ backgroundColor: 'white', marginHorizontal: 20 }}>
        <KeyboardAvoidingView style={{ flex: 1 }}>
          <View>
            <TouchableOpacity style={{ marginTop: 50 }} onPress={() => navigation.goBack()}>
              <AntDesign name="left" size={24} color="black" />
            </TouchableOpacity>
            <Text style={{ fontSize: 30, fontWeight: 'bold', marginTop: 15 }}>ยืนยันรหัสผ่าน</Text>
            <Text style={{ fontSize: 16, marginTop: 15, marginBottom: 30, color: '#4D4D4D' }}>
              ป้อนรหัสผ่าน Hahai ของคุณเพื่อดำเนินการ
            </Text>
          </View>

          <View>
            <Text style={{ fontSize: 16 }}>รหัสผ่าน<Text style={{ color: 'red' }}>*</Text></Text>
          </View>
          <View style={styles.textinputpass}>
            <TextInput
              style={styles.textInput}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              placeholder="กรอกรหัสผ่าน"
            />
            <TouchableOpacity onPress={toggleShowPassword}>
              <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={24} color={showPassword ? 'black' : "#AFAFB3"} />
            </TouchableOpacity>
          </View>

          <View style={{ flex: 1, justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 30 }}>
            <TouchableOpacity style={styles.btnconfirm} onPress={handleConfirmPassword}>
              <Text style={styles.textconfirm}>ถัดไป</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={{ fontSize: 16, fontWeight: 'bold', textAlign: 'center', textDecorationLine: 'underline' }}>
                ยกเลิก
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </ScrollView>

      <CustomAlert
        visible={alertVisible}
        title="เกิดข้อผิดพลาด"
        message={alertMessage}
        onClose={() => setAlertVisible(false)}
      />
    </SafeAreaView>
  );
};

export default ConfirmPassword;

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
  btnconfirm: {
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
  textInput: {
    fontSize: 16,
    color: 'black',
    flex: 1,
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
