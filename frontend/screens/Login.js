import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

const AuthScreen = ({ navigation }) => {
  const BASE_URL =
    Platform.OS === 'android'
      ? 'http://192.168.100.137:8000'
      : 'http://localhost:8000';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [photo, setPhoto] = useState(null);
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    checkIfLoggedIn();
  }, []);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission refusée', 'Nous avons besoin de votre permission pour accéder à vos photos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setPhoto(result.assets[0].uri);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs.');
      return;
    }

    setLoading(true);

    try {
      console.log('Connexion à:', `${BASE_URL}/api/login`);
      
      const response = await fetch(`${BASE_URL}/api/login`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ email, password })
      });

      console.log('Status:', response.status);
      const text = await response.text();
      console.log('Response:', text);

      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error('Erreur parsing JSON:', e);
        Alert.alert('Erreur', 'Réponse invalide du serveur');
        setLoading(false);
        return;
      }

      if (response.ok) {
        // Sauvegarder les informations utilisateur et le token
        await AsyncStorage.setItem('user', JSON.stringify(data.user));
        await AsyncStorage.setItem('token', data.token);
        
        Alert.alert('Connexion réussie', `Bienvenue ${data.user.name} !`);
        navigation.replace('Accueil');
      } else {
        // Gérer les erreurs de validation
        if (data.errors) {
          const errorMessages = Object.values(data.errors).flat().join('\n');
          Alert.alert('Erreur', errorMessages);
        } else if (data.message) {
          Alert.alert('Erreur', Array.isArray(data.message) ? data.message.join('\n') : data.message);
        } else {
          Alert.alert('Erreur', 'Connexion échouée');
        }
      }
    } catch (error) {
      console.error('Erreur connexion:', error);
      Alert.alert('Erreur', 'Impossible de se connecter au serveur. Vérifiez que le serveur est lancé.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    setLoading(true);

    try {
      console.log('Inscription à:', `${BASE_URL}/api/register`);
      
      const response = await fetch(`${BASE_URL}/api/register`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ 
          name, 
          email, 
          password,
          photo: photo, // URI de la photo ou null
        })
      });

      console.log('Status:', response.status);
      const text = await response.text();
      console.log('Response:', text);

      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error('Erreur parsing JSON:', e);
        Alert.alert('Erreur', 'Réponse invalide du serveur');
        setLoading(false);
        return;
      }

      if (response.ok) {
        // Sauvegarder les informations utilisateur
        await AsyncStorage.setItem('user', JSON.stringify(data.user));
        
        // Votre backend ne renvoie pas de token lors de l'inscription
        // Si vous voulez auto-login après inscription, connectez l'utilisateur
        Alert.alert('Inscription réussie', `Bienvenue ${data.user.name} !`, [
          {
            text: 'OK',
            onPress: () => {
              // Basculer vers le mode connexion
              setIsLogin(true);
              setPassword(''); // Vider le mot de passe pour la sécurité
            }
          }
        ]);
      } else {
        // Gérer les erreurs de validation
        if (data.errors) {
          const errorMessages = Object.values(data.errors).flat().join('\n');
          Alert.alert('Erreur de validation', errorMessages);
        } else {
          Alert.alert('Erreur', data.message || "Inscription échouée");
        }
      }
    } catch (error) {
      console.error('Erreur inscription:', error);
      Alert.alert('Erreur', "Impossible de se connecter au serveur. Vérifiez que le serveur est lancé.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    if (isLogin) {
      handleLogin();
    } else {
      handleRegister();
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir votre adresse email d\'abord');
      return;
    }

    Alert.alert(
      'Mot de passe oublié',
      `Un nouveau mot de passe temporaire sera envoyé à ${email}. Continuer ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Envoyer',
          onPress: async () => {
            try {
              setLoading(true);
              
              const response = await fetch(`${BASE_URL}/api/forgot-password`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Accept': 'application/json',
                },
                body: JSON.stringify({ email: email.trim() }),
              });

              const data = await response.json();

              if (response.ok) {
                Alert.alert(
                  'Email envoyé',
                  'Vérifiez votre boîte email pour votre nouveau mot de passe temporaire.',
                  [{ text: 'OK' }]
                );
              } else {
                Alert.alert('Erreur', data.message || 'Impossible d\'envoyer l\'email');
              }
            } catch (error) {
              console.error('Erreur mot de passe oublié:', error);
              Alert.alert('Erreur', 'Impossible de se connecter au serveur');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const checkIfLoggedIn = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const userStr = await AsyncStorage.getItem('user');
      
      if (token && userStr) {
        // Vérifier si le token est valide
        const response = await fetch(`${BASE_URL}/api/user`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          console.log('Utilisateur déjà connecté, redirection...');
          navigation.replace('Accueil');
        } else {
          // Token invalide, nettoyer le storage
          await AsyncStorage.removeItem('token');
          await AsyncStorage.removeItem('user');
        }
      }
    } catch (error) {
      console.error('Erreur vérification session:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{isLogin ? 'Connexion' : 'Inscription'}</Text>

      {!isLogin && (
        <>
          {/* Photo de profil */}
          <TouchableOpacity style={styles.photoContainer} onPress={pickImage}>
            {photo ? (
              <Image source={{ uri: photo }} style={styles.photo} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Text style={styles.photoPlaceholderText}>📷</Text>
                <Text style={styles.photoText}>Ajouter une photo</Text>
                <Text style={styles.photoSubtext}>(optionnel)</Text>
              </View>
            )}
          </TouchableOpacity>

          <TextInput
            style={styles.input}
            placeholder="Votre Nom Complet"
            placeholderTextColor="#aaa"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />
        </>
      )}

      <TextInput
        style={styles.input}
        placeholder="Adresse email"
        placeholderTextColor="#aaa"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />

      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.passwordInput}
          placeholder="Mot de passe (min. 6 caractères)"
          placeholderTextColor="#aaa"
          secureTextEntry={!showPassword}
          value={password}
          onChangeText={setPassword}
        />
        <TouchableOpacity
          style={styles.eyeButton}
          onPress={() => setShowPassword(!showPassword)}
        >
          <Text style={styles.eyeButtonText}>
            {showPassword ? '🙈' : '👁️'}
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        style={[styles.button, loading && styles.buttonDisabled]} 
        onPress={handleSubmit}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Chargement...' : (isLogin ? 'Se connecter' : "S'inscrire")}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        onPress={() => {
          setIsLogin(!isLogin);
          setPhoto(null);
          setName('');
          setEmail('');
          setPassword('');
        }} 
        style={{ marginTop: 20 }}
        disabled={loading}
      >
        <Text style={{ color: '#4F46E5', textAlign: 'center' }}>
          {isLogin ? "Pas de compte ? S'inscrire" : 'Déjà un compte ? Se connecter'}
        </Text>
      </TouchableOpacity>

      {isLogin && (
        <TouchableOpacity 
          onPress={handleForgotPassword}
          style={{ marginTop: 16 }}
          disabled={loading}
        >
          <Text style={{ color: '#6B7280', textAlign: 'center', fontSize: 14 }}>
            Mot de passe oublié ?
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default AuthScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f8fa',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111',
    marginBottom: 30,
    textAlign: 'center',
  },
  photoContainer: {
    alignSelf: 'center',
    marginBottom: 20,
  },
  photo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#4F46E5',
  },
  photoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4F46E5',
    borderStyle: 'dashed',
  },
  photoPlaceholderText: {
    fontSize: 40,
  },
  photoText: {
    color: '#666',
    fontSize: 12,
    marginTop: 5,
  },
  photoSubtext: {
    color: '#999',
    fontSize: 10,
    marginTop: 2,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 16,
    color: '#000',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 12,
    marginBottom: 16,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#000',
  },
  eyeButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  eyeButtonText: {
    fontSize: 18,
  },
  button: {
    backgroundColor: '#4F46E5',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});