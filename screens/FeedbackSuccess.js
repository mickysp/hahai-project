import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useCallback } from 'react';

const FeedbackSuccess = () => {
  const navigation = useNavigation();

  useFocusEffect(
    useCallback(() => {
      const checkAuthentication = async () => {
        try {
          const token = await AsyncStorage.getItem("authToken");
          if (!token) {
            navigation.navigate('Login');
          }
        } catch (error) {
          console.error("เกิดข้อผิดพลาดในการตรวจสอบการรับรองความถูกต้อง:", error);
        }
      };

      checkAuthentication();
    }, [navigation])
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons name="check-circle" size={190} color="#4CAF50" />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>ขอบคุณที่แจ้งให้เราทราบ</Text>
        </View>
        <View style={styles.messageContainer}>
          <Text style={styles.message}>
            เราจะตรวจสอบการรายงานของคุณ และจะแจ้งเตือนคุณให้ดูผลลัพธ์ในการแจ้งเตือน
            ของคุณโดยเร็วที่สุด
          </Text>
        </View>
        <View style={styles.done}>
          <TouchableOpacity onPress={() => navigation.navigate('BottomTabs', { screen: 'UserProfile' })}
          >
            <Text style={styles.text}>ตกลง</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default FeedbackSuccess;

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    flex: 1,
  },

  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 220
  },

  title: {
    fontWeight: 'bold',
    fontSize: 28,
    textAlign: 'center',
  },
  messageContainer: {
    paddingHorizontal: 30,
    marginTop: 10,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
  },
  done: {
    marginTop: 300,
    width: '100%',
    paddingLeft: 25,
    paddingRight: 25
  },
  text: {
    backgroundColor: '#006FFD',
    paddingTop: 15,
    paddingBottom: 15,
    fontSize: 15,
    color: 'white',
    borderRadius: 12,
    fontWeight: 'bold',
    textAlign: 'center'
  },
});
