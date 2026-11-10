import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import NetInfo from '@react-native-community/netinfo';
import { getCities, getFavorites, getMe, getVenues } from '../api';
import { CITIES, CITY_META } from '../config';
import { supabase } from '../supabase/client';

const AppContext = createContext(null);
export function AppProvider({ children }) {
  const [booting, setBooting] = useState(true);
  const [authReady, setAuthReady] = useState(false);
  const [session, setSession] = useState(null);
  const [online, setOnline] = useState(null);
  const [city, setCity] = useState('Milwaukee');
  const [cities, setCities] = useState(CITIES);
  const [cityMeta, setCityMeta] = useState(CITY_META);
  const [venues, setVenues] = useState([]);
  const [profile, setProfile] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [venueLoading, setVenueLoading] = useState(false);
  const [apiUnavailable, setApiUnavailable] = useState(false);
  const authGeneration = useRef(0);
  const authUserId = useRef(null);

  const loadCoreData = useCallback(async () => {
    setVenueLoading(true);
    try {
      const data = await getVenues(city);
      setVenues(data);
      setApiUnavailable(false);
      return data;
    } catch (error) {
      setApiUnavailable(true);
      setVenues([]);
      return [];
    } finally {
      setVenueLoading(false);
    }
  }, [city]);

  const loadFavorites = useCallback(async () => {
    if (!session?.user || !online) {
      setFavorites([]);
      return;
    }
    try {
      setFavorites(await getFavorites());
    } catch {
      setFavorites([]);
    }
  }, [online, session]);

  useEffect(() => {
    const applyConnectivity = state => {
      const connected =
        state.isConnected === true && state.isInternetReachable !== false;
      setOnline(connected);
      setBooting(!connected);
    };
    const unsubscribe = NetInfo.addEventListener(applyConnectivity);
    NetInfo.fetch()
      .then(applyConnectivity)
      .catch(() => {
        setOnline(false);
        setBooting(true);
      });
    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!online) return undefined;
    let active = true;
    getCities().then(items => {
      if (!active || !items.length) return;
      setCities(items.map(item => item.name));
      setCityMeta(Object.fromEntries(items.map(item => [item.name, item])));
      setCity(current => items.some(item => item.name === current) ? current : items[0].name);
    }).catch(() => {});
    return () => { active = false; };
  }, [online]);

  useEffect(() => {
    let mounted = true;
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!mounted) return;
      const nextUserId = nextSession?.user?.id || null;
      if (authUserId.current !== nextUserId) {
        const previousUserId = authUserId.current;
        authUserId.current = nextUserId;
        authGeneration.current += 1;
        if (previousUserId) setProfile(null);
      }
      setSession(nextSession);
      if (!nextSession) setProfile(null);
    });

    async function restoreAuth() {
      try {
        const { data: result, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (!mounted) return;
        const restoredSession = result.session;
        const restoredUserId = restoredSession?.user?.id || null;
        if (authUserId.current !== restoredUserId) {
          authUserId.current = restoredUserId;
          authGeneration.current += 1;
        }
        const generation = authGeneration.current;
        setSession(restoredSession);
        if (restoredUserId) {
          try {
            const user = await getMe();
            if (!mounted || generation !== authGeneration.current) return;
            setProfile(user);
            if (user?.preferredCity) setCity(user.preferredCity);
          } catch {
            if (mounted && generation === authGeneration.current)
              setProfile(null);
          }
        } else setProfile(null);
      } catch {
        if (mounted) {
          setSession(null);
          setProfile(null);
        }
      } finally {
        if (mounted) setAuthReady(true);
      }
    }

    restoreAuth();
    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (online && session?.user) {
      loadCoreData();
      loadFavorites();
    } else {
      setVenues([]);
      setFavorites([]);
    }
  }, [city, online, session, loadCoreData, loadFavorites]);

  const value = useMemo(
    () => ({
      booting,
      authReady,
      session,
      online,
      city,
      setCity,
      cities,
      cityMeta,
      venues,
      setVenues,
      profile,
      setProfile,
      favorites,
      setFavorites,
      favoriteIds: new Set(favorites.map(item => item.id)),
      venueLoading,
      apiUnavailable,
      refreshVenues: loadCoreData,
      refreshFavorites: loadFavorites,
    }),
    [
      booting,
      authReady,
      session,
      online,
      city,
      cities,
      cityMeta,
      venues,
      profile,
      favorites,
      venueLoading,
      apiUnavailable,
      loadCoreData,
      loadFavorites,
    ],
  );
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
export function useApp() {
  const value = useContext(AppContext);
  if (!value) throw new Error('useApp must be used inside AppProvider');
  return value;
}
