'use client';

import { useDispatch, useSelector } from 'react-redux';
import { setPlatforms, setSelectedPlatform } from '@/store/slices/platformsSlice';
import { RootState } from '@/store/store';
import { useGetGamesQuery } from '@/store/api/gamesApi';
import { Gamepad2, Monitor } from 'lucide-react';
import Dropdown from '../../ui/Dropdown';

const getPlatformIcon = (platform: string): React.ReactNode => {
  if (platform === 'PS5' || platform === 'PS4' || platform === 'PS3') {
    return <Gamepad2 className="h-5 w-5 text-blue-400" />;
  }
  if (platform === 'PC') {
    return <Monitor className="h-5 w-5 text-green-400" />;
  }
  return <Gamepad2 className="h-5 w-5 text-gray-400" />;
};

export default function PlatformFilter() {
  const dispatch = useDispatch();

  const { data } = useGetGamesQuery();

  const platforms = useSelector((state: RootState) => state.platforms.platforms);
  const selectedPlatform = useSelector((state: RootState) => state.platforms.selectedPlatform);

  if (data?.platforms && platforms.length === 0) {
    const formattedPlatforms = data.platforms.map(platform => ({
      value: platform,
      label: platform,
    }));

    dispatch(setPlatforms(formattedPlatforms));
  }

  const options = [
    {
      value: '',
      label: 'Όλες οι Πλατφόρμες',
      icon: <Gamepad2 className="h-5 w-5 text-red-400" />,
    },
    ...platforms.map(platform => ({
      value: platform.value,
      label: platform.label,
      icon: getPlatformIcon(platform.value),
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
