import { FC, ReactNode } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
} from "react-native";

type FormFieldProps = {
  label: string;
  hint?: string;
  trailingActionLabel?: string;
  onTrailingActionPress?: () => void;
  trailingAccessory?: ReactNode;
} & TextInputProps;

export const FormField: FC<FormFieldProps> = ({
  label,
  hint,
  trailingActionLabel,
  onTrailingActionPress,
  trailingAccessory,
  secureTextEntry,
  ...inputProps
}) => {
  return (
    <View style={styles.field}>
      <View style={styles.labelRow}>
        <View>
          <Text style={styles.label}>{label}</Text>
          {hint ? <Text style={styles.hint}>{hint}</Text> : null}
        </View>
        {trailingActionLabel ? (
          <TouchableOpacity onPress={onTrailingActionPress}>
            <Text style={styles.trailingAction}>{trailingActionLabel}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      <View style={styles.inputWrapper}>
        <TextInput
          placeholderTextColor="#7C87A9"
          style={
            trailingAccessory
              ? [styles.input, styles.inputWithAccessory]
              : styles.input
          }
          secureTextEntry={secureTextEntry}
          {...inputProps}
        />
        {trailingAccessory ? (
          <View style={styles.trailingAccessory}>{trailingAccessory}</View>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  field: {
    marginBottom: 20,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  label: {
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: "#9CA3AF",
    fontWeight: "600",
  },
  hint: {
    fontSize: 12,
    color: "#94A3B8",
  },
  trailingAction: {
    fontSize: 12,
    color: "#A78BFA",
    fontWeight: "600",
  },
  inputWrapper: {
    position: "relative",
  },
  input: {
    width: "100%",
    backgroundColor: "#070B16",
    borderWidth: 1,
    borderColor: "#1E2537",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#E5E7EB",
    fontSize: 16,
  },
  inputWithAccessory: {
    paddingRight: 48,
  },
  trailingAccessory: {
    position: "absolute",
    right: 14,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
});
