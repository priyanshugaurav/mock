import React, { useState } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { WebView } from 'react-native-webview';

const MathView = ({ 
  math, 
  fontSize = 18, 
  color = '#2D3142', 
  center = true,
  handwriting = true,
  style = {} 
}) => {
  const [height, setHeight] = useState(40); // Initial reasonable guess

  // Use \displaystyle to ensure all numbers (fractions etc.) are full size
  const formattedMath = `\\displaystyle ${math}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
        <link href="https://fonts.googleapis.com/css2?family=Patrick+Hand&display=swap" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"></script>
        <style>
          body {
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: ${center ? 'center' : 'flex-start'};
            align-items: flex-start;
            background-color: transparent;
            color: ${color};
            font-size: ${fontSize}px;
            overflow: hidden;
            ${handwriting ? "font-family: 'Patrick Hand', cursive;" : ""}
          }
          #math-container {
            padding: 4px;
            display: inline-block;
            text-align: ${center ? 'center' : 'left'};
          }
          .katex { 
            font-size: 1.1em !important; 
            ${handwriting ? "font-family: 'Patrick Hand', cursive !important;" : ""}
          }
          .katex .mord { font-size: inherit; }
        </style>
      </head>
      <body>
        <div id="math-container"></div>
        <script>
          function sendHeight() {
            setTimeout(() => {
              const container = document.getElementById('math-container');
              if (container) {
                const height = container.offsetHeight;
                window.ReactNativeWebView.postMessage(height.toString());
              }
            }, 100);
          }

          try {
            katex.render(\`${formattedMath.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`, document.getElementById('math-container'), {
              throwOnError: false,
              displayMode: false
            });
            sendHeight();
          } catch (e) {
            document.getElementById('math-container').innerHTML = "<span style='color:red'>Math Error</span>";
          }
        </script>
      </body>
    </html>
  `;

  return (
    <View style={[styles.container, { height }, style]}>
      <WebView
        originWhitelist={['*']}
        source={{ html }}
        style={styles.webview}
        scrollEnabled={false}
        overScrollMode="never"
        onMessage={(event) => {
          const webViewHeight = parseInt(event.nativeEvent.data);
          if (webViewHeight > 0) {
            setHeight(webViewHeight + 4); // Reduced buffer for better alignment
          }
        }}
        containerStyle={{ backgroundColor: 'transparent' }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  webview: {
    backgroundColor: 'transparent',
    flex: 1,
  },
});

export default MathView;
