import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, Alert, Dimensions, ActivityIndicator, ImageBackground } from 'react-native';
import { useNavigation, useRoute } from "@react-navigation/native";
import * as FileSystem from 'expo-file-system';
import axios from 'axios';
import { Entypo } from '@expo/vector-icons';

const AddGallery = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const [labels, setLabels] = useState([]);
    const [labelcolor, setLabelColor] = useState([]);
    const [imageUri, setImageUri] = useState(route.params && route.params.imageUri ? route.params.imageUri : null);
    const [isLoading, setIsLoading] = useState(false);
    const [highestLabel, setHighestLabel] = useState(null);
    const [highestColor, setHighestColor] = useState(null);

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

    const translateText = async (text) => {
        const apiKey = "apiKey";
        const apiURL = "apiURL";

        try {
            const response = await axios.post(apiURL, {
                q: text,
                target: 'th',
            });

            return response.data.data.translations[0].translatedText;
        } catch (error) {
            console.error('เกิดข้อผิดพลาดในการแปลภาษา:', error);
            return text;
        }
    };

    useEffect(() => {
        if (labels.length > 0 || labelcolor.length > 0) {
            navigation.navigate('AddBlog', { imageUri: imageUri, labels: labels, labelcolor: labelcolor });
        }
    }, [labels, labelcolor]);

    const targetLabels = [
        'wallet', 'computer', 'mobile phone', 'headphones', 'keychain', 'tote bag', 'shoulder bag'
    ];

    const analyzeImage = async (imageUri) => {
        setIsLoading(true); // แก้ไขจาก setLoading เป็น setIsLoading
        try {
            if (!imageUri) {
                Alert.alert('เกิดข้อผิดพลาด', 'กรุณาเลือกภาพก่อน');
                setIsLoading(false);
                return;
            }

            const apiKey = "GOOGLE_VISON_API_KEY";
            const apiURL = "GOOGLE_VISON_API_URL";

            const base64ImageData = await FileSystem.readAsStringAsync(imageUri, {
                encoding: FileSystem.EncodingType.Base64,
            });

            if (imageUri) {
                try {
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

                    //ดึงข้อมูล labelAnnotations และ colorAnnotations ออกมาจากผลลัพธ์
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

                    // ตรวจสอบความเสี่ยง หาก 75% ขึ้นไป ให้แสดงแจ้งเตือนและหยุดกระบวนการไปหน้าถัดไป
                    const risks = [adultRisk.percentage, medicalRisk.percentage, violenceRisk.percentage, racyRisk.percentage, spoofRisk.percentage];
                    const isRisky = risks.some(risk => risk >= 75);

                    // แสดงผล SafeSearch 
                    console.log('ความล่อแหลมของภาพ:');
                    console.log(`เนื้อหาผู้ใหญ่: ${adultRisk.text} (${adultRisk.percentage}%)`);
                    console.log(`เนื้อหาทางการแพทย์: ${medicalRisk.text} (${medicalRisk.percentage}%)`);
                    console.log(`ความรุนแรง: ${violenceRisk.text} (${violenceRisk.percentage}%)`);
                    console.log(`เนื้อหาล่อแหลม: ${racyRisk.text} (${racyRisk.percentage}%)`);
                    console.log(`เนื้อหาหลอกลวง: ${spoofRisk.text} (${spoofRisk.percentage}%)`);



                    // แสดงผลลัพธ์ LABEL_DETECTION ที่แปลเป็นภาษาไทยพร้อมคะแนน
                    // console.log('LABEL_DETECTION Results:');
                    // for (const [index, label] of labelAnnotations.entries()) {
                    //     const translatedDescription = await translateText(label.description);
                    //     console.log(`${index + 1}. คำอธิบาย: ${translatedDescription}, คะแนน: ${label.score}`);
                    // }

                    // แสดงผลลัพธ์ LABEL_DETECTION ที่แปลเป็นภาษาไทยพร้อมคะแนน
                    console.log('LABEL_DETECTION Results:');
                    for (const [index, label] of labelAnnotations.entries()) {
                        // แสดงข้อความภาษาอังกฤษก่อน
                        console.log(`${index + 1}. คำอธิบาย (อังกฤษ): ${label.description}, คะแนน: ${label.score}`);

                        // แปลข้อความและแสดงผลลัพธ์
                        const translatedDescription = await translateText(label.description);
                        console.log(`   คำอธิบาย (ไทย): ${translatedDescription}`);
                    }

                    if (isRisky) {
                        checkRiskAndAlert(adultRisk, medicalRisk, violenceRisk, racyRisk, spoofRisk);
                    } else {
                        // ถ้าไม่พบความเสี่ยง เก็บค่าผลลัพธ์เพื่อใช้ในหน้าถัดไป
                        //กรอง Label ที่ตรงกับเป้าหมายที่กำหนดไว้
                        const filteredLabels = labelAnnotations.filter(label => {
                            const lowerCaseDescription = label.description.toLowerCase();
                            return targetLabels.some(target => lowerCaseDescription.includes(target));
                        });

                        //แปลข้อความของ Label ที่กรองแล้ว
                        const translatedLabelsPromises = filteredLabels.slice(0, 5).map(async (label) => ({
                            ...label,
                            description: await translateText(label.description),
                        }));

                        const translatedLabels = await Promise.all(translatedLabelsPromises);

                        //ดึงสีที่เด่นออกมาจาก colorAnnotations
                        const dominantColors = colorAnnotations.slice(0, 3).map(colorInfo => {
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

                        //อัปเดตสถานะของ Labels และ Colors
                        setLabels(translatedLabels);
                        setLabelColor(dominantColors);

                        //ค้นหาลูปที่มีคะแนนสูงสุด
                        let highestLabel = translatedLabels.length > 0
                            ? translatedLabels.reduce((max, label) => label.score > max.score ? label : max, { score: 0 })
                            : null;

                        const highestColor = dominantColors.length > 0
                            ? dominantColors.reduce((max, color) => color.score > max.score ? color : max, { score: 0 })
                            : null;

                        // หากไม่พบ Label ที่สูงสุด ให้ตั้งค่าเป็น 'อื่นๆ'
                        if (!highestLabel) {
                            highestLabel = {
                                description: 'อื่นๆ',
                                score: 0
                            };
                        }

                        console.log('Highest Label:', highestLabel);
                        console.log('Highest Color:', highestColor);

                        //อัปเดตสถานะของ Label ที่มีคะแนนสูงสุด และสีที่มีคะแนนสูงสุด
                        setHighestLabel(highestLabel);
                        setHighestColor(highestColor);
                    }

                } catch (error) {
                    console.error('เกิดข้อผิดพลาดในการวิเคราะห์ภาพ:', error);
                    Alert.alert('เกิดข้อผิดพลาด', 'การวิเคราะห์ภาพล้มเหลว');
                }
            }
        } catch (error) {
            console.error('เกิดข้อผิดพลาด:', error);
            Alert.alert('เกิดข้อผิดพลาด', 'การวิเคราะห์ภาพล้มเหลว');
        } finally {
            setIsLoading(false); // แก้ไขจาก setLoading เป็น setIsLoading
        }
    };

    const checkRiskAndAlert = (adultRisk, medicalRisk, violenceRisk, racyRisk, spoofRisk) => {
        const risks = [adultRisk.percentage, medicalRisk.percentage, violenceRisk.percentage, racyRisk.percentage];

        // หากมีค่าเปอร์เซ็นต์ใด 75% ขึ้นไป ให้แจ้งเตือนและค้างหน้าภาพไว้
        if (risks.some(risk => risk >= 75)) {
            Alert.alert(
                'คำเตือน',
                'ภาพนี้มีเนื้อหาล่อแหลมหรือไม่เหมาะสม กรุณาลองใหม่อีกครั้ง',
                [
                    {
                        text: 'เลือกรูปภาพใหม่',
                        onPress: () => {
                            setImageUri(null); // รีเซ็ตภาพและเตรียมให้ผู้ใช้เลือกภาพใหม่
                            setLabels([]);
                            setLabelColor([]);
                            setIsLoading(false);
                            navigation.navigate('AddCamera'); // นำไปยังหน้า AddCamera
                        },
                    },
                ],
                { cancelable: false }
            );
        }
    };


    return (
        <View style={styles.container}>
            {isLoading ? (
                <ImageBackground source={{ uri: imageUri }} style={styles.loadingContainer}>
                    <View style={styles.overlay}>
                        <ActivityIndicator size="large" color="#0000ff" />
                        <Text style={styles.loadingText}>กำลังประมวลผลรูปภาพ กรุณารอสักครู่</Text>
                    </View>
                </ImageBackground>
            ) : (
                <>

                    {imageUri && (
                        <View style={styles.imageContainer}>
                            <Image source={{ uri: imageUri }} style={styles.image} />
                        </View>
                    )}
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
                </>
            )}
        </View>
    );
};

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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: 'white',
    },
});

export default AddGallery;