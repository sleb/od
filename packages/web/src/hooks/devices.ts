import { useUser } from "@/hooks/user";
import {
  subscribeToDevice,
  subscribeToDevices,
  type DeviceRegistration,
} from "@overdrip/core/device";
import { useEffect, useState } from "react";

export const useDevices = () => {
  const user = useUser();
  const [devices, setDevices] = useState<DeviceRegistration[]>([]);
  const [loading, setLoading] = useState(!!user?.uid);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!user?.uid) {
      return;
    }

    const unsubscribe = subscribeToDevices(
      user.uid,
      (devicesList) => {
        setDevices(devicesList);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching devices:", err);
        setError(err);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [user?.uid]);

  return { devices, loading, error };
};

export const useDevice = (deviceId: string | undefined) => {
  const user = useUser();
  const [device, setDevice] = useState<DeviceRegistration | null>(null);
  const [loading, setLoading] = useState(!!user?.uid && !!deviceId);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!user?.uid || !deviceId) {
      return;
    }

    const unsubscribe = subscribeToDevice(
      user.uid,
      deviceId,
      (foundDevice) => {
        setDevice(foundDevice);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching device:", err);
        setError(err);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [user?.uid, deviceId]);

  return { device, loading, error };
};
