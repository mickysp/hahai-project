import { StyleSheet, Text, View, SafeAreaView, TextInput, TouchableOpacity, Alert, ScrollView, Modal } from "react-native";
import React, { useState } from "react";
import { useNavigation } from "@react-navigation/native";
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

const ForgotPassword = () => {
    const navigation = useNavigation();
    const [email, setEmail] = useState("");
    const [alertVisible, setAlertVisible] = useState(false);
    const [alertMessage, setAlertMessage] = useState("");

    const handleResetPassword = async () => {
        if (!email) {
            setAlertMessage("กรุณากรอกอีเมลเพื่อตั้งค่ารหัสผ่านใหม่");
            setAlertVisible(true);
            return;
        }

        try {
            const userData = {
                email: email,
            };
            const response = await axios.post(`https://localhost:5001/resetPassword`, userData);

            if (response.data.status === 'ok') {
                //Alert.alert("สำเร็จ", "รหัสรีเซ็ตถูกส่งไปยังอีเมลของคุณแล้ว");
                navigation.navigate('CheckCodeEmail', { email: email });
            } else {
                setAlertMessage(response.data.message);
                setAlertVisible(true);
                return;
            }
        } catch (error) {
            setAlertMessage(error.response?.data?.message || error.message);
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
                    <View>
                        <TouchableOpacity style={{ marginTop: 50 }} onPress={() => navigation.navigate('Login')}>
                            <AntDesign name="left" size={24} color="black" />
                        </TouchableOpacity>
                        <Text style={{ fontSize: 30, fontWeight: 'bold', marginTop: 15 }}>ค้นหาบัญชีของคุณ</Text>
                        <View style={{ marginTop: 15 }}>
                            <Text style={{ fontSize: 16 }}>โปรดป้อนอีเมลของคุณ</Text>
                        </View>
                    </View>

                    <View style={{ marginTop: 30 }}>
                        <Text style={{ fontSize: 16 }}>อีเมล
                            <Text style={{ color: 'red' }}>*</Text>
                        </Text>
                        <TextInput
                            style={styles.textinput}
                            placeholder="ที่อยู่อีเมล"
                            value={email}
                            onChangeText={setEmail} />
                    </View>

                    <TouchableOpacity style={styles.containersearch} onPress={handleResetPassword}>
                        <Text style={styles.textsearch}>ค้นหาบัญชี</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            <CustomAlert
                visible={alertVisible}
                title="เกิดข้อผิดพลาด"
                message={alertMessage}
                onClose={() => setAlertVisible(false)}
            />
        </SafeAreaView>
    )
}

export default ForgotPassword

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
        borderRadius: 9,
        padding: 16,
    },
    textsearch: {
        textAlign: 'center',
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold'
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
