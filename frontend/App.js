import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Login from './screens/Login';
import Home from './screens/Home';
import Profile from './screens/Profile';
import EditProfile from './screens/EditProfile';
import * as Notifications from 'expo-notifications';

const Stack = createNativeStackNavigator();

// Configuration des notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="Login"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#2196F3',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen 
          name="Login" 
          component={Login}
          options={{ title: 'Connexion' }}
        />
        <Stack.Screen 
          name="Accueil" 
          component={Home}
          options={{ title: 'Accueil' }}
        />
        <Stack.Screen 
          name="Profil" 
          component={Profile}
          options={{ title: 'Profil' }}
        />
        <Stack.Screen 
          name="EditProfile" 
          component={EditProfile}
          options={{ title: 'Modifier le profil' }}
        />
      </Stack.Navigator>
      <StatusBar style="auto" />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});