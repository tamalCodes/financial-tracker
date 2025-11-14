import { memo } from "react";
import { Text, View } from "react-native";
import Svg, { Rect } from "react-native-svg";

type Props = {
  data: { category: string; total: number }[];
};

const CHART_WIDTH = 280;
const CHART_HEIGHT = 18;

export const CategoryChart = memo(({ data }: Props) => {
  if (!data.length) {
    return <Text className="text-slate-400 text-sm">No spending yet</Text>;
  }

  const max = data.reduce(
    (maxValue, item) => Math.max(maxValue, item.total),
    0
  );

  return (
    <View className="space-y-3">
      {data.slice(0, 3).map((item) => (
        <View key={item.category}>
          <View className="flex-row items-center justify-between mb-1">
            <Text className="text-slate-200 font-medium">{item.category}</Text>
            <Text className="text-slate-400 text-sm">
              ${item.total.toFixed(2)}
            </Text>
          </View>
          <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
            <Rect
              x="0"
              y="0"
              width={(item.total / max) * CHART_WIDTH}
              height={CHART_HEIGHT}
              rx="7"
              fill="#0EA5E9"
            />
          </Svg>
        </View>
      ))}
    </View>
  );
});

CategoryChart.displayName = "CategoryChart";
