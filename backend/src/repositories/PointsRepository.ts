import { User } from '../models/User';
import { PointsTransaction, PointSource, UserPoints } from '../types/points';

export class PointsRepository {
  async updatePoints(userId: string, amount: number, source: PointSource): Promise<void> {
    await User.updateOne(
      { discord_id: userId },
      {
        $inc: { 
          points: amount,
          totalPoints: amount > 0 ? amount : 0 // Only increase total points for positive amounts
        },
        $push: {
          pointsHistory: {
            amount,
            source,
            timestamp: new Date()
          }
        }
      }
    );
  }

  async getUserPoints(userId: string): Promise<UserPoints | null> {
    const user = await User.findOne(
      { discord_id: userId },
      'points totalPoints pointsHistory'
    );
    
    if (!user) return null;

    return {
      current: user.points,
      total: user.totalPoints,
      history: user.pointsHistory.map(entry => ({
        amount: entry.amount,
        source: entry.source as PointSource,
        timestamp: entry.timestamp
      }))
    };
  }

  async getTopUsers(limit: number = 10): Promise<Array<{ userId: string; username: string; points: number }>> {
    return User.find(
      { 'settings.privacy.showInLeaderboard': true },
      'discord_id username points'
    )
      .sort({ points: -1 })
      .limit(limit)
      .then(users => users.map(user => ({
        userId: user.discord_id,
        username: user.username,
        points: user.points
      })));
  }

  async resetPoints(userId: string): Promise<void> {
    await User.updateOne(
      { discord_id: userId },
      {
        $set: { points: 0 },
        $push: {
          pointsHistory: {
            amount: 0,
            source: 'ADMIN_ADJUSTMENT',
            timestamp: new Date()
          }
        }
      }
    );
  }
}