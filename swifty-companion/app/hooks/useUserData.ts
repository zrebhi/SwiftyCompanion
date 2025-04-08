import { useState, useEffect } from 'react';
import userService, { UserDetail } from '../services/userService';

export const useUserData = (login: string | undefined) => {
  const [userData, setUserData] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (!login) {
          throw new Error("No login provided");
        }

        const data = await userService.searchUser(login);
        setUserData(data);
      } catch (err) {
        console.error("Error fetching user:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load user data"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [login]);

  return { userData, loading, error };
};

export default useUserData;