import { ResponseContext, ResponseValidator } from '../../../interfaces/api';
import { ApiResponse } from '../../../../../types/api';

export class DefaultResponseValidator implements ResponseValidator {
  async validate<T>(context: ResponseContext<T>): Promise<void> {
    const response = context.response;

    // Controleer of de response voldoet aan de ApiResponse interface
    if (!this.isValidApiResponse(response)) {
      throw new Error('Invalid API response format');
    }

    // Als er een error is in de response, moet success false zijn
    if (response.error && response.success) {
      throw new Error('Inconsistent response: success should be false when error is present');
    }

    // Als success true is, moet er data zijn (tenzij het een void response is)
    if (response.success && response.data === undefined && !this.isVoidResponse(context)) {
      throw new Error('Success response must contain data');
    }
  }

  private isValidApiResponse<T>(response: unknown): response is ApiResponse<T> {
    if (!response || typeof response !== 'object') {
      return false;
    }

    const apiResponse = response as ApiResponse<T>;
    return typeof apiResponse.success === 'boolean' &&
      (apiResponse.data !== undefined || apiResponse.error !== undefined);
  }

  private isVoidResponse<T>(context: ResponseContext<T>): boolean {
    // Check of het een DELETE request was of een ander endpoint dat geen data teruggeeft
    return context.request.method === 'DELETE' || 
           context.request.path.endsWith('/delete');
  }
}