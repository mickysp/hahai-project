import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, Alert, Dimensions } from 'react-native';
import { useNavigation, useRoute } from "@react-navigation/native";
import * as FileSystem from 'expo-file-system';
import axios from 'axios';
import { Entypo } from '@expo/vector-icons';

const SearchGallery = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const [labels, setLabels] = useState([]);
  const [labelcolor, setLabelColor] = useState([]); 
  const [imageUri, setImageUri] = useState(route.params && route.params.imageUri ? route.params.imageUri : null); 

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

  const analyzeImage = async (imageUri) => {
    try {
      if (!imageUri) {
        Alert.alert('เกิดข้อผิดพลาด', 'กรุณาเลือกภาพก่อน');
        return;
      }

      const apiKey = "GOOGLE_API_KEY";
      const apiURL = `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`;

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
              { type: 'LABEL_DETECTION', maxResults: 12 },
              { type: 'IMAGE_PROPERTIES', maxResults: 3 },
            ],
          },
        ],
      };

      const apiResponse = await axios.post(apiURL, requestData);
      const labelAnnotations = apiResponse.data.responses[0].labelAnnotations || [];
      const colorAnnotations = apiResponse.data.responses[0].imagePropertiesAnnotation?.dominantColors?.colors || [];

      const filteredLabels = labelAnnotations.filter(label =>
        label.description.toLowerCase() !== 'rectangle'
      );

      const detectedColors = filteredLabels
        .filter(label => colorNameMapping.map(c => c.name).includes(label.description))
        .map(label => ({
          description: label.description,
          score: (label.score * 100).toFixed(2)
        }));

      const dominantColors = colorAnnotations
        .map(colorInfo => {
          const { red, green, blue } = colorInfo.color;
          const rgbRed = Math.round(red);
          const rgbGreen = Math.round(green);
          const rgbBlue = Math.round(blue);

          const colorName = findClosestColor(rgbRed, rgbGreen, rgbBlue);

          return {
            description: colorName,
            rgb: `rgb(${rgbRed}, ${rgbGreen}, ${rgbBlue})`,
            score: colorInfo.score
          };
        });

      // Log labels and colors with percentages
      console.log('Detected Labels:');
      filteredLabels.forEach(label => {
        console.log(`${label.description}: ${label.score * 100}%`);
      });

      console.log('Detected Colors:');
      dominantColors.forEach(color => {
        console.log(`${color.description}: ${color.score * 100}%`);
      });

      setLabels(filteredLabels);
      setLabelColor(dominantColors.concat(detectedColors));

      const highestLabel = filteredLabels.length > 0 ? filteredLabels.reduce((max, label) => label.score > max.score ? label : max, { score: 0 }) : null;
      const highestColor = dominantColors.concat(detectedColors).length > 0 ? dominantColors.concat(detectedColors).reduce((max, color) => color.score > max.score ? color : max, { score: 0 }) : null;

      navigation.navigate('Dataimgsearch', {
        imageUri,
        highestLabel,
        highestColor
      });

    } catch (error) {
      console.error('เกิดข้อผิดพลาดในการวิเคราะห์รูปภาพ: ', error);
      Alert.alert('เกิดข้อผิดพลาด', 'กรุณาลองใหม่อีกครั้ง');
    }
  };
  // ค้นหาเปอร์เซ็นต์สูงสุดและสีสูงสุดจาก labels และ labelcolor
  const highestLabel = labels.length > 0 ? labels.reduce((max, label) => label.score > max.score ? label : max, { score: 0 }) : null;
  const highestColor = labelcolor.length > 0 ? labelcolor.reduce((max, color) => color.score > max.score ? color : max, { score: 0 }) : null;

  return (
    <View style={styles.container}>
      <View style={styles.resultsContainer}>
        {highestLabel && (
          <Text style={styles.resultsTitle}>
            Highest: {highestLabel.description} ({highestLabel.score}%)
          </Text>
        )}
        {highestColor && (
          <Text style={styles.resultsTitle}>
            Highest Color: {highestColor.description} ({(highestColor.score * 100).toFixed(2)}%)
          </Text>
        )}
      </View>
      <Image source={{ uri: imageUri }} style={styles.image} />
      <View style={styles.after}>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            onPress={() => navigation.navigate('AddCamera')}
            style={styles.button}>
            <Entypo name="retweet" size={24} color="white" />
            <Text style={styles.buttonText}>เลือกรูปภาพใหม่</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => analyzeImage(imageUri)}
            style={styles.button}>
            <Entypo name="check" size={24} color="white" />
            <Text style={styles.buttonText}>บันทึก</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

export default SearchGallery;

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
  },
  image: {
    width: width,
    height: height * 0.5,
  },
  resultsContainer: {
    position: 'absolute',
    top: 20,
    left: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 10,
    borderRadius: 5,
  },
  resultsTitle: {
    fontSize: 16,
    color: 'white',
    marginBottom: 5,
  },
  after: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 50,
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    marginHorizontal: 6,
  },
});