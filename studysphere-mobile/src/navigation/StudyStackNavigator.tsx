

import { createNativeStackNavigator } from '@react-navigation/native-stack';

import StudyTabScreen from '../screens/StudyTabScreen';
import MyTasksScreen from '../screens/MyTasksScreen';

export type StudyStackParamList = {
    StudyMain: undefined;
    MyTasks: undefined;
};

const Stack = createNativeStackNavigator<StudyStackParamList>();

export default function StudyStackNavigator() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="StudyMain" component={StudyTabScreen} />
            <Stack.Screen name="MyTasks" component={MyTasksScreen} />
        </Stack.Navigator>
    );
}
