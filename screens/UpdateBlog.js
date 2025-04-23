import { View, Text, SafeAreaView, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Image, Modal, ActivityIndicator, Pressable } from 'react-native';
import React, { useState, useEffect } from 'react';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from "jwt-decode";
import axios from "axios";
import ipAddress from './ip';
import { Ionicons, FontAwesome } from '@expo/vector-icons';

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

const UpdateBlog = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { blogId, obj_picture, object_subtype, color, note, location, date, } = route.params;

    const [userId, setUserId] = useState("");
    const [subtype, setSubtype] = useState(object_subtype);
    const [colorText, setColor] = useState(color);
    const [noteText, setNote] = useState(note);
    const [locationText, setLocationText] = useState(location);
    const [dateText, setDate] = useState(date);
    const [isLoading, setLocation] = useState(false); // ใช้ isLoading สำหรับการโหลด
    const [isDataChanged, setIsDataChanged] = useState(false); // ตรวจสอบการเปลี่ยนแปลงข้อมูล
    const [alertVisible, setAlertVisible] = useState(false);
    const [alertMessage, setAlertMessage] = useState("");

    const { selectedLocation } = route.params || {};
    const [locationName, setLocationName] = useState(selectedLocation || "");
    const [latitude, setLatitude] = useState(null);
    const [longitude, setLongitude] = useState(null);
    const [locationname, setLocationame] = useState(null);


    const [loading, setIsLoading] = useState(false); // เพิ่มสถานะ loading
    const [success, setSuccess] = useState(false); // เพิ่มสถานะ success

    const [isLocationConfirmed, setIsLocationConfirmed] = useState(false);

    const handleConfirmLocation = () => {
        if (locationName) {
            setIsLocationConfirmed(true);
        } else {
            setAlertMessage("กรุณาเลือกตำแหน่งที่ตั้งก่อนยืนยัน");
            setAlertVisible(true);
            return;
        }
    };

    useEffect(() => {
        if (route.params?.latitude && route.params?.longitude) {
            setLatitude(route.params.latitude);
            setLongitude(route.params.longitude);
            setLocation(route.params.address || "");
            setLocationName(route.params.locationName || "");
            setLocationame(route.params.locationname || "");
        }
    }, [route.params]);


    useEffect(() => {
        console.log("Latitude:", route.params.latitude);
        console.log("Longitude:", route.params.longitude);
        console.log("Location name being sent:", route.params.locationname);
    }, []);


    useEffect(() => {
        const fetchUser = async () => {
            try {
                const token = await AsyncStorage.getItem("authToken");
                if (token) {
                    const decodedToken = jwtDecode(token); // Correct usage of jwtDecode
                    const userId = decodedToken.userId;
                    setUserId(userId);
                }
            } catch (error) {
                console.error("เกิดข้อผิดพลาดในการแสดงข้อมูลผู้ใช้:", error);
            }
        };

        fetchUser();
    }, []);

    useEffect(() => {
        // ตรวจสอบการเปลี่ยนแปลงข้อมูล
        if (
            subtype !== object_subtype ||
            colorText !== color ||
            noteText !== note ||
            locationText !== location ||
            locationName !== selectedLocation // ตรวจสอบตำแหน่งที่ตั้งใหม่
        ) {
            setIsDataChanged(true);
        } else {
            setIsDataChanged(false);
        }
    }, [subtype, colorText, noteText, locationText, locationName]);

    const handleSelectLocation = () => {
        navigation.navigate('Map', {
            onLocationSelect: ({ latitude, longitude, address, locationName }) => {
                setLatitude(latitude);
                setLongitude(longitude);
                setLocation(address);
                setLocationName(locationName);

            },
        });
    };

    const handleUpdate = async () => {
        if (!isLocationConfirmed && locationName) {  // เช็คว่า location ถูกเลือก
            setIsLocationConfirmed(true);  // ตั้งค่าให้เป็นการยืนยันตำแหน่ง
        }

        setIsLoading(true);
        try {
            const token = await AsyncStorage.getItem("authToken");
            const response = await axios.put(
                `https://localhost:5001/updateBlog/${blogId}`,
                {
                    object_subtype: subtype,
                    color: colorText,
                    note: noteText,
                    location: locationText,
                    locationname: locationName, // อัปเดตตำแหน่งที่ตั้งใหม่
                    latitude: latitude,
                    longitude: longitude,
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );
            if (response.status === 200) {
                setSuccess(true);
                setTimeout(() => {
                    setSuccess(false);
                    navigation.goBack();
                }, 2000);
            }
        } catch (error) {
            setAlertMessage("แก้ไขกระทู้ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
            setAlertVisible(true);
            return;
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <Image source={{ uri: obj_picture }} style={styles.blogImage} resizeMode="cover" />

                <Text style={styles.label}>วันที่พบ</Text>
                <TextInput
                    style={styles.input}
                    value={date}
                    onChangeText={setSubtype}
                />

                <Text style={styles.label}>ชนิดสิ่งของ</Text>
                <TextInput
                    style={styles.input}
                    value={subtype}
                    onChangeText={setSubtype}
                    placeholder="Object Subtype"
                />

                <Text style={styles.label}>สี</Text>
                <TextInput
                    style={styles.input}
                    value={colorText}
                    onChangeText={setColor}
                    placeholder="Color"
                />

                <Text style={styles.label}>ตำแหน่งที่ตั้ง</Text>
                <TextInput
                    style={styles.inputlocation}
                    value={locationname}
                    onChangeText={setColor}
                    editable={false}
                />

                {isLocationConfirmed && (
                    <TextInput
                        style={styles.inputlocation}
                        value={locationText}
                        onChangeText={setLocationText}
                        placeholder="แก้ไขรายละเอียดสถานที่"
                    />
                )}

                {/* <TextInput
                    style={[styles.inputlocation, { height: 100 }]} // ปรับให้เป็น textarea
                    value={locationname}
                    //value={`${locationname || ''} ${location || ''}`} // แสดงชื่อสถานที่
                    multiline={true}
                    numberOfLines={4}
                    editable={false} // ไม่ให้แก้ไขค่าโดยตรง
                /> */}

                <Pressable onPress={handleSelectLocation} style={styles.locationButton}>
                    <View style={styles.locationContainer}>
                        <FontAwesome name="map-marker" size={22} color="#006FFD" style={styles.locationIcon} />
                        <Text style={styles.locationText}>
                            {location && locationName ? `${locationName}, ${location}` : 'เลือกตำแหน่งที่ตั้ง'}
                        </Text>
                    </View>
                </Pressable>


                <Text style={styles.label}>หมายเหตุ</Text>
                <TextInput
                    style={styles.input}
                    value={noteText}
                    onChangeText={setNote}
                    placeholder="Note"
                    multiline
                />

                <View style={{}}>
                    <TouchableOpacity
                        onPress={handleUpdate}
                        style={[styles.button, { backgroundColor: isDataChanged ? "#006FFD" : "#B0B0B0" }]} // ปรับสีปุ่ม
                        disabled={!isDataChanged} // ปุ่มจะกดไม่ได้ถ้าไม่มีการเปลี่ยนแปลง
                    >
                        <Text style={styles.buttonText}>ยืนยัน</Text>
                    </TouchableOpacity>
                </View>

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
                        <Text style={styles.successText}>แก้ไขกระทู้สำเร็จ!</Text>
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

export default UpdateBlog;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
        padding: 15,
    },
    scrollContainer: {
        flexGrow: 1,
    },
    blogImage: {
        width: '100%',
        height: 300,
        borderRadius: 10,
        marginBottom: 15,
    },
    input: {
        backgroundColor: 'white',
        borderRadius: 10,
        paddingHorizontal: 15,  // Make sure padding is consistent
        paddingVertical: 18,    // Same vertical padding for all inputs
        marginBottom: 15,
        fontSize: 16,
        borderColor: '#ddd',
        borderWidth: 1,
        color: 'black',
        width: '100%',
    },
    inputlocation: {
        backgroundColor: '#ddd',
        borderRadius: 10,
        paddingHorizontal: 15,  // Make sure padding is consistent
        paddingVertical: 18,    // Same vertical padding for all inputs
        marginBottom: 15,
        fontSize: 16,
        borderColor: '#ddd',
        borderWidth: 1,
        color: 'black',
        width: '100%',
    },
    button: {
        width: '100%',  // ขยายปุ่มให้เต็มความกว้าง
        paddingVertical: 15, // เพิ่มความสูงของปุ่ม
        borderRadius: 10,
        alignItems: 'center',
    },
    buttonText: {
        textAlign: 'center',
        color: 'white',
        fontSize: 15,
        fontWeight: 'bold'
    },
    label: {
        fontSize: 16,
        paddingLeft: 5,
        paddingBottom: 6
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
        marginTop: 20,
        backgroundColor: "#006FFD",
        borderRadius: 9,
        padding: 16,
        marginBottom: 20,
        width: '100%',
    },
    buttonText: {
        textAlign: 'center',
        color: 'white',
        fontSize: 15,
        fontWeight: 'bold'
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
    locationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    locationIcon: {
        marginLeft: 8,
    },
    locationText: {
        marginLeft: 8,
        fontSize: 16,
        color: '#000',
    },
    locationButton: {
        backgroundColor: 'white',
        borderRadius: 10,
        paddingHorizontal: 15,  // Make sure padding is consistent
        paddingVertical: 20,    // Same vertical padding for all inputs
        marginBottom: 15,
        fontSize: 16,
        borderColor: '#ddd',
        borderWidth: 1,
        color: 'black',
        width: '100%',
    },
});