import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, TouchableWithoutFeedback, SafeAreaView, TouchableOpacity, TextInput, FlatList, Platform, ActivityIndicator, Image, ScrollView, Modal, RefreshControl } from 'react-native';
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
import axios from 'axios';
import { jwtDecode } from "jwt-decode";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MaterialCommunityIcons, FontAwesome, AntDesign, MaterialIcons, Ionicons } from '@expo/vector-icons';
import BlogsItem from '../components/BlogsItem';

import ipAddress from './ip';
import PolicyItem from "../components/PolicyItem";

const Home = () => {
    const navigation = useNavigation();
    const [userId, setUserId] = useState("");
    const [user, setUser] = useState(null);
    const [data, setData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedFilters, setSelectedFilters] = useState([]);
    const [isLoadingScreen, setIsLoadingScreen] = useState(false);
    const [selectedSort, setSelectedSort] = useState('newest');
    const route = useRoute();
    const itemsPerPage = 50;


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

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const response = await axios.get(`https://localhost:5001/blogs`);
            if (response.data && response.data.blogs) {
                const newData = response.data.blogs.reverse();
                setData(newData);
                filterData(newData); // Apply filter to the fetched data
            } else {
                console.log("Invalid response format:", response.data);
            }
        } catch (error) {
            console.log("Error fetching data:", error);
        } finally {
            setIsLoading(false);
        }
    };


    const resetFilters = () => {
        setSelectedFilters([]); // Reset filters to default (none selected)
        setSelectedSort('newest'); // Reset sort to default 'newest'
    };

    useFocusEffect(
        useCallback(() => {
            // Reset filters and sort whenever the screen is focused
            resetFilters();
            fetchData();
        }, [])
    );

    const filterData = (data) => {
        let filtered = data;

        filtered = filtered.filter(item => item.receivedStatus !== true);

        // กรองข้อมูลจากตัวกรองที่ผู้ใช้เลือก
        if (selectedFilters.length > 0) {
            filtered = data.filter(item => {
                const lowerCaseSubtype = item.object_subtype.toLowerCase();
                return selectedFilters.some(filter => {
                    // กรองทั้งคำภาษาไทยและอังกฤษที่ตรงกัน
                    const lowerCaseFilter = filter.toLowerCase();
                    return lowerCaseSubtype.includes(lowerCaseFilter) || lowerCaseSubtype.includes(mapFilterToThai(filter));
                });
            });
        }

        // จัดเรียงข้อมูลตามตัวเลือกที่เลือก
        if (selectedSort === 'oldest') {
            filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)); // จากเก่าไปใหม่
        } else if (selectedSort === 'newest') {
            filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // จากใหม่ไปเก่า
        }

        setFilteredData(filtered); // อัพเดตข้อมูลที่ถูกกรองแล้ว
    };

    // ฟังก์ชันช่วยในการแปลงจากคำภาษาอังกฤษไปเป็นคำภาษาไทย
    const mapFilterToThai = (filter) => {
        const filterMapping = {
            'bag': 'กระเป๋า',
            'wallet': 'กระเป๋าสตางค์',
            'computer': 'คอมพิวเตอร์',
            'mobile phone': 'โทรศัพท์มือถือ',
            'headphones': 'หูฟัง',
            'keychain': 'พวงกุญแจ',
        };

        return filterMapping[filter.toLowerCase()] || filter; // คืนค่าภาษาไทยหรือคงค่าเดิมถ้าไม่พบการจับคู่
    };

    const applyFilter = (filter) => {
        setSelectedFilters(prevFilters => {
            const newFilters = prevFilters.includes(filter)
                ? prevFilters.filter(f => f !== filter)
                : [...prevFilters, filter];
            return newFilters;
        });
    };

    const handleConfirmFilters = () => {
        setIsLoadingScreen(true); // Show full-screen loading spinner
        setTimeout(() => {
            filterData(data); // Apply filters and sorting to the current data
            setIsModalVisible(false); // Close the modal
            setIsLoadingScreen(false); // Hide full-screen loading spinner
        }, 1000); // Simulate loading time
    };


    const handleClearFilters = () => {
        setSelectedFilters([]); // Clear all filters
        setSelectedSort('newest'); // Reset sort to default 'newest'
    };

    const navigateToCamera = () => {
        navigation.navigate('Camera');
    };

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            fetchData();
        });

        return unsubscribe;
    }, [navigation]);

    const navigateToUserProfile = () => {
        navigation.navigate('BottomTabs', {
            screen: 'profile'
        });
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchData();
        setRefreshing(false);
    };

    if (isLoading) {
        return (
            <SafeAreaView style={styles.loadingScreenContainer}>
                <ActivityIndicator size="large" color="#006FFD" />
                <Text style={styles.loadingText}>กรุณารอสักครู่</Text>
            </SafeAreaView>
        );
    }

    if (isLoadingScreen) {
        return (
            <SafeAreaView style={styles.loadingScreenContainer}>
                <ActivityIndicator size="large" color="#006FFD" />
                <Text style={styles.loadingText}>กรุณารอสักครู่</Text>
            </SafeAreaView>
        );
    }

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentData = filteredData.slice(startIndex, endIndex);

    const handleNextPage = () => {
        if (endIndex < filteredData.length) {
            setCurrentPage(prevPage => prevPage + 1);
        }
    };

    const handlePreviousPage = () => {
        if (currentPage > 1) {
            setCurrentPage(prevPage => prevPage - 1);
        }
    };


    return (
        <SafeAreaView style={{ paddingTop: Platform.OS === 'android' ? 50 : 0, flex: 1, backgroundColor: '#F5F5F5' }}>

            <View style={styles.topContainer}>
                {/* <Text>{isFirstLogin ? 'Welcome! This is your first login.' : 'Welcome Back!'}</Text> */}
                <TouchableOpacity onPress={navigateToUserProfile}>
                    <View style={styles.profile}>
                        {user?.profileImage ? (
                            <Image source={{ uri: user.profileImage }} style={styles.profileImage} />
                        ) : (
                            <MaterialCommunityIcons name="account-circle" size={60} color="#006FFD" />
                        )}
                        <View style={styles.userInfo}>
                            <Text style={styles.username}>{user?.username || "ไม่มีข้อมูล"}</Text>
                            <View style={styles.nameContainer}>
                                <Text style={styles.firstname}>{user?.firstname || "ไม่มีข้อมูล"}</Text>
                                <Text style={styles.lastname}>{user?.lastname || "ไม่มีข้อมูล"}</Text>
                            </View>
                        </View>
                    </View>
                </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={() => navigation.navigate('BottomTabs', { screen: 'searchbar' })}>
                <View style={styles.searchBar}>
                    <View style={styles.search}>
                        <FontAwesome name="search" size={20} color="black" />
                        <TextInput placeholder="ค้นหา" style={{ flex: 1, marginLeft: 10 }} editable={false} />
                        <View style={styles.iconContainer}>
                            <TouchableOpacity onPress={navigateToCamera}>
                                <MaterialIcons name="linked-camera" size={28} color="#C5C6CC" style={{ marginRight: 3 }} />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => setIsModalVisible(true)}>
                                <Ionicons name="filter" size={28} color="#C5C6CC" style={{ marginRight: 0 }} />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>

            <FlatList
                style={styles.flatList}
                data={currentData}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                    <TouchableOpacity onPress={() => navigation.navigate('Bloginfo', { item })}>
                        <BlogsItem item={item} />
                    </TouchableOpacity>
                )}
                keyExtractor={(item, index) => item.id || index.toString()} // Ensure unique keys
                ListEmptyComponent={
                    <Text style={styles.emptyText}></Text>
                }
                numColumns={2}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh} // Function triggered on pull-to-refresh
                        colors={['#006FFD']} // Loader color
                    />
                }
                contentContainerStyle={{ paddingBottom: 20 }} // Adjust padding if needed
                ListFooterComponent={ // Pagination at the bottom
                    filteredData.length > 0 && (
                        <View style={styles.paginationContainer}>
                            {currentPage > 1 && (
                                <TouchableOpacity onPress={handlePreviousPage} style={styles.arrowButton}>
                                    <AntDesign name="left" size={24} color="#006FFD" />
                                </TouchableOpacity>
                            )}
                            <Text style={styles.pageNumber}>{currentPage}</Text>
                            {endIndex < filteredData.length && (
                                <TouchableOpacity onPress={handleNextPage} style={styles.arrowButton}>
                                    <AntDesign name="right" size={24} color="#006FFD" />
                                </TouchableOpacity>
                            )}
                        </View>
                    )
                }
            />

            <View style={styles.addIcon}>
                <TouchableOpacity onPress={() => navigation.navigate('AddReadOnly')}>
                    <AntDesign name="pluscircle" size={60} color="#006FFD" />
                </TouchableOpacity>
            </View>

            <Modal
                animationType="slide"
                transparent={true}
                visible={isModalVisible}
                onRequestClose={() => setIsModalVisible(false)}
            >
                <TouchableWithoutFeedback onPress={() => setIsModalVisible(false)}>
                    <View style={styles.modalContainer}>
                        <TouchableWithoutFeedback>
                            <View style={styles.modalContent}>
                                <TouchableOpacity
                                    style={styles.closeButton}
                                    onPress={() => setIsModalVisible(false)}
                                >
                                    <MaterialCommunityIcons name="close" size={24} color="black" />
                                </TouchableOpacity>

                                <Text style={styles.modalTitle}>Filter by</Text>

                                {[
                                    { en: 'bag', th: 'กระเป๋า' },
                                    { en: 'computer', th: 'คอมพิวเตอร์' },
                                    { en: 'mobile phone', th: 'โทรศัพท์มือถือ' },
                                    { en: 'headphones', th: 'หูฟัง' },
                                    { en: 'keychain', th: 'พวงกุญแจ' },
                                ].map((filter) => (
                                    <TouchableOpacity
                                        key={filter.en}
                                        onPress={() => applyFilter(filter.en)}
                                        style={styles.checkboxContainer}
                                    >
                                        <MaterialCommunityIcons
                                            name={selectedFilters.includes(filter.en) ? 'checkbox-marked' : 'checkbox-blank-outline'}
                                            size={24}
                                            color="black"
                                        />
                                        <Text style={styles.checkboxLabel}>{`${filter.th}`}</Text>
                                    </TouchableOpacity>
                                ))}


                                <Text style={styles.modalTitle}>Sort by</Text>

                                {/* Add sorting options as radio buttons */}
                                <TouchableOpacity onPress={() => setSelectedSort('newest')} style={styles.checkboxContainer}>
                                    <MaterialCommunityIcons
                                        name={selectedSort === 'newest' ? 'radiobox-marked' : 'radiobox-blank'}
                                        size={24}
                                        color="black"
                                    />
                                    <Text style={styles.checkboxLabel}>ของหายล่าสุดไปยังของหายก่อนหน้า</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => setSelectedSort('oldest')} style={styles.checkboxContainer}>
                                    <MaterialCommunityIcons
                                        name={selectedSort === 'oldest' ? 'radiobox-marked' : 'radiobox-blank'}
                                        size={24}
                                        color="black"
                                    />
                                    <Text style={styles.checkboxLabel}>ของหายก่อนหน้าไปยังของหายล่าสุด</Text>
                                </TouchableOpacity>

                                <View style={styles.modalButtonContainer}>
                                    <TouchableOpacity
                                        onPress={handleClearFilters}
                                        style={styles.modalButtonclear}
                                    >
                                        <Text style={styles.modalButtonTextClear}>ล้าง</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={handleConfirmFilters} style={styles.modalButtonCon}>
                                        <Text style={styles.modalButtonText}>ตกลง</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>

        </SafeAreaView>
    );
};

