'use client';

import { useEffect } from 'react';
import { useGetGamesQuery } from '@/store/api/gamesApi';
import { RootState } from '@/store/store';
import { useDispatch, useSelector } from 'react-redux';
import { setDeveloper, setSelectedDeveloper } from '@/store/slices/developerSlice';
import { getIcon } from '@/utils/icons/getIcon';
import Dropdown from '../ui/Dropdown';

export default function DeveloperFilter() {
  const dispatch = useDispatch();

  const { data } = useGetGamesQuery();

  const developer = useSelector((state: RootState) => state.developer.developer);
  const selectedDeveloper = useSelector((state: RootState) => state.developer.selectedDeveloper);

  useEffect(() => {
    if (data?.developers && developer.length === 0) {
      const formattedDevelopers = data.developers.map(developer => ({
        value: developer,
        label: `${developer}`,
      }));

      dispatch(setDeveloper(formattedDevelopers));
    }
  }, [data, developer.length, dispatch]);

  const options = [
    {
      value: '',
      label: 'Developers',
      icon: getIcon('developer'),
    },
    ...(data?.developers.map(developer => ({
      value: developer,
      label: `${developer}`,
    })) ?? []),
  ];

  const handleSelect = (value: string | null) => {
    dispatch(setSelectedDeveloper(value));
  };
  return (
    <Dropdown
      options={options}
      selectedValue={selectedDeveloper ?? ''}
      onSelect={handleSelect}
      isOpen={false}
      zIndex={50}
    />
  );
}
