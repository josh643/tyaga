import { config } from '../config';

export interface Workflow {
  id: string;
  name: string;
  active: boolean;
  nodes: any[];
  createdAt: string;
  updatedAt: string;
}

export class N8nService {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = config.N8N_URL.replace(/\/$/, ''); // Remove trailing slash
    this.apiKey = config.N8N_API_KEY;
  }

  private async request(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.baseUrl}/api/v1${endpoint}`;
    const headers = {
      'X-N8N-API-KEY': this.apiKey,
      'Content-Type': 'application/json',
      ...options.headers,
    };

    console.log(`[N8nService] Requesting: ${url}`);
    
    try {
      const response = await fetch(url, { ...options, headers });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`n8n API Error (${response.status}): ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('[N8nService] Request failed:', error);
      throw error;
    }
  }

  public async getWorkflows(): Promise<Workflow[]> {
    try {
      const data = await this.request('/workflows');
      return data.data || [];
    } catch (error) {
      console.error('Failed to fetch workflows:', error);
      return [];
    }
  }

  public async createWorkflow(name: string): Promise<Workflow | null> {
    try {
      const payload = {
        name: name,
        nodes: [],
        connections: {},
        settings: {},
        active: true
      };
      
      const data = await this.request('/workflows', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      
      return data;
    } catch (error) {
      console.error('Failed to create workflow:', error);
      return null;
    }
  }

  public async activateWorkflow(id: string): Promise<boolean> {
    try {
      await this.request(`/workflows/${id}/activate`, { method: 'POST' });
      return true;
    } catch (error) {
      return false;
    }
  }

  public async deactivateWorkflow(id: string): Promise<boolean> {
    try {
      await this.request(`/workflows/${id}/deactivate`, { method: 'POST' });
      return true;
    } catch (error) {
      return false;
    }
  }
}
