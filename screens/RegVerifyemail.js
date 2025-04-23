import React, { useEffect, useState } from 'react';
import { Alert, SafeAreaView, ScrollView, Text, TouchableOpacity, View, Image, StyleSheet } from 'react-native';
import axios from 'axios';
import { useNavigation, useRoute } from '@react-navigation/native';
import AntDesign from 'react-native-vector-icons/AntDesign';
import ipAddress from './ip';

const RegVerifyemail = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { email, userData } = route.params;

    const [timer, setTimer] = useState(300);
    const [canResend, setCanResend] = useState(false);

    useEffect(() => {
        const checkVerificationStatus = async () => {
            try {
                const response = await axios.get(`https://localhost:5001/verify-status/${email}`);
                if (response.status === 200) {
                    navigation.navigate('SuccessRegister');
                }
            } catch (error) {
                //console.log("ตรวจสอบสถานะการยืนยันอีเมลล้มเหลว", error);
            }
        };

        checkVerificationStatus();

        const intervalId = setInterval(checkVerificationStatus, 5000);

        return () => clearInterval(intervalId);
    }, [email, navigation]);

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

    const handleResendEmail = async () => {
        if (canResend) {
            try {
                const response = await axios.post(`https://localhost:5001/resend`, { email, userData });
                console.log(response.data.message);
                setCanResend(false);
                setTimer(300);
            } catch (error) {
                console.log("เกิดข้อผิดพลาดในการส่งอีเมลยืนยันใหม่", error);
                Alert.alert(
                    "เกิดข้อผิดพลาด", "เกิดข้อผิดพลาดในการส่งอีเมลยืนยันใหม่ กรุณาลองอีกครั้ง",
                    [{ text: "ตกลง", onPress: () => console.log("OK Pressed") }],
                    { cancelable: false }
                );
            }
        } else {
            Alert.alert("กรุณารอ", "กรุณารอ 5 นาที ก่อนกดส่งใหม่");
        }
    };

    const formatTime = (time) => {
        const minutes = Math.floor(time / 60);
        const seconds = time % 60;
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                contentContainerStyle={{ flexGrow: 1 }}
                showsVerticalScrollIndicator={false}
                style={{ backgroundColor: 'white' }}>
                <View>
                    <TouchableOpacity style={{ marginTop: 50, marginLeft: 20 }} onPress={() => navigation.navigate('Register')}>
                        <AntDesign name="left" size={24} color="black" />
                    </TouchableOpacity>
                </View>
                <View style={styles.imagecontainer}>
                    <Image style={styles.image} source={require('../src/image/email_verify.png')} />
                </View>
                <View style={{ marginTop: 12 }}>
                    <Text style={{ fontWeight: 'bold', fontSize: 28, textAlign: 'center' }}>ตรวจสอบอีเมลของคุณ</Text>
                </View>
                <View style={{ paddingRight: 61, paddingLeft: 61, marginTop: 10, marginBottom: 10 }}>
                    <Text style={{ fontSize: 16, textAlign: 'center' }}>
                        เราได้ส่งลิงก์การยืนยันไปยังอีเมลของคุณ กรุณาตรวจสอบและคลิกที่ลิงก์เพื่อยืนยันอีเมลของคุณ
                    </Text>
                </View>
                <View style={styles.timerContainer}>
                    <Text style={styles.timerText}>{canResend ? '' : `ส่งอีกครั้ง ${formatTime(timer)}`}</Text>
                </View>

                <View style={styles.done}>
                    <TouchableOpacity
                        style={{ ...styles.button, backgroundColor: canResend ? '#006FFD' : '#B0C4DE' }}
                        onPress={() => navigation.navigate('Register')}
                        disabled={!canResend}
                    >
                        <Text style={styles.text}>กลับสู่หน้าลงทะเบียน</Text>
                    </TouchableOpacity>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
};

export default RegVerifyemail;

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    imagecontainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 175
    },
    image: {
        width: 225,
        height: 160,
    },
    timerContainer: {
        alignItems: 'center',
        marginTop: 70,
    },
    timerText: {
        fontSize: 16,
        color: '#808080',
    },
    done: {
        marginTop: 160,
        marginLeft: 25,
        marginRight: 25,
    },
    button: {
        paddingTop: 15,
        paddingBottom: 15,
        borderRadius: 12,
        fontWeight: 'bold',
        textAlign: 'center',
        justifyContent: 'center',
        alignItems: 'center'
    },
    text: {
        fontSize: 15,
        color: 'white',
    }
});
