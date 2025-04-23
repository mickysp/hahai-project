import { StyleSheet, Text, View } from 'react-native';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons, FontAwesome, MaterialIcons } from '@expo/vector-icons';

//import { LocationProvider } from '../components/LocationContext';

import Opening from '../screens/Opening';
import Login from '../screens/Login';
import Register from '../screens/Register';
import UserProfile from '../screens/UserProfile';
import RegVerifyemail from '../screens/RegVerifyemail';
import SuccessRegister from '../screens/SuccessRegister';
import ForgotPassword from '../screens/ForgotPassword';
import CheckCodeEmail from '../screens/CheckCodeEmail';
import NewPassword from '../screens/NewPassword';
import UpdatePassword from '../screens/UpdatePassword';
import UpdateProfile from '../screens/UpdateProfile';
import UpdateEmail from '../screens/UpdateEmail';
import Home from '../screens/Home';
import Datasearch from '../screens/Datasearch';
import Searchbar from '../screens/Searchbar';
import AddReadOnly from '../screens/AddReadOnly';
import Bloginfo from '../screens/Bloginfo';
import AddGallery from '../screens/AddGallery';
import AddCamera from '../screens/AddCamera';
import AddBlog from '../screens/AddBlog';
import Camera from '../screens/Camera';
import Dataimgsearch from '../screens/Dataimgsearch';
import SearchGallery from '../screens/SearchGallery';
import ChangeEmail from '../screens/ChangeEmail';
import ConfirmPassword from '../screens/ConfirmPassword';
import Chat from '../screens/Chat';
import ChatPeople from '../screens/ChatPeople';
import Notification from '../screens/Notification';
import MyBlog from '../screens/MyBlog';
import Feedback from '../screens/Feedback';
import Map from '../screens/Map';
import FeedbackSuccess from '../screens/FeedbackSuccess';
import UpdateBlog from '../screens/UpdateBlog';
import Report from '../screens/Report';
import ReportSuccess from '../screens/ReportSuccess';
import ReportConfirm from '../screens/ReportConfirm';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Mappoint from '../screens/Mappoint';
import FeedbackForm from '../screens/FeedbackForm';
import Policy from '../screens/Policy'
import ChangeEmailSuccess from '../screens/ChangeEmailSuccess'
import DetailBlog from '../screens/DetailBlog'
import Received from '../screens/Received'

import { useEffect, useState } from 'react';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();



function BottomTabs() {
    const [isNewMessage, setIsNewMessage] = useState(false);

    useEffect(() => {
        const checkForNewMessages = async () => {
            const hasNewMessage = await AsyncStorage.getItem('newMessage');
            setIsNewMessage(hasNewMessage === 'true');
        };

        checkForNewMessages();
    }, []);

    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    height: 70,
                    paddingBottom: 12,
                    paddingTop: 12,
                    borderTopEndRadius: 45,
                    borderTopLeftRadius: 45
                },
                tabBarActiveTintColor: '#1F2024',
            }}>
            <Tab.Screen
                name="explore"
                component={Home}
                options={{
                    tabBarLabel: "สำรวจ",
                    tabBarLabelStyle: { fontSize: 12 },
                    tabBarIcon: ({ focused }) =>
                        focused ? (
                            <MaterialIcons name="explore" size={27} color="#006FFD" />
                        ) : (
                            <MaterialIcons name="explore" size={27} color="#D4D6DD" />
                        ),
                }}
            />
            <Tab.Screen
                name="ChatPeople"
                component={ChatPeople}
                options={{
                    tabBarLabel: "แชท",
                    tabBarLabelStyle: { fontSize: 12 },
                    tabBarIcon: ({ focused }) => (
                        focused ? (
                            <Ionicons name="chatbubble" size={27} color="#006FFD" />
                        ) : (
                            <Ionicons name="chatbubble" size={27} color="#D4D6DD" />
                        )
                    ),
                }}
            />
            <Tab.Screen
                name="Notification"
                component={Notification}
                options={{
                    tabBarLabel: "แจ้งเตือน",
                    tabBarLabelStyle: { fontSize: 12 },
                    tabBarIcon: ({ focused }) => (
                        focused ? (
                            <MaterialIcons name="notifications" size={28} color="#006FFD" />
                        ) : (
                            <MaterialIcons name="notifications" size={28} color="#D4D6DD" />
                        )
                    ),
                }}
            />
            <Tab.Screen
                name="profile"
                component={UserProfile}
                options={{
                    tabBarLabel: "โปรไฟล์",
                    tabBarLabelStyle: { fontSize: 12 },
                    tabBarIcon: ({ focused }) =>
                        focused ? (
                            <FontAwesome name="user" size={27} color="#006FFD" />
                        ) : (
                            <FontAwesome name="user" size={27} color="#D4D6DD" />
                        ),
                }}
            />
            <Tab.Screen
                name="searchbar"
                component={Searchbar}
                options={{
                    tabBarButton: () => null,
                    tabBarVisible: false,
                }}
            />
            <Tab.Screen
                name="datasearch"
                component={Datasearch}
                options={{
                    tabBarButton: () => null,
                    tabBarVisible: false,
                }}
            />

            <Tab.Screen
                name="dataimgsearch"
                component={Dataimgsearch}
                options={{
                    tabBarButton: () => null,
                    tabBarVisible: false,
                }}
            />
        </Tab.Navigator>
    );
}

