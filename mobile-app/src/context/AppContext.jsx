import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { getCities, getFavorites, getMe, getVenues } from '../api';
import { CITIES, CITY_META } from '../config';
import { supabase } from '../supabase/client';

const AppContext = createContext(null);
const VENUE_CACHE_PREFIX = 'toptini.venue-directory.v1.';
const VENUE_REFRESH_INTERVAL_MS = 45_000;

export function AppProvider({ children }) {
  const [booting, setBooting] = useState(true);
  const [authReady, setAuthReady] = useState(false);
  const [session, setSession] = useState(null);
  const [online, setOnline] = useState(null);
  const [city, setCity] = useState('Milwaukee');
  const [cities, setCities] = useState(CITIES);
  const [cityMeta, setCityMeta] = useState(CITY_META);
  const [venuesByCity, setVenuesByCity] = useState({});
  const [profile, setProfile] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [venueLoading, setVenueLoading] = useState(false);
  const [apiUnavailable, setApiUnavailable] = useState(false);
  const authGeneration = useRef(0);
  const authUserId = useRef(null);
  const venueCacheRef = useRef({});
  const venueRequestsRef = useRef(new Map());
  const activeCityRef = useRef(city);
  activeCityRef.current = city;

  const storeVenueDirectory = useCallback((targetCity, data) => {
    const previous = venueCacheRef.current[targetCity];
    if (previous && JSON.stringify(previous) === JSON.stringify(data)) return;
    venueCacheRef.current = { ...venueCacheRef.current, [targetCity]: data };
    setVenuesByCity(current => ({ ...current, [targetCity]: data }));
    AsyncStorage.setItem(
      `${VENUE_CACHE_PREFIX}${targetCity}`,
      JSON.stringify(data),
    ).catch(() => {});
  }, []);

  const loadCoreData = useCallback((targetCity = city) => {
    const inFlight = venueRequestsRef.current.get(targetCity);
    if (inFlight) return inFlight;
    if (activeCityRef.current === targetCity && !venueCacheRef.current[targetCity]) {
      setVenueLoading(true);
    }

    const request = (async () => {
      let cached = venueCacheRef.current[targetCity];
      if (!cached) {
        try {
          const saved = await AsyncStorage.getItem(
            `${VENUE_CACHE_PREFIX}${targetCity}`,
          );
          if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) {
              cached = parsed;
              venueCacheRef.current = {
                ...venueCacheRef.current,
                [targetCity]: parsed,
              };
              setVenuesByCity(current => ({ ...current, [targetCity]: parsed }));
            }
          }
        } catch {
          // Ignore an invalid or unavailable cache and fetch fresh data below.
        }
      }

      const isCurrentCity = () => activeCityRef.current === targetCity;
      if (isCurrentCity()) {
        // Only show the initial loader when there is no saved list to keep visible.
        setVenueLoading(!cached);
        if (cached) setApiUnavailable(false);
      }
      try {
        const data = await getVenues(targetCity);
        storeVenueDirectory(targetCity, data);
        if (isCurrentCity()) setApiUnavailable(false);
        return data;
      } catch {
        // Keep showing the last known list when the network request fails.
        if (isCurrentCity()) setApiUnavailable(true);
        return cached || [];
      } finally {
        if (isCurrentCity()) setVenueLoading(false);
      }
    })();

    venueRequestsRef.current.set(targetCity, request);
    request.finally(() => {
      if (venueRequestsRef.current.get(targetCity) === request) {
        venueRequestsRef.current.delete(targetCity);
      }
    }).catch(() => {});
    return request;
  }, [city, storeVenueDirectory]);

  const venues = venuesByCity[city] || [];

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

  const setCurrentCityVenues = useCallback(
    data => storeVenueDirectory(city, data),
    [city, storeVenueDirectory],
  );

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
      setFavorites([]);
    }
  }, [city, online, session, loadCoreData, loadFavorites]);

  useEffect(() => {
    if (!online || !session?.user) return undefined;

    let active = true;
    const refreshQuietly = () => {
      if (active && AppState.currentState === 'active') loadCoreData(city);
    };
    const appStateSubscription = AppState.addEventListener('change', state => {
      if (state === 'active') refreshQuietly();
    });
    const refreshTimer = setInterval(
      refreshQuietly,
      VENUE_REFRESH_INTERVAL_MS,
    );
    const channel = supabase
      .channel(`venue-directory-${city}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'venues',
          filter: `city=eq.${city}`,
        },
        refreshQuietly,
      )
      .subscribe();

    return () => {
      active = false;
      appStateSubscription.remove();
      clearInterval(refreshTimer);
      supabase.removeChannel(channel);
    };
  }, [city, online, session?.user?.id, loadCoreData]);

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
      setVenues: setCurrentCityVenues,
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
      setCurrentCityVenues,
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
