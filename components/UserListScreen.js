import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image, BackHandler, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from '@react-navigation/native';
import db from '../database';

export default function UserListScreen({ route, navigation }) {
  const { username } = route.params;
  const [users, setUsers] = useState([]);
  const [currentPhoto, setCurrentPhoto] = useState(null);

  // Load users
  const loadUsers = () => {
    const allUsers = db.getAllSync('SELECT * FROM users');
    setUsers(allUsers.filter((u) => u.username !== username));
  };

  // Load current user photo
  const loadCurrentUserPhoto = () => {
    const user = db.getFirstSync('SELECT photo FROM users WHERE username = ?', [username]);
    setCurrentPhoto(user?.photo || null);
  };

  // Disable back button on this screen
  useFocusEffect(
    React.useCallback(() => {
      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => true);
      return () => backHandler.remove();
    }, [])
  );

  useEffect(() => {
    loadUsers();
    loadCurrentUserPhoto();
  }, []);

  const handleLogout = () => {
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  const changePhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      db.runSync('UPDATE users SET photo = ? WHERE username = ?', [uri, username]);
      setCurrentPhoto(uri);
      Alert.alert('Success', 'Profile photo updated!');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.profileContainer}>
        {currentPhoto ? (
          <Image source={{ uri: currentPhoto }} style={styles.currentAvatar} />
        ) : (
          <View style={styles.defaultAvatar}>
            <Text style={styles.defaultInitials}>{username[0].toUpperCase()}</Text>
          </View>
        )}
        <TouchableOpacity style={styles.photoButton} onPress={changePhoto}>
          <Text style={styles.photoText}>Change Profile Photo</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.headerContainer}>
        <Text style={styles.header}>Hello, {username}</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={users}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.userRow}
            onPress={() => navigation.navigate('Chat', { sender: username, receiver: item.username })}
          >
            {item.photo ? (
              <Image source={{ uri: item.photo }} style={styles.avatar} />
            ) : (
              <View style={styles.defaultAvatarSmall}>
                <Text style={styles.defaultInitialsSmall}>{item.username[0].toUpperCase()}</Text>
              </View>
            )}
            <Text style={styles.userText}>{item.username}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f4f4f8' },
  profileContainer: { alignItems: 'center', marginBottom: 15 },
  currentAvatar: { width: 100, height: 100, borderRadius: 50, marginBottom: 10 },
  defaultAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#6C63FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  defaultInitials: { color: '#fff', fontSize: 40, fontWeight: 'bold' },
  photoButton: { backgroundColor: '#6C63FF', padding: 8, borderRadius: 10 },
  photoText: { color: '#fff', fontWeight: 'bold' },
  headerContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  header: { fontSize: 22, fontWeight: 'bold', color: '#6C63FF' },
  logoutButton: { backgroundColor: '#FF4D4D', padding: 8, borderRadius: 10 },
  logoutText: { color: '#fff', fontWeight: 'bold' },
  userRow: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: '#6C63FF', borderRadius: 15, marginBottom: 10 },
  avatar: { width: 50, height: 50, borderRadius: 25, marginRight: 12 },
  defaultAvatarSmall: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#6C63FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  defaultInitialsSmall: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  userText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});