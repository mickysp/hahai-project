import { StyleSheet, Text, View, TextInput, Button, Image, SafeAreaView, ScrollView, Pressable, Modal, TouchableOpacity, ActivityIndicator } from 'react-native';
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigation, useFocusEffect } from '@react-navigation/native'; import axios from 'axios';
import ipAddress from "./ip";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from "jwt-decode";
import { Ionicons } from '@expo/vector-icons';

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

const Received = ({ route }) => {
    const [isAdding, setIsPosting] = useState(false);
    const [phone, setPhone] = useState('');
    const [contact, setContact] = useState('');
    const [successMessageVisible, setSuccessMessageVisible] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [alertVisible, setAlertVisible] = useState(false);
    const [alertMessage, setAlertMessage] = useState("");
    const [userId, setUserId] = useState("");
    const [user, setUser] = useState({});
    const navigation = useNavigation();
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        const checkToken = async () => {
            try {
                const token = await AsyncStorage.getItem('authToken');
                if (token) {
                    const decodedToken = jwtDecode(token);
                    setUserId(decodedToken.userId);
                } else {
                    navigation.reset({
                        index: 0,
                        routes: [{ name: 'Login' }],
                    });
                }
            } catch (error) {
                console.error('Error checking token:', error);
            }
        };

        checkToken();
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
            const response = await axios.get(`https://localhost:5001m/profile/${userId}`);
            const userData = response.data.user;
            setUser(userData);
        } catch (error) {
            console.log('Error fetching user profile', error);
        }
    };

    const {
        blogId, obj_picture, object_subtype, color, location, locationname,
        note, date, username, firstname, lastname, profileImage
    } = route.params || {}; // รับข้อมูลที่ส่งมาจาก Bloginfo


    const handleConfirm = async () => {
        if (!firstName || !lastName || !phone) {
            setAlertMessage('กรุณากรอกข้อมูลให้ครบถ้วน');
            setAlertVisible(true);
            return;
        }

        if (!userId) {
            setAlertMessage('ไม่พบข้อมูลผู้ใช้');
            setAlertVisible(true);
            return;
        }

        setIsPosting(true);

        try {
            // Update the blog status
            const blogResponse = await axios.put(`https://localhost:5001/blogs/${blogId}/update-status`, {
                receivedStatus: true,
            });

            console.log('Blog status updated:', blogResponse.data);

            // Prepare the data for the /received endpoint
            const receivedData = {
                blog: blogId,  // Send the blog ID
                receiverFirstName: firstName,
                receiverLastName: lastName,
                receiverPhone: phone,
                receiverContact: contact,
                user: userId,  // Ensure userId is sent as 'user' for consistency
            };

            console.log('Data sent to server:', receivedData);

            // Send the data to the /received endpoint
            const receivedResponse = await axios.post(`https://localhost:5001/received`, receivedData);
            console.log('Received Response:', receivedResponse.data);

            // Set the success message
            setSuccessMessage('ยืนยันการรับสิ่งของสำเร็จ');
            setSuccessMessageVisible(true);
            setIsPosting(false);

            setTimeout(() => {
                setSuccessMessageVisible(false);
                navigation.navigate('Home'); // Navigate to the Home screen
            }, 3000); // 3 seconds delay
        } catch (error) {
            console.error('Error confirming receipt:', error);
            setAlertMessage('เกิดข้อผิดพลาด กรุณาลองใหม่');
            setAlertVisible(true);
            setIsPosting(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            {isAdding && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color="#006FFD" />
                    <Text style={styles.loadingText}>กำลังบันทึก...</Text>
                </View>
            )}
            <ScrollView>
                <View>
                    <View style={styles.blogSection}>
                        {/* Show blog details */}
                        {obj_picture && (
                            <Image source={{ uri: obj_picture }} style={styles.image} />
                        )}
                        <Text style={styles.text}>สิ่งของ: {object_subtype}</Text>
                        <Text style={styles.text}>สี: {color}</Text>
                        <Text style={styles.text}>ตำแหน่งที่ตั้ง: {locationname || 'ไม่พบข้อมูล'}</Text>
                        <Text style={styles.text}>หมายเหตุ: {note || 'ไม่มีหมายเหตุ'}</Text>
                        <Text style={styles.text}>วันที่พบ: {date || 'ไม่พบข้อมูล'}</Text>
                        <Text style={styles.text}>ผู้ลงกระทู้: {firstname}  {lastname}</Text>
                    </View>

                    {/* Form to input user info */}
                    <View style={styles.formSection}>
                        <Text style={styles.formTitle}>ผู้ใช้ที่รับสิ่งของ</Text>
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>ชื่อ</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="ชื่อ"
                                value={firstName}
                                onChangeText={setFirstName}
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>นามสกุล</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="นามสกุล"
                                value={lastName}
                                onChangeText={setLastName}
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>เบอร์โทรศัพท์</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="011-999-9999"
                                value={phone}
                                onChangeText={setPhone}
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>ช่องทางการติดต่ออื่นๆ</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Facebook, Line, Email, Instagram"
                                value={contact}
                                onChangeText={setContact}
                            />
                        </View>
                    </View>

                    <Pressable onPress={handleConfirm} style={styles.containeradd} disabled={isAdding}>
                        <Text style={styles.textadd}>ยืนยันการรับสิ่งของ</Text>
                    </Pressable>

                </View>
            </ScrollView>

            <CustomAlert
                visible={alertVisible}
                title="เกิดข้อผิดพลาด"
                message={alertMessage}
                onClose={() => setAlertVisible(false)}
            />

            {/* Loading Modal */}
            <Modal visible={loading} transparent={true} animationType="fade">
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#006FFD" />
                    <Text style={styles.loadingText}>กำลังบันทึก...</Text>
                </View>
            </Modal>

            {/* Success Modal */}
            <Modal visible={successMessageVisible} transparent={true} animationType="slide">
                <View style={styles.loadingContainer}>
                    <View style={styles.successBox}>
                        <Ionicons name="checkmark-circle-outline" size={80} color="#006FFD" />
                        <Text style={styles.successText}>{successMessage}</Text>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#F8F8F8',  // พื้นหลังที่อ่อนกว่า
    },
    blogSection: {
        backgroundColor: '#FFF',  // พื้นหลังของส่วนกระทู้
        padding: 15,
        borderRadius: 10,
        marginBottom: 20,
        elevation: 3,  // เพิ่มเงาเพื่อให้เด่นขึ้น
    },
    formSection: {
        backgroundColor: '#FFF',  // พื้นหลังของฟอร์ม
        padding: 15,
        borderRadius: 10,
        elevation: 3,  // เพิ่มเงาเพื่อให้เด่นขึ้น
    },
    formTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center',
    },
    image: {
        width: '100%',
        height: 300,
        borderRadius: 10,
        marginBottom: 20,
    },
    text: {
        fontSize: 16,
        marginBottom: 12,
    },
    inputContainer: {
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#C5C6CC',
        padding: 12,
        borderRadius: 10,
        fontSize: 16,
        backgroundColor: '#FFF',
    },
    buttonContainer: {
        marginTop: 20,
    },
    containeradd: {
        marginTop: 25,
        backgroundColor: '#006FFD',
        borderRadius: 12,
        padding: 15.5,
        marginBottom: 20,
    },
    textadd: {
        color: 'white',
        textAlign: 'center',
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
        marginTop: 10,
        fontSize: 16,
        fontWeight: 'bold',
        color: 'white',
    },
    successBox: {
        backgroundColor: 'white',
        padding: 30,
        borderRadius: 15,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    successText: {
        marginTop: 10,
        fontSize: 18,
        fontWeight: 'bold',
        color: '#006FFD',
    },
});

export default Received;
