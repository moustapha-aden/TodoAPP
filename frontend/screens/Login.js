import React, { useState } from 'react';
import { View, TextInput, Button, Text, Alert } from 'react-native';
import axios from 'axios';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      const res = await axios.post('http://10.0.2.2:8000/api/login', { email, password });
      Alert.alert('Succès', res.data.message);
    } catch (err) {
      Alert.alert('Erreur', 'Email ou mot de passe incorrect');
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Text>Email :</Text>
      <TextInput style={{ borderWidth: 1, marginBottom: 10 }} onChangeText={setEmail} />
      <Text>Mot de passe :</Text>
      <TextInput style={{ borderWidth: 1, marginBottom: 10 }} secureTextEntry onChangeText={setPassword} />
      <Button title="Connexion" onPress={handleLogin} />
    </View>
  );
}
