import React, { useEffect, useState } from 'react';
import { 
  View, Text, FlatList, TouchableOpacity, StyleSheet, Image, BackHandler, Alert, Modal 
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from '@react-navigation/native';
import db from '../database';

export default function UserListScreen({ route, navigation }) {
  const { username } = route.params;
  const [users, setUsers] = useState([]);
  const [currentPhoto, setCurrentPhoto] = useState(null);
  const [aboutVisible, setAboutVisible] = useState(false);

  const loadUsers = () => {
    const allUsers = db.getAllSync('SELECT * FROM users');
    setUsers(allUsers.filter((u) => u.username !== username));
  };

  const loadCurrentUserPhoto = () => {
    const user = db.getFirstSync('SELECT photo FROM users WHERE username = ?', [username]);
    setCurrentPhoto(user?.photo || null);
  };

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
      {/* Profile Section */}
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

      {/* Header Section */}
      <View style={styles.headerContainer}>
        <Text style={styles.header}>Hello, {username}</Text>
        <View style={{ flexDirection: 'row' }}>
          <TouchableOpacity style={styles.aboutButton} onPress={() => setAboutVisible(true)}>
            <Text style={styles.aboutText}>About</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Users List */}
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

      {/* About Modal */}
      <Modal
        visible={aboutVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setAboutVisible(false)}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalContent}>
            <Image
              source={require('../assets/haha.jpeg')}
              style={{
                width: 100,
                height: 100,
                borderRadius: 50,
                marginBottom: 15,
                borderWidth: 3,
                borderColor: '#FFD700',
              }}
            />
            <Text style={styles.modalTitle}>About the App</Text>
            <Text style={styles.modalText}>Author: Eugene J. Wahing</Text>
            <Text style={styles.modalText}>Submitted To: Jay Ian Camelotes</Text>
            <Text style={styles.modalText}>
              Bio: I am Eugene Wahing. You can call me baby. I'm a Gamer and also a Low Budget Programmer.
            </Text>
            <Text style={styles.modalText}>Facebook: So ja</Text>
            <Text style={styles.modalText}>Phone: 09938920645</Text>
            <Text style={styles.modalText}>Address: San Roque, Mbini, Bohol</Text>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setAboutVisible(false)}
            >
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#000' },
  profileContainer: { alignItems: 'center', marginBottom: 20 },
  currentAvatar: { width: 100, height: 100, borderRadius: 50, marginBottom: 10, borderWidth: 2, borderColor: '#FFD700' },
  defaultAvatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#FFD700', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  defaultInitials: { color: '#000', fontSize: 40, fontWeight: 'bold' },
  photoButton: { backgroundColor: '#FFD700', paddingVertical: 8, paddingHorizontal: 15, borderRadius: 10 },
  photoText: { color: '#000', fontWeight: 'bold' },

  headerContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  header: { fontSize: 22, fontWeight: 'bold', color: '#FFD700' },

  logoutButton: { backgroundColor: '#FF4D4D', paddingVertical: 8, paddingHorizontal: 15, borderRadius: 10, marginLeft: 10 },
  logoutText: { color: '#fff', fontWeight: 'bold' },

  aboutButton: { backgroundColor: '#FFD700', paddingVertical: 8, paddingHorizontal: 15, borderRadius: 10 },
  aboutText: { color: '#000', fontWeight: 'bold' },

  userRow: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: '#FFD700', borderRadius: 15, marginBottom: 10 },
  avatar: { width: 50, height: 50, borderRadius: 25, marginRight: 12, borderWidth: 1, borderColor: '#000' },
  defaultAvatarSmall: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  defaultInitialsSmall: { color: '#FFD700', fontSize: 20, fontWeight: 'bold' },
  userText: { color: '#000', fontSize: 18, fontWeight: 'bold' },

  modalBackground: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#FFD700', padding: 25, borderRadius: 15, width: '80%', alignItems: 'center' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15 },
  modalText: { fontSize: 16, marginBottom: 8, color: '#000' },

  closeButton: { marginTop: 15, backgroundColor: '#000', paddingVertical: 8, paddingHorizontal: 20, borderRadius: 10 },
  closeText: { color: '#FFD700', fontWeight: 'bold' }
});
