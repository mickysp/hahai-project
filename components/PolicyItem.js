import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Button, ScrollView, StyleSheet, Alert, Dimensions } from 'react-native';
import { Checkbox } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

const PolicyItem = ({ visible, onClose }) => {

  if (!visible) {
    return null; // ไม่แสดงผลหาก PolicyItem ไม่ควรแสดง
  }
  const navigation = useNavigation();

  const [isChecked, setIsChecked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isScrolledToEnd, setIsScrolledToEnd] = useState(false);
  const [hasScrolledToEndOnce, setHasScrolledToEndOnce] = useState(false);
  const scrollViewRef = useRef(null);

  useEffect(() => {
    const checkPolicyAcceptance = async () => {
      try {
        const accepted = await AsyncStorage.getItem('hasAcceptedPolicy');
        if (accepted === 'true') {
          navigation.navigate('BottomTabs', { screen: 'Home' });
        }
      } catch (error) {
        console.error('Error checking policy acceptance:', error);
      } finally {
        setLoading(false);
      }
    };

    checkPolicyAcceptance();
  }, [navigation]);

  const handleAcceptPolicy = () => {
    if (hasScrolledToEndOnce && isChecked) {
      onClose(); // ปิดหน้าต่าง Policy
    } else if (!hasScrolledToEndOnce) {
      Alert.alert('ข้อผิดพลาด', 'กรุณาเลื่อนอ่านนโยบายให้ครบก่อน');
    } else if (!isChecked) {
      Alert.alert('ข้อผิดพลาด', 'กรุณาติ๊กยอมรับนโยบายก่อน');
    }
  };

  const handleScroll = (event) => {
    const contentHeight = event.nativeEvent.contentSize.height;
    const contentOffsetY = event.nativeEvent.contentOffset.y;
    const visibleHeight = event.nativeEvent.layoutMeasurement.height;

    if (contentHeight - contentOffsetY <= visibleHeight) {
      setIsScrolledToEnd(true);
      setHasScrolledToEndOnce(true);
    } else {
      if (hasScrolledToEndOnce) {
        setIsScrolledToEnd(true);
      } else {
        setIsScrolledToEnd(false);
      }
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>กำลังโหลด...</Text>
      </View>
    );
  }

  return (
    <View style={styles.overlay}>
      <View style={[styles.container, { width: width * 0.85, height: height * 0.7 }]}>
        <Text style={styles.header}>กฎและข้อกำหนดการใช้งาน {'\n'}Hahai Application</Text>
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          <Text style={styles.policyText}>
            <Text style={styles.bold}>1. การใช้งานที่เหมาะสม</Text>
            {'\n'}ผู้ใช้จะต้องใช้ Hahai Application ในการแจ้งพบและติดตามสิ่งของสูญหายเท่านั้น ห้ามใช้แอปในทางที่ผิดกฎหมาย หรือทำให้เกิดความเสียหายแก่บุคคลอื่นหรือสังคม
            {'\n\n'}
            <Text style={styles.bold}>2. ห้ามใช้ภาพที่มีเนื้อหาล่อแหลม</Text>
            {'\n'}การโพสต์ภาพที่มีเนื้อหาล่อแหลมหรือไม่เหมาะสม เช่น ภาพที่เกี่ยวข้องกับการละเมิดสิทธิ์ของผู้อื่น ภาพอนาจาร ภาพที่มีเนื้อหาทางเพศ หรือภาพที่มีการใช้ความรุนแรง จะถูกห้ามโดยเด็ดขาด หากตรวจพบภาพเหล่านี้ ทางแอปจะทำการดำเนินการตามมาตรการที่เหมาะสมทันที
            {'\n\n'}
            <Text style={styles.bold}>3. การตรวจสอบและการระงับบัญชีผู้ใช้</Text>
            {'\n'}หากพบว่าผู้ใช้ละเมิดกฎข้อ 2 (ห้ามใช้ภาพที่มีเนื้อหาล่อแหลม) หรือทำการกระทำที่ไม่เหมาะสม ทางแอปขอสงวนสิทธิ์ในการตรวจสอบเนื้อหาที่ถูกโพสต์และทำการแบนบัญชีผู้ใช้ที่ละเมิดกฎ โดยไม่ต้องแจ้งให้ทราบล่วงหน้า
            {'\n\n'}
            <Text style={styles.bold}>4. ความรับผิดชอบของผู้ใช้</Text>
            {'\n'}ผู้ใช้ทุกท่านรับผิดชอบในการโพสต์ข้อมูลและภาพที่ถูกต้องตามข้อกำหนดของแอป รวมถึงข้อมูลส่วนบุคคลของผู้อื่น หากมีการละเมิดสิทธิ์หรือกฎหมายเกี่ยวกับการใช้งานแอป ผู้ใช้จะต้องรับผิดชอบแต่เพียงผู้เดียว
            {'\n\n'}
            <Text style={styles.bold}>5. การบังคับใช้กฎ</Text>
            {'\n'}Hahai Application จะทำการตรวจสอบเนื้อหาภาพและข้อความที่โพสต์ภายในแอป และหากพบว่ามีการฝ่าฝืนข้อกำหนดใด ๆ ทางทีมงานจะดำเนินการระงับบัญชีหรือลบบัญชีผู้ใช้ที่เกี่ยวข้องตามที่เห็นสมควร
            {'\n\n'}
            <Text style={styles.bold}>6. การอัปเดตกฎการใช้งาน</Text>
            {'\n'}ทางแอปขอสงวนสิทธิ์ในการอัพเดตหรือปรับเปลี่ยนกฎการใช้งานโดยไม่ต้องแจ้งให้ทราบล่วงหน้า ผู้ใช้ควรติดตามการเปลี่ยนแปลงกฎเหล่านี้เพื่อให้แน่ใจว่าใช้งานแอปได้อย่างถูกต้องและปลอดภัย
            {'\n\n'}
            <Text style={styles.bold}>7. การสนับสนุนและติดต่อ</Text>
            {'\n'}หากมีคำถามหรือข้อสงสัยเกี่ยวกับกฎการใช้งานหรือการกระทำที่ละเมิดกฎกรุณาติดต่อทีมงานผ่านช่องทางที่กำหนดไว้ในแอป
            {'\n'}
          </Text>
        </ScrollView>

        <View style={styles.checkboxContainer}>
          <Checkbox
            status={isChecked ? 'checked' : 'unchecked'}
            onPress={() => setIsChecked(!isChecked)}
            color={isChecked ? '#006FFD' : '#006FFD'}
            uncheckedColor="#C0C0C0"
            style={[styles.checkbox, isChecked && styles.checked]}
            disabled={!isScrolledToEnd}
          />
          <Text style={styles.checkboxText}>ฉันได้อ่านและยอมรับ กฎและข้อกำหนดการใช้งานของ Hahai Application ดังกล่าวแล้ว</Text>
        </View>

        <Button
          title="ยอมรับ"
          onPress={handleAcceptPolicy}
          disabled={!isChecked || !isScrolledToEnd}
        />
      </View>
    </View>
  );
};

export default PolicyItem;

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  header: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  scrollView: {
    width: '100%',
    marginBottom: 20,
  },
  policyText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#333',
  },
  bold: {
    fontWeight: 'bold',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  checkbox: {
    marginRight: 10,
  },
  checkboxText: {
    fontSize: 14,
    color: '#333',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  loadingText: {
    fontSize: 16,
    color: '#333',
  },
});