import * as React from "react";
import { StyleSheet, Button, Image, Alert } from "react-native";
import { Video } from "expo-av";
import ViewShot from "react-native-view-shot";
import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-react-native";
import { fetch, decodeJpeg } from "@tensorflow/tfjs-react-native";
import * as mobilenet from "@tensorflow-models/mobilenet";
import * as cocossd from '@tensorflow-models/coco-ssd';

import { View } from "../components/Themed";
import { RootTabScreenProps } from "../types";
const URLS = [
  "https://24i-demo-data.s3.eu-west-1.amazonaws.com/529113/529113.m3u8",
];

export default function TabOneScreen({
  navigation,
}: RootTabScreenProps<"TabOne">) {
  const captureRef = React.useRef(null);
  const video = React.useRef(null);
  const modelMN = React.useRef({});
  const modelCS = React.useRef({});
  const [status, setStatus] = React.useState({});
  const [isTfReady, setIsTfReady] = React.useState({});
  const [imgUri, setImgUri] = React.useState("img");

  React.useEffect(() => {
    const startTF = async () => {
      await tf.ready();
      setIsTfReady(true);
      console.log("TfReady to use");
    };
    const loadModels = async () => {
      const mn = await mobilenet.load();
      modelMN.current = mn;

      const cs = await cocossd.load();
      modelCS.current = cs;
      console.log("Models loaded");
    };

    startTF();
    loadModels();
  }, []);

  const isDetectionReady = () => {
    return !!captureRef.current && !!modelMN.current && isTfReady && !!modelCS.current
  }

  const createImage = () => {
    //console.log("aaa_captureRef", captureRef);

    if (isDetectionReady()) {
      captureRef.current.capture().then((uri) => {
        console.log("do something with ", uri);
        setImgUri(uri);
        detectObjects(uri);
      });
    } else {
      Alert.alert("waiting for models");
    }
  };

  const detectObjects = async (uri) => {
    console.log("detect objects ");
    const response = await fetch(uri, {}, { isBinary: true });
    const imageDataArrayBuffer = await response.arrayBuffer();
    const imageData = new Uint8Array(imageDataArrayBuffer);
    const imageTensor = decodeJpeg(imageData);

    const predictionMN = await modelMN.current?.classify(imageTensor);
    const predictionCS = await modelCS.current?.detect(imageTensor);
    console.log("predictions MN ", predictionMN);
    console.log("predictions CS ", predictionCS);
  };

  return (
    <View style={styles.container}>
      <ViewShot ref={captureRef} options={{ format: "jpg", quality: 1 }}>
        <View style={styles.videoContainer}>
          <Video
            ref={video}
            style={styles.video}
            source={{
              uri: URLS[0],
            }}
            useNativeControls
            resizeMode="contain"
            isLooping
            onPlaybackStatusUpdate={(status) => setStatus(() => status)}
          />
        </View>
      </ViewShot>
      <View style={styles.buttons}>
        <Button
          title={status.isPlaying ? "Pause" : "Play"}
          onPress={() =>
            status.isPlaying
              ? video.current?.pauseAsync()
              : video.current?.playAsync()
          }
        />
      </View>
      <Image
        style={styles.image}
        source={{
          uri: imgUri,
        }}
      />
      <View style={styles.buttons}>
        <Button title={"Capture Image"} onPress={createImage} disabled={!isDetectionReady()}/>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: "80%",
  },
  videoContainer: {
    marginHorizontal: 20,
  },
  video: {
    aspectRatio: 16 / 9,
    width: "100%",
  },
  image: {
    alignSelf: "center",
    width: 320,
    height: 200,
  },
  buttons: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
});
