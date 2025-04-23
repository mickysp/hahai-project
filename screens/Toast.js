import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const Toast = ({ message, onHide }) => {
  if (!message) return null;

  console.log("Toast Message:", message);

  setTimeout(() => {
    onHide();
  }, 5000);

  return (
    <View style={styles.toast}>
      <Text style={styles.toastText}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#333',
    padding: 10,
    alignItems: 'center',
    zIndex: 1000,
  },
  toastText: {
    color: 'white',
    fontSize: 16,
  },
});

export default Toast;
