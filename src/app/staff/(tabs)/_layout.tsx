import { Tabs } from 'expo-router';
import { TabImageIcon, useFloatingTabOptions } from '@/components/common/TabImageIcon';
import { STAFF_TABS } from '@/components/staff/StaffBottomNav';

export const unstable_settings = { initialRouteName: 'index' };

export default function StaffTabLayout() {
  const screenOptions = useFloatingTabOptions();

  return (
    <Tabs detachInactiveScreens={false} screenOptions={screenOptions}>
      {STAFF_TABS.map(({ name, label, icon }) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title: label,
            tabBarIcon: ({ focused }) => <TabImageIcon name={icon} focused={focused} />,
          }}
        />
      ))}
    </Tabs>
  );
}
