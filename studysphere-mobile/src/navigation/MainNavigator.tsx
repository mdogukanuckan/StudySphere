import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useTheme } from "../context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";

import UniverseStackNavigator from "./UniverseStackNavigator";

import { CustomHeader } from "../components/CustomHeader";
import StudyStackNavigator from "./StudyStackNavigator";
import StatisticsStackNavigator from './StatisticsStackNavigator';
import { StudyRoomNavigator } from "./StudyRoomNavigator";
import { Library } from "lucide-react-native";

const Tab = createBottomTabNavigator();

export const MainNavigator = () => {
    const { colors } = useTheme();

    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName: keyof typeof Ionicons.glyphMap = 'help';

                    if (route.name === 'Evrenler') iconName = focused ? 'earth' : 'earth-outline';
                    else if (route.name === 'Ekle') iconName = focused ? 'add-circle' : 'add-circle-outline';
                    else if (route.name === 'Odalar') iconName = focused ? 'people' : 'people-outline';
                    else if (route.name === 'İstatistik') iconName = focused ? 'bar-chart' : 'bar-chart-outline';

                    return <Ionicons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: colors.primary,
                tabBarInactiveTintColor: 'gray',
                header: ({ navigation }) => <CustomHeader navigation={navigation} />,
            })}>
            <>
                <Tab.Screen
                    name="Evrenler"
                    component={StudyStackNavigator}
                    options={{ tabBarLabel: 'Çalışma' }}
                />
                <Tab.Screen name="Ekle" component={UniverseStackNavigator} />
                <Tab.Screen
                    name="Odalar"
                    component={StudyRoomNavigator}
                    options={{
                        tabBarLabel: 'Çalışma Odaları',
                        tabBarIcon: ({ color, size }) => <Library color={color} size={size} />,
                    }}
                />
                <Tab.Screen name="İstatistik" component={StatisticsStackNavigator} />
            </>
        </Tab.Navigator>
    );
};
