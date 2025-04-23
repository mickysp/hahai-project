import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity, Image, FlatList, ActivityIndicator, Modal, Pressable } from 'react-native';
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import { jwtDecode } from "jwt-decode";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons, FontAwesome } from '@expo/vector-icons';
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

const MyBlog = () => {
    const navigation = useNavigation();
    const [userId, setUserId] = useState("");
    const [data, setData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [message, setMessage] = useState("");
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [selectedBlogId, setSelectedBlogId] = useState(null);
    const [user, setUser] = useState(null);
    const [alertVisible, setAlertVisible] = useState(false);
    const [alertMessage, setAlertMessage] = useState("");
    const [loading, setLoading] = useState(false); // เพิ่มสถานะ loading
    const [success, setSuccess] = useState(false); // เพิ่มสถานะ success

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const token = await AsyncStorage.getItem("authToken");
                if (token) {
                    const decodedToken = jwtDecode(token);
                    setUserId(decodedToken.userId);
                }
            } catch (error) {
                console.error("Error fetching user data:", error);
            }
        };

        fetchUser();
    }, []);

    const fetchUserProfile = async () => {
        try {
            const response = await axios.get(`https://localhost:5001/profile/${userId}`);
            const userData = response.data.user;
            setUser(userData);
        } catch (error) {
            console.log("Error fetching user profile", error);
        }
    };

    useFocusEffect(
        useCallback(() => {
            if (userId) {
                fetchUserProfile();
            }
        }, [userId])
    );

    useFocusEffect(
        useCallback(() => {
            if (userId) {
                fetchData();
            }
        }, [userId])
    );

    const fetchData = async () => {
        try {
            const response = await axios.get(`https://hahaiserverapp.onrender.com/userBlogs/${userId}`);
            console.log("Response data:", response.data);
            if (response.data.message) {
                setMessage(response.data.message);
                setData([]);
            } else if (response.data && Array.isArray(response.data)) {
                setData(response.data.reverse());
                setMessage("");
            } else {
                setMessage("Error fetching data");
            }
        } catch (error) {
            //console.log("Error fetching data:", error);
            setMessage("Data not found");
        } finally {
            setIsLoading(false);
        }
    };

    const renderItem = ({ item }) => (
        <Pressable
            style={styles.blogItem}
            onPress={() =>
                navigation.navigate('DetailBlog', {
                    obj_picture: item?.obj_picture,
                    object_subtype: item?.object_subtype,
                    color: item?.color,
                    note: item?.note,
                    date: item?.date,
                    phone: item?.phone,
                    location: item?.location,
                    locationname: item?.locationname,
                    username: item?.user?.username,
                    firstname: item?.user?.firstname,
                    lastname: item?.user?.lastname,
                    profileImage: item?.user?.profileImage,
                    userId: item?.user?._id,
                    ownerId: item?.user?._id,
                    blogId: item?._id,
                    latitude: item?.latitude,
                    longitude: item?.longitude,
                })
            }
        >
            <View style={styles.imageContainer}>
                <Image source={{ uri: item.obj_picture }} style={styles.blogImage} />
            </View>

            <View style={styles.blogContent}>
                <Text style={styles.blogText}>ชนิดสิ่งของ: {item.object_subtype}</Text>
                <Text style={styles.blogText}>สถานที่: {item.locationname} {item.location}</Text>
                <Text style={styles.blogText}>หมายเหตุ: {item.note}</Text>

                <View style={styles.buttonContainer}>
                    <Pressable
                        style={styles.btnEditContainer}
                        onPress={() =>
                            navigation.navigate('UpdateBlog', {
                                blogId: item._id,
                                obj_picture: item?.obj_picture,
                                object_subtype: item.object_subtype,
                                color: item.color,
                                note: item.note,
                                location: item?.location,
                                locationname: item?.locationname,
                                date: item.date,
                                latitude: item?.latitude, // Include latitude
                                longitude: item?.longitude, // Include longitude
                            })
                        }
                    >
                        <Text style={styles.textedit}>แก้ไข</Text>
                    </Pressable>

                    <TouchableOpacity
                        style={styles.btnDeleteContainer}
                        onPress={() => openDeleteModal(item._id)}
                    >
                        <Text style={styles.textdelete}>ลบกระทู้</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Pressable >
    );

    const handleDeleteBlog = async () => {
        setLoading(true); // แสดงหน้าภาพโหลดข้อมูล

        try {
            // ทำการลบกระทู้
            const response = await axios.delete(`https://hahaiserverapp.onrender.com/deleteBlog/${selectedBlogId}`);

            if (response.status === 200) {
                setLoading(false); // หยุดการแสดงหน้าภาพโหลด
                setSuccess(true); // แสดงผลสำเร็จ
                setTimeout(() => {
                    setSuccess(false); // ปิดข้อความสำเร็จ
                    // อัปเดตข้อมูลใน state โดยลบกระทู้ที่ถูกเลือก
                    setData((prevData) => prevData.filter((blog) => blog._id !== selectedBlogId));
                    // ปิด modal ที่แสดงผลการลบ
                    setDeleteModalVisible(false);
                }, 2000); // หน่วงเวลา 2 วินาที
            }
        } catch (error) {
            setLoading(false); // หยุดการแสดงหน้าภาพโหลด
            setAlertMessage("ไม่สามารถลบกระทู้ได้ กรุณาลองใหม่อีกครั้ง");
            setAlertVisible(true); // แสดงข้อความแจ้งเตือน
        }
    };

    const openDeleteModal = (blogId) => {
        setSelectedBlogId(blogId);
        setDeleteModalVisible(true);
    };

    if (isLoading) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0000ff" />
                <Text>Loading...</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {message ? (
                <View style={styles.messageContainer}>
                    <Text>{message}</Text>
                </View>
            ) : (
                <FlatList
                    data={data}
                    renderItem={renderItem}
                    keyExtractor={(item) => item._id.toString()}
                    contentContainerStyle={styles.flatListContainer}
                />
            )}

            <Modal
                visible={deleteModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setDeleteModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <Text style={styles.modalTitle}>ยืนยันการลบ</Text>
                        <Text style={styles.modalMessage}>คุณแน่ใจหรือไม่ว่าต้องการลบกระทู้นี้?</Text>
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={() => setDeleteModalVisible(false)}
                            >
                                <Text style={styles.cancelButtonText}>ยกเลิก</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.confirmButton}
                                onPress={handleDeleteBlog}
                            >
                                <Text style={styles.confirmButtonText}>ยืนยัน</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

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
                        <Text style={styles.successText}>ลบกระทู้สำเร็จ!</Text>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

