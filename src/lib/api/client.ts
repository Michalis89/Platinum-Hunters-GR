export class ApiClient {
  async request(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    return fetch(input, init);
  }

  async getJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
    const response = await this.request(input, init);
    return (await response.json()) as T;
  }

  async getJsonOrThrow<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
    const response = await this.request(input, init);
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }
    return (await response.json()) as T;
  }

  swrFetcher = <T>(url: string) => this.getJson<T>(url);

  swrNoStoreFetcher = <T>(url: string) =>
    this.getJson<T>(url, {
      cache: 'no-store',
    });
}

export const apiClient = new ApiClient();
