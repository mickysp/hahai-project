import { StyleSheet, Text, View, SafeAreaView, Image, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect } from 'react';

const SuccessRegister = () => {
    const navigation = useNavigation();

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView>
                <View style={styles.imagecontainer}>
                    <Image style={styles.image} source={require('../src/image/successreg.png')} />
                </View>

                <View style={{ marginTop: 10 }}>
                    <Text style={{ fontWeight: 'bold', fontSize: 28, textAlign: 'center' }}>ลงทะเบียนสำเร็จ</Text>
                </View>

                <View style={{ paddingRight: 61, paddingLeft: 61, marginTop: 10, marginBottom: 10 }}>
                    <Text style={{ fontSize: 16, textAlign: 'center' }}>คุณสามารถเข้าใช้บริการหาให้แอปพลิเคชันได้แล้วตอนนี้</Text>
                </View>

                <View style={styles.done}>
                    <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                        <Text style={styles.text}>ตกลง</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

export default SuccessRegister;

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
    },
    imagecontainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 185
    },
    image: {
        width: 220,
        height: 250,
    },
    done: {
        marginTop: 230,
        marginLeft: 25,
        marginRight: 25,
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
