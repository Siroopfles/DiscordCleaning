import { Achievement, AchievementProgress } from '@/types/achievement';

class AchievementService {
  private baseUrl = '/api/achievements';

  async getAllAchievements(): Promise<Achievement[]> {
    const response = await fetch(this.baseUrl);
    if (!response.ok) {
      throw new Error('Failed to fetch achievements');
    }
    return response.json();
  }

  async getUserProgress(userId: string): Promise<AchievementProgress[]> {
    const response = await fetch(`${this.baseUrl}/progress/${userId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch user progress');
    }
    return response.json();
  }

  async getAchievementsByCategory(category: string): Promise<Achievement[]> {
    const response = await fetch(`${this.baseUrl}/category/${category}`);
    if (!response.ok) {
      throw new Error('Failed to fetch achievements by category');
    }
    return response.json();
  }

  async updateProgress(
    userId: string,
    achievementId: string,
    progress: Partial<AchievementProgress>
  ): Promise<AchievementProgress> {
    const response = await fetch(`${this.baseUrl}/progress/${userId}/${achievementId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(progress),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update achievement progress');
    }
    return response.json();
  }
}

export const achievementService = new AchievementService();