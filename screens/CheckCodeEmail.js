import { StyleSheet, Text, View, SafeAreaView, TextInput, TouchableOpacity, Alert, ScrollView, Modal } from "react-native";
import React, { useState, useEffect } from "react";
import { useNavigation, useRoute } from "@react-navigation/native";
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

const CheckCodeEmail = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { email } = route.params;
    const [code, setCode] = useState("");
    const [timer, setTimer] = useState(300);
    const [canResend, setCanResend] = useState(false);
    const [alertVisible, setAlertVisible] = useState(false);
    const [alertMessage, setAlertMessage] = useState("");

    useEffect(() => {
        let countdown;
        if (timer > 0) {
            countdown = setInterval(() => {
                setTimer(prevTimer => prevTimer - 1);
            }, 1000);
        } else {
            setCanResend(true);
        }

        return () => clearInterval(countdown);
    }, [timer]);

    const formatTime = (time) => {
        const minutes = Math.floor(time / 60);
        const seconds = time % 60;
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };

    const handleVerifyCode = async () => {
        if (!code) {
            setAlertMessage("กรุณากรอกรหัสรีเซ็ตเพื่อตั้งค่ารหัสผ่านใหม่");
            setAlertVisible(true);
            return;
        }

        try {
            const response = await axios.post(`https://localhost:5001/verifyResetCode`, { email, code });
            if (response.data.status === 'ok') {
                navigation.navigate('NewPassword', { email });
            } else {
                setAlertMessage(response.data.message);
                setAlertVisible(true);
                return;
            }
        } catch (error) {
            //console.error("เกิดข้อผิดพลาดในการตรวจสอบรหัสรีเซ็ต");
            setAlertMessage("ข้อมูลไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง");
            setAlertVisible(true);
            return;
        }
    };

    const handleResendCode = async () => {
        if (!canResend) return;
        try {
            const response = await axios.post(`https://localhost:5001/resetPassword`, { email });
            if (response.status === 200) {
                setTimer(300);
                setCanResend(false);
            } else {
                setAlertMessage("ข้อมูลไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง");
                setAlertVisible(true);
                return;
            }
        } catch (error) {
            //console.error("เกิดข้อผิดพลาดในการส่งรหัสรีเซ็ตใหม่:", error);
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
                style={{ backgroundColor: 'white' }}>
                <View style={{ marginLeft: 30, marginRight: 30 }}>
                    <TouchableOpacity style={{ marginTop: 50 }} onPress={() => navigation.navigate('ForgotPassword')}>
                        <AntDesign name="left" size={24} color="black" />
                    </TouchableOpacity>
                    <Text style={{ fontSize: 30, fontWeight: 'bold', marginLeft: 4, marginTop: 15 }}>กรุณาตรวจสอบอีเมลของคุณ</Text>
                    <View style={{ marginTop: 15 }}>
                        <Text style={{ fontSize: 16 }}>ได้ทำการส่งรหัสไปที่
                            <Text style={{ fontWeight: 'bold' }}> {email}</Text>
                        </Text>
                    </View>

                    <View style={{ marginTop: 30 }}>
                        <Text style={{ fontSize: 16 }}>รหัสรีเซ็ต<Text style={{ color: 'red' }}>*</Text></Text>
                        <TextInput
                            style={styles.textinput}
                            placeholder="กรอกรหัสรีเซ็ต"
                            value={code}
                            onChangeText={setCode}
                        />
                    </View>

                    <TouchableOpacity style={styles.containersearch} onPress={handleVerifyCode}>
                        <Text style={styles.textsearch}>ยืนยันรหัส</Text>
                    </TouchableOpacity>

                    <View style={styles.timerContainer}>
                        <Text
                            style={[styles.timerText, canResend && { fontWeight: 'bold' }]}
                            onPress={canResend ? handleResendCode : null}
                        >
                            ส่งรหัสอีกครั้ง {canResend ? '' : formatTime(timer)}
                        </Text>
                    </View>
                </View>
            </ScrollView>

            <CustomAlert
                visible={alertVisible}
                title="เกิดข้อผิดพลาด"
                message={alertMessage}
                onClose={() => setAlertVisible(false)}
            />
        </SafeAreaView>
    );
}

export default CheckCodeEmail

const styles = StyleSheet.create({
    container: {
        backgroundColor: "white",
        flex: 1,
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
    containersearch: {
        marginTop: 25,
        backgroundColor: '#006FFD',
        borderRadius: 13,
        padding: 16,
    },
    textsearch: {
        textAlign: 'center',
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold'
    },
    timerContainer: {
        marginTop: 20,
    },
    timerText: {
        textAlign: 'center',
        color: 'black',
        fontSize: 16,
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
