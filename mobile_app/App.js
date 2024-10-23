import React from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

export default function App() {
  return (
    <View style={styles.container}>
      <WebView
        source={{ html: `
          <!DOCTYPE html>
          <html>
            <body>
              <h1>Hello, World!</h1>
              <p>This is a simple WebView with HTML content.</p>
            </body>
          </html>
        `}}
        style={{ flex: 1 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
