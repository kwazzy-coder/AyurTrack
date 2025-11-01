
import { useState, useEffect } from 'react';
import { GeolocationCoordinates } from '../types';

interface GeolocationState {
  loading: boolean;
  error: string | null;
  data: GeolocationCoordinates | null;
}

export const useGeolocation = () => {
  const [state, setState] = useState<GeolocationState>({
    loading: true,
    error: null,
    data: null,
  });

  useEffect(() => {
    const fetchLocation = () => {
      if (!navigator.geolocation) {
        setState({
          loading: false,
          error: 'Geolocation is not supported by your browser.',
          data: null,
        });
        return;
      }

      setState({ loading: true, error: null, data: null });

      navigator.geolocation.getCurrentPosition(
        (position) => {
          setState({
            loading: false,
            error: null,
            data: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
            },
          });
        },
        (error) => {
          setState({
            loading: false,
            error: error.message,
            data: null,
          });
        }
      );
    };

    fetchLocation();
  }, []);

  return state;
};
