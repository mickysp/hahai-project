import { Pressable, StyleSheet, Text, View, Image } from 'react-native';
import React from 'react';
import { useNavigation } from '@react-navigation/native';

const truncateText = (text, maxLength) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

const getTimeElapsed = (createdAt) => {
  const now = new Date();
  const postDate = new Date(createdAt);
  const differenceInMs = now - postDate;

  const seconds = Math.floor(differenceInMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);

  if (months > 0) return `${months} เดือนที่แล้ว${months > 1 ? '' : ''}`;
  if (days > 0) return `${days} วันที่แล้ว${days > 1 ? '' : ''}`;
  if (hours > 0) return `${hours} ชั่วโมงที่แล้ว${hours > 1 ? '' : ''}`;
  if (minutes > 0) return `${minutes} นาทีที่แล้ว${minutes > 1 ? '' : ''}`;

  return `${seconds > 59 ? 59 : seconds} วินาทีที่แล้ว`;
};

const BlogsItem = ({ item }) => {
  const navigation = useNavigation();

  const locationname = truncateText(item?.locationname || '', 17);
  const object_subtype = truncateText(item?.object_subtype || '', 17);
  const username = truncateText(item?.user?.username || '', 17);
  const timeElapsed = getTimeElapsed(item?.createdAt);

  return (
    <Pressable
      onPress={() => navigation.navigate("Bloginfo", {
        obj_picture: item?.obj_picture,
        object_subtype: item?.object_subtype,
        color: item?.color,
        note: item?.note,
        date: item?.date,
        phone: item?.phone,
        location: item?.location,
        locationname: item?.locationname,
        username: item?.user?.username,
        firstname: item?.user?.firstname,
        lastname: item?.user?.lastname,
        profileImage: item?.user?.profileImage,
        userId: item?.user?._id,
        ownerId: item?.user?._id,
        blogId: item?._id,
        latitude: item?.latitude, // Include latitude
        longitude: item?.longitude, // Include longitude
      })}
      style={{
        marginHorizontal: 10,
        marginVertical: 25,
        backgroundColor: "#FFFF",
        borderRadius: 20,
        paddingBottom: 20,
        marginLeft: 15,
      }}
    >
      <Image
        style={{
          width: 160,
          height: 160,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          marginBottom: 10,
        }}
        source={{ uri: item?.obj_picture }}
      />

      <Text
        style={{
          fontWeight: "bold",
          color: "black",
          marginLeft: 10,
          marginBottom: 5,
        }}
      >
        {username}
      </Text>

      <Text style={{ marginLeft: 10 }}>{object_subtype}</Text>

      <Text style={{ color: "gray", marginLeft: 10 }}>
        {locationname}
      </Text>


      <Text
        style={{
          color: "gray",
          marginLeft: 10,
          marginTop: 5,
        }}
      >
        {timeElapsed}
      </Text>
    </Pressable>
  );
};

export default BlogsItem;
