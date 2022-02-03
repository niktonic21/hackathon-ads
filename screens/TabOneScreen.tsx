import * as React from "react";
import {
  StyleSheet,
  Button,
  Image,
  Alert,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Video } from "expo-av";
import ViewShot from "react-native-view-shot";
import * as WebBrowser from "expo-web-browser";
import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-react-native";
import { fetch, decodeJpeg } from "@tensorflow/tfjs-react-native";
import * as mobilenet from "@tensorflow-models/mobilenet";

import { Text, View } from "../components/Themed";
import { RootTabScreenProps } from "../types";
import useAdvertQuery, { parseAds } from "../hooks/useAdvertQuery";

export const URLS = [
  "http://d23dyxeqlo5psv.cloudfront.net/big_buck_bunny.mp4",
  "https://24i-demo-data.s3.eu-west-1.amazonaws.com/529113/529113.m3u8",
  "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
  "https://bitdash-a.akamaihd.net/content/MI201109210084_1/m3u8s/f08e80da-bf1d-4e3d-8899-f0f6155f6efa.m3u8",
  "https://s1-vod-test.secure2.footprint.net/hlslive/account=ObckAuTKb4mG/livestream=ocvtpagkftgw/livestream=ocvtpagkftgw.isml/ocvtpagkftgw.m3u8",
  "https://nmxapplive.akamaized.net/hls/live/529965/Live_1/index.m3u8",
  "https://nmxapplive.akamaized.net/hls/live/529965/Live_1/index_404.m3u8",
];

export default function TabOneScreen({
  navigation,
}: RootTabScreenProps<"TabOne">) {
  const captureRef = React.useRef(null);
  const video = React.useRef(null);
  const model = React.useRef({});
  const [status, setStatus] = React.useState({});
  const [predictions, setPredictions] = React.useState([]);
  const [adsKeyword, setAdsKeyword] = React.useState("");
  const [adsData, setAdsData] = React.useState("");
  const [isTfReady, setIsTfReady] = React.useState({});
  const [imgUri, setImgUri] = React.useState("");

  const { data } = useAdvertQuery(adsKeyword);

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

  React.useEffect(() => {
    let timeout = null;

    if (data && Object.keys(data).length !== 0) {
      const parsedData = parseAds(data);
      console.log("aaaa____parsedData", parsedData);
      if (parsedData) {
        setAdsData(parsedData);
      }
    }
    return () => {
      !!timeout && clearTimeout(timeout);
    };
  }, [data]);

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
    extractKeyword(prediction);
    console.log("prediction", prediction);
  };

  const extractKeyword = async (prediction) => {
    if (!!prediction.length) {
      const firstPrediction = prediction[0];
      console.log("extractKeyword fp", firstPrediction);
      if (firstPrediction.probability > 0.1) {
        const stringArray = firstPrediction.className.split(",");
        const preparedKeyword = encodeURI(stringArray[0].trim());
        console.log("extractKeyword", preparedKeyword);
        setAdsKeyword(preparedKeyword);
      }
    }
  };

  const handleAdsPress = (link: string) => {
    WebBrowser.openBrowserAsync(link);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainerStyle}
    >
      <ViewShot ref={captureRef} options={{ format: "jpg", quality: 1 }}>
        <View style={styles.videoContainer}>
          <Video
            ref={video}
            style={styles.video}
            source={{
              uri: URLS[6],
            }}
            useNativeControls={false}
            resizeMode="cover"
            isLooping
            onPlaybackStatusUpdate={(status) => setStatus(() => status)}
          />
        </View>
      </ViewShot>
      {!!adsData && (
        <TouchableOpacity
          style={styles.adsContainer}
          onPress={() => handleAdsPress(adsData.link)}
        >
          {!!adsData.thumbnail && (
            <Image
              source={{ uri: adsData.thumbnail }}
              style={{ width: 40, height: 40, marginRight: 4 }}
            />
          )}
          <Text numberOfLines={2} style={styles.adsText}>
            {adsData.title}
          </Text>
        </TouchableOpacity>
      )}
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
          source={
            typeof imgUri === "number"
              ? imgUri
              : {
                  uri: imgUri,
                }
          }
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
    paddingVertical: 15,
  },
  contentContainerStyle: {
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
    minHeight: 190,
  },
  image: {
    alignSelf: "center",
    width: 320,
    height: 200,
  },
  imageAd: {
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
  adsContainer: {
    flex: 1,
    alignSelf: "center",
    alignItems: "center",
    flexDirection: "row",
    borderColor: "grey",
    borderWidth: 1,
    backgroundColor: "rgba(128,128,128, 0.5)",
    width: 200,
    height: 40,
  },
  adsText: {
    flex: 1,
    padding: 3,
    fontSize: 11,
    textAlign: "left",
  },
});
