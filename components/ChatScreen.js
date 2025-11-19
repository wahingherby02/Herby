import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  BackHandler,
  Alert,
  Modal,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import db from '../database';

export default function ChatScreen({ route }) {
  const { sender, receiver } = route.params;
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [senderPhoto, setSenderPhoto] = useState(null);
  const [receiverPhoto, setReceiverPhoto] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const flatListRef = useRef();

  const HEADER_HEIGHT = 60;

  useFocusEffect(
    React.useCallback(() => {
      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => false);
      return () => backHandler.remove();
    }, [])
  );

  const loadMessages = () => {
    const msgs = db.getAllSync(
      `SELECT * FROM messages WHERE 
        (sender = ? AND receiver = ?) OR (sender = ? AND receiver = ?)
        ORDER BY id ASC`,
      [sender, receiver, receiver, sender]
    );
    setMessages(msgs);
  };

  useEffect(() => {
    const sUser = db.getFirstSync('SELECT photo FROM users WHERE username = ?', [sender]);
    const rUser = db.getFirstSync('SELECT photo FROM users WHERE username = ?', [receiver]);
    setSenderPhoto(sUser?.photo || null);
    setReceiverPhoto(rUser?.photo || null);

    loadMessages();

    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: false });
    }, 100);
  }, []);

  const handleSend = (imageUri = null) => {
    if (!text.trim() && !imageUri) return;

    db.runSync(
      'INSERT INTO messages (sender, receiver, message, image, timestamp) VALUES (?, ?, ?, ?, ?)',
      [sender, receiver, text, imageUri, new Date().toISOString()]
    );

    setText('');
    loadMessages();

    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert("Permission required", "Permission to access gallery is required!");
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled) {
      handleSend(result.assets[0].uri);
    }
  };

  const renderMessage = ({ item }) => {
    const isSender = item.sender === sender;
    return (
      <View style={[styles.messageRow, isSender ? styles.senderRow : styles.receiverRow]}>
        {!isSender && (
          <View style={receiverPhoto ? {} : styles.defaultChatAvatar}>
            {receiverPhoto ? (
              <Image source={{ uri: receiverPhoto }} style={styles.avatar} />
            ) : (
              <Text style={styles.chatInitials}>{receiver[0].toUpperCase()}</Text>
            )}
          </View>
        )}

        <View style={[styles.messageBubble, isSender ? styles.senderBubble : styles.receiverBubble]}>
          {item.image && (
            <TouchableOpacity
              onPress={() => {
                setSelectedImage(item.image);
                setModalVisible(true);
              }}
            >
              <Image
                source={{ uri: item.image }}
                style={{ width: 150, height: 150, borderRadius: 12, marginBottom: 5 }}
              />
            </TouchableOpacity>
          )}
          {item.message ? <Text style={{ color: '#000' }}>{item.message}</Text> : null}
        </View>

        {isSender && (
          <View style={senderPhoto ? {} : styles.defaultChatAvatar}>
            {senderPhoto ? (
              <Image source={{ uri: senderPhoto }} style={styles.avatar} />
            ) : (
              <Text style={styles.chatInitials}>{sender[0].toUpperCase()}</Text>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {receiverPhoto ? (
          <Image source={{ uri: receiverPhoto }} style={styles.headerAvatar} />
        ) : (
          <View style={styles.defaultHeaderAvatar}>
            <Text style={styles.headerInitials}>{receiver[0].toUpperCase()}</Text>
          </View>
        )}
        <Text style={styles.headerName}>{receiver}</Text>
      </View>

      {/* Chat and Input */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={HEADER_HEIGHT}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderMessage}
          contentContainerStyle={{ padding: 10, paddingBottom: 20 }}
          keyboardShouldPersistTaps="handled"
        />

        <View style={styles.inputRow}>
          <TouchableOpacity style={styles.photoButton} onPress={pickImage}>
            <Text style={{ color: '#000', fontWeight: 'bold' }}>📷</Text>
          </TouchableOpacity>

          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor="#555"
            value={text}
            onChangeText={setText}
          />

          <TouchableOpacity style={styles.sendButton} onPress={() => handleSend()}>
            <Text style={{ color: '#000', fontWeight: 'bold' }}>Send</Text>
          </TouchableOpacity>
        </View>

        {/* Modal for fullscreen image */}
        {modalVisible && (
          <Modal
            visible={modalVisible}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setModalVisible(false)}
          >
            <View style={styles.modalBackground}>
              <TouchableOpacity
                style={styles.modalCloseArea}
                onPress={() => setModalVisible(false)}
              />
              <Image source={{ uri: selectedImage }} style={styles.modalImage} />
            </View>
          </Modal>
        )}
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    backgroundColor: '#FFD700',
    height: 60,
    marginTop: 40,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
  },
  headerAvatar: { width: 32, height: 32, borderRadius: 16, marginRight: 10 },
  defaultHeaderAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  headerInitials: { color: '#FFD700', fontWeight: 'bold', fontSize: 16 },
  headerName: { fontSize: 18, fontWeight: 'bold', color: '#000' },

  messageRow: { flexDirection: 'row', marginVertical: 6, alignItems: 'flex-end' },
  senderRow: { justifyContent: 'flex-end' },
  receiverRow: { justifyContent: 'flex-start' },
  messageBubble: { maxWidth: '70%', padding: 12, borderRadius: 15 },
  senderBubble: { backgroundColor: '#FFD700', marginLeft: 8, borderTopRightRadius: 0 },
  receiverBubble: { backgroundColor: '#f0f0f0', marginRight: 8, borderTopLeftRadius: 0 },
  avatar: { width: 32, height: 32, borderRadius: 16 },
  defaultChatAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatInitials: { color: '#000', fontWeight: 'bold' },
  inputRow: {
    flexDirection: 'row',
    padding: 15,
    borderTopWidth: 1,
    borderColor: '#444',
    alignItems: 'center',
    backgroundColor: '#111',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#FFD700',
    borderRadius: 25,
    paddingHorizontal: 15,
    height: 50,
    backgroundColor: '#222',
    color: '#FFD700',
  },
  sendButton: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 25,
    marginLeft: 8,
  },
  photoButton: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 25,
    marginRight: 8,
  },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalImage: {
    width: '90%',
    height: '70%',
    borderRadius: 12,
    resizeMode: 'contain',
  },
  modalCloseArea: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
});
