import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity, Image, Alert, ActivityIndicator, ImageBackground } from 'react-native';
import { useState, useRef, useEffect } from 'react';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import axios from 'axios';
import { Entypo, FontAwesome, AntDesign, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from "@react-navigation/native";


export default function Camera() {
  const navigation = useNavigation();
  const [image, setImage] = useState(null);
  const cameraRef = useRef(null);
  const [facing, setFacing] = useState('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [loading, setLoading] = useState(false); // สถานะการโหลด
  const [labels, setLabels] = useState([]);
  const [labelcolor, setLabelColor] = useState([]);
  const [isFromCamera, setIsFromCamera] = useState(false);


  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, [permission]);

  function toggleCameraFacing() {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  }

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const data = await cameraRef.current.takePictureAsync();
        setImage(data.uri);
        analyzeImage(data.uri);
      } catch (e) {
        console.log(e);
      }
    }
  };

  const pickImage = async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 3],
        quality: 1,
      });

      if (!result.canceled) {
        setImage(result.assets[0].uri);
        analyzeImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
    }
  };

  const colorNameMapping = [
    { name: 'สีแดง', rgb: [255, 0, 0] },
    { name: 'สีน้ำเงิน', rgb: [0, 0, 255] },
    { name: 'สีน้ำเงิน', rgb: [0, 0, 139] },
    { name: 'สีน้ำเงิน', rgb: [173, 216, 230] },
    { name: 'สีเขียว', rgb: [0, 255, 0] },
    { name: 'สีเขียว', rgb: [0, 128, 0] },
    { name: 'สีเขียว', rgb: [144, 238, 144] },
    { name: 'สีเหลือง', rgb: [255, 255, 0] },
    { name: 'สีเหลือง', rgb: [255, 255, 224] },
    { name: 'สีเหลือง', rgb: [204, 204, 0] },
    { name: 'สีดำ', rgb: [0, 0, 0] },
    { name: 'สีขาว', rgb: [255, 255, 255] },
    { name: 'สีขาว', rgb: [245, 245, 245] },
    { name: 'สีม่วง', rgb: [128, 0, 128] },
    { name: 'สีม่วง', rgb: [216, 191, 216] },
    { name: 'สีม่วง', rgb: [75, 0, 130] },
    { name: 'สีชมพู', rgb: [255, 192, 203] },
    { name: 'สีชมพู', rgb: [255, 105, 180] },
    { name: 'สีส้ม', rgb: [255, 165, 0] },
    { name: 'สีส้ม', rgb: [255, 200, 0] },
    { name: 'สีส้ม', rgb: [255, 140, 0] },
    { name: 'สีเทา', rgb: [128, 128, 128] },
    { name: 'สีเทา', rgb: [211, 211, 211] },
    { name: 'สีเทา', rgb: [169, 169, 169] },
    { name: 'สีน้ำตาล', rgb: [165, 42, 42] },
    { name: 'สีน้ำตาล', rgb: [210, 105, 30] },
    { name: 'สีน้ำตาล', rgb: [101, 67, 33] },
    { name: 'สีม่วงแดง', rgb: [255, 0, 255] },
    { name: 'สีฟ้า', rgb: [0, 191, 255] },
    { name: 'สีฟ้า', rgb: [173, 216, 230] },
    { name: 'สีฟ้า', rgb: [0, 0, 139] }
  ];


  const findClosestColor = (r, g, b) => {
    let closestColor = '';
    let minDistance = Infinity;

    r = Math.min(255, Math.max(0, r));
    g = Math.min(255, Math.max(0, g));
    b = Math.min(255, Math.max(0, b));

    colorNameMapping.forEach(color => {
      const [cr, cg, cb] = color.rgb;
      const distance = Math.sqrt(
        Math.pow(r - cr, 2) +
        Math.pow(g - cg, 2) +
        Math.pow(b - cb, 2)
      );

      if (distance < minDistance) {
        minDistance = distance;
        closestColor = color.name;
      }
    });

    return closestColor;
  };

  const translateText = async (text) => {
    const apiKey = "GOOGLE_TRANSLATE_API_KEY";
    const apiURL = "GOOGLE_TRANSLATE_API_URL";

    try {
      const response = await axios.post(apiURL, {
        q: text,
        target: 'th',
      });

      return response.data.data.translations[0].translatedText;
    } catch (error) {
      console.error('เกิดข้อผิดพลาดในการแปลภาษา:', error);
      return text; // ถ้าการแปลผิดพลาด, ส่งกลับคำเดิม
    }
  };


  const analyzeImage = async (imageUri) => {
    setLoading(true);
    try {
      if (!imageUri) {
        Alert.alert('เกิดข้อผิดพลาด', 'กรุณาเลือกภาพก่อน');
        setLoading(false);
        return;
      }

      const apiKey = "GOOGLE_VISON_API_KEY";
      const apiURL = "GOOGLE_VISON_API_URL";

      const base64ImageData = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const requestData = {
        requests: [
          {
            image: {
              content: base64ImageData,
            },
            features: [
              { type: 'LABEL_DETECTION', maxResults: 20 },
              { type: 'IMAGE_PROPERTIES', maxResults: 3 },
              { type: 'SAFE_SEARCH_DETECTION' }
            ],
          },
        ],
      };

      const apiResponse = await axios.post(apiURL, requestData);
      const labelAnnotations = apiResponse.data.responses[0].labelAnnotations || [];
      const colorAnnotations = apiResponse.data.responses[0].imagePropertiesAnnotation?.dominantColors?.colors || [];

      const getRiskDescriptionInThai = (riskLevel) => {
        const safeSearchLevels = {
          VERY_UNLIKELY: { text: 'แทบจะเป็นไปไม่ได้', percentage: 0 },
          UNLIKELY: { text: 'ไม่น่าจะเป็นไปได้', percentage: 25 },
          POSSIBLE: { text: 'เป็นไปได้', percentage: 50 },
          LIKELY: { text: 'น่าจะเป็นไปได้', percentage: 75 },
          VERY_LIKELY: { text: 'มีโอกาสสูง', percentage: 100 },
        };
        return safeSearchLevels[riskLevel] || { text: 'ไม่ทราบ', percentage: 0 };
      };

      const safeSearchAnnotations = apiResponse.data.responses[0].safeSearchAnnotation || {};
      const adultRisk = getRiskDescriptionInThai(safeSearchAnnotations.adult);
      const medicalRisk = getRiskDescriptionInThai(safeSearchAnnotations.medical);
      const violenceRisk = getRiskDescriptionInThai(safeSearchAnnotations.violence);
      const racyRisk = getRiskDescriptionInThai(safeSearchAnnotations.racy);
      const spoofRisk = getRiskDescriptionInThai(safeSearchAnnotations.spoof);

      const risks = [adultRisk.percentage, medicalRisk.percentage, violenceRisk.percentage, racyRisk.percentage, spoofRisk.percentage];
      const isRisky = risks.some(risk => risk >= 75);

      // แสดงผล SafeSearch 
      console.log('ความล่อแหลมของภาพ:');
      console.log(`เนื้อหาผู้ใหญ่: ${adultRisk.text} (${adultRisk.percentage}%)`);
      console.log(`เนื้อหาทางการแพทย์: ${medicalRisk.text} (${medicalRisk.percentage}%)`);
      console.log(`ความรุนแรง: ${violenceRisk.text} (${violenceRisk.percentage}%)`);
      console.log(`เนื้อหาล่อแหลม: ${racyRisk.text} (${racyRisk.percentage}%)`);
      console.log(`เนื้อหาหลอกลวง: ${spoofRisk.text} (${spoofRisk.percentage}%)`);

      console.log('LABEL_DETECTION Results:');
      for (const [index, label] of labelAnnotations.entries()) {
        const translatedDescription = await translateText(label.description);
        console.log(`${index + 1}. คำอธิบาย: ${translatedDescription}, คะแนน: ${label.score}`);
      }

      if (isRisky) {
        checkRiskAndAlert(adultRisk, medicalRisk, violenceRisk, racyRisk, spoofRisk);
      } else {
        // const targetLabels = [
        //   'bag', 'wallet', 'backpack', 'luggage', 'computer', 'electronic device',
        //   'mobile phone', 'headphones', 'keychain', 'key', 'gadget', 'mouse', 'chain'
        // ];

        const targetLabels = [
          'wallet', 'computer', 'mobile phone', 'headphones', 'keychain', 'tote bag', 'shoulder bag', 'Luggage & Bags'
        ];

        // const targetLabels = [
        //   'wallet', 'backpack', 'luggage', 'computer', 'electronic device',
        //   'mobile phone', 'headphones', 'keychain', 'key', 'mouse', 'chain',
        //   'umbrella', 'identity document','car', 'vehicle', 'package delivery', 'tablet computer',
        //   'telephony', 'card', 'bicycle'
        // ];

        const filteredLabels = labelAnnotations.filter(label =>
          targetLabels.includes(label.description.toLowerCase())
        );

        const translatedLabels = await Promise.all(filteredLabels.map(async (label) => {
          const translatedText = await translateText(label.description);
          return {
            ...label,
            description: translatedText
          };
        }));

        console.log('Detected Labels:');
        translatedLabels.forEach(label => {
          console.log(`${label.description}: ${label.score * 100}%`);
        });

        setLabels(translatedLabels);
        const dominantColors = colorAnnotations.map(colorInfo => {
          const { red, green, blue } = colorInfo.color;
          const colorName = findClosestColor(red, green, blue);
          return { description: colorName, score: colorInfo.score };
        });

        console.log('Detected Colors:');
        dominantColors.forEach(color => {
          console.log(`${color.description}: ${color.score * 100}%`);
        });

        setLabelColor(dominantColors);
        navigation.navigate('Dataimgsearch', {
          imageUri,
          highestLabel: translatedLabels[0],
          highestColor: dominantColors[0],
        });
      }
    } catch (error) {
      console.error('เกิดข้อผิดพลาดในการวิเคราะห์รูปภาพ: ', error);
      Alert.alert('เกิดข้อผิดพลาด', 'กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  };

  const checkRiskAndAlert = (adultRisk, medicalRisk, violenceRisk, racyRisk, spoofRisk) => {
    const risks = [adultRisk.percentage, medicalRisk.percentage, violenceRisk.percentage, racyRisk.percentage, spoofRisk.percentage];

    if (risks.some(risk => risk >= 75)) {
      Alert.alert(
        'คำเตือน',
        'ภาพนี้มีเนื้อหาล่อแหลมหรือไม่เหมาะสม กรุณาลองใหม่อีกครั้ง',
        [
          {
            text: 'ลองใหม่อีกครั้ง',
            onPress: () => {
              setImage(null);
              setLabels([]);
              setLabelColor([]);
              setLoading(false);
              navigation.navigate('Camera');
            },
          },
        ],
        { cancelable: false }
      );
    }
  };




  return (
    <SafeAreaView style={styles.container}>
      {loading ? (
        <View style={styles.overlayContainer}>
          <ImageBackground
            source={{ uri: image }}
            style={styles.overlay}
            resizeMode="cover"
          >
            <View style={styles.overlayContent}>
              <ActivityIndicator size="large" color="#ffffff" />
              <Text style={styles.loadingText}>กำลังตามหาสิ่งของของคุณ กรุณารอสักครู่</Text>
            </View>
          </ImageBackground>
        </View>
      ) : (
        <>
          {!image ? (
            <CameraView
              style={styles.camera}
              facing={facing}
              ref={cameraRef}
            />
          ) : (
            <Image source={{ uri: image }} style={styles.camera} />
          )}

          <View>
            {image ? (
              <View style={styles.after}>
                <TouchableOpacity
                  onPress={() => setImage(null)}
                  style={styles.actionButton}
                >
                  <Entypo name="retweet" size={24} color="white" />
                  <Text style={styles.actionText}>
                    {isFromCamera ? 'ถ่ายใหม่' : 'เลือกรูปภาพใหม่'} {/* Dynamic text */}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => analyzeImage(image)}
                  style={styles.actionButton}
                >
                  <Entypo name="check" size={24} color="white" />
                  <Text style={styles.actionText}>บันทึก</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.controls}>
                <TouchableOpacity onPress={pickImage} style={styles.iconButton}>
                  <MaterialCommunityIcons name="camera-image" size={38} color="white" />
                </TouchableOpacity>

                <TouchableOpacity onPress={takePicture} style={styles.button}>
                  <FontAwesome name="circle" size={80} color="white" />
                </TouchableOpacity>

                <TouchableOpacity onPress={toggleCameraFacing} style={styles.iconButton}>
                  <AntDesign name="retweet" size={35} color="white" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    paddingBottom: 20,
  },
  camera: {
    flex: 1,
    borderRadius: 10,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  iconButton: {
    marginTop: 20,
  },
  after: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  actionButton: {
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 20,
  },
  actionText: {
    color: 'white',
    marginTop: 5,
  },
  overlayContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  overlayContent: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  loadingText: {
    color: 'white',
    marginTop: 10,
  },
});