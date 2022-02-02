import React, { useState } from "react";
import { StyleSheet, Button, Image } from "react-native";
import * as VideoThumbnails from "expo-video-thumbnails";

import EditScreenInfo from "../components/EditScreenInfo";
import { Text, View } from "../components/Themed";

export default function TabTwoScreen() {
  const [image, setImage] = useState(null);
  const [time, setTime] = useState(3000);

  const generateThumbnail = async () => {
    try {
      const { uri } = await VideoThumbnails.getThumbnailAsync(
        "http://d23dyxeqlo5psv.cloudfront.net/big_buck_bunny.mp4",
        {
          time: time,
        }
      );
      setImage(uri);
    } catch (e) {
      console.warn(e);
    } finally {
      setTime((prev) => prev + 1000);
    }
  };

  return (
    <View style={styles.container}>
      <EditScreenInfo path="/screens/TabTwoScreen.tsx" />
      <Button onPress={generateThumbnail} title="Generate thumbnail" />
      {image && <Image source={{ uri: image }} style={styles.image} />}
      <Text>{image}</Text>
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
  image: {
    width: 200,
    height: 200,
  },
});
