import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { UserDetail } from "../../services/userService";

interface ProfileHeaderProps {
  userData: UserDetail;
  onBackPress: () => void;
}

export const ProfileHeader = ({ userData, onBackPress }: ProfileHeaderProps) => {
  return (
    <View style={styles.profileHeader}>
      <Image
        source={{ uri: userData.image?.link }}
        style={styles.profileImage}
      />
      <View style={styles.profileInfo}>
        <Text style={styles.emailText}>{userData.login}</Text>

        <View style={styles.nameContainer}>
          <Text style={styles.loginText}>{userData.displayname}</Text>
        </View>
        <Text style={styles.emailText}>{userData.email}</Text>
      </View>
      <View style={styles.backArrow}>
        <TouchableOpacity onPress={onBackPress}>
          <FontAwesome name="arrow-left" size={30} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  profileHeader: {
    flexDirection: "row",
    padding: 20,
    backgroundColor: "#1E1E1E",
    borderBottomWidth: 1,
    borderBottomColor: "#333",
    alignItems: "center",
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#333",
  },
  profileInfo: {
    marginLeft: 20,
    justifyContent: "center",
  },
  loginText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  emailText: {
    color: "#bbb",
    marginTop: 5,
  },
  nameContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  backArrow: {
    position: "absolute",
    right: 30,
  },
});

export default ProfileHeader;