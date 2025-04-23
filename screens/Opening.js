import { SafeAreaView, Text, View, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState, useCallback, useEffect } from "react";

export default function Opening() {
  const navigation = useNavigation();

  useEffect(() => {
    const checkInitialScreen = async () => {
      try {
        const hasSeenOpening = await AsyncStorage.getItem('hasSeenOpening');
        const authToken = await AsyncStorage.getItem("authToken");
        if (authToken) {
          navigation.reset({
            index: 0,
            routes: [{ name: 'BottomTabs' }],
          });
        } else if (hasSeenOpening) {
          navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          });
        }
      } catch (error) {
        console.error("เกิดข้อผิดพลาดในการตรวจสอบสถานะ:", error);
      }
    };

    checkInitialScreen();
  }, []);

  const handleStart = async () => {
    await AsyncStorage.setItem('hasSeenOpening', 'true');
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.imagecontainer}>
        <Image style={styles.image} source={require('../src/image/opening.png')} />
        <View style={styles.open}>
          <Image style={styles.imagehahai} source={require('../src/image/textopen.png')} />
          <TouchableOpacity style={styles.textopen} onPress={handleStart}>
            <Text style={styles.text}>เริ่มต้นใช้งาน</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagecontainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: 270,
    height: 310,
  },
  open: {
    backgroundColor: '#EFF4FF',
    borderRadius: 20,
    paddingBottom: 25,
    paddingLeft: 30,
    paddingRight: 30,
    marginTop: 50
  },
  imagehahai: {
    width: 240,
    height: 240,
  },
  textopen: {
    backgroundColor: '#006FFD',
    borderRadius: 20,
    padding: 10,
  },
  text: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
});