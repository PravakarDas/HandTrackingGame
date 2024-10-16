import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Camera, useCameraDevices } from 'react-native-vision-camera';
import * as handPoseDetection from '@tensorflow-models/hand-pose-detection';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-react-native';
import { bundleResourceIO } from '@tensorflow/tfjs-react-native';

const HandTrackingGame = () => {
  const [hasPermission, setHasPermission] = useState(false);
  const [model, setModel] = useState(null);
  const [circlePosition, setCirclePosition] = useState({ x: 0, y: 0 });
  const [isCircleVisible, setIsCircleVisible] = useState(false);
  const [score, setScore] = useState(0);

  const devices = useCameraDevices();
  const device = devices.back;

  const cameraRef = useRef(null);

  useEffect(() => {
    (async () => {
      const cameraPermission = await Camera.requestCameraPermission();
      setHasPermission(cameraPermission === 'authorized');
    })();
  }, []);

  useEffect(() => {
    loadModel();
  }, []);

  const loadModel = async () => {
    await tf.ready();
    const model = await handPoseDetection.createDetector(
      handPoseDetection.SupportedModels.MediaPipeHands,
      {
        runtime: 'tfjs',
        modelType: 'full'
      }
    );
    setModel(model);
  };

  const generateRandomPosition = () => {
    const x = Math.random() * 300;
    const y = Math.random() * 300;
    setCirclePosition({ x, y });
  };

  useEffect(() => {
    const intervalId = setInterval(() => {
      setIsCircleVisible(prev => !prev);
      if (!isCircleVisible) {
        generateRandomPosition();
      }
    }, 3000);

    return () => clearInterval(intervalId);
  }, [isCircleVisible]);

  const onFrame = async (image) => {
    if (model) {
      const imageTensor = tf.tensor(image.data, [image.height, image.width, 4]);
      const hands = await model.estimateHands(imageTensor);

      if (hands.length > 0) {
        const indexFinger = hands[0].keypoints[8];
        const distance = Math.sqrt(
          Math.pow(indexFinger.x - circlePosition.x, 2) +
          Math.pow(indexFinger.y - circlePosition.y, 2)
        );

        if (distance < 30 && isCircleVisible) {
          setScore(prevScore => prevScore + 1);
          setIsCircleVisible(false);
        }
      }

      tf.dispose(imageTensor);
    }
  };

  if (!hasPermission) {
    return <Text>No access to camera</Text>;
  }

  if (!device) {
    return <Text>No camera device</Text>;
  }

  return (
    <View style={styles.container}>
      <Camera
        ref={cameraRef}
        style={styles.camera}
        device={device}
        isActive={true}
        frameProcessor={onFrame}
      />
      {isCircleVisible && (
        <View
          style={[
            styles.circle,
            { left: circlePosition.x, top: circlePosition.y },
          ]}
        />
      )}
      <Text style={styles.score}>Score: {score}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  circle: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'green',
  },
  score: {
    position: 'absolute',
    top: 20,
    right: 20,
    fontSize: 24,
    color: 'white',
  },
});

export default HandTrackingGame;