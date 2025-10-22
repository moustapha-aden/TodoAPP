import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  TextInput,
  Modal,
  RefreshControl,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

const Home = ({ navigation }) => {
  const BASE_URL =
    Platform.OS === 'android'
      ? 'http://192.168.100.137:8000'
      : 'http://localhost:8000';

  // États pour l'utilisateur
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  // États pour les todos
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // États pour le modal
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTodo, setEditingTodo] = useState(null);
  const [todoTitle, setTodoTitle] = useState('');
  const [todoDescription, setTodoDescription] = useState('');
  const [todoPriority, setTodoPriority] = useState('medium');
  const [todoDueDate, setTodoDueDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    if (user && token) {
      loadTodos();
    }
  }, [user, token]);

  const loadUserData = async () => {
    try {
      const userStr = await AsyncStorage.getItem('user');
      const tokenStr = await AsyncStorage.getItem('token');
      
      if (userStr && tokenStr) {
        setUser(JSON.parse(userStr));
        setToken(tokenStr);
      } else {
        navigation.replace('Login');
      }
    } catch (error) {
      console.error('Erreur chargement utilisateur:', error);
      navigation.replace('Login');
    }
  };

  const loadTodos = async () => {
    try {
      const response = await fetch(`${BASE_URL}/api/todos`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTodos(data.todos || []);
      } else if (response.status === 401) {
        // Token expiré, rediriger vers login
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('user');
        navigation.replace('Login');
      } else {
        Alert.alert('Erreur', 'Impossible de charger les todos');
      }
    } catch (error) {
      console.error('Erreur chargement todos:', error);
      Alert.alert('Erreur', 'Impossible de se connecter au serveur');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadTodos();
    setRefreshing(false);
  }, [token]);

  const handleLogout = async () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: async () => {
            try {
              if (token) {
                await fetch(`${BASE_URL}/api/logout`, {
                  method: 'POST',
                  headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`,
                  },
                });
              }
            } catch (error) {
              console.error('Erreur déconnexion:', error);
            }
            
            await AsyncStorage.removeItem('token');
            await AsyncStorage.removeItem('user');
            navigation.replace('Login');
          },
        },
      ]
    );
  };

  const openModal = (todo = null) => {
    if (todo) {
      setEditingTodo(todo);
      setTodoTitle(todo.title);
      setTodoDescription(todo.description || '');
      setTodoPriority(todo.priority || 'medium');
      setTodoDueDate(todo.due_date ? new Date(todo.due_date) : new Date());
    } else {
      setEditingTodo(null);
      setTodoTitle('');
      setTodoDescription('');
      setTodoPriority('medium');
      setTodoDueDate(new Date());
    }
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingTodo(null);
    setTodoTitle('');
    setTodoDescription('');
    setTodoPriority('medium');
    setTodoDueDate(new Date());
    setShowDatePicker(false);
  };

  const saveTodo = async () => {
    if (!todoTitle.trim()) {
      Alert.alert('Erreur', 'Le titre est obligatoire');
      return;
    }

    try {
      const todoData = {
        title: todoTitle.trim(),
        description: todoDescription.trim(),
        priority: todoPriority,
        due_date: todoDueDate.toISOString().split('T')[0],
      };

      const url = editingTodo 
        ? `${BASE_URL}/api/todos/${editingTodo.id}`
        : `${BASE_URL}/api/todos`;
      
      const method = editingTodo ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(todoData),
      });

      if (response.ok) {
        const data = await response.json();
        Alert.alert('Succès', data.message);
        closeModal();
        loadTodos();
      } else {
        const errorData = await response.json();
        Alert.alert('Erreur', errorData.message || 'Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error('Erreur sauvegarde todo:', error);
      Alert.alert('Erreur', 'Impossible de sauvegarder');
    }
  };

  const toggleTodoComplete = async (todo) => {
    try {
      const response = await fetch(`${BASE_URL}/api/todos/${todo.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ completed: !todo.completed }),
      });

      if (response.ok) {
        loadTodos();
      } else {
        Alert.alert('Erreur', 'Impossible de mettre à jour le todo');
      }
    } catch (error) {
      console.error('Erreur toggle todo:', error);
      Alert.alert('Erreur', 'Impossible de mettre à jour');
    }
  };

  const deleteTodo = async (todo) => {
    Alert.alert(
      'Supprimer',
      `Êtes-vous sûr de vouloir supprimer "${todo.title}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`${BASE_URL}/api/todos/${todo.id}`, {
                method: 'DELETE',
                headers: {
                  'Accept': 'application/json',
                  'Authorization': `Bearer ${token}`,
                },
              });

              if (response.ok) {
                Alert.alert('Succès', 'Todo supprimé');
                loadTodos();
              } else {
                Alert.alert('Erreur', 'Impossible de supprimer le todo');
              }
            } catch (error) {
              console.error('Erreur suppression todo:', error);
              Alert.alert('Erreur', 'Impossible de supprimer');
            }
          },
        },
      ]
    );
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      case 'low': return '#10B981';
      default: return '#6B7280';
    }
  };

  const getPriorityText = (priority) => {
    switch (priority) {
      case 'high': return 'Haute';
      case 'medium': return 'Moyenne';
      case 'low': return 'Basse';
      default: return 'Moyenne';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
  };

  const renderTodo = ({ item }) => (
    <View style={styles.todoCard}>
      <View style={styles.todoHeader}>
        <TouchableOpacity
          style={styles.checkboxContainer}
          onPress={() => toggleTodoComplete(item)}
        >
          <View style={[
            styles.checkbox,
            item.completed && styles.checkboxChecked
          ]}>
            {item.completed && <Text style={styles.checkmark}>✓</Text>}
          </View>
        </TouchableOpacity>
        
        <View style={styles.todoContent}>
          <Text style={[
            styles.todoTitle,
            item.completed && styles.todoTitleCompleted
          ]}>
            {item.title}
          </Text>
          {item.description && (
            <Text style={styles.todoDescription}>{item.description}</Text>
          )}
          
          <View style={styles.todoMeta}>
            <View style={[
              styles.priorityBadge,
              { backgroundColor: getPriorityColor(item.priority) }
            ]}>
              <Text style={styles.priorityText}>
                {getPriorityText(item.priority)}
              </Text>
            </View>
            
            {item.due_date && (
              <Text style={styles.dueDate}>
                📅 {formatDate(item.due_date)}
              </Text>
            )}
          </View>
        </View>
      </View>
      
      <View style={styles.todoActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => openModal(item)}
        >
          <Text style={styles.actionButtonText}>✏️</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => deleteTodo(item)}
        >
          <Text style={styles.actionButtonText}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header avec profil utilisateur */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.profileSection}
          onPress={() => navigation.navigate('Profil')}
        >
          {user?.photo ? (
            <Image source={{ uri: user.photo }} style={styles.profilePhoto} />
          ) : (
            <View style={styles.profilePhotoPlaceholder}>
              <Text style={styles.profilePhotoText}>
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </Text>
            </View>
          )}
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.name}</Text>
            <Text style={styles.profileEmail}>{user?.email}</Text>
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Déconnexion</Text>
        </TouchableOpacity>
      </View>

      {/* Liste des todos */}
      <FlatList
        data={todos}
        renderItem={renderTodo}
        keyExtractor={(item) => item.id.toString()}
        style={styles.todosList}
        contentContainerStyle={styles.todosListContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Aucun todo pour le moment</Text>
            <Text style={styles.emptySubtext}>Appuyez sur + pour en ajouter un</Text>
          </View>
        }
      />

      {/* Bouton flottant pour ajouter */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => openModal()}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Modal pour créer/éditer un todo */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingTodo ? 'Modifier le todo' : 'Nouveau todo'}
            </Text>
            
            <TextInput
              style={styles.modalInput}
              placeholder="Titre du todo"
              value={todoTitle}
              onChangeText={setTodoTitle}
            />
            
            <TextInput
              style={[styles.modalInput, styles.modalTextArea]}
              placeholder="Description (optionnel)"
              value={todoDescription}
              onChangeText={setTodoDescription}
              multiline
              numberOfLines={3}
            />
            
            <View style={styles.priorityContainer}>
              <Text style={styles.priorityLabel}>Priorité :</Text>
              <View style={styles.priorityButtons}>
                {['low', 'medium', 'high'].map((priority) => (
                  <TouchableOpacity
                    key={priority}
                    style={[
                      styles.priorityButton,
                      todoPriority === priority && styles.priorityButtonSelected,
                      { borderColor: getPriorityColor(priority) }
                    ]}
                    onPress={() => setTodoPriority(priority)}
                  >
                    <Text style={[
                      styles.priorityButtonText,
                      todoPriority === priority && styles.priorityButtonTextSelected
                    ]}>
                      {getPriorityText(priority)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
    </View>
            
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.dateButtonText}>
                📅 Date d'échéance: {todoDueDate.toLocaleDateString('fr-FR')}
              </Text>
            </TouchableOpacity>
            
            {showDatePicker && (
              <DateTimePicker
                value={todoDueDate}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowDatePicker(false);
                  if (selectedDate) {
                    setTodoDueDate(selectedDate);
                  }
                }}
              />
            )}
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalButtonCancel}
                onPress={closeModal}
              >
                <Text style={styles.modalButtonCancelText}>Annuler</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.modalButtonSave}
                onPress={saveTodo}
              >
                <Text style={styles.modalButtonSaveText}>
                  {editingTodo ? 'Modifier' : 'Créer'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default Home;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f8fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f7f8fa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profilePhoto: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  profilePhotoPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  profilePhotoText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  profileEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  logoutButton: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  logoutButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  todosList: {
    flex: 1,
  },
  todosListContent: {
    padding: 16,
  },
  todoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  todoHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkboxContainer: {
    marginRight: 12,
    marginTop: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  todoContent: {
    flex: 1,
  },
  todoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  todoTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#6B7280',
  },
  todoDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  todoMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  priorityText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  dueDate: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  todoActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
  actionButtonText: {
    fontSize: 18,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    color: '#6B7280',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  modalTextArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  priorityContainer: {
    marginBottom: 16,
  },
  priorityLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  priorityButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  priorityButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 2,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  priorityButtonSelected: {
    backgroundColor: '#4F46E5',
  },
  priorityButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6B7280',
  },
  priorityButtonTextSelected: {
    color: '#fff',
  },
  dateButton: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#111827',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  modalButtonCancel: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    marginRight: 8,
  },
  modalButtonCancelText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6B7280',
  },
  modalButtonSave: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    marginLeft: 8,
  },
  modalButtonSaveText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
});