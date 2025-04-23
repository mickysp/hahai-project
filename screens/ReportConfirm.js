import { StyleSheet, Text, View, ScrollView, SafeAreaView, TouchableOpacity, ActivityIndicator, Modal } from 'react-native';
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import { jwtDecode } from "jwt-decode";
import AsyncStorage from '@react-native-async-storage/async-storage';
import ipAddress from './ip';
import { Ionicons } from '@expo/vector-icons';

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

const ReportConfirm = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const [userId, setUserId] = useState('');
  const [user, setUser] = useState(null);
  const [blogOwner, setBlogOwner] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const { category, blogDetails, blogOwner: routeBlogOwner } = route.params;
  const { blogId } = route.params;
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  console.log('Received category:', category);
  console.log('Received blogDetails:', blogDetails);
  console.log('Received blogOwner:', blogOwner);

  useEffect(() => {
    const checkToken = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        if (token) {
          const decodedToken = jwtDecode(token);
          setUserId(decodedToken.userId);
        } else {
          navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          });
        }
      } catch (error) {
        console.error('Error checking token:', error);
      }
    };

    checkToken();
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
    } catch (error) {
      console.log('Error fetching user profile', error);
    }
  };

  const fetchBlogOwner = async (blogId) => {
    if (!blogId) return;
    try {
      const response = await axios.get(`https://localhost:5001/getBlogOwner/${blogId}`);
      if (response.data && response.data._id) {
        setBlogOwner(response.data);
      } else {
        console.error('Blog owner data is invalid or missing');
      }
    } catch (error) {
      console.error('Error fetching blog owner:', error);
    }
  };

  useEffect(() => {
    if (blogOwner) {
      console.log('Blog Owner fetched from API:', blogOwner);
    } else if (routeBlogOwner) {
      console.log('Blog Owner from route:', routeBlogOwner);
      setBlogOwner(routeBlogOwner);
    }
  }, [blogOwner, routeBlogOwner]);

  useEffect(() => {
    if (blogId) {
      fetchBlogOwner(blogId);
    }
  }, [blogId]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccess(false);
  
    if (!user || !category || !blogDetails || !blogOwner) {
      setErrorMessage('ข้อมูลบางอย่างไม่ครบถ้วน กรุณาลองใหม่อีกครั้ง');
      setIsSubmitting(false);
      return;
    }
  
    console.log('User:', user);
    console.log('Category:', category);
    console.log('Blog Details:', blogDetails);
    console.log('Blog Owner:', blogOwner);
  
    try {
      const reportData = {
        category: category._id,
        user: userId,
        blog: blogDetails.blogId,
        blogOwner: blogOwner._id,
      };
  
      const response = await axios.post(`https://localhost:5001/report`, reportData);
  
      // Check if the status is 200 or 201 for success
      if (response.status === 200 || response.status === 201) {
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          navigation.navigate('Home');
        }, 2000);
      } else {
        console.log('Error response:', response);
        setErrorMessage('เกิดข้อผิดพลาดขณะส่งรายงาน กรุณาลองใหม่อีกครั้ง');
      }
    } catch (error) {
      console.error('Error submitting report:', error);
      setErrorMessage('เกิดข้อผิดพลาดขณะส่งรายงาน กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={{ backgroundColor: 'white', flex: 1 }}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        style={{ backgroundColor: 'white', paddingHorizontal: 20 }}
      >
        <View style={styles.container}>
          <Text style={styles.title}>คุณกำลังจะส่งรายงาน</Text>
          <Text style={styles.description}>
            เราทราบดีว่านี่ไม่ใช่เรื่องง่าย เราจึงรู้สึกขอบคุณที่คุณสละเวลาตอบคำถามเหล่านั้น
            เราจะลบเฉพาะเนื้อหาที่ขัดต่อมาตราฐานชุมชนของเราออกเท่านั้น
            คุณสามารถตรวจสอบหรือแก้ไขรายละเอียดรายงานของคุณได้ด้านล่าง
          </Text>
          <View style={styles.reportDetailsContainer}>
            <Text style={styles.reportDetailsTitle}>รายละเอียดการรายงาน</Text>
            <Text style={styles.reportDetailsText}>
              ประเภท: {category?.title || 'ไม่ระบุ'}
            </Text>
            <Text style={styles.reportDetailsText}>
              เนื้อหา: {category?.description || 'ไม่ระบุ'}
            </Text>
          </View>

          <View style={styles.bottomContainer}>
            {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}
            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.submitButtonText}>ส่ง</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Loading Modal */}
      <Modal visible={loading} transparent={true} animationType="fade">
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#006FFD" />
          <Text style={styles.loadingText}>กำลังบันทึก...</Text>
        </View>
      </Modal>

      {/* Success Modal */}
      <Modal visible={success} transparent={true} animationType="slide">
        <View style={styles.loadingContainer}>
          <View style={styles.successBox}>
            <Ionicons name="checkmark-circle-outline" size={80} color="#006FFD" />
            <Text style={styles.successText}>ส่งรายงานกระทู้สำเร็จ!</Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#000',
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#555',
    marginBottom: 20,
  },
  reportDetailsContainer: {
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  reportDetailsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  reportDetailsText: {
    fontSize: 16,
    marginBottom: 5,
  },
  submitButton: {
    backgroundColor: '#006FFD',
    padding: 13,
    borderRadius: 6,
    alignItems: 'center',
    width: '100%',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
  },
  bottomContainer: {
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 30,
    marginTop: 'auto',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  successBox: {
    backgroundColor: 'white',
    padding: 30,
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  successText: {
    marginTop: 10,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#006FFD',
  },
});

export default ReportConfirm;
