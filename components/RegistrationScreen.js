import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet } from 'react-native';
import db from '../database';

export default function RegistrationScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = () => {
    if (!username || !password) {
      Alert.alert('Error', 'Please enter username and password.');
      return;
    }

    const exists = db.getFirstSync('SELECT * FROM users WHERE username = ?', [username]);
    if (exists) {
      Alert.alert('Error', 'Username already exists!');
      return;
    }

    db.runSync('INSERT INTO users (username, password, photo) VALUES (?, ?, ?)', [
      username,
      password,
      null,
    ]);

    Alert.alert('Success', 'User registered!', [
      { text: 'OK', onPress: () => navigation.navigate('Login') },
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Register</Text>
      <TextInput placeholder="Username" value={username} onChangeText={setUsername} style={styles.input} />
      <TextInput placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry style={styles.input} />
      <Button title="Register" onPress={handleRegister} />
      <View style={{ height: 10 }} />
      <Button title="Go to Login" onPress={() => navigation.navigate('Login')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center', backgroundColor: '#f4f4f8' },
  title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 10, borderRadius: 8 },
});