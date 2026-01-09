import {
  Alert,
  Card,
  Center,
  Grid,
  Group,
  Loader,
  SegmentedControl,
  Stack,
  Text,
  ThemeIcon,
} from "@mantine/core";
import type { DeviceRegistration } from "@overdrip/core/device";
import type { MetricDataPointResponse } from "@overdrip/core/metrics";
import { readMetrics } from "@overdrip/core/metrics";
import {
  IconActivity,
  IconAlertCircle,
  IconDroplet,
} from "@tabler/icons-react";
import { useEffect, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface DeviceStatsProps {
  device: DeviceRegistration;
}

type TimeRange = "1h" | "6h" | "24h" | "7d";

interface ChartDataPoint {
  timestamp: number;
  date: string;
  [key: string]: string | number;
}

const DeviceStats = ({ device }: DeviceStatsProps) => {
  const [timeRange, setTimeRange] = useState<TimeRange>("24h");
  const [dataPoints, setDataPoints] = useState<MetricDataPointResponse[]>([]);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch metrics whenever device ID or time range changes
  useEffect(() => {
    const fetchMetrics = async () => {
      setLoading(true);
      setError(null);
      try {
        const metrics = await readMetrics(device.id, timeRange);
        setDataPoints(metrics);

        // Transform raw data into chart-friendly format, grouped by plant
        const chartDataMap = new Map<number, ChartDataPoint>();

        for (const point of metrics) {
          const existing = chartDataMap.get(point.timestamp) || {
            timestamp: point.timestamp,
            date: new Date(point.timestamp).toLocaleTimeString(),
          };
          existing[point.plantId] = point.value;
          chartDataMap.set(point.timestamp, existing);
        }

        // Sort by timestamp and convert to array
        const sorted = Array.from(chartDataMap.values()).sort(
          (a, b) => a.timestamp - b.timestamp,
        );
        setChartData(sorted);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to load metrics";
        setError(message);
        setChartData([]);
        setDataPoints([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [device.id, timeRange]);

  // Get unique plant IDs from the data for multi-line chart
  const plantIds = Array.from(new Set(dataPoints.map((p) => p.plantId))).sort();

  // Generate distinct colors for each plant line
  const colors = [
    "#1f77b4", // blue
    "#ff7f0e", // orange
    "#2ca02c", // green
    "#d62728", // red
    "#9467bd", // purple
    "#8c564b", // brown
  ];

  return (
    <Stack gap="md">
      <Group justify="space-between" align="center">
        <Text size="sm" fw={500}>
          Moisture Readings
        </Text>
        <SegmentedControl
          value={timeRange}
          onChange={(value) => setTimeRange(value as TimeRange)}
          data={[
            { label: "1h", value: "1h" },
            { label: "6h", value: "6h" },
            { label: "24h", value: "24h" },
            { label: "7d", value: "7d" },
          ]}
          size="xs"
        />
      </Group>

      {error && (
        <Alert icon={<IconAlertCircle size={16} />} color="red">
          {error}
        </Alert>
      )}

      {loading ? (
        <Center py="xl">
          <Loader />
        </Center>
      ) : chartData.length === 0 ? (
        <Card withBorder padding="lg" radius="md">
          <Text size="sm" c="dimmed" ta="center">
            No metrics data available for this device yet. Start the device to
            begin collecting sensor readings.
          </Text>
        </Card>
      ) : (
        <Card withBorder padding="lg" radius="md">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                interval={Math.max(0, Math.floor(chartData.length / 6))}
              />
              <YAxis
                label={{
                  value: "Moisture %",
                  angle: -90,
                  position: "insideLeft",
                }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(255, 255, 255, 0.95)",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                }}
                formatter={(value) => `${value}%`}
              />
              <Legend />
              {plantIds.map((plantId, index) => (
                <Line
                  key={plantId}
                  type="monotone"
                  dataKey={plantId}
                  stroke={colors[index % colors.length]}
                  dot={false}
                  isAnimationActive={false}
                  name={plantId}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      <Grid>
        <Grid.Col span={{ base: 12, sm: 6 }}>
          <Card withBorder padding="lg" radius="md">
            <Group>
              <ThemeIcon size="xl" variant="light" color="cyan">
                <IconDroplet size={24} />
              </ThemeIcon>
              <div>
                <Text size="xs" c="dimmed">
                  Data Points
                </Text>
                <Text size="lg" fw={600}>
                  {dataPoints.length}
                </Text>
              </div>
            </Group>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6 }}>
          <Card withBorder padding="lg" radius="md">
            <Group>
              <ThemeIcon size="xl" variant="light" color="green">
                <IconActivity size={24} />
              </ThemeIcon>
              <div>
                <Text size="xs" c="dimmed">
                  Plants Monitored
                </Text>
                <Text size="lg" fw={600}>
                  {plantIds.length}
                </Text>
              </div>
            </Group>
          </Card>
        </Grid.Col>
      </Grid>
    </Stack>
  );
};

export default DeviceStats;
