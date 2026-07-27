
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '../context/ThemeContext';
import { RoomListScreen } from '../screens/RoomListScreen';

import CreateRoomScreen from '../screens/CreateRoomScreen';

import ParticipantsScreen from '../screens/Participants';
import RoomDetailScreen from '../screens/RoomDetail';
import RoomSettingsScreen from '../screens/RoomSettings';

export type StudyRoomStackParamList = {
  RoomList: undefined;
  RoomDetail: { id: string };
  CreateRoom: undefined;
  Participants: { id: string };
  RoomSettings: { id: string };
};

const Stack = createNativeStackNavigator<StudyRoomStackParamList>();

export const StudyRoomNavigator = () => {
  const { colors } = useTheme();
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: 'bold' },
        headerShadowVisible: false,
      }}>
      
      {/* Mevcut Liste Ekranın */}
      <Stack.Screen
        name="RoomList"
        component={RoomListScreen}
        options={{ headerShown: false }}
      />
      
      <Stack.Screen 
        name="CreateRoom" 
        component={CreateRoomScreen} 
        options={{ title: 'Yeni Oda Kur' }} 
      />
      <Stack.Screen 
        name="RoomDetail" 
        component={RoomDetailScreen} 
        options={{ title: 'Oda Detayı' }} 
      />
      <Stack.Screen 
        name="Participants" 
        component={ParticipantsScreen} 
        options={{ title: 'Katılımcılar' }} 
      />
      <Stack.Screen 
        name="RoomSettings" 
        component={RoomSettingsScreen} 
        options={{ title: 'Oda Ayarları' }} 
      />

    </Stack.Navigator>
  );
};