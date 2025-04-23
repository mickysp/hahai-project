import { StyleSheet, Text, View, SafeAreaView, TextInput, TouchableOpacity, Alert, ScrollView, KeyboardAvoidingView, Modal, ActivityIndicator } from "react-native";
import React, { useState, useEffect, useCallback } from "react";
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import { AntDesign } from '@expo/vector-icons';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import ipAddress from "./ip";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { jwtDecode } from "jwt-decode";

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

const NewPassword = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { email } = route.params;
    const [userId, setUserId] = useState("");
    const [user, setUser] = useState({});
    const [newPassword, setNewPassword] = useState("");
    const [newPasswordVerify, setnewPasswordVerify] = useState(false);
    const [newConfirmPassword, setConfirmNewPassword] = useState("");
    const [newConfirmPasswordVerify, setConfirmNewPasswordVerify] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [alertVisible, setAlertVisible] = useState(false);
    const [alertMessage, setAlertMessage] = useState("");

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

    const toggleShowPassword = () => {
        setShowPassword(!showPassword);
    };

    const toggleShowConfirmPassword = () => {
        setShowConfirmPassword(!showConfirmPassword);
    }

    const handleNewPassword = (e) => {
        const passwordVar = e.nativeEvent.text;
        setNewPassword(passwordVar);
        setnewPasswordVerify(false);
        if (/(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}/.test(passwordVar)) {
            setnewPasswordVerify(true); // Only validate, no need to setNewPassword again
        }
    }

    const handleNewConfirmPassword = (e) => {
        const confirmPasswordVar = e.nativeEvent.text;
        setConfirmNewPassword(confirmPasswordVar);
        setConfirmNewPasswordVerify(false);
        if (/(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}/.test(confirmPasswordVar)) {
            setConfirmNewPasswordVerify(true); // Only validate, no need to setConfirmNewPassword again
        }
    }

    const handleSetNewPassword = async () => {
        if (!newPasswordVerify) {
            setAlertMessage("ข้อมูลไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง");
            setAlertVisible(true);
            return;
        }

        if (newPassword !== newConfirmPassword) {
            setAlertMessage("ข้อมูลไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง");
            setAlertVisible(true);
            return;
        }

        setLoading(true); // แสดงหน้ากำลังโหลด

        try {
            const response = await axios.post(`https://hahaiserverapp.onrender.com/newPassword`, { email, password: newPassword });

            if (response.status === 200) {
                setLoading(false); // ปิดโหลด
                setSuccess(true); // แสดงสถานะสำเร็จ

                setTimeout(() => {
                    setSuccess(false);
                    navigation.navigate('Login'); // ไปหน้า Login
                }, 3000); // แสดง success 2 วินาทีแล้วเปลี่ยนหน้า
            } else {
                setLoading(false);
                setAlertMessage("ข้อมูลไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง");
                setAlertVisible(true);
                return;
            }
        } catch (error) {
            setLoading(false);
            //console.error("เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน:", error);
            setAlertMessage("ข้อมูลไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง");
            setAlertVisible(true);
            return;
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                contentContainerStyle={{ flexGrow: 1 }}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps={'always'}
                style={{ backgroundColor: 'white', marginLeft: 30, marginRight: 30 }}>
                <KeyboardAvoidingView>
                    <View>
                        <TouchableOpacity style={{ marginTop: 50 }} onPress={() => navigation.navigate('CheckCodeEmail', { email })}>
                            <AntDesign name="left" size={24} color="black" />
                        </TouchableOpacity>
                        <Text style={{ fontSize: 30, fontWeight: 'bold', marginLeft: 4, width: 350, marginTop: 15 }}>ตั้งรหัสผ่านใหม่</Text>
                    </View>

                    <View style={{ marginTop: 30 }}>
                        <Text style={{ fontSize: 16 }}>รหัสผ่านใหม่
                            <Text style={{ color: 'red' }}>*</Text>
                        </Text>

                        <View style={styles.textinputpass}>
                            <TextInput
                                style={{ fontSize: 16, color: 'black' }}
                                value={newPassword}
                                onChange={e => handleNewPassword(e)}
                                onChangeText={(text) => setNewPassword(text)}
                                secureTextEntry={!showPassword}
                                placeholder="กรอกรหัสผ่าน" />
                            <TouchableOpacity onPress={toggleShowPassword}>
                                <Ionicons
                                    name={showPassword ? 'eye-off' : 'eye'}
                                    size={24}
                                    color={showPassword ? 'black' : "#AFAFB3"} />
                            </TouchableOpacity>
                        </View>
                        {newPassword.length < 1 ? null : newPasswordVerify ? null : (
                            <Text
                                style={{
                                    width: 350,
                                    marginBottom: 10,
                                    color: 'red',
                                }}>
                                ป้อนตัวอักษรพิมพ์ใหญ่ ตัวอักษรพิมพ์เล็ก ตัวเลข อย่างน้อย 1 ตัวและมีอักขระ 6 ตัวขึ้นไป
                            </Text>
                        )}

                        <Text style={{ fontSize: 16 }}>ยืนยันรหัสผ่านใหม่
                            <Text style={{ color: 'red' }}>*</Text>
                        </Text>

                        <View style={styles.textinputpass}>
                            <TextInput
                                style={{ fontSize: 16, color: 'black' }}
                                value={newConfirmPassword}
                                onChange={e => handleNewConfirmPassword(e)}
                                onChangeText={(text) => setConfirmNewPassword(text)}
                                secureTextEntry={!showConfirmPassword}
                                placeholder="กรอกรหัสผ่านยืนยัน" />
                            <TouchableOpacity onPress={toggleShowConfirmPassword}>
                                <Ionicons
                                    name={showConfirmPassword ? 'eye-off' : 'eye'}

                                    size={24}
                                    color={showConfirmPassword ? 'black' : "#AFAFB3"} />
                            </TouchableOpacity>
                        </View>

                        {newConfirmPassword.length < 1 ? null : newConfirmPasswordVerify ? null : (
                            <Text
                                style={{
                                    width: 350,
                                    marginBottom: 10,
                                    color: 'red',
                                }}>
                                ป้อนตัวอักษรพิมพ์ใหญ่ ตัวอักษรพิมพ์เล็ก ตัวเลข อย่างน้อย 1 ตัวและมีอักขระ 6 ตัวขึ้นไป
                            </Text>
                        )}
                    </View>

                    <TouchableOpacity style={styles.containersearch} onPress={handleSetNewPassword}>
                        <Text style={styles.textconfirm}>ยืนยัน</Text>
                    </TouchableOpacity>
                </KeyboardAvoidingView>
            </ScrollView>

            <Modal visible={loading} transparent={true}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#006FFD" />
                    <Text style={styles.loadingText}>กำลังบันทึก...</Text>
                </View>
            </Modal>
            <Modal visible={success} transparent={true}>
                <View style={styles.loadingContainer}>
                    <View style={styles.successBox}>
                        <Ionicons name="checkmark-circle-outline" size={80} color="#006FFD" />
                        <Text style={styles.successText}>บันทึกรหัสผ่านสำเร็จ!</Text>
                    </View>
                </View>
            </Modal>

            <CustomAlert
                visible={alertVisible}
                title="เกิดข้อผิดพลาด"
                message={alertMessage}
                onClose={() => setAlertVisible(false)}
            />
        </SafeAreaView>
    );
};

export default NewPassword;

const styles = StyleSheet.create({
    container: {
        backgroundColor: "white",
        flex: 1,
    },
    textinputpass: {
        flexDirection: 'row',
        alignItems: 'center',
        color: "black",
        marginVertical: 10,
        width: '100%',
        backgroundColor: "#F3F8FF",
        paddingTop: 6,
        paddingBottom: 6,
        paddingLeft: 13,
        paddingRight: 13,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#C5C6CC',
        justifyContent: 'space-between',
    },
    containersearch: {
        marginTop: 25,
        backgroundColor: '#006FFD',
        borderRadius: 13,
        padding: 16,
    },
    textconfirm: {
        textAlign: 'center',
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold'
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: 'white',
    },
    successBox: {
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 10,
        alignItems: 'center',
    },
    successText: {
        marginTop: 10,
        fontSize: 18,
        color: '#006FFD',
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
