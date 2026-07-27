
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SessionHistoryScreen from '../screens/SessionHistory';
import StatisticsScreen from '../screens/StatisticsScreen';
import SessionDetailScreen from '../screens/SessionDetail';
import AchievementsScreen from '../screens/AchievementsScreen';
import { useTheme } from '../context/ThemeContext';

export type StatisticsStackParamList = {
    StatsMain: undefined;
    SessionHistory: undefined;
    SessionDetail: { id: string };
    Achievements: undefined;
};

const Stack = createNativeStackNavigator<StatisticsStackParamList>();

export default function StatisticsStackNavigator() {
    const { colors } = useTheme();
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="StatsMain" component={StatisticsScreen} />
            <Stack.Screen name="SessionHistory" component={SessionHistoryScreen} />
            <Stack.Screen
                name="Achievements"
                component={AchievementsScreen}
                options={{
                    headerShown: true,
                    title: 'Başarımlar',
                    headerStyle: { backgroundColor: colors.surface },
                    headerTintColor: colors.text,
                    headerTitleStyle: { fontWeight: 'bold' },
                    headerShadowVisible: false,
                }}
            />
            <Stack.Screen
                name="SessionDetail"
                component={SessionDetailScreen}
                options={{
                    headerShown: true,
                    title: 'Seans Detayı',
                    headerStyle: { backgroundColor: colors.surface },
                    headerTintColor: colors.text,
                    headerTitleStyle: { fontWeight: 'bold' },
                    headerShadowVisible: false,
                }}
            />
        </Stack.Navigator>
    );
}