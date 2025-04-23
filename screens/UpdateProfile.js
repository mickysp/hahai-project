import { View, Text, SafeAreaView, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Image, Modal, TouchableWithoutFeedback, ActivityIndicator } from 'react-native';
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from "jwt-decode";
import axios from "axios";
import { firebase } from "../firebase";
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import Ionicons from 'react-native-vector-icons/Ionicons';
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

const UpdateProfile = () => {
    const navigation = useNavigation();
    const [userId, setUserId] = useState("");
    const [user, setUser] = useState({});
    const [profileImage, setProfileImage] = useState("");
    const [username, setUsername] = useState("");
    const [firstname, setFirstname] = useState("");
    const [lastname, setLastname] = useState("");
    const [bottomSheetVisible, setBottomSheetVisible] = useState(false);
    const [loading, setLoading] = useState(false); // เพิ่มสถานะ loading
    const [success, setSuccess] = useState(false); // เพิ่มสถานะ success
    const [isDataChanged, setIsDataChanged] = useState(false); // ติดตามสถานะการเปลี่ยนแปลงข้อมูล

    const [alertVisible, setAlertVisible] = useState(false);
    const [alertMessage, setAlertMessage] = useState("");

    const [deleteModalVisible, setDeleteModalVisible] = useState(false);

    const handleMenuPress = () => setBottomSheetVisible(true);
    const handleCloseBottomSheet = () => setBottomSheetVisible(false);

    const deleteProfile = async () => {
        setProfileImage("");
        handleCloseBottomSheet();
    };

    const imageOptions = () => {
        handleCloseBottomSheet();
        pickImage();
    };

    const openDeleteModal = () => {
        setDeleteModalVisible(true); // This ensures the modal is visible when you press delete
    };

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const token = await AsyncStorage.getItem("authToken");
                if (token) {
                    const decodedToken = jwtDecode(token);
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
            setProfileImage(userData.profileImage);
            setUsername(userData.username);
            setFirstname(userData.firstname);
            setLastname(userData.lastname);
        } catch (error) {
            console.log("เกิดข้อผิดพลาดในการแสดงข้อมูลผู้ใช้", error);
        }
    };

    // ตรวจสอบว่ามีการเปลี่ยนแปลงข้อมูลหรือไม่
    const handleInputChange = (setter, value) => {
        setter(value);
        setIsDataChanged(true); // เปลี่ยนสถานะเมื่อมีการแก้ไขข้อมูล
    };

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 1,
        });

        if (!result.canceled) {
            setProfileImage(result.assets[0].uri);
            setIsDataChanged(true);
        }
    };

    const uploadFile = async () => {
        try {
            if (!profileImage) return null;

            const { uri } = await FileSystem.getInfoAsync(profileImage);

            if (!uri) {
                throw new Error("Invalid file URI");
            }

            const blob = await new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.onload = () => resolve(xhr.response);
                xhr.onerror = (e) => reject(new TypeError("Network request failed"));
                xhr.responseType = "blob";
                xhr.open("GET", uri, true);
                xhr.send(null);
            });

            const filename = profileImage.substring(profileImage.lastIndexOf("/") + 1);
            const ref = firebase.storage().ref().child(filename);
            await ref.put(blob);

            const downloadURL = await ref.getDownloadURL();
            return downloadURL;
        } catch (error) {
            console.log("เกิดข้อผิดพลาด:", error);
        }
    };



    const handleUpdateProfile = async () => {
        try {
            setLoading(true);
            const profileImageUrl = profileImage ? await uploadFile() : "";

            const response = await axios.put(`https://localhost:5001/updateProfile/${userId}`, {
                username,
                firstname,
                lastname,
                profileImage: profileImageUrl
            });

            if (response.status === 200) {
                console.log("อัพเดตโปรไฟล์สำเร็จ");
                setSuccess(true);
                setTimeout(() => {
                    navigation.goBack();
                }, 2000);
            }
        } catch (error) {
            //console.log("เกิดข้อผิดพลาดในการอัพเดตข้อมูลผู้ใช้", error);
            setAlertMessage("แก้ไขข้อมูลผู้ใช้ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
            setAlertVisible(true);
            return;
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        try {
            const response = await axios.post(`https://localhost:5001/deleteUser/${userId}`);
            if (response.status === 200) {
                console.log("ลบข้อมูลผู้ใช้สำเร็จแล้ว");
                await AsyncStorage.removeItem("authToken");
                navigation.navigate('Login');
            }
        } catch (error) {
            console.log("เกิดข้อผิดพลาด ลบข้อมูลผู้ใช้ไม่สำเร็จ", error);
            setAlertMessage("ลบข้อมูลผู้ใช้ไม่สำเร็จ กรุณาลองอีกครั้ง");
            setAlertVisible(true);
        } finally {
            setDeleteModalVisible(false); // Close delete modal
        }
    };
    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                contentContainerStyle={{ flexGrow: 1 }}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps={'always'}
                style={{ backgroundColor: 'white', marginLeft: 20, marginRight: 20 }}>
                <View style={styles.imagecontainer}>
                    {profileImage ? (
                        <>
                            <Image style={styles.image} source={{ uri: profileImage }} />
                            <View style={styles.imageOptions}>
                                <TouchableOpacity onPress={handleMenuPress}>
                                    <Text style={styles.imageOptionText}>จัดการรูปภาพ</Text>
                                </TouchableOpacity>
                            </View>
                        </>
                    ) : (
                        <TouchableOpacity onPress={pickImage}>
                            <Image style={styles.image} source={require('../src/image/updateprofile.png')} />
                        </TouchableOpacity>
                    )}
                </View>
                <View>
                    <Text style={styles.username}>{user.username || "ไม่มีข้อมูล"}</Text>
                </View>
                <View style={styles.name}>
                    <Text style={styles.firstname}>{user.firstname || "ไม่มีข้อมูล"}</Text>
                    <Text style={styles.lastname}>{user.lastname || "ไม่มีข้อมูล"}</Text>
                </View>
                <View>
                    <Text style={styles.id}>ID: {user._id || "ไม่มีข้อมูล"}</Text>
                </View>

                <View style={{ marginTop: 20 }}>
                    <View>
                        <Text style={{ fontSize: 16 }}>ชื่อผู้ใช้</Text>
                    </View>
                    <View style={styles.textinput}>
                        <TextInput
                            style={{ fontSize: 16, color: 'black' }}
                            placeholder="กรอกชื่อผู้ใช้"
                            value={username}
                            onChangeText={(text) => handleInputChange(setUsername, text, user.username)}
                        />
                    </View>
                    <View>
                        <View>
                            <Text style={{ fontSize: 16 }}>ชื่อ</Text>
                        </View>
                        <View style={styles.textinput}>
                            <TextInput
                                style={{ fontSize: 16, color: 'black' }}
                                placeholder="กรอกชื่อ"
                                value={firstname}
                                onChangeText={(text) => handleInputChange(setFirstname, text, user.firstname)}
                            />
                        </View>
                    </View>
                    <View>
                        <View>
                            <Text style={{ fontSize: 16 }}>นามสกุล</Text>
                        </View>
                        <View style={styles.textinput}>
                            <TextInput
                                style={{ fontSize: 16, color: 'black' }}
                                placeholder="กรอกนามสกุล"
                                value={lastname}
                                onChangeText={(text) => handleInputChange(setLastname, text, user.lastname)}
                            />
                        </View>
                    </View>
                </View>

                <View style={{ flex: 1, justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 30 }}>
                    <TouchableOpacity
                        onPress={handleUpdateProfile}
                        style={[styles.btnconfirm, { backgroundColor: isDataChanged ? "#006FFD" : "#B0B0B0" }]} // ปรับสีปุ่ม
                        disabled={!isDataChanged} // ปุ่มจะกดไม่ได้ถ้าไม่มีการเปลี่ยนแปลง
                    >
                        <Text style={styles.textconfirm}>ยืนยัน</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={openDeleteModal}>
                        <Text style={styles.detele}>ลบบัญชี?</Text>
                    </TouchableOpacity>
                </View>
                <BottomSheetModal visible={bottomSheetVisible} onClose={handleCloseBottomSheet} imageOptions={imageOptions} deleteProfile={deleteProfile} />
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
                        <Text style={styles.successText}>บันทึกสำเร็จ!</Text>
                    </View>
                </View>
            </Modal>

            <CustomAlert
                visible={alertVisible}
                title="เกิดข้อผิดพลาด"
                message={alertMessage}
                onClose={() => setAlertVisible(false)}
            />

            <Modal
                visible={deleteModalVisible} // Modal visibility controlled by state
                transparent={true}
                animationType="fade"
                onRequestClose={() => setDeleteModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <Text style={styles.modalTitle}>ยืนยันการลบบัญชี</Text>
                        <Text style={styles.modalMessage}>คุณแน่ใจหรือไม่ว่าต้องการลบบัญชีนี้?</Text>
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={() => setDeleteModalVisible(false)}
                            >
                                <Text style={styles.cancelButtonText}>ยกเลิก</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.confirmButton}
                                onPress={handleDeleteAccount} // Trigger account deletion
                            >
                                <Text style={styles.confirmButtonText}>ยืนยัน</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

        </SafeAreaView>
    );
};

