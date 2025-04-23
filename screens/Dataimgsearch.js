import React, { useEffect, useState } from 'react';
import { StyleSheet, Platform, TouchableOpacity, View, FlatList, Text, Image, RefreshControl, ScrollView } from 'react-native';
import axios from 'axios';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AntDesign, Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import BlogsItem from '../components/BlogsItem';

import ipAddress from './ip';

const Dataimgsearch = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { imageUri, highestLabel, highestColor } = route.params;

  const [data, setData] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const searchTerm = highestLabel ? highestLabel.description.toLowerCase() : '';
  const searchColor = highestColor ? highestColor.description.toLowerCase() : '';


  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 30;

  const fetchData = async () => {
    try {
      const response = await axios.get(`https://localhost:5001/blogs`);
      if (response.data && response.data.blogs) {
        setData(response.data.blogs);
      } else {
        console.log("Invalid response format:", response.data);
      }
    } catch (error) {
      console.log("error message", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [imageUri, searchTerm, searchColor]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const navigateToHome = () => {
    navigation.navigate('Home');
  };

  const containsMatchingWord = (str, term) => {
    if (!str || !term) return false;
    const strWords = str.toLowerCase().split(' ');
    const termWords = term.toLowerCase().split(' ');
    return termWords.some(word => strWords.includes(word));
  };

  const filteredData = data.filter(item => {
    const itemSubtype = item.object_subtype ? item.object_subtype.toLowerCase() : '';
    const itemColor = item.color ? item.color.toLowerCase() : '';
    return containsMatchingWord(itemSubtype, searchTerm) && containsMatchingWord(itemColor, searchColor);
  });

  const sortedData = filteredData.sort((a, b) => {
    const aMatches =
      (a.object_subtype && containsMatchingWord(a.object_subtype.toLowerCase(), searchTerm) ? 1 : 0) +
      (a.color && containsMatchingWord(a.color.toLowerCase(), searchColor) ? 1 : 0);

    const bMatches =
      (b.object_subtype && containsMatchingWord(b.object_subtype.toLowerCase(), searchTerm) ? 1 : 0) +
      (b.color && containsMatchingWord(b.color.toLowerCase(), searchColor) ? 1 : 0);

    return bMatches - aMatches;
  });

  // คำนวณข้อมูลที่จะแสดงในแต่ละหน้า
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = sortedData.slice(startIndex, endIndex);

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
    <SafeAreaView style={{
      paddingTop: Platform.OS === 'android' ? 10 : 0,
      flex: 1,
      backgroundColor: '#F5F5F5',
    }}>
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <AntDesign name="arrowleft" size={24} color="black" style={{ marginLeft: 10, marginBottom: 10 }} />
      </TouchableOpacity>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', width: "95%", height: 100, borderRadius: 20, marginLeft: 10, backgroundColor: "#FFFF" }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10 }}>
              {imageUri && <Image source={{ uri: imageUri }} style={styles.image} />}
              <View style={{ marginLeft: 10 }}>
                <Text style={styles.labelText}>ชนิดสิ่งของ: {highestLabel ? highestLabel.description : 'อื่น ๆ'} </Text>
                <Text style={styles.colorText}>สี: {highestColor ? highestColor.description : 'อื่น ๆ'}</Text>
              </View>
            </View>
          </View>
        </View>
      </View>



      <FlatList
        data={sortedData.reverse()}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => (
          <TouchableOpacity
            onPress={() => {
              navigation.navigate('Bloginfo');
            }}
          >
            <BlogsItem item={item} key={index} />
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View>
            <TouchableOpacity onPress={navigateToHome}>
              <Ionicons style={styles.emptyicon} name="search-circle-sharp" size={100} color="black" />
              <Text style={styles.emptyText}> ไม่พบสิ่งของที่คุณตามหา กรุณาลองใหม่อีกครั้ง</Text>
            </TouchableOpacity>
          </View>
        }
        numColumns={2}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#006FFD']}
          />

        }
      />

      {/* ซ่อน pagination ถ้าไม่มีข้อมูลใน currentData */}
      {currentData.length > 0 && (
        <View style={styles.paginationContainer}>
          {currentPage > 1 && (
            <TouchableOpacity onPress={handlePreviousPage} style={styles.arrowButton}>
              <AntDesign name="left" size={24} color="#006FFD" />
            </TouchableOpacity>
          )}
          <Text style={styles.pageNumber}>{currentPage}</Text>
          {currentData.length === itemsPerPage && endIndex < filteredData.length && (
            <TouchableOpacity onPress={handleNextPage} style={styles.arrowButton}>
              <AntDesign name="right" size={24} color="#006FFD" />
            </TouchableOpacity>
          )}
        </View>
      )}

    </SafeAreaView>
  );
}

export default Dataimgsearch;

const styles = StyleSheet.create({
  emptyText: {
    textAlign: 'center',
    marginTop: 10,
    fontSize: 18,
    color: '#555',
  },
  emptyicon: {
    textAlign: 'center',
    marginTop: 50,
    color: '#556',
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 10
  },
  labelText: {
    fontSize: 16,
    marginLeft: 10,
  },
  colorText: {
    fontSize: 16,
    marginLeft: 10,
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
  flatListContainer: {
    paddingHorizontal: 10, 
    
  },
});