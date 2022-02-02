import * as React from "react";
import { StyleSheet, Button, Image, Alert } from "react-native";
import { Video } from "expo-av";
import ViewShot from "react-native-view-shot";
import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-react-native";
import { fetch, decodeJpeg } from "@tensorflow/tfjs-react-native";
import * as mobilenet from "@tensorflow-models/mobilenet";

import { Text, View } from "../components/Themed";
import { RootTabScreenProps } from "../types";
const URLS = [
  "http://d23dyxeqlo5psv.cloudfront.net/big_buck_bunny.mp4",
  "https://24i-demo-data.s3.eu-west-1.amazonaws.com/529113/529113.m3u8",
  "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
  "https://bitdash-a.akamaihd.net/content/MI201109210084_1/m3u8s/f08e80da-bf1d-4e3d-8899-f0f6155f6efa.m3u8",
];

export default function TabOneScreen({
  navigation,
}: RootTabScreenProps<"TabOne">) {
  const captureRef = React.useRef(null);
  const video = React.useRef(null);
  const model = React.useRef({});
  const [status, setStatus] = React.useState({});
  const [predictions, setPredictions] = React.useState([]);
  const [isTfReady, setIsTfReady] = React.useState({});
  const [imgUri, setImgUri] = React.useState("img");

  React.useEffect(() => {
    const startTF = async () => {
      await tf.ready();
      setIsTfReady(true);
      console.log("TfReady to use");
    };
    const loadModel = async () => {
      const mod = await mobilenet.load();
      model.current = mod;
      console.log("Mobilenet Model loaded");
    };

    startTF();
    loadModel();
  }, []);

  const createImage = () => {
    if (!!captureRef.current && !!model.current) {
      captureRef.current.capture().then((uri) => {
        console.log("do something with ", uri);
        setImgUri(uri);
        detectObjects(uri);
      });
    } else {
      Alert.alert("waiting for model");
    }
  };

  const detectObjects = async (uri) => {
    console.log("detect objects");
    const response = await fetch(uri, {}, { isBinary: true });
    const imageDataArrayBuffer = await response.arrayBuffer();
    const imageData = new Uint8Array(imageDataArrayBuffer);
    const imageTensor = decodeJpeg(imageData);

    const prediction = await model.current?.classify(imageTensor);
    setPredictions(prediction);
    console.log("aaaa", prediction);
  };

  return (
    <View style={styles.container}>
      <ViewShot ref={captureRef} options={{ format: "jpg", quality: 1 }}>
        <View style={styles.videoContainer}>
          <Video
            ref={video}
            style={styles.video}
            source={{
              uri: URLS[2],
            }}
            useNativeControls={false}
            resizeMode="cover"
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
      <View style={styles.videoContainer}>
        <Image
          style={styles.video}
          source={{
            uri: imgUri,
          }}
        />
      </View>

      <View style={styles.buttons}>
        <Button title={"Capture Image"} onPress={createImage} />
      </View>
      {!!predictions.length && (
        <View style={styles.predictionsContainer}>
          {predictions.map(({ className, probability }) => (
            <Text key={className} style={{ paddingTop: 5 }}>
              {(probability * 100)?.toFixed(2)}% - {className}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
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
  predictionsContainer: {
    borderColor: "black",
    borderWidth: 1,
    padding: 4,
  },
});
