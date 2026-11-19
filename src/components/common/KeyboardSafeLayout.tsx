import React, { useEffect, useRef, useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { KeyboardProvider, useKeyboardState } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function AndroidKeyboardLayout({ children }: React.PropsWithChildren) {
  const { bottom } = useSafeAreaInsets();
  const controllerHeight = useKeyboardState(state => state.isVisible ? state.height : 0);
  const [systemHeight, setSystemHeight] = useState(() => Keyboard.metrics()?.height ?? 0);
  const [layoutHeight, setLayoutHeight] = useState(0);
  const restingHeight = useRef(0);
  const keyboardHeight = Math.max(controllerHeight, systemHeight);

  useEffect(() => {
    const shown = Keyboard.addListener('keyboardDidShow', event => setSystemHeight(event.endCoordinates.height));
    const hidden = Keyboard.addListener('keyboardDidHide', () => setSystemHeight(0));
    return () => {
      shown.remove();
      hidden.remove();
    };
  }, []);

  const resizedHeight = Math.max(0, restingHeight.current - layoutHeight);
  const overlap = Math.max(0, keyboardHeight - bottom - resizedHeight);
  return (
    <View
      style={styles.layout}
      onLayout={({ nativeEvent: { layout: { height } } }) => {
        if (!keyboardHeight && !Keyboard.isVisible()) restingHeight.current = height;
        setLayoutHeight(height);
      }}>
      {children}
      {overlap > 0 && <View style={{ height: overlap, flexShrink: 0 }} />}
    </View>
  );
}

export function KeyboardSafeLayout({ children }: React.PropsWithChildren) {
  if (Platform.OS === 'android') {
    return (
      <KeyboardProvider>
        <AndroidKeyboardLayout>{children}</AndroidKeyboardLayout>
      </KeyboardProvider>
    );
  }
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.layout}>
      {children}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({ layout: { flex: 1 } });
