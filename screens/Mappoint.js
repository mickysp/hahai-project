import React, { useState, useEffect } from 'react';
import {View, StyleSheet, TouchableOpacity, Text, Dimensions, Alert, Linking, } from 'react-native';
import MapView, { Marker, Polyline, Circle } from 'react-native-maps';

import * as Location from 'expo-location';
import Geocoder from 'react-native-geocoding';
import axios from 'axios';

const { width } = Dimensions.get('window');

// Initialize Geocoder with your Google API key
Geocoder.init('Geocoder API key');

const Mappoint = ({ route }) => {
  const destinationLocation = route?.params?.destinationLocation;

  const [currentLocation, setCurrentLocation] = useState(null);
  const [currentAddress, setCurrentAddress] = useState('');
  const [distance, setDistance] = useState(null);
  const [directions, setDirections] = useState([]);

  const destLat = destinationLocation?.latitude;
  const destLng = destinationLocation?.longitude;
  const destName = destinationLocation?.name || 'ตำแหน่งปลายทาง';

  useEffect(() => {
    if (!destLat || !destLng) {
      Alert.alert('Error', 'ข้อมูลตำแหน่งสิ่งของไม่ถูกต้อง');
      return;
    }

    const translateText = async (text) => {
      const apiKey = "apiKey";
      const apiURL = "apiURL";

      try {
        const response = await axios.post(apiURL, {
          q: text,
          target: 'th', // Target language is Thai
        });

        return response.data.data.translations[0].translatedText;
      } catch (error) {
        console.error('เกิดข้อผิดพลาดในการแปลภาษา:', error);
        return text; // Return original text if translation fails
      }
    };

    const getCurrentLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Permission Denied',
            'กรุณาเปิดใช้งานบริการระบุตำแหน่งเพื่อดำเนินการต่อ'
          );
          return;
        }

        const location = await Location.getCurrentPositionAsync({});
        const coords = location.coords;
        setCurrentLocation(coords);

        try {
          const response = await Geocoder.from(coords.latitude, coords.longitude);
          const address = response.results[0]?.formatted_address || 'ไม่พบที่อยู่';
          const translatedAddress = await translateText(address, 'th'); // แปลที่อยู่เป็นภาษาไทย
          setCurrentAddress(translatedAddress);
        } catch (geocodeError) {
          console.error('Error during geocoding:', geocodeError);
          setCurrentAddress('ไม่สามารถระบุที่อยู่ได้');
        }

        calculateDistance(coords.latitude, coords.longitude, destLat, destLng);
        fetchDirections(coords.latitude, coords.longitude, destLat, destLng);
      } catch (locationError) {
        Alert.alert('Error', 'ไม่สามารถดึงข้อมูลตำแหน่งปัจจุบันได้');
        console.error('Location error:', locationError);
      }
    };


    getCurrentLocation();
  }, []);

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const toRad = (value) => (value * Math.PI) / 180;
    const R = 6371; // Radius of the earth in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    setDistance(d.toFixed(2)); // Round to 2 decimal places
  };

  const decodePolyline = (encoded) => {  // สร้างฟังก์ชัน decodePolyline ที่รับค่า encoded (สตริงที่เข้ารหัส)
    let points = [];  // สร้างตัวแปร points เพื่อเก็บข้อมูลพิกัดที่ถอดรหัสออกมา
    let index = 0, len = encoded.length;  // สร้างตัวแปร index เพื่อใช้ในการวนลูป และตัวแปร len เพื่อเก็บความยาวของ encoded
    let lat = 0, lng = 0;  // สร้างตัวแปร lat และ lng เพื่อเก็บค่าพิกัดละติจูดและลองจิจูด

    while (index < len) {  // วนลูปจนกว่าจะหมดสตริงที่เข้ารหัส
      let b, shift = 0, result = 0;  // สร้างตัวแปร b, shift, และ result สำหรับการถอดรหัส
      do {  // เริ่มกระบวนการถอดรหัสละติจูด
        b = encoded.charCodeAt(index++) - 63;  // ดึงค่าตัวอักษรที่ตำแหน่ง index และแปลงเป็นค่าที่ใช้ในกระบวนการ
        result |= (b & 0x1f) << shift;  // ปรับค่าผลลัพธ์โดยการชิฟต์ข้อมูล
        shift += 5;  // เพิ่มค่า shift สำหรับการจัดการบิต
      } while (b >= 0x20);  // ดำเนินการจนกว่าจะเจอค่าที่น้อยกว่า 0x20

      const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));  // แปลงข้อมูลที่ได้จากการถอดรหัสเป็นค่าการเปลี่ยนแปลงละติจูด
      lat += dlat;  // เพิ่มค่าการเปลี่ยนแปลงละติจูดเข้าไปในค่าละติจูดที่มีอยู่

      shift = 0;  // รีเซ็ตค่าของ shift
      result = 0;  // รีเซ็ตค่าของ result
      do {  // เริ่มกระบวนการถอดรหัสลองจิจูด
        b = encoded.charCodeAt(index++) - 63;  // ดึงค่าตัวอักษรที่ตำแหน่ง index และแปลงเป็นค่าที่ใช้ในการถอดรหัส
        result |= (b & 0x1f) << shift;  // ปรับค่าผลลัพธ์โดยการชิฟต์ข้อมูล
        shift += 5;  // เพิ่มค่า shift สำหรับการจัดการบิต
      } while (b >= 0x20);  // ดำเนินการจนกว่าจะเจอค่าที่น้อยกว่า 0x20

      const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));  // แปลงข้อมูลที่ได้จากการถอดรหัสเป็นค่าการเปลี่ยนแปลงลองจิจูด
      lng += dlng;  // เพิ่มค่าการเปลี่ยนแปลงลองจิจูดเข้าไปในค่าลองจิจูดที่มีอยู่

      points.push([lat / 1e5, lng / 1e5]);  // เพิ่มค่าพิกัดที่ถอดรหัสแล้ว (หารด้วย 1e5 เพื่อแปลงให้เป็นค่าที่ถูกต้อง) ลงในอาเรย์ points
    }

    return points;  // คืนค่าอาเรย์ของพิกัดที่ถอดรหัสแล้ว
  };


  const fetchDirections = async (originLat, originLng, destLat, destLng) => {
    const GOOGLE_MAPS_API_KEY = 'GOOGLE_MAPS_API_KEY';
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${originLat},${originLng}&destination=${destLat},${destLng}&key=${GOOGLE_MAPS_API_KEY}`;
    try {
      const response = await axios.get(url);
      if (response.data.status === 'OK') {
        const points = decodePolyline(response.data.routes[0].overview_polyline.points);
        setDirections(points.map(([latitude, longitude]) => ({ latitude, longitude })));
      } else {
        console.error('Directions API error:', response.data.error_message);
      }
    } catch (error) {
      console.error('Error fetching directions:', error);
    }
  };

  const handleNavigate = () => {
    if (!currentLocation) {
      Alert.alert('Error', 'ตำแหน่งปัจจุบันยังไม่พร้อม');
      return;
    }

    const url = `https://www.google.com/maps/dir/?api=1&origin=${currentLocation.latitude},${currentLocation.longitude}&destination=${destLat},${destLng}`;
    Linking.openURL(url);
  };




  return (
    <View style={styles.container}>
      {currentLocation ? (
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
        >
          {/* Circle for aura effect */}
          <Circle
            center={{ latitude: currentLocation.latitude, longitude: currentLocation.longitude }}
            radius={100} // Adjust the radius as needed (in meters)
            strokeWidth={1}
            strokeColor="rgba(0, 102, 255, 0.5)" // Semi-transparent blue border
            fillColor="rgba(0, 102, 255, 0.2)" // Semi-transparent blue fill
          />

          {/* Marker for current location */}
          <Marker
            coordinate={{
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
            }}
            title="ตำแหน่งปัจจุบัน"
            description={`${currentAddress} (${currentLocation.latitude.toFixed(6)}, ${currentLocation.longitude.toFixed(6)})`}
            pinColor="blue" // Set the marker color to blue
          />

          {/* Marker for destination */}
          <Marker
            coordinate={{
              latitude: destLat,
              longitude: destLng,
            }}
            title={destName}
            description={`(${destLat.toFixed(6)}, ${destLng.toFixed(6)})`}
          />

          {/* Polyline for directions */}
          <Polyline coordinates={directions} strokeWidth={4} strokeColor="blue" />
        </MapView>

      ) : (
        <Text style={styles.loadingText}>กำลังโหลดตำแหน่ง...</Text>
      )}
      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>
        <Text style={styles.bold}>ตำแหน่งปัจจุบัน: </Text>{currentAddress ? currentAddress : 'กำลังระบุที่อยู่...'}
        </Text>
        <Text style={styles.infoText}>
        <Text style={styles.bold}>ตำแหน่งสิ่งของ: </Text>{destName}
        </Text>
        <Text style={styles.infoText}>
        <Text style={styles.bold}>ระยะทาง: </Text>{distance ? `${distance} กม.` : 'กำลังคำนวณ...'}
        </Text>
        <TouchableOpacity style={styles.navigateButton} onPress={handleNavigate}>
          <Text style={styles.buttonText}>นำทาง</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default Mappoint;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  loadingText: {
    textAlign: 'center',
    marginTop: '50%',
    fontSize: 16,
  },
  infoContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    elevation: 5,
  },
  infoText: {
    fontSize: 16,
    marginBottom: 10,
  },
  navigateButton: {
    backgroundColor: '#006FFD',
    borderRadius: 5,
    padding: 10,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
  },
  bold: {
    fontWeight: 'bold',
    color: '#006FFD',
    // textShadowColor: 'rgba(0, 0, 0, 0)', // สีของเงา
    // textShadowOffset: { width: 1, height: 1 }, // ระยะเงาในแนวนอนและแนวตั้ง
    // textShadowRadius: 5, // ความเบลอของเงา
  },
});