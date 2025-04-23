import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, RefreshControl, TextInput, TouchableOpacity, View, FlatList, Text, ScrollView } from 'react-native';
import axios from 'axios';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AntDesign, MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import BlogsItem from '../components/BlogsItem';
import ipAddress from './ip';

const Datasearch = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { search } = route.params || {};
    const [refreshing, setRefreshing] = useState(false);
    const [data, setData] = useState([]);
    const [searchTerm, setSearchTerm] = useState(search ? String(search) : '');
    const [filteredData, setFilteredData] = useState([]);
    const searchRef = useRef();
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 30;

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const response = await axios.get(`https://localhost:5001/blogs`);
            if (response.data && response.data.blogs) {
                setData(response.data.blogs);
                filterData(response.data.blogs); // กรองข้อมูลทันทีที่โหลดข้อมูล
            } else {
                console.log("Invalid response format:", response.data);
            }
        } catch (error) {
            console.log("error message", error);
        }
    };

    const filterData = (blogs) => {
        if (!searchTerm) {
            setFilteredData(blogs);
            return;
        }

        const searchTerms = searchTerm.toLowerCase().split(' ').filter(term => term.trim() !== '');
        const filtered = blogs.filter(item => {
            const objectType = item.object_type ? item.object_type.toLowerCase() : '';
            const objectSubtype = item.object_subtype ? item.object_subtype.toLowerCase() : '';
            const color = item.color ? item.color.toLowerCase() : '';
            const note = item.note ? item.note.toLowerCase() : '';
            const location = item.location ? item.location.toLowerCase() : '';
            const locationname = item.locationname ? item.locationname.toLowerCase() : '';
            const date = item.date ? item.date.toLowerCase() : '';

            const combinedFields = `${objectType} ${objectSubtype} ${color} ${note} ${location} ${locationname} ${date}`.toLowerCase();

            return searchTerms.every(term => combinedFields.includes(term));
        });

        setFilteredData(filtered.reverse());
    };

    const handleSearch = (text) => {
        setSearchTerm(text);
        filterData(data); // กรองข้อมูลทันทีเมื่อมีการค้นหาใหม่
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchData();
        setRefreshing(false);
    };

    const filteredCurrentData = filteredData.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handleNextPage = () => {
        if (currentPage * itemsPerPage < filteredData.length) {
            setCurrentPage(prevPage => prevPage + 1);
        }
    };

    const handlePreviousPage = () => {
        if (currentPage > 1) {
            setCurrentPage(prevPage => prevPage - 1);
        }
    };


    const navigateToCamera = () => {
        navigation.navigate('Camera');
    };

    return (

            <SafeAreaView style={{ flex: 1, backgroundColor: "#F5F5F5" }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10 }}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <AntDesign name="arrowleft" size={24} color="black" style={{ marginTop: 10 }} />
                    </TouchableOpacity>
                    <View style={{ flexDirection: 'row', alignItems: 'center', width: '95%', justifyContent: "space-between" }}>
                        <View style={styles.searchBar}>
                            <TextInput
                                placeholder="ค้นหา..."
                                value={searchTerm}
                                onChangeText={handleSearch}
                                maxLength={500}
                                style={styles.searchInput}
                            />
                            <TouchableOpacity onPress={() => setSearchTerm('')}>
                                <AntDesign name="close" size={24} color="black" />
                            </TouchableOpacity>
                        </View>
                        <TouchableOpacity onPress={navigateToCamera}>
                            <MaterialIcons name="linked-camera" size={28} color="#C5C6CC" style={{ marginRight: 10 }} />
                        </TouchableOpacity>
                    </View>
                </View>

                <FlatList
                    style={styles.list}
                    data={filteredCurrentData}
                    keyExtractor={(item, index) => index.toString()}
                    showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#006FFD']} />}
                    renderItem={({ item }) => (
                        <TouchableOpacity onPress={() => navigation.navigate('Bloginfo')}>
                            <BlogsItem item={item} />
                        </TouchableOpacity>
                    )}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons style={styles.emptyIcon} name="search-circle-sharp" size={100} color="black" />
                            <Text style={styles.emptyText}>ไม่พบสิ่งของที่คุณตามหา กรุณาลองใหม่อีกครั้ง</Text>
                        </View>
                    }
                    numColumns={2}
                    ListFooterComponent={() =>
                        filteredData.length > 0 && (
                            <View style={styles.paginationContainer}>
                                {currentPage > 1 && (
                                    <TouchableOpacity onPress={handlePreviousPage} style={styles.arrowButton}>
                                        <AntDesign name="left" size={24} color="#006FFD" />
                                    </TouchableOpacity>
                                )}
                                <Text style={styles.pageNumber}>{currentPage}</Text>
                                {filteredCurrentData.length === itemsPerPage && currentPage * itemsPerPage < filteredData.length && (
                                    <TouchableOpacity onPress={handleNextPage} style={styles.arrowButton}>
                                        <AntDesign name="right" size={24} color="#006FFD" />
                                    </TouchableOpacity>
                                )}
                            </View>
                        )
                    }
                />
            </SafeAreaView>

    );
}

export default Datasearch;

const styles = StyleSheet.create({
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        width: "85%",
        height: 35,
        borderRadius: 20,
        marginLeft: 10,
        backgroundColor: "#FFFF",
        paddingHorizontal: 10,
    },
    searchInput: {
        flex: 1,
        paddingStart: 10,
    },
    list: {
        marginHorizontal: 10,
        marginVertical: 25,
        borderRadius: 20,
        paddingBottom: 20,
        marginLeft: 14,
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 50,
    },
    emptyIcon: {
        textAlign: 'center',
        color: '#556',
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 10,
        fontSize: 18,
        color: '#555',
    },
    paginationContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 10,
    },
    arrowButton: {
        paddingHorizontal: 10,
    },
    pageNumber: {
        fontSize: 18,
        color: '#000000',
    },
});
