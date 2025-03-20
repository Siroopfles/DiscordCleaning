import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import { fetchAchievements, fetchUserProgress, setSelectedCategory } from '@/store/slices/achievementsSlice';
import { AchievementList } from './AchievementList';
import { AppDispatch } from '@/store';

export const AchievementsContainer: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const {
    achievements,
    progress,
    selectedCategory,
    loading,
    error
  } = useSelector((state: RootState) => state.achievements);

  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    dispatch(fetchAchievements());
    // TODO: Get actual user ID from auth context
    dispatch(fetchUserProgress('current-user-id'));
  }, [dispatch]);

  useEffect(() => {
    const uniqueCategories = [...new Set(achievements.map((achievement) => achievement.category))];
    setCategories(uniqueCategories.filter((category): category is string => !!category));
  }, [achievements]);

  const handleCategoryChange = (category: string | null) => {
    dispatch(setSelectedCategory(category));
  };

  if (loading) {
    return <div className="flex justify-center p-8">Laden...</div>;
  }

  if (error) {
    return (
      <div className="p-4 text-red-600 bg-red-100 rounded">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Achievements</h1>
      
      <div className="mb-6">
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            className={`px-4 py-2 rounded-full ${
              !selectedCategory
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            onClick={() => handleCategoryChange(null)}
          >
            Alle
          </button>
          {categories.map((category) => (
            <button
              key={category}
              className={`px-4 py-2 rounded-full ${
                selectedCategory === category
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              onClick={() => handleCategoryChange(category)}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      <AchievementList
        achievements={achievements}
        progress={progress}
        category={selectedCategory}
      />
    </div>
  );
};