export default Home;

const styles = StyleSheet.create({
    topContainer: {
        flexDirection: 'row',
        padding: 20,
    },
    profile: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    profileImage: {
        width: 60,
        height: 60,
        borderRadius: 30,
    },
    userInfo: {
        marginLeft: 10,
    },
    username: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    nameContainer: {
        flexDirection: 'row',
    },
    firstname: {
        fontSize: 16,
    },
    lastname: {
        fontSize: 16,
        marginLeft: 5,
    },
    searchBar: {
        backgroundColor: '#fff',
        borderRadius: 25,
        margin: 15,
        padding: 10,
    },
    search: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        flexDirection: 'row',
        marginLeft: 'auto',
    },
    flatList: {
        margin: 10,
        flex: 1,
    },
    paginationContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: 10,
    },
    arrowButton: {
        marginHorizontal: 10,
    },
    pageNumber: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    addIcon: {
        position: 'absolute',
        bottom: 20,
        right: 20,
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        width: '80%',
        padding: 20,
        backgroundColor: '#fff',
        borderRadius: 10,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    checkboxLabel: {
        marginLeft: 10,
        fontSize: 16,
    },
    modalButtonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    modalButtonCon: {
        marginTop: 15,
        alignItems: 'center',
        padding: 10,
        backgroundColor: '#006FFD',
        paddingHorizontal: 20,
        borderRadius: 10,
    },
    modalButtonclear: {
        marginTop: 15,
        alignItems: 'center',
        padding: 10,
        paddingHorizontal: 25,
        backgroundColor: 'white',  // พื้นหลังสีขาว
        borderColor: '#006FFD',    // สีของกรอบ
        borderWidth: 1,            // ความหนาของกรอบ
        borderRadius: 10,           // ขอบมน
    },

    modalButtonText: {
        color: '#fff',
        fontSize: 16,
    },
    modalButtonTextClear: {
        color: '#006FFD',
        fontSize: 16,
    },
    loadingScreenContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#000',
    },

    radioButtonContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    radioButtonLabel: {
        marginLeft: 10,
        fontSize: 16,
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        width: '80%',
        padding: 20,
        backgroundColor: '#fff',
        borderRadius: 10,
        position: 'relative', // Added for close button
    },
    closeButton: {
        position: 'absolute',
        top: 10,
        right: 10,
    },
    modalButtonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
    },
    modalButton: {
        marginTop: 15,
        alignItems: 'center',
        padding: 10,
        backgroundColor: '#006FFD',
        borderRadius: 5,
    },
    modalButtonText: {
        color: '#fff',
        fontSize: 16,
    },

});