export default MyBlog;

const styles = StyleSheet.create({
    blogItem: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        marginHorizontal: 15,
        marginVertical: 15,
        height: 230,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        overflow: 'hidden',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
    flatListContainer: {
        paddingTop: 20,
        paddingBottom: 10,
    },
    imageContainer: {
        flex: 0.4,
    },
    blogImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
        borderTopLeftRadius: 12,
        borderBottomLeftRadius: 12,
    },
    blogContent: {
        flex: 0.6,
        padding: 15,
        justifyContent: 'space-evenly',
    },
    blogText: {
        fontSize: 15,
        fontWeight: '500',
        marginBottom: 3,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    btnEditContainer: {
        backgroundColor: '#006FFD',
        borderRadius: 5,
        paddingVertical: 8,
        paddingHorizontal: 15,
        alignItems: 'center',
        flex: 1,
        marginRight: 5,
    },
    btnDeleteContainer: {
        backgroundColor: '#F44336',
        borderRadius: 5,
        paddingVertical: 8,
        paddingHorizontal: 15,
        alignItems: 'center',
        flex: 1,
        marginLeft: 5,
    },
    textedit: {
        color: '#FFFFFF',
        fontSize: 14,
    },
    textdelete: {
        color: '#FFFFFF',
        fontSize: 14,
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