const BottomSheetModal = ({ visible, onClose, imageOptions, deleteProfile }) => {
    return (
        <Modal
            transparent={true}
            animationType="slide"
            visible={visible}
            onRequestClose={onClose}>
            <View style={styles.bottomSheet}>
                <TouchableWithoutFeedback onPress={onClose}>
                    <View style={styles.bottomSheetOverlay}></View>
                </TouchableWithoutFeedback>
                <View style={styles.bottomSheetContainer}>
                    <View style={styles.bottomSheetContent}>
                        <TouchableOpacity style={styles.bottomSheetItem} onPress={imageOptions}>
                            <Ionicons name="image-outline" size={20} color="#006FFD" />
                            <Text style={styles.bottomSheetText}>เลือกรูปภาพใหม่</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.bottomSheetItem} onPress={deleteProfile}>
                            <Ionicons name="trash" size={20} color="red" />
                            <Text style={styles.bottomSheetTextCancel}>ลบรูปภาพ</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

export default UpdateProfile;

const styles = StyleSheet.create({
    container: {
        backgroundColor: "white",
        flex: 1
    },
    textinput: {
        color: "black",
        marginVertical: 10,
        width: '100%',
        backgroundColor: "#F3F8FF",
        padding: 7,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#C5C6CC',
    },
    btnconfirm: {
        marginTop: 25,
        backgroundColor: "#006FFD",
        borderRadius: 9,
        padding: 16,
        marginBottom: 20,
        width: '100%',
    },
    textconfirm: {
        textAlign: 'center',
        color: 'white',
        fontSize: 15,
        fontWeight: 'bold'
    },
    detele: {
        color: '#6F6F6F',
        fontWeight: '500',
        textAlign: 'center',
        fontSize: 14,
        textDecorationLine: 'underline'
    },
    name: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    username: {
        fontWeight: 'bold',
        textAlign: 'center',
        fontSize: 18,
    },
    firstname: {
        marginEnd: 10,
        fontSize: 18,
        fontWeight: 'bold',
    },
    lastname: {
        fontSize: 18,
        fontWeight: '900',
    },
    id: {
        marginTop: 2,
        marginBottom: 12,
        textAlign: 'center',
        color: '#71727A',
    },
    imagecontainer: {
        marginTop: 45,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 5,
    },
    image: {
        width: 126,
        height: 126,
        borderRadius: 63,
    },
    imageOptions: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 10,
    },
    imageOptionText: {
        marginHorizontal: 10,
        color: '#006FFD',
        fontWeight: 'bold',
    },
    bottomSheet: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    bottomSheetOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
    },
    bottomSheetContainer: {
        overflow: 'hidden',
        backgroundColor: 'white',
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
        elevation: 20,
        shadowColor: '#00000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
    },
    bottomSheetContent: {
        backgroundColor: 'white',
        padding: 16,
    },
    bottomSheetItem: {
        flexDirection: 'row',
        paddingVertical: 16,
        alignItems: 'center',
    },
    bottomSheetText: {
        fontSize: 16,
        color: 'black',
        textAlign: 'center',
        marginLeft: 10,
    },
    bottomSheetTextCancel: {
        fontSize: 16,
        color: 'red',
        textAlign: 'center',
        marginLeft: 10,
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
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',  // Dark transparent background
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        width: '80%',
        padding: 20,
        backgroundColor: '#fff',
        borderRadius: 10,
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    modalMessage: {
        fontSize: 16,
        marginBottom: 20,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
    },
    cancelButton: {
        flex: 1,
        marginRight: 10,
        paddingVertical: 10,
        backgroundColor: '#ccc',
        borderRadius: 5,
        alignItems: 'center',
    },
    confirmButton: {
        flex: 1,
        marginLeft: 10,
        paddingVertical: 10,
        backgroundColor: '#006FFD',
        borderRadius: 5,
        alignItems: 'center',
    },
    cancelButtonText: {
        color: '#000',
        fontSize: 16,
    },
    confirmButtonText: {
        color: '#fff',
        fontSize: 16,
    },
});