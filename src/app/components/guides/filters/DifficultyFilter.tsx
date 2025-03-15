'use client';

import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { setSelectedDifficulty } from '@/store/slices/difficultySlice';
import SingleSlider from '../../ui/SingleSlider';

export default function DifficultyFilter() {
  const dispatch = useDispatch();

  const difficulty = useSelector((state: RootState) => state.difficulty.selectedDifficulty);

  const handleSelect = (value: number) => {
    dispatch(setSelectedDifficulty(value));
  };

  return (
    <SingleSlider
      min={0}
      max={10}
      value={difficulty ?? 0}
      onChange={handleSelect}
      label="Δυσκολία"
      icon={<span>🔥</span>}
    />
  );
}
