// components/PaginationControls.tsx
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { FontAwesome } from "@expo/vector-icons";

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  goToFirstPage: () => void;
  goToLastPage: () => void;
  goToNextPage: () => void;
  goToPreviousPage: () => void;
}

export const PaginationControls = ({
  currentPage,
  totalPages,
  goToFirstPage,
  goToLastPage,
  goToNextPage,
  goToPreviousPage,
}: PaginationControlsProps) => {
  if (totalPages <= 1) return null;

  return (
    <View style={paginationStyles.container}>
      {/* First page button */}
      {totalPages > 3 && (
        <TouchableOpacity
          onPress={goToFirstPage}
          disabled={currentPage === 1}
          style={[
            paginationStyles.button,
            currentPage === 1 && paginationStyles.buttonDisabled,
          ]}
        >
          <FontAwesome
            name="angle-double-left"
            size={18}
            color={currentPage === 1 ? "#666" : "#fff"}
          />
        </TouchableOpacity>
      )}
      {/* Previous page button */}
      <TouchableOpacity
        onPress={goToPreviousPage}
        disabled={currentPage === 1}
        style={[
          paginationStyles.button,
          currentPage === 1 && paginationStyles.buttonDisabled,
        ]}
      >
        <FontAwesome
          name="chevron-left"
          size={10}
          color={currentPage === 1 ? "#666" : "#fff"}
        />
      </TouchableOpacity>

      {/* Page indicator */}
      <Text style={paginationStyles.text}>
        {currentPage}/{totalPages}
      </Text>

      {/* Next page button */}
      <TouchableOpacity
        onPress={goToNextPage}
        disabled={currentPage === totalPages}
        style={[
          paginationStyles.button,
          currentPage === totalPages && paginationStyles.buttonDisabled,
        ]}
      >
        <FontAwesome
          name="chevron-right"
          size={10}
          color={currentPage === totalPages ? "#666" : "#fff"}
        />
      </TouchableOpacity>

      {/* Last page button */}
      {totalPages > 3 && (
        <TouchableOpacity
          onPress={goToLastPage}
          disabled={currentPage === totalPages}
          style={[
            paginationStyles.button,
            currentPage === totalPages && paginationStyles.buttonDisabled,
          ]}
        >
          <FontAwesome
            name="angle-double-right"
            size={18}
            color={currentPage === totalPages ? "#666" : "#fff"}
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

const paginationStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 8,
    marginTop: 15,
    borderRadius: 20,
  },
  button: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 3,
  },
  buttonDisabled: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  text: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginHorizontal: 15,
  },
});

export default PaginationControls;