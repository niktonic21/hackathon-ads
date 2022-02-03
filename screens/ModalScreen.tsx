import * as React from "react";
import { Alert, Image, Pressable, StyleSheet } from "react-native";
import { Video } from "expo-av";
import { Text, View } from "../components/Themed";
import { URLS } from "./TabOneScreen";
import { FontAwesome } from "@expo/vector-icons";

import * as WebBrowser from "expo-web-browser";
import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-react-native";
import { fetch, decodeJpeg } from "@tensorflow/tfjs-react-native";
import * as mobilenet from "@tensorflow-models/mobilenet";
import useAdvertQuery, { parseAds } from "../hooks/useAdvertQuery";
import { RootTabScreenProps } from "../types";
import ViewShot from "react-native-view-shot";

export default function ModalScreen({
  navigation,
}: RootTabScreenProps<"TabOne">) {
  const captureRef = React.useRef(null);
  const model = React.useRef({});
  const [adsData, setAdsData] = React.useState("");
  const [isTfReady, setIsTfReady] = React.useState({});
  const [adsKeyword, setAdsKeyword] = React.useState("");

  const { data } = useAdvertQuery(adsKeyword);

  React.useEffect(() => {
    const startTF = async () => {
      await tf.ready();
      setIsTfReady(true);
      // console.log("TfReady to use");
    };
    const loadModel = async () => {
      const mod = await mobilenet.load();
      model.current = mod;
      // console.log("Mobilenet Model loaded");
    };

    startTF();
    loadModel();
  }, []);

  React.useEffect(() => {
    const createImage = () => {
      if (!!captureRef.current && !!model.current) {
        captureRef.current.capture().then((uri) => {
          // console.log("do something with ", uri);
          detectObjects(uri);
        });
      } else {
        Alert.alert("waiting for model");
      }
    };
    let timerId = setInterval(createImage, 10000);

    return () => {
      !!timerId && clearTimeout(timerId);
    };
  }, []);

  React.useEffect(() => {
    let timeout = null;

    if (data && Object.keys(data).length !== 0) {
      const parsedData = parseAds(data);
      console.log("aaaa____parsedData", parsedData);
      if (parsedData) {
        setAdsData(parsedData);
      }
      setTimeout(() => {
        setAdsData("");
      }, 5000);
    }
    return () => {
      !!timeout && clearTimeout(timeout);
    };
  }, [data]);

  const detectObjects = async (uri) => {
    // console.log("detect objects");
    const response = await fetch(uri, {}, { isBinary: true });
    const imageDataArrayBuffer = await response.arrayBuffer();
    const imageData = new Uint8Array(imageDataArrayBuffer);
    const imageTensor = decodeJpeg(imageData);

    const prediction = await model.current?.classify(imageTensor);
    extractKeyword(prediction);
    // console.log("prediction", prediction);
  };

  const extractKeyword = async (prediction) => {
    if (!!prediction.length) {
      const firstPrediction = prediction[0];
      // console.log("extractKeyword fp", firstPrediction);
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
    <View style={styles.container}>
      <ViewShot ref={captureRef} options={{ format: "jpg", quality: 1 }}>
        <Video
          style={{ width: 850, height: 390 }}
          source={{
            uri: URLS[2],
          }}
          useNativeControls={false}
          resizeMode="cover"
          shouldPlay
          isLooping
        />
      </ViewShot>
      <Pressable
        onPress={() => navigation.goBack()}
        style={({ pressed }) => ({
          opacity: pressed ? 0.5 : 1,
          position: "absolute",
          top: 20,
          left: 30,
        })}
      >
        <FontAwesome
          name="arrow-circle-left"
          size={35}
          color={"grey"}
          style={{ marginRight: 15 }}
        />
      </Pressable>

      {!!adsData && (
        <Pressable
          style={({ pressed }) => ({
            opacity: pressed ? 0.5 : 1,
            position: "absolute",
            bottom: 20,
            alignSelf: "center",
            alignItems: "center",
            flexDirection: "row",
            borderColor: "grey",
            borderWidth: 1,
            backgroundColor: "white",
            width: 200,
            height: 40,
          })}
          onPress={() => handleAdsPress(adsData.link)}
        >
          {!!adsData?.thumbnail && (
            <Image
              source={{ uri: adsData.thumbnail }}
              style={{ width: 40, height: 40, marginRight: 4 }}
            />
          )}
          <Text numberOfLines={2} style={styles.adsText}>
            {adsData.title}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "black",
  },
  video: {
    flex: 1,
    width: "100%",
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
