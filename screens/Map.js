import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Modal, Text, Alert } from 'react-native';
import MapView, { Marker, Polyline, Polygon } from 'react-native-maps';
import Geocoder from 'react-native-geocoding';
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import { Delaunay } from "d3-delaunay";

// ขอบเขตของมหาวิทยาลัยขอนแก่น
const kkuBoundaryCoordinates = [
  { latitude: 16.482067, longitude: 102.832368 }, //ขวาบน สาธิตมอแดง
  { latitude: 16.480803, longitude: 102.805970 }, //ซ้ายบน
  { latitude: 16.442559, longitude: 102.810207 }, //ซ้ายล่าง
  { latitude: 16.441244, longitude: 102.819292 }, //ขวาล่าง
  { latitude: 16.465277, longitude: 102.822122 }, //ประตูฝั่งกัง
  { latitude: 16.464163, longitude: 102.831683 }, //ศูนย์หัวใจสิริกิติ์ฯ 
  { latitude: 16.482067, longitude: 102.832368 }, // กลับไปยังจุดเริ่มต้น
];

// คำนวณค่าต่ำสุดและสูงสุดของพิกัด
const minLatitude = Math.min(...kkuBoundaryCoordinates.map(p => p.latitude));
const maxLatitude = Math.max(...kkuBoundaryCoordinates.map(p => p.latitude));
const minLongitude = Math.min(...kkuBoundaryCoordinates.map(p => p.longitude));
const maxLongitude = Math.max(...kkuBoundaryCoordinates.map(p => p.longitude));


