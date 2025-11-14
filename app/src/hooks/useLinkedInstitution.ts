import * as SecureStore from "expo-secure-store";
import { useCallback, useEffect, useState } from "react";

const STORE_KEY = "linked-institution";

export const useLinkedInstitution = () => {
  const [institution, setInstitution] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    SecureStore.getItemAsync(STORE_KEY)
      .then(setInstitution)
      .finally(() => setReady(true));
  }, []);

  const persistInstitution = useCallback(async (value: string | null) => {
    if (value) {
      await SecureStore.setItemAsync(STORE_KEY, value);
    } else {
      await SecureStore.deleteItemAsync(STORE_KEY);
    }
    setInstitution(value);
  }, []);

  return { institution, ready, setInstitution: persistInstitution };
};
