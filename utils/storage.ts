import AsyncStorage from '@react-native-async-storage/async-storage';

const BEST_SCORE_KEY = 'platformer_best_score';

/**
 * Storage utility for managing persistent game data
 */
export class GameStorage {
  /**
   * Get the best score from persistent storage
   * @returns Promise<number> The best score, or 0 if none exists
   */
  static async getBestScore(): Promise<number> {
    try {
      const value = await AsyncStorage.getItem(BEST_SCORE_KEY);
      return value ? parseInt(value, 10) : 0;
    } catch (error) {
      console.warn('Failed to load best score:', error);
      return 0;
    }
  }

  /**
   * Save the best score to persistent storage
   * @param score The score to save
   * @returns Promise<boolean> True if successful, false otherwise
   */
  static async setBestScore(score: number): Promise<boolean> {
    try {
      await AsyncStorage.setItem(BEST_SCORE_KEY, score.toString());
      return true;
    } catch (error) {
      console.warn('Failed to save best score:', error);
      return false;
    }
  }

  /**
   * Update best score if the new score is higher
   * @param newScore The new score to potentially save
   * @returns Promise<boolean> True if best score was updated, false otherwise
   */
  static async updateBestScoreIfHigher(newScore: number): Promise<boolean> {
    try {
      const currentBest = await this.getBestScore();
      if (newScore > currentBest) {
        await this.setBestScore(newScore);
        return true;
      }
      return false;
    } catch (error) {
      console.warn('Failed to update best score:', error);
      return false;
    }
  }
}