const Map = ({ route }) => {
  const navigation = useNavigation();
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedAddress, setSelectedAddress] = useState("");
  const [translatedAddress, setTranslatedAddress] = useState("");
  const [currentLocation, setCurrentLocation] = useState(null);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");

  useEffect(() => {
    const getCurrentLocation = async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setAlertMessage("Location permission is required to access your current location.");
        setAlertVisible(true);
        return;
      }

      try {
        let location = await Location.getCurrentPositionAsync({});
        setCurrentLocation(location.coords);

        // ตรวจสอบว่าผู้ใช้อยู่ในขอบเขตมหาวิทยาลัยขอนแก่นหรือไม่
        if (!isWithinBounds(location.coords.latitude, location.coords.longitude)) {
          setAlertMessage("คุณไม่ได้อยู่ภายในพื้นที่มหาวิทยาลัยขอนแก่น กรุณาเลือกตำแหน่งที่ต้องการ");
          setAlertVisible(true);
        }
      } catch (error) {
        setAlertMessage("Unable to access current location. Please check location services.");
        setAlertVisible(true);
      }
    };

    getCurrentLocation();
  }, []);

  const translateText = async (text) => {
    const apiKey = "GOOGLE_TRANSLATE_API_KEY";
    const apiURL = "GOOGLE_TRANSLATE_API_URL";

    try {
      const response = await axios.post(apiURL, {
        q: text,
        target: 'th', // Target language is Thai
      });

      return response.data.data.translations[0].translatedText;
    } catch (error) {
      console.error('ตำแหน่งไม่ถูกต้องในการแปลภาษา:', error);
      return text; // Return original text if translation fails
    }
  };

  // ฟังก์ชันตรวจสอบว่าตำแหน่งอยู่ในพื้นที่หลายเหลี่ยมหรือไม่
  const isWithinBounds = (latitude, longitude) => {
    // สร้างตัวแปร 'polygon' โดยแปลง kkuBoundaryCoordinates เป็นรูปแบบของพิกัดที่ประกอบด้วย latitude และ longitude
    const polygon = kkuBoundaryCoordinates.map(coord => ({
      latitude: coord.latitude,
      longitude: coord.longitude
    }));

    // กำหนดค่าเริ่มต้นให้ตัวแปร 'isInside' เป็น false (ใช้เก็บผลลัพธ์ว่าอยู่ในหลายเหลี่ยมหรือไม่)
    let isInside = false;

    // ตัวแปร j ใช้สำหรับเก็บตำแหน่งของจุดสุดท้ายใน polygon (เริ่มต้นที่จุดสุดท้าย)
    let j = polygon.length - 1;

    // การใช้ Ray-Casting algorithm เพื่อตรวจสอบว่าอยู่ในหลายเหลี่ยมหรือไม่
    for (let i = 0; i < polygon.length; i++) {
      // กำหนดให้ 'vertex1' และ 'vertex2' เป็นจุด 2 จุดที่ใช้ในการตรวจสอบ
      const vertex1 = polygon[i];
      const vertex2 = polygon[j];

      // เช็คว่าพิกัด longitude อยู่ระหว่างระยะของเส้นตรงที่เชื่อมต่อ vertex1 และ vertex2 หรือไม่
      if (
        (longitude > vertex1.longitude && longitude <= vertex2.longitude) ||
        (longitude > vertex2.longitude && longitude <= vertex1.longitude)
      ) {
        // ตรวจสอบว่าจุดที่อยู่ในทิศทางของ ray ตัดกับเส้นตรงระหว่าง vertex1 และ vertex2 หรือไม่
        if (
          latitude <
          ((vertex2.latitude - vertex1.latitude) *
            (longitude - vertex1.longitude)) /
          (vertex2.longitude - vertex1.longitude) +
          vertex1.latitude
        ) {
          // ถ้าเส้นตัด จะเปลี่ยนสถานะ 'isInside' จาก true เป็น false หรือจาก false เป็น true
          isInside = !isInside;
        }
      }
      // อัปเดตค่า j ให้เป็นตำแหน่งของจุดก่อนหน้า (เป็นวงจรการตรวจสอบเส้นขอบ polygon)
      j = i;
    }

    // คืนค่า 'isInside' ถ้าค่าเป็น true หมายถึงตำแหน่งอยู่ในพื้นที่ polygon
    return isInside;
  };

  // รายชื่อพิกัดสถานที่สำคัญ
  const predefinedLocationPairs = [
    { name1: "คุ้มสีฐาน", lat1: 16.445450308502334, lon1: 102.81260734907696 },
    { name1: "หอศิลปวัฒนธรรม", lat1: 16.445018131549514, lon1: 102.81444197988984 },
    { name1: "ศูนย์ประชุมอเนกประสงค์กาญจนาภิเษก", lat1: 16.446678576845578, lon1: 102.8175680913035 },
    { name1: "คณะนิติศาสตร์", lat1: 16.450225903691557, lon1: 102.8154035527692 },

    { name1: "โรงเรียนสาธิตมหาวิทยาลัยขอนแก่น (ศึกษาศาสตร์)", lat1: 16.45214077053667, lon1: 102.81865976732696 },
    { name1: "โรงเรียนสาธิตมหาวิทยาลัยขอนแก่น (ศึกษาศาสตร์)", lat1: 16.45011275146653, lon1: 102.81839646066643 },
    { name1: "โรงเรียนสาธิตมหาวิทยาลัยขอนแก่น (มอดินแดง)", lat1: 16.481559689580653, lon1: 102.83101294487267 },


    { name1: "สถานีไฟฟ้าย่อย มข.", lat1: 16.46586913206072, lon1: 102.80814055752644 },
    { name1: "อาคารจตุรมุข", lat1: 16.46625239071297, lon1: 102.81332083028279 },
    { name1: "อาคารสิริคุณากร", lat1: 16.471283848122006, lon1: 102.81550280849471 },

    { name1: "สำนักงานอธิการบดี", lat1: 16.47124912229674, lon1: 102.81600414670731 },
    { name1: "อาคารพลศึกษา", lat1: 16.47720076472579, lon1: 102.81858190662088 },
    { name1: "โรงยิมเทเบิลเทนนิส", lat1: 16.477822440482786, lon1: 102.81380313543627 },
    { name1: "สนามยิงปืน", lat1: 16.477921838736993, lon1: 102.8129758063755 },
    { name1: "โรงยิมฟันดาบ", lat1: 16.4782615635957, lon1: 102.81370052197398 },

    { name1: "อาคารพละศึกษา", lat1: 16.476744353485415, lon1: 102.81392616424903 },
    { name1: "กองป้องกันและรักษาความปลอดภัย", lat1: 16.47803252132918, lon1: 102.81918058657095 },
    { name1: "ศูนย์อาหารและบริการ 2 (โรงชาย)", lat1: 16.478192630020104, lon1: 102.81962096867575 },
    { name1: "กองพัฒนานักศึกษาและศิษย์เก่าสัมพันธ์", lat1: 16.477822070240865, lon1: 102.8203842000436 },
    { name1: "องค์การนักศึกษา", lat1: 16.477769060560966, lon1: 102.82123619464066 },


    { name1: "ศูนย์อาหารและบริการ 1 (Complex)", lat1: 16.477788057159426, lon1: 102.82309805884178 },
    { name1: "อาคารองค์กรกิจกรรมนักศึกษา", lat1: 16.47776584549811, lon1: 102.82133677747031 },
    { name1: "โรงแรมบายาสิตา", lat1: 16.477752328789748, lon1: 102.83176164889402 },
    { name1: "คณะสัตวแพทยศาสตร์", lat1: 16.478663215843405, lon1: 102.83132546423467 },
    { name1: "คณะเกษตรศาสตร์", lat1: 16.475765261970245, lon1: 102.8222038473388 },

    { name1: "คณะเทคโนโลยี", lat1: 16.474815130631193, lon1: 102.82211184751267 },
    { name1: "สำนักหอสมุด", lat1: 16.47698748996619, lon1: 102.82346750656282 },
    { name1: "คณะวิทยาศาสตร์", lat1: 16.476457231275525, lon1: 102.82468046476617 },
    { name1: "คณะมนุษยศาสตร์ ฯ", lat1: 16.4756014097594, lon1: 102.82651491765108 },
    { name1: "อาคารพิมล กลกิจ", lat1: 16.474376267725933, lon1: 102.82709697777759 },

    { name1: "ศาลา พระราชทานปริญญาบัตร (เดิม)", lat1: 16.47389141458287, lon1: 102.82801534099886 },
    { name1: "สำนักเทคโนโลยีดิจิทัล", lat1: 16.474161344771055, lon1: 102.82477786423468 },
    { name1: "คณะบริหารธุรกิจและการบัญชี", lat1: 16.474010000275356, lon1: 102.8255771843746 },
    { name1: "คณะศึกษาศาสตร์", lat1: 16.473374434137078, lon1: 102.82645480120884 },
    { name1: "คณะวิศวกรรมศาสตร์", lat1: 16.473215738468586, lon1: 102.82330795538002 },

    { name1: "คณะสถาปัตยกรรมศาสตร์", lat1: 16.472580161603123, lon1: 102.82746133570427 },
    { name1: "บ้านชีวาศิลป์มอดินแดง", lat1: 16.475357133085556, lon1: 102.8289596017407 },
    { name1: "สถาบันฯ ลุ่มน้ำโขง", lat1: 16.474065933292536, lon1: 102.82895677975823 },
    { name1: "สถาบันขงจื้อ", lat1: 16.474202272672866, lon1: 102.8303635596787 },
    { name1: "วิทยาลัยปกครองท้องถิ่น", lat1: 16.473587886336155, lon1: 102.83121884107865 },

    { name1: "อาคารพจน์ สารสิน", lat1: 16.473479668686696, lon1: 102.82889786441758 },
    { name1: "อาคาร 25 ปี", lat1: 16.472681070830873, lon1: 102.83006154281844 },
    { name1: "คณะเภสัชศาสตร์", lat1: 16.470849714289738, lon1: 102.82769583447487 },
    { name1: "คณะพยาบาลศาสตร์", lat1: 16.46992918620035, lon1: 102.82510973763183 },
    { name1: "คณะสาธารณะสุขศาสตร์", lat1: 16.470538046399238, lon1: 102.82585866423467 },


    { name1: "คณะเทคนิคการแพทย์", lat1: 16.468968496119352, lon1: 102.82774849491598 },
    { name1: "อาคารเรียนรวมและห้องปฏิบัติการวิจัยคณะแพทย์ฯ", lat1: 16.469238661842535, lon1: 102.8308777796874 },
    { name1: "คณะแพทยศาสตร์", lat1: 16.46980453698861, lon1: 102.83114600056648 },
    { name1: "โรงพยาบาลศรีนครินทร์", lat1: 16.46829404034072, lon1: 102.83001654907693 },
    { name1: "คณะทันตแพทยศาสตร์", lat1: 16.46692502067597, lon1: 102.82871913395202 },
    { name1: "ศูนย์หัวใจสิริกิติ์ฯ", lat1: 16.46658084243228, lon1: 102.83129009325273 },

    { name1: "คณะศิลปะกรรมศาสตร์", lat1: 16.469418395689456, lon1: 102.81763486423466 },
    { name1: "ศูนย์อาหารหนองแวง", lat1: 16.465730510363258, lon1: 102.82528316441758 },
    { name1: "สถาบันวิจัยและพัฒนา", lat1: 16.47560546702716, lon1: 102.82255382625738 },
    { name1: "วิทยาลัยบัณฑิตศึกษาการจัดการ", lat1: 16.474166075201992, lon1: 102.82602844907693 },
    { name1: "วิทยาลัยนานาชาติ", lat1: 16.47458836750923, lon1: 102.82903950674725 },

    { name1: "วิทยาลัยการคอมพิวเตอร์ (SC09 ตึกวิทยวิภาส)", lat1: 16.475905628869995, lon1: 102.82516144197459 },
    { name1: "หอพักนพรัตน์ (หอพัก 9 หลัง)", lat1: 16.480451718194153, lon1: 102.8068238494965 },
    { name1: "หอพักสวัสดิการ (หอพัก 8 หลัง)", lat1: 16.479662314569737, lon1: 102.81011466441757 },
    { name1: "ปั๊มน้ำมัน ปตท.", lat1: 16.478900993635378, lon1: 102.81396631624105 },
    { name1: "หอพักวรอินเตอร์ (หออินเตอร์)", lat1: 16.479055315688218, lon1: 102.81196002406558 },

    { name1: "กองบริการหอพักนักศึกษา", lat1: 16.4788758007154, lon1: 102.82056851807424 },
    { name1: "เขตบ้านพัก (มอดินแดง)", lat1: 16.48170327694714, lon1: 102.82742654257866 },
    { name1: "ศาลเจ้าพ่อมอดินแดง", lat1: 16.477056664887556, lon1: 102.83199467791209 },
    { name1: "KKU Smart Solar Farm", lat1: 16.464279500827562, lon1: 102.80794113980863 },
    { name1: "สระพลาสติก", lat1: 16.473369599487278, lon1: 102.81927072024176 },

    { name1: "สนามกีฬากลาง", lat1: 16.47678876517212, lon1: 102.81813206441755 },
    { name1: "สวนร่มเกล้ากาลพฤกษ์", lat1: 16.4722088787196, lon1: 102.81787723284688 },
    { name1: "สวนร่มเกล้ากาลพฤกษ์", lat1: 16.470881658145593, lon1: 102.81733006225356 },
    { name1: "บ่อนกสวนร่มเกล้า", lat1: 16.474050510813917, lon1: 102.81745880827552 },
    { name1: "เขตบ้านพัก (ศูนย์แพทย์ 1)", lat1: 16.469677827294728, lon1: 102.82265714897919 },

    { name1: "หอพักนักศึกษาคณะพยาบาลศาสตร์ 1", lat1: 16.469266281628745, lon1: 102.8239553380339 },
    { name1: "บริเวณอุทยานเทคโนโลยีการเกษตร", lat1: 16.46544876607981, lon1: 102.81374113539951 },
    { name1: "หอพักคณะพยาบาลศาสตร์", lat1: 16.46796606327391, lon1: 102.81680736441758 },
    { name1: "ลานกิจกรรม ริมบึงสีฐาน", lat1: 16.44458451039093, lon1: 102.81521624128811 },
    { name1: "บึงสีฐาน", lat1: 16.443827, lon1: 102.812215 },

    { name1: "ตลาดมอดินแดง", lat1: 16.47970807277148, lon1: 102.82303983519395 },
    { name1: "พิพิธภัณฑ์ธรรมชาติวิทยา อพ.สธ.", lat1: 16.446093157444547, lon1: 102.8110957805775 },
    { name1: "พิพิธภัณฑ์วิทยาศาสตร์", lat1: 16.44808617666883, lon1: 102.81254872579404 },

    { name1: "สนามเทนนิสสีฐาน", lat1: 16.454626969893233, lon1: 102.81797274805916 },
    { name1: "อุทยานวิทยาศาสตร์ มหาวิทยาลัยขอนแก่น", lat1: 16.455866816989587, lon1: 102.81951933457002 }, 
    { name1: "อ่างกาลพฤกษ์", lat1: 16.462861667808912, lon1: 102.81961060564956 }, 
    { name1: "สนามฟุตบอลสีฐาน (KKM-STADIUM)", lat1: 16.454118566282727, lon1: 102.81663801997868 },
    { name1: "เขตบ้านพัก", lat1: 16.44871624565124, lon1: 102.81194425651434 }, 
    { name1: "หอต้นกล้ากัลปพฤกษ์", lat1: 16.454476243940245, lon1: 102.81435440931406 },
    { name1: "แฟลตป่าดู่ มข.", lat1: 16.455315026233425, lon1: 102.81358357244828 },
    { name1: "บ้านพักศูนย์คอมพิวเตอร์", lat1: 16.45237149146574, lon1: 102.81397385245715 },
    { name1: "หมวดประมง มหาวิทยาลัยขอนแก่น", lat1: 16.4588874466754, lon1: 102.81064190173514 },
    { name1: "สนามบาส ข้างหอ 7", lat1: 16.478122003288398, lon1: 102.81810355936221 },
    { name1: "หอพักนักศึกษาชาย", lat1: 16.478357443909136, lon1: 102.81769635644828 }, 
    { name1: "มหาวิทยาลัยขอนแก่น", lat1: 16.478676, lon1:  102.815779 }, 
    { name1: "หอพักนักศึกษาชาย", lat1: 16.47887506677171, lon1:  102.81834436078442 },
    { name1: "แปลงกังหัน", lat1: 16.47880623934398, lon1:  102.8096526067472 }, 
    
  ];

  // ฟังก์ชันสร้าง Voronoi Diagram และหาจุดที่ใกล้ที่สุด
  const determineLocationVoronoi = (latitude, longitude) => {
    // สร้างชุดพิกัดจาก predefinedLocationPairs (ใช้ [lon1, lat1] เพราะ D3 ต้องการรูปแบบนี้)
    const points = predefinedLocationPairs.map(pair => [pair.lon1, pair.lat1]);

    // สร้าง Delaunay Triangulation จากชุดพิกัด
    const delaunay = Delaunay.from(points);

    // สร้าง Voronoi Diagram ภายในขอบเขตที่กำหนด
    const voronoi = delaunay.voronoi([minLongitude, minLatitude, maxLongitude, maxLatitude]);

    // ค้นหาพิกัดที่ใกล้ที่สุดใน Delaunay
    const index = delaunay.find(longitude, latitude);

    // คืนค่าชื่อของตำแหน่งที่พิกัดนั้นอยู่ หรือค่าเริ่มต้นเป็น "มหาวิทยาลัยขอนแก่น"
    return predefinedLocationPairs[index]?.name1 || "มหาวิทยาลัยขอนแก่น";
  };

  const handleSelectLocation = async (event) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;

    if (!isWithinBounds(latitude, longitude)) {
      setAlertMessage("ตำแหน่งที่เลือกอยู่นอกพื้นที่มหาวิทยาลัยขอนแก่น กรุณาเลือกใหม่");
      setAlertVisible(true);
      return;
    }

    const locationName = determineLocationVoronoi(latitude, longitude);

    setSelectedLocation({ latitude, longitude, name: locationName });

    try {
      const response = await Geocoder.from(latitude, longitude);
      const address = response.results[0].formatted_address;
      const translatedAddress = await translateText(address);

      setSelectedAddress(`${locationName}, ${translatedAddress}`);
      setTranslatedAddress(translatedAddress);

      console.log('ละติจูด:', latitude);
      console.log('ลองจิจูด:', longitude);
      console.log('สถานที่:', locationName);
      console.log('ที่อยู่ (English):', address);
      console.log('ที่อยู่ (Thai):', translatedAddress);
    } catch (error) {
      setAlertMessage("ตำแหน่งไม่ถูกต้องในการดึงข้อมูลที่อยู่");
      setAlertVisible(true);
    }
  };

  const handleConfirmLocation = () => {
    if (!selectedLocation || !selectedLocation.latitude || !selectedLocation.longitude) {
      Alert.alert("โปรดเลือกตำแหน่งในแผนที่");
      return;
    }

    route.params.onLocationSelect({
      latitude: selectedLocation.latitude,
      longitude: selectedLocation.longitude,
      address: translatedAddress || selectedAddress,
      locationName: selectedLocation.name || "", // Include location name (if available)
    });

    navigation.goBack();
  };


  const CustomAlert = ({ visible, title, message, onClose }) => (
    <Modal transparent={true} visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.containerpopup}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <TouchableOpacity style={styles.button} onPress={onClose}>
            <Text style={styles.buttonText}>เลือกตำแหน่งใหม่</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const region = selectedLocation
    ? {
      latitude: selectedLocation.latitude,
      longitude: selectedLocation.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    }
    : currentLocation
      ? {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }
      : undefined;

  return (
    <View style={styles.containermap}>
      <MapView style={styles.map} onPress={handleSelectLocation} region={region}>
        {selectedLocation && <Marker coordinate={selectedLocation} />}
        {currentLocation && <Marker coordinate={currentLocation} pinColor="blue" />}

        {/* เส้นขอบเขตมหาวิทยาลัยขอนแก่น */}
        <Polygon
          coordinates={kkuBoundaryCoordinates}
          strokeColor="#006FFD"
          fillColor="rgba(184, 200, 241, 0.17)"  // สีโปร่งใส
          strokeWidth={2.5}
        />
      </MapView>
      {selectedAddress && (
        <View style={styles.addressContainer}>
          <Text>{selectedLocation?.name ? `${selectedLocation.name}, ${translatedAddress || selectedAddress}` : (translatedAddress || selectedAddress)}</Text>
          <TouchableOpacity onPress={handleConfirmLocation} style={styles.confirmButton}>
            <Text style={styles.confirmButtonText}>ยืนยันตำแหน่ง</Text>
          </TouchableOpacity>
        </View>
      )}

      <CustomAlert
        visible={alertVisible}
        title="อยู่นอกพื้นที่ให้บริการ"
        message={alertMessage}
        onClose={() => setAlertVisible(false)}
      />
    </View>
  );
};

export default Map;


const styles = StyleSheet.create({
  containermap: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  addressContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    elevation: 5,
  },
  confirmButton: {
    backgroundColor: '#006FFD',
    borderRadius: 5,
    padding: 10,
    marginTop: 10,
  },
  confirmButtonText: {
    color: 'white',
    textAlign: 'center',
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  containerpopup: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#006FFD',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    width: '100%',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
  },
});