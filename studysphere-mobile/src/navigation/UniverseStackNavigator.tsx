import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import UniverseScreen from '../screens/UniverseScreen';

import { UniverseStackParamList } from '../types/navigation';
import SubjectScreen from '../screens/SubjectScreen';
import TopicScreen from '../screens/TopicScreen';
import TopicDetailScreen from '../screens/TopicDetailScreen';
const Stack = createNativeStackNavigator<UniverseStackParamList>();

export default function UniverseStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Universes" component={UniverseScreen} />
      <Stack.Screen name="Subjects" component={SubjectScreen} />
      <Stack.Screen name="Topics" component={TopicScreen} />
      <Stack.Screen name="TopicDetail" component={TopicDetailScreen} />
    </Stack.Navigator>
  );
}