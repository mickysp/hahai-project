import { View, Text, SafeAreaView, ScrollView, StyleSheet, TouchableOpacity, TextInput, Dimensions, Pressable } from 'react-native'
import React, { useState, useEffect, useCallback } from 'react';
import { FontAwesome } from '@expo/vector-icons';
import { useNavigation } from "@react-navigation/native";

const AddReadOnly = () => {
    const navigation = useNavigation();

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView>
                <TouchableOpacity onPress={() => navigation.navigate('AddCamera')}>
                    <View style={styles.select}>
                        <View>
                            <FontAwesome name="camera" size={30} color="#A6D4FF" />
                        </View>
                    </View>
                </TouchableOpacity>

                <Pressable>
                    <View style={{ marginLeft: 23, marginRight: 23, marginTop: 23 }}>
                        <Text style={{ fontSize: 14 }}>วันที่พบ</Text>
                        <TextInput
                            style={styles.textinput} readOnly />
                    </View>
                </Pressable>

                <Pressable>
                    <View style={{ marginLeft: 23, marginRight: 23, }}>
                        <Text style={{ fontSize: 14 }}>ชนิดสิ่งของ</Text>
                        <TextInput
                            style={styles.textinput} readOnly />
                    </View>
                </Pressable>

                <Pressable>
                    <View style={{ marginLeft: 23, marginRight: 23, }}>
                        <Text style={{ fontSize: 14 }}>สี</Text>
                        <TextInput
                            style={styles.textinput} readOnly />
                    </View>
                </Pressable>

                <Pressable>
                    <View style={{ marginLeft: 23, marginRight: 23, }}>
                        <Text style={{ fontSize: 14 }}>ตำแหน่งที่ตั้ง</Text>
                        <TextInput
                            style={styles.textinput} readOnly />
                    </View>
                </Pressable>

                <Pressable>
                    <View style={{ marginLeft: 23, marginRight: 23, }}>
                        <Text style={{ fontSize: 14 }}>หมายเหตุ</Text>
                        <TextInput
                            multiline={true} numberOfLines={10} style={styles.textarea} readOnly />
                    </View>
                </Pressable>

                <Pressable style={styles.containeradd}>
                    <Text style={styles.textadd}>ยืนยัน</Text>
                </Pressable>
            </ScrollView>
        </SafeAreaView>

    )
}

export default AddReadOnly

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'white'
    },
    select: {
        backgroundColor: '#EAF2FF',
        width: width * 0.9,
        height: height * 0.27,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 30,
        marginLeft: 23,
        marginRight: 23,
        borderRadius: 15,
    },
    textinput: {
        color: "black",
        marginVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        paddingBottom: 12.5,
        paddingTop: 12.5,
        borderColor: '#C5C6CC',
        backgroundColor: '#F0F0F0',
    },
    textarea: {
        height: 150,
        textAlignVertical: 'top',
        borderRadius: 8,
        marginVertical: 8,
        borderWidth: 1,
        borderColor: '#C5C6CC',
        backgroundColor: '#F0F0F0',
    },
    containeradd: {
        marginTop: 20,
        backgroundColor: '#C5C6CC',
        borderRadius: 12,
        padding: 15.5,
        marginLeft: 25,
        marginRight: 25,
        marginBottom: 50
    },
    textadd: {
        color: 'white',
        textAlign: 'center',
    },
});
