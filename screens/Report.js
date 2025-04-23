import {
    View, Text, SafeAreaView, StyleSheet, ScrollView,
    TouchableOpacity, Modal, TextInput, ActivityIndicator
} from 'react-native';
import React, { useState, useEffect } from 'react';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import ipAddress from './ip';
import { jwtDecode } from "jwt-decode";

const Report = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const [userId, setUserId] = useState("");
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [blogOwner, setBlogOwner] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [alertVisible, setAlertVisible] = useState(false);
    const [alertMessage, setAlertMessage] = useState("");
    const [reportDetails, setReportDetails] = useState(null);
    const [categories, setCategories] = useState([]);

    const CustomAlert = ({ visible, title, message, onClose }) => (
        <Modal transparent={true} visible={visible} animationType="fade">
            <View style={styles.overlay}>
                <View style={styles.containerpopup}>
                    <Text style={styles.title}>{title}</Text>
                    <Text style={styles.message}>{message}</Text>
                    <TouchableOpacity style={styles.button} onPress={onClose}>
                        <Text style={styles.buttonText}>ปิด</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                setIsLoading(true);
                const response = await axios.get(`https://localhost:5001/categories`);
                console.log("Categories Response:", response.data);
                if (response.data && response.data.categories) {
                    setCategories(response.data.categories);
                } else {
                    console.log("Invalid response format:", response.data);
                }
            } catch (error) {
                console.log("Error fetching categories:", error);
                setAlertMessage("ไม่สามารถดึงข้อมูลหมวดหมู่ได้");
                setAlertVisible(true);
            } finally {
                setIsLoading(false);
            }
        };

        fetchCategories();
    }, []);

    useEffect(() => {
        const checkToken = async () => {
            try {
                const token = await AsyncStorage.getItem("authToken");
                if (token) {
                    const decodedToken = jwtDecode(token);
                    setUserId(decodedToken.userId);
                } else {
                    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
                }
            } catch (error) {
                console.error("Error checking token:", error);
            }
        };

        checkToken();
    }, []);

    const handleCategorySelect = (categoryId) => {
        setSelectedCategory(categoryId);
        const selected = categories.find(category => category._id === categoryId);
        console.log("Selected Category ID:", categoryId);
        console.log("Selected Category Details:", selected);
    };

    const fetchBlogOwner = async (blogId) => {
        if (!blogId) return;
        try {
            setIsLoading(true);
            const response = await axios.get(`https://localhost:5001/getBlogOwner/${blogId}`);
            if (response.data) {
                console.log("Blog Owner Response:", response.data);
                setBlogOwner(response.data);
                setReportDetails({
                    blog: route.params,
                    blogOwner: response.data,
                });
            } else {
                console.log("No data returned for blog owner.");
            }
        } catch (error) {
            console.error("Error fetching blog owner:", error);
            setAlertMessage("ไม่สามารถดึงข้อมูลเจ้าของกระทู้ได้");
            setAlertVisible(true);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        console.log("Updated Report Details:", reportDetails);
    }, [reportDetails]);

    useEffect(() => {
        const blogDetails = route.params || {};
        if (blogDetails.blogId) {
            console.log("Blog Details:", blogDetails);
            fetchBlogOwner(blogDetails.blogId);
        } else {
            console.log("No blogId found in route parameters.");
        }
    }, [route.params]);

    const handleSubmit = () => {
        if (!selectedCategory) {
            setAlertMessage("กรุณาเลือกประเภทการรายงาน");
            setAlertVisible(true);
            return;
        }

        const category = categories.find(cat => cat._id === selectedCategory);
        if (!category) {
            setAlertMessage("หมวดหมู่ไม่ถูกต้อง");
            setAlertVisible(true);
            return;
        }

        if (!reportDetails || !reportDetails.blog || !reportDetails.blogOwner) {
            setAlertMessage("ข้อมูลบล็อกไม่ถูกต้อง");
            setAlertVisible(true);
            return;
        }

        const { blog, blogOwner } = reportDetails;
        console.log("Sending Report Data:", { category, userId, blog, blogOwner });

        navigation.navigate('ReportConfirm', {
            category,
            blogDetails: blog,
            blogOwner,
        });
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
            <CustomAlert
                visible={alertVisible}
                title="เกิดข้อผิดพลาด"
                message={alertMessage}
                onClose={() => setAlertVisible(false)}
            />
            <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps={'always'}>
                <Text style={styles.titleinfor}>รวบรวมข้อมูล</Text>
                <Text style={styles.headtitle}>เหตุใดคุณจึงรายงานกระทู้นี้</Text>

                {isLoading ? (
                    <ActivityIndicator size="large" color="#006FFD" style={styles.loadingIndicator} />
                ) : (
                    categories.length > 0 ? (
                        categories.map((category) => (
                            <TouchableOpacity
                                key={category._id} // Use _id as the key
                                style={styles.radioButtonContainer}
                                onPress={() => handleCategorySelect(category._id)} // Pass _id to the handler
                            >
                                <View style={[styles.radioButton, selectedCategory === category._id && styles.radioButtonSelected]} >
                                    {selectedCategory === category._id && <View style={styles.radioButtonInner} />}
                                </View>
                                <View style={styles.categoryTextContainer}>
                                    <Text style={styles.radioButtonText}>{category.title}</Text>
                                    <Text style={styles.categoryDescription}>{category.description}</Text>
                                </View>
                            </TouchableOpacity>
                        ))
                    ) : (
                        <Text style={styles.noCategoriesText}>ไม่พบหมวดหมู่</Text>
                    )
                )}

                <TouchableOpacity
                    onPress={handleSubmit}
                    style={[styles.submitButton, isLoading && styles.disabledButton]}
                    disabled={isLoading}
                >
                    <Text style={styles.submitButtonText}>{isLoading ? "กำลังโหลด..." : "ต่อไป"}</Text>
                </TouchableOpacity>

            </ScrollView>

            <CustomAlert
                visible={alertVisible}
                title="เกิดข้อผิดพลาด"
                message={alertMessage}
                onClose={() => setAlertVisible(false)}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    titleinfor: {
        fontWeight: 'bold',
        marginTop: 20,
        paddingLeft: 20,
        fontSize: 20,
    },
    headtitle: {
        fontSize: 30,
        fontWeight: 'bold',
        marginTop: 20,
        marginBottom: 10,
        paddingLeft: 40,
        paddingRight: 20,
        paddingBottom: 15,
    },
    radioButtonContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        paddingLeft: 40,
        paddingRight: 20,
    },
    radioButton: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: 'black',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    radioButtonSelected: {
        borderColor: '#006FFD',
    },
    radioButtonInner: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#006FFD',
    },
    categoryTextContainer: {
        flex: 1,
    },
    radioButtonText: {
        fontSize: 18,
        color: '#000',
        fontWeight: 'bold',
    },
    categoryDescription: {
        fontSize: 16,
        color: '#555',
        marginTop: 5,
    },
    noCategoriesText: {
        fontSize: 16,
        color: '#999',
        textAlign: 'center',
        marginTop: 20,
    },
    submitButton: {
        marginTop: 25,
        backgroundColor: "#006FFD",
        borderRadius: 6,
        padding: 15,
        marginBottom: 30,
        marginHorizontal: 18,
    },
    submitButtonText: {
        textAlign: "center",
        color: "white",
        fontSize: 16,
        fontWeight: "bold",
    },
    loadingIndicator: {
        marginTop: 20,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center',
    },
    message: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 20,
        fontWeight: '500',
    },
    button: {
        backgroundColor: '#006FFD',
        borderRadius: 10,
        paddingVertical: 10,
        paddingHorizontal: 20,
        alignItems: 'center',
        width: '100%',
        borderColor: '#0056b3',
        borderWidth: 1,
    },
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    containerpopup: {
        width: '80%',
        padding: 20,
        backgroundColor: 'white',
        borderRadius: 10,
        alignItems: 'center',
    },
    disabledButton: {
        backgroundColor: '#ccc',
    },

});

export default Report;
