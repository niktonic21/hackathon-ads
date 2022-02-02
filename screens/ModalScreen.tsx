import { Pressable, StyleSheet } from "react-native";
import { Video } from "expo-av";
import { View } from "../components/Themed";
import { URLS } from "./TabOneScreen";
import { FontAwesome } from "@expo/vector-icons";
import useColorScheme from "../hooks/useColorScheme";
import { RootTabScreenProps } from "../types";

export default function ModalScreen({
  navigation,
}: RootTabScreenProps<"TabOne">) {
  const colorScheme = useColorScheme();

  return (
    <View style={styles.container}>
      <Video
        style={styles.video}
        source={{
          uri: URLS[2],
        }}
        useNativeControls={false}
        resizeMode="contain"
        shouldPlay
        isLooping
      />
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
});