const StackNavigator = () => {
    return (
        // <LocationProvider>
        <NavigationContainer>
            <Stack.Navigator>
                <Stack.Screen name="Opening" component={Opening} options={{ headerShown: false }} />
                <Stack.Screen name="Home" component={BottomTabs} options={{ headerShown: false }} />
                <Stack.Screen name="Login" component={Login} options={{ headerShown: false }} />
                <Stack.Screen name="Register" component={Register} options={{ headerShown: false }} />
                <Stack.Screen name="RegVerifyemail" component={RegVerifyemail} options={{ headerShown: false }} />
                <Stack.Screen name="SuccessRegister" component={SuccessRegister} options={{ headerShown: false }} />
                <Stack.Screen name="ChangeEmailSuccess" component={ChangeEmailSuccess} options={{ headerShown: false }} />
                <Stack.Screen name="ForgotPassword" component={ForgotPassword} options={{ headerShown: false }} />
                <Stack.Screen name="CheckCodeEmail" component={CheckCodeEmail} options={{ headerShown: false }} />
                <Stack.Screen name="NewPassword" component={NewPassword} options={{ headerShown: false }} />
                <Stack.Screen name="UpdatePassword" component={UpdatePassword} options={{ headerShown: false }} />
                <Stack.Screen name="UpdateEmail" component={UpdateEmail} options={{ headerShown: false }} />
                <Stack.Screen name="Bloginfo" component={Bloginfo} options={{ headerShown: false }} />
                <Stack.Screen name="AddGallery" component={AddGallery} options={{ headerShown: false }} />
                <Stack.Screen name="AddCamera" component={AddCamera} options={{ headerShown: false }} />
                <Stack.Screen name="Camera" component={Camera} options={{ headerShown: false }} />
                <Stack.Screen name="Dataimgsearch" component={Dataimgsearch} options={{ headerShown: false }} />
                <Stack.Screen name="Datasearch" component={Datasearch} options={{ headerShown: false }} />
                <Stack.Screen name="SearchGallery" component={SearchGallery} options={{ headerShown: false }} />
                <Stack.Screen name="ChangeEmail" component={ChangeEmail} options={{ headerShown: false }} />
                <Stack.Screen name="ConfirmPassword" component={ConfirmPassword} options={{ headerShown: false }} />
                <Stack.Screen name="Map" component={Map} options={{ headerShown: false }} />
                <Stack.Screen name="UserProfile" component={UserProfile} options={{ headerShown: false }} />
                <Stack.Screen name="FeedbackSuccess" component={FeedbackSuccess} options={{ headerShown: false }} />
                <Stack.Screen name="ReportSuccess" component={ReportSuccess} options={{ headerShown: false }} />
                <Stack.Screen name="Chat" component={Chat} />
                <Stack.Screen name="ChatPeople" component={ChatPeople} options={{ headerShown: false }} />
                <Stack.Screen name="BottomTabs" component={BottomTabs} options={{ headerShown: false }} />
                <Stack.Screen name="Mappoint" component={Mappoint} options={{ headerShown: false }} />
                <Stack.Screen name="DetailBlog" component={DetailBlog} options={{ headerShown: false }} />
                <Stack.Screen name="AddReadOnly" component={AddReadOnly}
                    options={{
                        title: 'สร้างกระทู้',
                        headerStyle: {
                            elevation: 0,
                            borderBottomWidth: 0,
                        },
                        headerTitleStyle: {
                            fontWeight: 'bold',
                            fontSize: 18,
                        },
                        headerTitleAlign: 'center',
                    }} />
                <Stack.Screen name="AddBlog" component={AddBlog}
                    options={{
                        title: 'สร้างกระทู้',
                        headerStyle: {
                            elevation: 0,
                            borderBottomWidth: 0,
                        },
                        headerTitleStyle: {
                            fontWeight: 'bold',
                            fontSize: 18,
                        },
                        headerTitleAlign: 'center',
                    }} />
                <Stack.Screen name="UpdateProfile" component={UpdateProfile}
                    options={{
                        title: 'อัพเดตโปรไฟล์',
                        headerStyle: {
                            elevation: 0,
                            borderBottomWidth: 0,
                        },
                        headerTitleStyle: {
                            fontWeight: 'bold',
                            fontSize: 18,
                        },
                        headerTitleAlign: 'center',
                    }} />
                <Stack.Screen name="MyBlog" component={MyBlog}
                    options={{
                        title: 'กระทู้ของฉัน',
                        headerStyle: {
                            elevation: 0,
                            borderBottomWidth: 0,
                        },
                        headerTitleStyle: {
                            fontWeight: 'bold',
                            fontSize: 18,
                        },
                        headerTitleAlign: 'center',
                    }} />
                <Stack.Screen name="Feedback" component={Feedback}
                    options={{
                        title: 'รายงานปัญหา',
                        headerStyle: {
                            elevation: 0,
                            borderBottomWidth: 0,
                        },
                        headerTitleStyle: {
                            fontWeight: 'bold',
                            fontSize: 18,
                        },
                        headerTitleAlign: 'center',
                    }} />
                <Stack.Screen name="FeedbackForm" component={FeedbackForm}
                    options={{
                        title: 'ศูนย์ความช่วยเหลือ',
                        headerStyle: {
                            elevation: 0,
                            borderBottomWidth: 0,
                        },
                        headerTitleStyle: {
                            fontWeight: 'bold',
                            fontSize: 18,
                        },
                        headerTitleAlign: 'center',
                    }} />
                <Stack.Screen name="UpdateBlog" component={UpdateBlog}
                    options={{
                        title: 'อัพเดตกระทู้',
                        headerStyle: {
                            elevation: 0,
                            borderBottomWidth: 0,
                        },
                        headerTitleStyle: {
                            fontWeight: 'bold',
                            fontSize: 18,
                        },
                        headerTitleAlign: 'center',
                    }} />
                <Stack.Screen name="Report" component={Report}
                    options={{
                        title: 'รายงาน',
                        headerStyle: {
                            elevation: 0,
                            borderBottomWidth: 0,
                        },
                        headerTitleStyle: {
                            fontWeight: 'bold',
                            fontSize: 18,
                        },
                        headerTitleAlign: 'center',
                    }} />
                <Stack.Screen name="ReportConfirm" component={ReportConfirm}
                    options={{
                        title: 'รายงาน',
                        headerStyle: {
                            elevation: 0,
                            borderBottomWidth: 0,
                        },
                        headerTitleStyle: {
                            fontWeight: 'bold',
                            fontSize: 18,
                        },
                        headerTitleAlign: 'center',
                    }} />
                <Stack.Screen name="Policy" component={Policy}
                    options={{
                        title: 'กฎและข้อกำหนดการใช้งาน',
                        headerStyle: {
                            elevation: 0,
                            borderBottomWidth: 0,
                        },
                        headerTitleStyle: {
                            fontWeight: 'bold',
                            fontSize: 18,
                        },
                        headerTitleAlign: 'center',
                    }} />
                <Stack.Screen name="Received" component={Received}
                    options={{
                        title: 'ยืนยันการรับสิ่งของ',
                        headerStyle: {
                            elevation: 0,
                            borderBottomWidth: 0,
                        },
                        headerTitleStyle: {
                            fontWeight: 'bold',
                            fontSize: 18,
                        },
                        headerTitleAlign: 'center',
                    }} />
            </Stack.Navigator>
        </NavigationContainer>
        // </LocationProvider>
    );
};

export default StackNavigator;

const styles = StyleSheet.create({});
