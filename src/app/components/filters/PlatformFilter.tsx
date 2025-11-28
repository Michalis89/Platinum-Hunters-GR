'use client';

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setPlatforms, setSelectedPlatform } from '@/store/slices/platformsSlice';
import { RootState } from '@/store/store';
import { useGetGamesQuery } from '@/store/api/gamesApi';
import { Gamepad2 } from 'lucide-react';
import Dropdown from '../ui/Dropdown';

export default function PlatformFilter() {
  const dispatch = useDispatch();

  const { data } = useGetGamesQuery();

  const platforms = useSelector((state: RootState) => state.platforms.platforms);
  const selectedPlatform = useSelector((state: RootState) => state.platforms.selectedPlatform);

  useEffect(() => {
    if (data?.platforms && platforms.length === 0) {
      const platformOrder = ['PS5', 'PS4', 'PS3', 'PS2', 'PS1', 'PS Vita'];

      const formattedPlatforms = data.platforms
        .filter(platform => platform.startsWith('PS'))
        .sort((a, b) => {
          const indexA = platformOrder.indexOf(a);
          const indexB = platformOrder.indexOf(b);

          // If both are in the order array, sort by index
          if (indexA !== -1 && indexB !== -1) return indexA - indexB;
          // If only A is in the order array, A comes first
          if (indexA !== -1) return -1;
          // If only B is in the order array, B comes first
          if (indexB !== -1) return 1;
          // If neither is in the order array, sort alphabetically
          return a.localeCompare(b);
        })
        .map(platform => ({
          value: platform,
          label: platform,
        }));

      dispatch(setPlatforms(formattedPlatforms));
    }
  }, [data, platforms.length, dispatch]);

  const options = [
    {
      value: '',
      label: 'Κονσόλες',
      icon: <Gamepad2 className="h-5 w-5 text-red-400" />,
    },
    ...platforms.map(platform => ({
      value: platform.value,
      label: platform.label,
    })),
  ];

  const handleSelect = (value: string | null) => {
    dispatch(setSelectedPlatform(value));
  };

  return (
    <Dropdown
      options={options}
      selectedValue={selectedPlatform ?? ''}
      onSelect={handleSelect}
      isOpen={false}
      zIndex={10}
    />
  );
}
