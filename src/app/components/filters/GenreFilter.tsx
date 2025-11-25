'use client';

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setGenres, setSelectedGenre } from '@/store/slices/genresSlice';
import { RootState } from '@/store/store';
import { useGetGamesQuery } from '@/store/api/gamesApi';
import { getIcon } from '@/utils/icons/getIcon';
import Dropdown from '../ui/Dropdown';

export default function GenreFilter() {
  const dispatch = useDispatch();

  const { data } = useGetGamesQuery();

  const genres = useSelector((state: RootState) => state.genres.genres);
  const selectedGenre = useSelector((state: RootState) => state.genres.selectedGenre);

  useEffect(() => {
    if (data?.genres && genres.length === 0) {
      const formattedGenres = data.genres.map(genre => ({
        value: genre,
        label: `${genre}`,
      }));

      dispatch(setGenres(formattedGenres));
    }
  }, [data, genres.length, dispatch]);

  const options = [
    {
      value: '',
      label: 'Όλα τα Είδη',
      icon: getIcon('genre'),
    },
    ...(data?.genres.map(genre => ({
      value: genre,
      label: `${genre}`,
      icon: getIcon(genre),
    })) ?? []),
  ];

  const handleSelect = (value: string | null) => {
    dispatch(setSelectedGenre(value));
  };

  return (
    <Dropdown
      options={options}
      selectedValue={selectedGenre ?? ''}
      onSelect={handleSelect}
      isOpen={false}
      zIndex={10}
    />
  );
}
