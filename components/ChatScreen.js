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
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import db from '../database';

export default function ChatScreen({ route }) {
  const { sender, receiver } = route.params;
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [senderPhoto, setSenderPhoto] = useState(null);
  const [receiverPhoto, setReceiverPhoto] = useState(null);
  const flatListRef = useRef();

  const HEADER_HEIGHT = 60; // header height

  // Disable hardware back on this screen
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

  const handleSend = () => {
    if (!text.trim()) return;
    db.runSync(
      'INSERT INTO messages (sender, receiver, message, timestamp) VALUES (?, ?, ?, ?)',
      [sender, receiver, text, new Date().toISOString()]
    );
    setText('');
    loadMessages();

    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
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
          <Text style={{ color: isSender ? '#fff' : '#000' }}>{item.message}</Text>
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
    <View style={{ flex: 1, backgroundColor: '#f0f0f5' }}>
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
        keyboardVerticalOffset={HEADER_HEIGHT} // align input above keyboard
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderMessage}
          contentContainerStyle={{ padding: 5, marginTop: HEADER_HEIGHT }} // 👈 add marginTop
          keyboardShouldPersistTaps="handled"
        />

        {/* Input */}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            value={text}
            onChangeText={setText}
          />
          <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    backgroundColor: '#6C63FF',
    height: 60,
    marginTop:40,
  },
  headerAvatar: { width: 32, height: 32, borderRadius: 16, marginRight: 10 },
  defaultHeaderAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  headerInitials: { color: '#6C63FF', fontWeight: 'bold', fontSize: 16 },
  headerName: { fontSize: 18, fontWeight: 'bold', color: '#fff' },

  messageRow: { flexDirection: 'row', marginVertical: 6, alignItems: 'flex-end' },
  senderRow: { justifyContent: 'flex-end' },
  receiverRow: { justifyContent: 'flex-start' },
  messageBubble: { maxWidth: '70%', padding: 10, borderRadius: 15 },
  senderBubble: { backgroundColor: '#6C63FF', marginLeft: 8, borderTopRightRadius: 0 },
  receiverBubble: { backgroundColor: '#e5e5e5', marginRight: 15, borderTopLeftRadius: 0 },
  avatar: { width: 32, height: 32, borderRadius: 16 },
  defaultChatAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#6C63FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatInitials: { color: '#fff', fontWeight: 'bold' },
  inputRow: {
    flexDirection: 'row',
    padding: 15,
    borderTopWidth: 2,
    borderColor: '#ccc',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 25,
    paddingHorizontal: 15,
    height: 50,
    backgroundColor: '#f9f9f9',
  
  },
  sendButton: {
    backgroundColor: '#6C63FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 25,
    marginLeft: 8,
  },
});