import { RequestContext, RequestValidator } from '../../../interfaces/api';

export class DefaultRequestValidator implements RequestValidator {
  async validate(context: RequestContext): Promise<void> {
    // Valideer basis request eigenschappen
    if (!context.path) {
      throw new Error('Request path is required');
    }

    if (!context.method) {
      throw new Error('Request method is required');
    }

    // Valideer body voor POST/PUT requests
    if ((context.method === 'POST' || context.method === 'PUT') && !context.body) {
      throw new Error('Request body is required for POST/PUT requests');
    }

    // Valideer headers
    if (context.headers) {
      // Content-Type validatie voor requests met body
      if (context.body && !context.headers['Content-Type']) {
        throw new Error('Content-Type header is required for requests with body');
      }
    }
  }
}