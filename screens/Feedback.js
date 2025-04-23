import { View, Text, SafeAreaView, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Image } from 'react-native';
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { jwtDecode } from "jwt-decode";
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ipAddress from './ip';

const Feedback = () => {
    const navigation = useNavigation();
    const [userId, setUserId] = useState("");
    const [user, setUser] = useState({});
    const [feedback, setFeedback] = useState("");

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
                console.error("Error fetching user data:", error);
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
            console.log("User data:", response.data);
            const userData = response.data.user;
            setUser(userData);
        } catch (error) {
            console.log("Error fetching user profile", error);
        }
    };

    const handleSendFeedback = async () => {
        if (feedback.trim() === "") {
            Alert.alert("เกิดข้อผิดพลาด", "กรุณาแจ้งปัญหาการใช้งาน");
            return;
        }

        try {
            const response = await axios.post(`https://localhost:5001/feedback`, {
                feedback, userId,
            });

            if (response.status === 201) {
                navigation.navigate('FeedbackSuccess');
                console.log("ปัญหาการใช้งานของคุณถูกส่งเรียบร้อยแล้ว");
                setFeedback("");
            } else {
                Alert.alert("เกิดข้อผิดพลาด", response.data.message);
            }
        } catch (error) {
            //console.error("เกิดข้อผิดพลาดในการส่งข้อเสนอแนะ", error);
            Alert.alert("เกิดข้อผิดพลาด", "ปัญหาการใช้งานของคุณดำเนินการไม่สำเร็จ");
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView
                contentContainerStyle={styles.scrollViewContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps='always'
            >
                <View style={styles.profileContainer}>
                    {user.profileImage ? (
                        <Image source={{ uri: user.profileImage }} style={styles.profileImage} />
                    ) : (
                        <MaterialCommunityIcons name="account-circle" size={70} color="#D2E3FF" />
                    )}
                    <View style={styles.userInfo}>
                        <View style={styles.nameContainer}>
                            <Text style={styles.firstname}>{user.firstname || "No data"}</Text>
                            <Text style={styles.lastname}>{user.lastname || "No data"}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.feedbackContainer}>
                    <TextInput
                        style={styles.feedbackInput}
                        placeholder="กรอกรายละเอียด"
                        multiline
                        numberOfLines={50}
                        value={feedback}
                        onChangeText={setFeedback}
                    />

                    <View style={styles.buttonContainer}>
                        <TouchableOpacity style={styles.sendButton} onPress={handleSendFeedback}>
                            <Text style={styles.sendButtonText}>ยืนยัน</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
                            <Text style={styles.cancelButtonText}>ยกเลิก</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

export default Feedback;

const styles = StyleSheet.create({
    safeArea: {
        backgroundColor: 'white',
        flex: 1,
    },
    scrollViewContent: {
        flexGrow: 1,
    },
    profileContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 20,
        paddingHorizontal: 18,
    },
    profileImage: {
        width: 70,
        height: 70,
        borderRadius: 35,
    },
    userInfo: {
        marginLeft: 10,
    },
    nameContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    firstname: {
        marginEnd: 10,
        fontSize: 16,
        fontWeight: 'bold',
    },
    lastname: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    feedbackContainer: {
        paddingHorizontal: 18,
        flex: 1,
        fontSize: 20
    },
    feedbackLabel: {
        fontSize: 16,
        marginBottom: 10,
        paddingLeft: 10,
    },
    feedbackInput: {
        borderColor: '#ddd',
        borderWidth: 1,
        borderRadius: 5,
        padding: 20,
        fontSize: 20,
        color: 'black',
        textAlignVertical: 'top',
    },
    buttonContainer: {
        flex: 1,
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingBottom: 30,
    },
    sendButton: {
        marginBottom: 10,
        backgroundColor: '#006FFD',
        borderRadius: 6,
        padding: 16,
        width: '100%',
        alignItems: 'center',
    },
    sendButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    cancelButton: {
        marginBottom: 30,
        marginBottom: 10,
        paddingTop: 5
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
        textDecorationLine: 'underline',
    },
});
