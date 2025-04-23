import { StyleSheet, Text, View, SafeAreaView, Image, KeyboardAvoidingView, TextInput, TouchableOpacity, ScrollView, Modal } from "react-native";
import React, { useState, useCallback, useEffect } from "react";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from '@expo/vector-icons';
import ipAddress from "./ip";
import { jwtDecode } from "jwt-decode"; // Fix: Use default import for jwtDecode

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

export default function Login() {
    const navigation = useNavigation();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [alertVisible, setAlertVisible] = useState(false);
    const [alertMessage, setAlertMessage] = useState("");

    const checkToken = async () => {
        try {
            const token = await AsyncStorage.getItem("authToken");
            console.log("Retrieved token from AsyncStorage:", token); // Debugging log

            if (token) {
                // หากมี token ให้ทำการ decode และตรวจสอบ
                const decodedToken = jwtDecode(token);
                console.log("Decoded token:", decodedToken);

                // ตรวจสอบข้อมูลจาก decoded token
                if (decodedToken) {
                    console.log("Token valid. User ID:", decodedToken.userId);
                    // สามารถใช้ userId หรือข้อมูลจาก token เพื่อตรวจสอบสถานะต่างๆ ได้
                }
            } else {
                console.log("No token found in AsyncStorage.");
            }
        } catch (error) {
            //console.error("Error retrieving token:", error);
        }
    };

    // เรียกใช้ checkToken() ใน useEffect หรือหลังจากการทำงานของแอป
    useEffect(() => {
        checkToken();
    }, []);


    // Toggle password visibility
    const toggleShowPassword = () => {
        setShowPassword(!showPassword);
    };

    // Clear input fields
    const clearStates = () => {
        setEmail("");
        setPassword("");
    };

    // Navigate to Forgot Password screen
    const handleForgotPass = () => {
        clearStates();
        navigation.navigate('ForgotPassword');
    };

    // Handle login
    const handleLogin = async () => {
        if (!email) {
            setAlertMessage("กรุณากรอกอีเมลก่อนเข้าสู่ระบบ");
            setAlertVisible(true);
            return;
        }

        if (!password) {
            setAlertMessage("กรุณากรอกรหัสผ่านก่อนเข้าสู่ระบบ");
            setAlertVisible(true);
            return;
        }

        const userData = { email, password };

        try {
            const response = await axios.post(`https://localhost:5001/login`, userData);
            console.log("Login response:", response.data); // Debugging log

            if (response.data.status === 'ok') {
                const token = response.data.token;
                console.log("Token received:", token); // Debugging log

                await AsyncStorage.setItem("authToken", token); // Store token in AsyncStorage

                // ตรวจสอบว่า token ถูกเก็บใน AsyncStorage หรือไม่
                const storedToken = await AsyncStorage.getItem("authToken");
                console.log("Stored token:", storedToken); // Debugging log

                if (storedToken) {
                    console.log("Token is stored successfully!");
                } else {
                    console.log("Failed to store token.");
                }

                navigation.reset({
                    index: 0,
                    routes: [{ name: 'BottomTabs' }],
                });
            } else {
                setAlertMessage(response.data.message || "เกิดข้อผิดพลาด");
                setAlertVisible(true);
            }
        } catch (error) {
            console.error("Login error:", error);
            setAlertMessage(error.response?.data?.message || "เกิดข้อผิดพลาด");
            setAlertVisible(true);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView behavior="padding" style={styles.flexContainer}>
                <ScrollView contentContainerStyle={styles.scrollViewContent}>
                    <View style={styles.containerimage}>
                        <Image style={styles.imagehahai} source={require('../src/image/textopen.png')} />
                    </View>
                    <View style={styles.formContainer}>
                        <Text style={{ fontSize: 16 }}>อีเมล</Text>
                        <TextInput
                            value={email}
                            onChangeText={(text) => setEmail(text)}
                            style={styles.textinput}
                            placeholder="กรอกอีเมล"
                        />

                        <Text style={{ fontSize: 16 }}>รหัสผ่าน</Text>
                        <View style={styles.textinputpass}>
                            <TextInput
                                style={{ fontSize: 16, color: 'black' }}
                                value={password}
                                onChangeText={(text) => setPassword(text)}
                                secureTextEntry={!showPassword}
                                placeholder="กรอกรหัสผ่าน"
                            />
                            <TouchableOpacity onPress={toggleShowPassword}>
                                <Ionicons
                                    name={showPassword ? 'eye-off' : 'eye'}
                                    size={24}
                                    color={showPassword ? 'black' : "#AFAFB3"}
                                />
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity onPress={handleLogin} style={styles.containerlogin}>
                            <Text style={styles.textlogin}>เข้าสู่ระบบ</Text>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={handleForgotPass}>
                            <Text style={styles.textpwd}>ลืมรหัสผ่านใช่หรือไม่</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.bottomContainer}>
                        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                            <Text style={styles.textreg}>หากคุณยังไม่มีบัญชี?
                                <Text style={{ color: '#006FFD', fontWeight: 'bold' }}> ลงทะเบียน</Text>
                            </Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            <CustomAlert
                visible={alertVisible}
                title="เกิดข้อผิดพลาด"
                message={alertMessage}
                onClose={() => setAlertVisible(false)}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "white",
    },
    flexContainer: {
        flex: 1,
    },
    scrollViewContent: {
        flexGrow: 1,
    },
    containerimage: {
        marginTop: 80,
        alignItems: 'center',
        justifyContent: 'center',
    },
    imagehahai: {
        width: 245,
        height: 245,
    },
    formContainer: {
        flex: 1,
        marginLeft: 30,
        marginRight: 30,
    },
    textinput: {
        color: "black",
        marginVertical: 10,
        width: '100%',
        backgroundColor: "#F3F8FF",
        padding: 16,
        borderRadius: 8,
        borderColor: '#C5C6CC',
        borderWidth: 1,
        fontSize: 16,
    },
    containerlogin: {
        marginTop: 25,
        backgroundColor: '#006FFD',
        borderRadius: 13,
        padding: 16,
    },
    textlogin: {
        textAlign: 'center',
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold'
    },
    textpwd: {
        textAlign: 'center',
        marginTop: 25,
        fontSize: 16,
    },
    textreg: {
        textAlign: 'center',
        fontSize: 16,
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
    bottomContainer: {
        justifyContent: 'flex-end',
        alignItems: 'center',
        padding: 50,
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