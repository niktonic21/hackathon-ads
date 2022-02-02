import * as React from "react";
import { StyleSheet, Button, Image } from "react-native";
import { Video } from "expo-av";
import ViewShot from "react-native-view-shot";
import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-react-native";
import { fetch, decodeJpeg } from '@tensorflow/tfjs-react-native';
import * as mobilenet from '@tensorflow-models/mobilenet';

import { View } from "../components/Themed";
import { RootTabScreenProps } from "../types";
const URLS = [
  "http://d23dyxeqlo5psv.cloudfront.net/big_buck_bunny.mp4",
  "https://24i-demo-data.s3.eu-west-1.amazonaws.com/529113/529113.m3u8",
];

export default function TabOneScreen({
  navigation,
}: RootTabScreenProps<"TabOne">) {
  const captureRef = React.useRef({});
  const video = React.useRef(null);
  const [status, setStatus] = React.useState({});
  const [isTfReady, setIsTfReady] = React.useState({});
  const [imgUri, setImgUri] = React.useState("img");

  React.useEffect(() => {
    const startTF = async () => {
      await tf.ready();
      setIsTfReady(true);
      console.log("TfReady to use");
    };
    startTF();
  }, []);

  const createImage = () => {
    if (!!captureRef.current) {
      captureRef.current.capture().then((uri) => {
        console.log("do something with ", uri);
        setImgUri(uri);
        detectObjects(uri);
      });
    }
  };


  const detectObjects = async (uri) => {
    console.log("detect objects ");
    const model = await mobilenet.load();
    const response = await fetch(uri, {}, { isBinary: true });
    const imageDataArrayBuffer = await response.arrayBuffer();
    const imageData = new Uint8Array(imageDataArrayBuffer);
    const imageTensor = decodeJpeg(imageData);

    const prediction = await model.classify(imageTensor);
    console.log("predictions ",prediction);
  }

  return (
    <View style={styles.container}>
      <ViewShot
        ref={(ref) => (captureRef.current = ref)}
        options={{ format: "jpg", quality: 1 }}
      >
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
        <Button title={"Capture Image"} onPress={createImage} />
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
  video: {
    alignSelf: "center",
    width: 320,
    height: 200,
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
