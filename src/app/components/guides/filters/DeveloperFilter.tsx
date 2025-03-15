'use client';

import { useGetGamesQuery } from '@/store/api/gamesApi';
import { RootState } from '@/store/store';
import { useDispatch, useSelector } from 'react-redux';
import Dropdown from '../../ui/Dropdown';
import { setDeveloper, setSelectedDeveloper } from '@/store/slices/developerSlice';
import { getIcon } from '@/utils/icons/getIcon';

export default function DeveloperFilter() {
  const dispatch = useDispatch();

  const { data } = useGetGamesQuery();

  const developer = useSelector((state: RootState) => state.developer.developer);
  const selectedDeveloper = useSelector((state: RootState) => state.developer.selectedDeveloper);

  if (data?.developer && developer.length === 0) {
    const formattedDevelopers = data.developer.map(developer => ({
      value: developer,
      label: `${developer}`,
    }));

    dispatch(setDeveloper(formattedDevelopers));
  }

  const options = [
    {
      value: '',
      label: 'Όλοι οι Προγραμματιστές',
      icon: getIcon('developer'),
    },
    ...(data?.developer.map(developer => ({
      value: developer,
      label: `${developer}`,
      icon: getIcon('developer'),
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
