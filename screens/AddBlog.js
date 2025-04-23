import { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity, TextInput, ScrollView, Image, Dimensions, ActivityIndicator, Modal, Pressable, Animated } from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';
import { firebase } from '../firebase';
import * as FileSystem from 'expo-file-system';
import DateTimePicker from '@react-native-community/datetimepicker';
import ipAddress from './ip';

const thaiMonths = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม',
    'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม',
    'พฤศจิกายน', 'ธันวาคม'
];

const formatToThaiDate = (date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = thaiMonths[date.getMonth()]; // Get Thai month name
    const year = date.getFullYear() + 543; // Convert to Buddhist calendar
    return `${day} ${month} ${year}`;
};

const AddBlog = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { selectedAddress } = route.params || {};
    const { selectedLocation } = route.params || {};
    const [userId, setUserId] = useState("");
    const [user, setUser] = useState({});
    const [obj_picture, setPicture] = useState(""); // Variable to hold image URI
    const [object_subtype, setObjsubtype] = useState("");
    const [color, setColor] = useState("");
    const [location, setLocation] = useState(selectedAddress || "");
    const [note, setNote] = useState("");
    const [phone, setPhone] = useState("");
    const [date, setDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [isAdding, setIsPosting] = useState(false);
    const { imageUri, labels, labelcolor } = route.params || {};
    const [modalVisible, setModalVisible] = useState(false);
    const [errorModalVisible, setErrorModalVisible] = useState(false);

    const [latitude, setLatitude] = useState(null);
    const [longitude, setLongitude] = useState(null);
    const [locationname, setLocationName] = useState(selectedLocation || "");

    // State for success message popup
    const [successMessageVisible, setSuccessMessageVisible] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    // Animation for success message
    const [fadeAnim] = useState(new Animated.Value(0));  // Initial opacity 0


    useEffect(() => {
        const checkTokenAndFetchUser = async () => {
            try {
                const token = await AsyncStorage.getItem("authToken");
                if (token) {
                    const decodedToken = jwtDecode(token);
                    const userId = decodedToken.userId;
                    setUserId(userId);
                    fetchUserProfile(userId);
                } else {
                    navigation.reset({
                        index: 0,
                        routes: [{ name: 'Login' }],
                    });
                }
            } catch (error) {
                console.error("Error checking token:", error);
            }
        };

        checkTokenAndFetchUser();
    }, []);

    const fetchUserProfile = async (userId) => {
        try {
            const response = await axios.get(`https://localhost:5001/profile/${userId}`);
            const userData = response.data.user;
            setUser(userData);
        } catch (error) {
            console.log("เกิดข้อผิดพลาดในการแสดงข้อมูลผู้ใช้", error);
        }
    };

    useFocusEffect(
        useCallback(() => {
            if (userId) {
                fetchUserProfile(userId);
            }
        }, [userId])
    );

    useEffect(() => {
        setPicture(imageUri || '');
    }, [imageUri]);

    useEffect(() => {
        if (labels && labels.length > 0) {
            const sortedLabels = labels.sort((a, b) => b.score - a.score).slice(0, 1);
            const labelDescriptions = sortedLabels.map(label => label.description).join(',');

            setObjsubtype(labelDescriptions === 'อื่นๆ' ? 'อื่นๆ' : labelDescriptions);
        } else {
            setObjsubtype('อื่นๆ');
        }
    }, [labels]);

    useEffect(() => {
        if (labelcolor && labelcolor.length > 0) {
            const highestColor = labelcolor.reduce((max, color) => (color.score > max.score ? color : max), { score: 0 });
            setColor(highestColor.description);
        }
    }, [labelcolor]);

    useEffect(() => {
        if (route.params?.latitude && route.params?.longitude) {
            console.log("Latitude:", route.params.latitude);
            console.log("Longitude:", route.params.longitude);

            setLocationName(route.params.locationName || "");
            setLocation(route.params.address || "");
            setLatitude(route.params.latitude); // เก็บค่า latitude
            setLongitude(route.params.longitude); // เก็บค่า longitude
        } else {
            console.log("Location data is missing");
        }
    }, [route.params]);

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

    const createBlog = async () => {
        setIsPosting(true);

        if (phone && !/^\d{10}$/.test(phone)) {
            setErrorModalVisible(true);
            setIsPosting(false);
            return;
        }

        try {
            const uploadedUrl = await uploadFile(obj_picture);
            const blogData = {
                obj_picture: uploadedUrl,
                object_subtype: object_subtype,
                color: color,
                location: location, // ส่งที่อยู่ในรูปแบบข้อความ
                locationname: locationname,
                latitude: latitude, // ส่ง latitude
                longitude: longitude, // ส่ง longitude
                note: note,
                date: formatToThaiDate(date),
                phone: phone || "",
                userId: userId,
            };

            const response = await axios.post(`https://hahaiserverapp.onrender.com/create`, blogData);
            if (response.status === 201) {
                // Show success message
                setSuccessMessage('กระทู้ของคุณบันทึกสำเร็จแล้ว');
                setSuccessMessageVisible(true);

                // Fade in the success message
                Animated.timing(fadeAnim, {
                    toValue: 1,  // Fade to opacity 1
                    duration: 500,  // Duration for the fade-in effect
                    useNativeDriver: true,
                }).start();

                // Redirect to Home after the success message disappears
                setTimeout(() => {
                    navigation.navigate('Home');
                }, 1000);
            }
        } catch (error) {
            console.log('Error creating blog', error);
        } finally {
            setIsPosting(false);
        }
    };

    const uploadFile = async (obj_picture) => {
        try {
            const { uri } = await FileSystem.getInfoAsync(obj_picture);
            if (!uri) throw new Error('Invalid file URI');

            const blob = await new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.onload = () => resolve(xhr.response);
                xhr.onerror = () => reject(new TypeError('Network request failed'));
                xhr.responseType = 'blob';
                xhr.open('GET', uri, true);
                xhr.send(null);
            });

            const filename = obj_picture.substring(obj_picture.lastIndexOf('/') + 1);
            const ref = firebase.storage().ref().child(filename);
            await ref.put(blob);
            return await ref.getDownloadURL();
        } catch (error) {
            console.log('Error:', error);
        }
    };

    const onDateChange = (event, selectedDate) => {
        if (selectedDate) {
            setDate(selectedDate);
        }
        setShowDatePicker(false);
    };

    const showDatePickerModal = () => {
        setShowDatePicker(true);
    };

    const clearImage = () => {
        setPicture("");
        setModalVisible(false);
    };

    return (
        <SafeAreaView style={styles.container}>
            {isAdding && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color="#006FFD" />
                    <Text style={styles.loadingText}>กำลังบันทึก...</Text>
                </View>
            )}

            {/* Dark Overlay when successMessageVisible is true */}
            {successMessageVisible && <View style={styles.darkOverlay} />}

            {/* Success Message Popup */}
            {successMessageVisible && (
                <View style={styles.wrapper}>
                    <Animated.View style={[styles.successMessage, { opacity: fadeAnim }]}>
                        <Ionicons name="checkmark-circle-outline" size={24} color="#006FFD" />
                        <Text style={styles.successText}>{successMessage}</Text>
                    </Animated.View>
                </View>
            )}

            <ScrollView>
                <View style={styles.select}>
                    <TouchableOpacity onPress={() => setModalVisible(true)}>
                        <View style={styles.imageContainer}>
                            {obj_picture && obj_picture !== '' ? (
                                <Image source={{ uri: obj_picture }} style={styles.image} />
                            ) : (
                                <View style={styles.cameraIconContainer}>
                                    <TouchableOpacity onPress={() => navigation.navigate('AddCamera')}>
                                        <FontAwesome name="camera" size={30} color="#A6D4FF" />
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                    </TouchableOpacity>
                </View>

                <Pressable onPress={showDatePickerModal}>
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>วันที่พบ</Text>
                        <Text style={styles.textinputdate}>
                            {formatToThaiDate(date)}
                        </Text>
                    </View>
                </Pressable>

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>ชนิดสิ่งของ</Text>
                    <TextInput value={object_subtype} onChangeText={setObjsubtype} style={styles.textinput} />
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>สี</Text>
                    <TextInput value={color} onChangeText={setColor} style={styles.textinput} />
                </View>

                {showDatePicker && (
                    <DateTimePicker
                        value={date}
                        mode="date"
                        display="default"
                        onChange={onDateChange}
                    />
                )}

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>ตำแหน่งที่ตั้ง</Text>
                </View>

                <Pressable onPress={handleSelectLocation} style={styles.locationButton}>
                    <View style={styles.locationContainer}>
                        <FontAwesome name="map-marker" size={22} color="#006FFD" style={styles.locationIcon} />
                        <Text style={styles.locationText}>
                            {location && locationname ? `${locationname}, ${location}` : 'เลือกตำแหน่งที่ตั้ง'}
                        </Text>
                    </View>
                </Pressable>

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>หมายเหตุ</Text>
                    <TextInput value={note} onChangeText={setNote} multiline={true} numberOfLines={10} style={styles.textarea} />
                </View>

                <Pressable onPress={createBlog} style={styles.containeradd} disabled={isAdding}>
                    <Text style={styles.textadd}>ยืนยัน</Text>
                </Pressable>
            </ScrollView>

            <Modal visible={modalVisible} transparent={true} onRequestClose={() => setModalVisible(false)}>
                <View style={styles.modalContainer}>
                    {obj_picture ? (
                        <>
                            <Image source={{ uri: obj_picture }} style={styles.fullImage} />
                            <TouchableOpacity onPress={clearImage} style={styles.clearImageButton}>
                                <Text style={styles.clearImageText}>ล้างรูปภาพ</Text>
                            </TouchableOpacity>
                        </>
                    ) : (
                        <Text style={styles.clearImageText}>ไม่มีรูปภาพ</Text>
                    )}
                    <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
                        <Ionicons name="close" size={40} color="white" />
                    </TouchableOpacity>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

export default AddBlog;

const { width, height } = Dimensions.get('window');

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
    select: {
        backgroundColor: '#EAF2FF',
        width: width * 0.9,
        height: height * 0.27,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 30,
        marginLeft: 23,
        marginRight: 23,
        borderRadius: 15,
        marginBottom: 18
    },
    imageContainer: {
        width: width * 0.9,
        height: height * 0.27,
        borderRadius: 20,
        overflow: 'hidden',
    },
    image: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    clearImageButton: {
        borderRadius: 5,
        alignItems: 'center',
    },
    clearImageText: {
        color: 'white',
        fontWeight: 'bold',
    },
    textinput: {
        color: 'black',
        marginVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        paddingBottom: 12.5,
        paddingTop: 12.5,
        borderColor: '#C5C6CC',
        fontSize: 16,
        paddingLeft: 10,
    },
    textarea: {
        height: 150,
        textAlignVertical: 'top',
        borderRadius: 8,
        marginVertical: 8,
        borderWidth: 1,
        borderColor: '#C5C6CC',
        color: 'black',
        fontSize: 16,
        paddingLeft: 10,
        paddingBottom: 12.5,
        paddingTop: 12.5,
    },
    inputContainer: {
        marginLeft: 23,
        marginRight: 23,
    },
    label: {
        fontSize: 16,
    },
    containeradd: {
        marginTop: 12,
        backgroundColor: '#006FFD',
        borderRadius: 12,
        padding: 15.5,
        marginLeft: 25,
        marginRight: 25,
        marginBottom: 20,
    },
    textadd: {
        color: 'white',
        textAlign: 'center',
    },
    locationButton: {
        marginLeft: 23,
        marginRight: 23,
        marginBottom: 10,
        paddingVertical: 15,
        borderWidth: 1,
        borderColor: '#C5C6CC',
        borderRadius: 8,
        marginTop: 8,
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
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.9)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    fullImage: {
        width: width * 0.9,
        height: height * 0.8,
        resizeMode: 'contain',
    },
    closeButton: {
        position: 'absolute',
        top: 30,
        right: 20,
    },
    textinputdate: {
        color: "black",
        marginVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        paddingBottom: 15.5,
        paddingTop: 15.5,
        borderColor: '#C5C6CC',
        fontSize: 16,
        paddingLeft: 10,
    },
    errorText: {
        color: 'red',
        fontSize: 14,
        marginTop: 4,
    },
    // Styles for error modal
    errorModalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
    },
    errorModalContent: {
        width: '80%',
        backgroundColor: 'white',
        borderRadius: 15,
        padding: 20,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e1e1e1',
    },
    errorModalTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 10,
        color: 'black',
        textAlign: 'center',
    },
    errorModalMessage: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 20,
        color: 'black',
        fontWeight: '500',
    },
    errorModalButton: {
        backgroundColor: '#006FFD',
        borderRadius: 10,
        paddingVertical: 8,
        paddingHorizontal: 16,
        alignItems: 'center',
        width: '100%',
        borderColor: '#0056b3',
        borderWidth: 1,
    },
    errorModalButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    cameraIconContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
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
