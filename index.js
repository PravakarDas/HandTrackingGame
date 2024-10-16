/**
 * @format
 */

import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';

import React from 'react';
import HandTrackingGame from './HandTrackingGame';

const App = () => {
  return <HandTrackingGame />;
};

export default App;

AppRegistry.registerComponent(appName, () => App);
