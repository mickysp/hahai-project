import { View, Text, SafeAreaView, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, KeyboardAvoidingView, Modal, ActivityIndicator } from 'react-native';
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from "jwt-decode";
import axios from "axios";
import { Ionicons } from '@expo/vector-icons';
import { AntDesign } from "@expo/vector-icons";
import ipAddress from './ip';

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

const UpdatePassword = () => {
    const navigation = useNavigation();
    const [userId, setUserId] = useState("");
    const [user, setUser] = useState(null);
    const [newPassword, setNewPassword] = useState("");
    const [newPasswordVerify, setNewPasswordVerify] = useState(false);
    const [newConfirmPassword, setConfirmNewPassword] = useState("");
    const [newConfirmPasswordVerify, setConfirmNewPasswordVerify] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [alertVisible, setAlertVisible] = useState(false);
    const [alertMessage, setAlertMessage] = useState("");
    const [loading, setLoading] = useState(false); // เพิ่มสถานะ loading
    const [success, setSuccess] = useState(false); // เพิ่มสถานะ success

    const toggleShowPassword = () => setShowPassword(!showPassword);
    const toggleShowConfirmPassword = () => setShowConfirmPassword(!showConfirmPassword);

    const handleNewPassword = (text) => {
        setNewPassword(text);
        setNewPasswordVerify(/(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}/.test(text));
    }

    const handleNewConfirmPassword = (text) => {
        setConfirmNewPassword(text);
        setConfirmNewPasswordVerify(/(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}/.test(text));
    }

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
            const userData = response.data.user;
            setUser(userData);
        } catch (error) {
            console.log("เกิดข้อผิดพลาดในการแสดงข้อมูลผู้ใช้", error);
        }
    };

    const handleUpdatePassword = async () => {
        if (!newPassword || !newConfirmPassword) {
            setAlertMessage("กรุณากรอกข้อมูลให้ครบทุกช่อง");
            setAlertVisible(true);
            return;
        }

        if (!newPasswordVerify || !newConfirmPasswordVerify) {
            setAlertMessage("ข้อมูลไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง");
            setAlertVisible(true);
            return;
        }

        if (newPassword !== newConfirmPassword) {
            setAlertMessage("ข้อมูลไม่ถูกต้อง กรุณากรอกรหัสผ่านและยืนยันรหัสผ่านให้ตรงกัน");
            setAlertVisible(true);
            return;
        }

        setLoading(true);

        try {
            const response = await axios.put(`https://localhost:5001/updatePassword/${userId}`,
                { password: newPassword }
            );

            if (response.status === 200) {
                setLoading(false);
                setSuccess(true);
                setTimeout(async () => {
                    setSuccess(false);
                    await AsyncStorage.removeItem("authToken");
                    navigation.navigate('Login');
                }, 2000);
            }
        } catch (error) {
            setLoading(false);
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
                style={{ backgroundColor: 'white' }}>
                <KeyboardAvoidingView style={{ flex: 1, marginLeft: 20, marginRight: 20 }}>
                    <View style={{ marginTop: 50 }}>
                        <TouchableOpacity onPress={() => navigation.goBack("UserProfile")}>
                            <AntDesign name="left" size={24} color="black" />
                        </TouchableOpacity>
                        <Text style={{ fontSize: 30, fontWeight: "bold", marginTop: 18, marginBottom: 10, }}>
                            อัพเดตรหัสผ่าน
                        </Text>

                        <Text style={{ fontSize: 16, marginBottom: 30, color: '#4D4D4D' }}>อีเมล {user?.email || "ไม่มีข้อมูล"}</Text>
                        <View>
                            <Text style={{ fontSize: 16, }}>รหัสผ่านใหม่<Text style={{ color: 'red' }}>*</Text></Text>
                        </View>
                        <View style={styles.textinputpass}>
                            <TextInput
                                style={styles.textInput}
                                value={newPassword}
                                onChangeText={handleNewPassword}
                                secureTextEntry={!showPassword}
                                placeholder="กรอกรหัสผ่าน" />
                            <TouchableOpacity onPress={toggleShowPassword}>
                                <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={24} color={showPassword ? 'black' : "#AFAFB3"} />
                            </TouchableOpacity>
                        </View>
                        {!newPasswordVerify && newPassword.length > 0 && (
                            <Text style={styles.errorText}>
                                ป้อนตัวอักษรพิมพ์ใหญ่ ตัวอักษรพิมพ์เล็ก ตัวเลข อย่างน้อย 1 ตัวและมีอักขระ 6 ตัวขึ้นไป
                            </Text>
                        )}

                        <View>
                            <Text style={{ fontSize: 16, }}>ยืนยันรหัสผ่านใหม่<Text style={{ color: 'red' }}>*</Text></Text>
                        </View>

                        <View style={styles.textinputpass}>
                            <TextInput
                                style={styles.textInput}
                                value={newConfirmPassword}
                                onChangeText={handleNewConfirmPassword}
                                secureTextEntry={!showConfirmPassword}
                                placeholder="กรอกรหัสผ่านยืนยัน" />
                            <TouchableOpacity onPress={toggleShowConfirmPassword}>
                                <Ionicons name={showConfirmPassword ? 'eye-off' : 'eye'} size={24} color={showConfirmPassword ? 'black' : "#AFAFB3"} />
                            </TouchableOpacity>
                        </View>
                        {!newConfirmPasswordVerify && newConfirmPassword.length > 0 && (
                            <Text style={styles.errorText}>
                                ป้อนตัวอักษรพิมพ์ใหญ่ ตัวอักษรพิมพ์เล็ก ตัวเลข อย่างน้อย 1 ตัวและมีอักขระ 6 ตัวขึ้นไป
                            </Text>
                        )}
                    </View>

                    <View style={{ flex: 1, justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 30 }}>
                        <TouchableOpacity style={styles.btnconfirm} onPress={handleUpdatePassword}>
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

            <CustomAlert
                visible={alertVisible}
                title="เกิดข้อผิดพลาด"
                message={alertMessage}
                onClose={() => setAlertVisible(false)}
            />

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
                        <Text style={styles.successText}>บันทึกสำเร็จ!</Text>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

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
    textInput: {
        fontSize: 16,
        color: 'black',
    },
    errorText: {
        width: 400,
        marginBottom: 10,
        color: 'red',
    },
    btnconfirm: {
        marginTop: 25,
        backgroundColor: "#006FFD",
        borderRadius: 6,
        padding: 16,
        marginBottom: 20,
        width: '100%',
        alignItems: 'center',
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    loadingText: {
        marginTop: 15,
        fontSize: 18,
        color: '#fff',
    },
    successText: {
        marginTop: 15,
        fontSize: 18,
        color: 'black',
    },
    successContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    successBox: {
        width: 300, // กำหนดความกว้างของกล่อง
        padding: 20, // ระยะห่างด้านใน
        backgroundColor: 'white', // กรอบสี่เหลี่ยมสีขาว
        borderRadius: 10, // มุมโค้ง
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.8,
        shadowRadius: 2,
        elevation: 5, // เพิ่มเงา
    },
});

export default UpdatePassword;
