import { View, Text, SafeAreaView, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, KeyboardAvoidingView, Image, Animated, Pressable } from 'react-native';
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { jwtDecode } from "jwt-decode";
import ipAddress from './ip';
import { Picker } from '@react-native-picker/picker';
import { firebase } from '../firebase';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { FontAwesome, Ionicons } from '@expo/vector-icons';

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

const FeedbackForm = () => {
    const navigation = useNavigation();
    const [userId, setUserId] = useState("");
    const [user, setUser] = useState({});
    const [category, setCategory] = useState("");
    const [feedbackImage, setFeedbackImage] = useState(null);
    const [description, setDescription] = useState("");
    const [successMessageVisible, setSuccessMessageVisible] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [isAdding, setIsPosting] = useState(false);

    const [fadeAnim] = useState(new Animated.Value(0));
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
            console.log("ข้อมูลผู้ใช้:", response.data);
            const userData = response.data.user;
            setUser(userData);
        } catch (error) {
            console.log("เกิดข้อผิดพลาดในการแสดงข้อมูลผู้ใช้", error);
        }
    };

    const pickImage = async () => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (permissionResult.status !== 'granted') {
            setAlertMessage("อนุญาตให้เข้าถึงคลังรูปภาพของคุณ");
            setAlertVisible(true);
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });

        if (!result.canceled) { // เปลี่ยนจาก cancelled เป็น canceled
            console.log("Selected Image URI:", result.assets[0].uri);
            setFeedbackImage(result.assets[0].uri); // ใช้ assets[0].uri แทน result.uri
        } else {
            setAlertMessage("กรุณาลองใหม่อีกครั้ง");
            setAlertVisible(true);
            return;
        }
    };

    useEffect(() => {
        const requestPermission = async () => {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                alert('Permission to access gallery is required!');
            }
        };

        requestPermission();
    }, []);

    const uploadFile = async (feedbackImage) => {
        try {
            const { uri } = await FileSystem.getInfoAsync(feedbackImage);
            if (!uri) throw new Error('Invalid file URI');

            const response = await fetch(uri);
            const blob = await response.blob();

            const filename = feedbackImage.substring(feedbackImage.lastIndexOf('/') + 1);
            const ref = firebase.storage().ref().child(`feedback_images/${filename}`);
            await ref.put(blob);

            const downloadURL = await ref.getDownloadURL();
            return downloadURL;
        } catch (error) {
            console.error('Error uploading file:', error);
            return null;
        }
    };

    const submitFeedback = async () => {
        if (!category || !description || !userId) {
            setAlertMessage("กรุณากรอกข้อมูลให้ครบถ้วน");
            setAlertVisible(true);
            return;
        }

        setIsPosting(true); // แสดง Loading
        let imageUrl = feedbackImage ? await uploadFile(feedbackImage) : "";

        try {
            const feedbackData = {
                category,
                description,
                user: userId,
                feedback_image: imageUrl,
            };

            const response = await axios.post(`https://localhost:5001/feedback`, feedbackData);
            if (response.status === 201) {
                setSuccessMessage("รายงานของคุณบันทึกสำเร็จแล้ว");
                setSuccessMessageVisible(true);

                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 500,
                    useNativeDriver: true,
                }).start();

                // รีเซ็ตฟอร์มหลังจากแสดงข้อความสำเร็จ
                setTimeout(() => {
                    setCategory("");
                    setDescription("");
                    setFeedbackImage(null);
                    setSuccessMessageVisible(false);
                    setIsPosting(false);

                    // นำผู้ใช้ไปยังหน้า UserProfile
                    setTimeout(() => {
                        navigation.goBack();
                    }, 2000);
                }, 2000);
            }
        } catch (error) {
            //console.error("Error submitting feedback:", error);
            setAlertMessage("กรุณาลองใหม่อีกครั้ง");
            setAlertVisible(true);
            setIsPosting(false);
            return;
        }
    };

    return (
        <SafeAreaView style={styles.container}>

            {successMessageVisible && <View style={styles.darkOverlay} />}

            {successMessageVisible && (
                <View style={styles.wrapper}>
                    <Animated.View style={[styles.successMessage, { opacity: fadeAnim }]}>
                        <Ionicons name="checkmark-circle-outline" size={24} color="#006FFD" />
                        <Text style={styles.successText}>{successMessage}</Text>
                    </Animated.View>
                </View>
            )}

            <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" style={{ backgroundColor: 'white' }}>
                <KeyboardAvoidingView style={{ flex: 1, padding: 20 }}>
                    <View style={{ paddingLeft: 5, paddingRight: 5 }}>
                        <Text style={styles.header}>แจ้งปัญหาการใช้งาน</Text>
                        <Text style={styles.subText}>
                            เพื่อให้การตรวจสอบและการแก้ไขปัญหาดำเนินไปได้อย่างรวดเร็ว กรุณากรอกข้อมูลให้ถูกต้องชัดเจน หรือแนบรูปภาพแคปเจอร์หน้าจอในระหว่างที่เกิดปัญหาเข้ามา
                        </Text>
                    </View>

                    <View>
                        <Text style={styles.label}>หมวดหมู่</Text>
                        <View style={styles.pickerContainer}>
                            <Picker
                                selectedValue={category}
                                onValueChange={(itemValue) => setCategory(itemValue)}
                                style={styles.picker}
                            >
                                <Picker.Item label="เลือกหมวดหมู่" value="" />
                                <Picker.Item label="แจ้งเตือน" value="แจ้งเตือน" />
                                <Picker.Item label="แชท" value="แชท" />
                                <Picker.Item label="อื่นๆ" value="อื่นๆ" />
                            </Picker>
                        </View>
                    </View>

                    <View>
                        <Text style={styles.label}>รายละเอียดปัญหา</Text>
                        <TextInput
                            style={styles.input}
                            multiline
                            numberOfLines={15}
                            placeholder="อธิบายสั้นๆ ถึงสิ่งที่เกิดขึ้นหรือสิ่งที่ขัดข้อง"
                            value={description}
                            onChangeText={setDescription}
                        />
                    </View>

                    <View>
                        <TouchableOpacity onPress={pickImage} style={styles.uploadButton}>
                            <Text style={styles.uploadText}>เลือกภาพ</Text>
                        </TouchableOpacity>

                        {feedbackImage && (
                            <>
                                <Text style={styles.imageSelectedText}>รูปภาพที่เลือก:</Text>
                                <Image source={{ uri: feedbackImage }} style={styles.selectedImage} />
                            </>
                        )}
                    </View>

                    <Text style={{ marginTop: 20, fontSize: 16 }}>
                        - ข้อมูลการแจ้งปัญหารวมถึงข้อมูลส่วนบุคคลของท่านถือเป็นความลับตาม
                        <Text style={{ fontWeight: 'bold', fontSize: 16 }}> กฎและข้อกำหนดการใช้งาน</Text>
                    </Text>
                    <Text style={{ fontSize: 16 }}>
                        การเลือกที่ "ส่ง" ถือว่าท่านรับทราบข้อมูลข้างต้นแล้ว
                    </Text>
                    <Text style={{ fontSize: 16 }}>
                        - ทีมงานจะตรวจสอบและตอบกลับหาท่านโดยเร็วที่สุดหลังจากได้รับการแจ้งเรื่องเข้ามา
                    </Text>
                    <Text style={{ fontSize: 16 }}>- Hahai จะไม่ส่งอีเมลหรือข้อความแชทสอบถามรหัสผ่านหรือรหัสยืนยันใดๆ จากท่านทั้งสิ้น โปรดระวังอย่าแจ้งข้อมูลส่วนบุคคลให้ผู้อื่นทราบ</Text>
                </KeyboardAvoidingView>

                <View style={styles.buttonContainer}>
                    {/* <Pressable onPress={submitFeedback} style={styles.submitButton} disabled={isAdding}>
                        <Text style={styles.submitText}>ส่ง</Text>
                    </Pressable> */}

                    <TouchableOpacity
                        style={[styles.submitButton, isAdding && styles.disabledButton]}
                        onPress={!isAdding ? submitFeedback : null} // ป้องกันการกดซ้ำขณะส่งข้อมูล
                        disabled={isAdding}
                    >
                        <Text style={styles.submitText}>
                            {isAdding ? "กำลังส่ง..." : "ส่ง"}
                        </Text>
                    </TouchableOpacity>

                </View>
            </ScrollView>


        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'white',
        flex: 1,
    },
    loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        zIndex: 1000,
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#fff',
    },
    header: {
        fontSize: 25,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    subText: {
        fontSize: 16,
        color: 'gray',
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: 'bold',
        marginTop: 10,
    },
    input: {
        backgroundColor: '#F3F8FF',
        padding: 10,
        borderRadius: 5,
        borderWidth: 1,
        borderColor: '#ccc',
        marginTop: 5,
        height: 300,
        textAlignVertical: 'top',
        fontSize: 16,
    },
    pickerContainer: {
        backgroundColor: '#F3F8FF',
        borderRadius: 5,
        borderWidth: 1,
        borderColor: '#ccc',
        marginTop: 5,
        fontSize: 16
    },
    picker: {
        height: 53,
        width: '100%',
        fontSize: 16
    },
    uploadButton: {
        backgroundColor: '#6fa3ef',
        padding: 13,
        borderRadius: 5,
        alignItems: 'center',
        marginTop: 16,
        fontSize: 16
    },
    uploadText: {
        color: 'white',
        fontSize: 16,
    },
    imageSelectedText: {
        marginTop: 10,
        color: '#007bff',
        fontSize: 16,
    },
    buttonContainer: {
        justifyContent: 'flex-end',
        alignItems: 'center',
        //position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingBottom: 20,
        paddingLeft: 20,
        paddingRight: 20
    },
    submitButton: {
        backgroundColor: '#007bff',
        padding: 15,
        borderRadius: 5,
        alignItems: 'center',
        marginTop: 20,
        width: '100%',
    },
    submitText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    selectedImage: {
        width: 150,
        height: 150,
        marginTop: 10,
        borderRadius: 5,
    },
    wrapper: {
        position: 'absolute',
        top: 20,
        left: 0,
        right: 0,
        justifyContent: 'center',
        alignItems: 'center',
    },
    successMessage: {
        backgroundColor: 'white',
        padding: 20,
        paddingTop: 20,
        paddingBottom: 20,
        paddingLeft: 20,
        paddingRight: 30,
        borderStyle: 'solid',
        borderWidth: 2,
        borderColor: '#006FFD',
        borderRadius: 10, // มุมโค้ง
        flexDirection: 'row', // ให้ไอคอนและข้อความอยู่ระนาบเดียวกัน
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1001, // ให้ข้อความแจ้งเตือนอยู่บนสุด
        width: '90%', // เพิ่มระยะห่างจากขอบ
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5, // เพิ่มเงาให้กล่อง
        opacity: 0.9,
    },
    successText: {
        fontSize: 18,
        color: '#006FFD',
        textAlign: 'left',
        marginLeft: 10, // เพิ่มระยะห่างจากไอคอน
        flex: 1,
    },
    darkOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)', // ฉากหลังมืด
        zIndex: 1000, // อยู่หลังข้อความแจ้งเตือน
    },
});

export default FeedbackForm;
