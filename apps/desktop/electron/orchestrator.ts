import { ipcMain, app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { N8nService } from './services/n8nService';
import { config } from './config';

export interface Slot {
  id: string;
  name: string;
  phase: string;
  assignedAgentId: string | null;
  status: 'Healthy' | 'Active' | 'Running' | 'Idle' | 'Error';
}

export interface Agent {
  id: string;
  name: string;
  type: string;
  n8nWorkflowId?: string;
}

export interface Work {
  id: string;
  title: string;
  iswc: string;
  writers: string; // Display string for frontend
  status: 'Pending' | 'Registered';
}

export interface Campaign {
  id: string;
  name: string;
  status: 'Draft' | 'Active' | 'Completed';
  platform: string;
  contentStrategy?: string;
}

interface OrchestratorData {
  slots: Slot[];
  agents: Agent[];
  works: Work[];
  campaigns: Campaign[];
  analytics: number[];
}

export class Orchestrator {
  private slots: Slot[] = [];
  private agents: Agent[] = [];
  private works: Work[] = [];
  private campaigns: Campaign[] = [];
  private analytics: number[] = [];
  private readonly dataPath: string;
  private n8nService: N8nService;

  constructor(userDataPath?: string) {
    // If no path provided, try to use app.getPath (runtime) or fallback to ./ (testing)
    const basePath = userDataPath || (app ? app.getPath('userData') : '.');
    this.dataPath = path.join(basePath, 'orchestrator-data.json');
    this.n8nService = new N8nService();
    
    this.initialize();
  }

  private initialize() {
    // Load structural slots (these are architectural constants, so it's okay to hardcode the *slots*, but not the data)
    this.initializeSlots();
    
    // Attempt to load other state, but prioritize fetching live data
    this.loadState();
    
    this.registerIpcHandlers();
    
    // Initial health check and periodic polling
    this.checkServiceHealth();
    setInterval(() => this.checkServiceHealth(), 30000); // Check every 30s
  }

  private loadState(): boolean {
    try {
      if (fs.existsSync(this.dataPath)) {
        const data = fs.readFileSync(this.dataPath, 'utf-8');
        const parsed: OrchestratorData = JSON.parse(data);
        if (parsed.slots && parsed.agents) {
          this.slots = parsed.slots;
          this.agents = parsed.agents;
          this.works = parsed.works || [];
          this.campaigns = parsed.campaigns || [];
          console.log(`State loaded from ${this.dataPath}`);
          return true;
        }
      }
    } catch (error) {
      console.error('Failed to load state:', error);
    }
    return false;
  }

  private saveState() {
    try {
      const data: OrchestratorData = {
        slots: this.slots,
        agents: this.agents,
        works: this.works,
        campaigns: this.campaigns,
        analytics: this.analytics
      };
      fs.writeFileSync(this.dataPath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Failed to save state:', error);
    }
  }

  private initializeSlots() {
    // 14 Slots based on the "Phases" plan and Microservices Architecture
    this.slots = [
      // Phase 1: Foundation
      { id: 'auth', name: 'Auth Service', phase: 'Foundation', assignedAgentId: null, status: 'Idle' },
      { id: 'api-gateway', name: 'API Gateway', phase: 'Foundation', assignedAgentId: null, status: 'Idle' },
      { id: 'rights-tracking', name: 'Rights Tracking', phase: 'Foundation', assignedAgentId: null, status: 'Idle' },
      { id: 'brand-mgmt', name: 'Brand Management', phase: 'Foundation', assignedAgentId: null, status: 'Idle' },
      
      // Phase 2: Content & Revenue
      { id: 'omnivael-hub', name: 'Omnivael Hub', phase: 'Content', assignedAgentId: null, status: 'Idle' },
      { id: 'music-streaming', name: 'Music Streaming', phase: 'Content', assignedAgentId: null, status: 'Idle' },
      { id: 'art-nft', name: 'Art & NFT', phase: 'Content', assignedAgentId: null, status: 'Idle' },
      { id: 'content-mgmt', name: 'Content Mgmt', phase: 'Content', assignedAgentId: null, status: 'Idle' },
      { id: 'social-mgmt', name: 'Social Media Hub', phase: 'Content', assignedAgentId: null, status: 'Idle' },
      { id: 'payment', name: 'Payment Processing', phase: 'Content', assignedAgentId: null, status: 'Idle' },
      { id: 'analytics', name: 'Analytics Engine', phase: 'Content', assignedAgentId: null, status: 'Idle' },

      // Phase 3: AI & Scale
      { id: 'ai-orchestrator', name: 'AI Orchestrator', phase: 'AI & Scale', assignedAgentId: null, status: 'Idle' },
      { id: 'marketing-engine', name: 'Marketing Engine', phase: 'AI & Scale', assignedAgentId: null, status: 'Idle' },
      { id: 'blockchain', name: 'Blockchain Integration', phase: 'AI & Scale', assignedAgentId: null, status: 'Idle' },
    ];
  }

  // Removed initializeAgents() to prevent mock agents from being created.
  // Agents will now be fetched from n8nService.

  private async checkServiceHealth() {
    // Map of slot ID to health check URL
    // These ports are based on docker-compose.yml configuration
    const healthEndpoints: Record<string, string> = {
        'auth': 'http://localhost:3001',
        'api-gateway': 'http://localhost:3000',
        'rights-tracking': 'http://localhost:3003',
        'brand-mgmt': 'http://localhost:3002',
        // 'omnivael-hub': 'http://localhost:3004', // Example for future services
    };

    const updates: Promise<void>[] = [];

    for (const slotId in healthEndpoints) {
        const url = healthEndpoints[slotId];
        updates.push(this.pingService(slotId, url));
    }
    
    await Promise.all(updates);
    this.saveState();
  }

  private async pingService(slotId: string, url: string) {
      const slotIndex = this.slots.findIndex(s => s.id === slotId);
      if (slotIndex === -1) return;

      try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 2000); // 2s timeout
          
          const response = await fetch(url, { method: 'GET', signal: controller.signal });
          clearTimeout(timeoutId);

          if (response.ok) {
              this.slots[slotIndex].status = 'Healthy';
          } else {
              this.slots[slotIndex].status = 'Error';
          }
      } catch (error) {
          // If connection refused, it's not running
          this.slots[slotIndex].status = 'Idle'; 
      }
  }

  private registerIpcHandlers() {
    // Check if ipcMain is available (it might not be in test environment)
    if (!ipcMain) return;

    ipcMain.handle('get-orchestrator-data', async () => {
      await Promise.all([this.fetchWorks(), this.fetchCampaigns(), this.fetchAnalytics(), this.fetchAgents()]); // Fetch real data
      return {
        slots: this.slots,
        agents: this.agents,
        works: this.works,
        campaigns: this.campaigns,
        analytics: this.analytics
      };
    });

    ipcMain.handle('get-n8n-workflows', async () => {
      return this.n8nService.getWorkflows();
    });

    ipcMain.handle('create-agent', async (_, agentData: Omit<Agent, 'id'>) => {
      return this.createAgent(agentData);
    });

    ipcMain.handle('assign-agent', (_, { slotId, agentId }: { slotId: string, agentId: string | null }) => {
      return this.assignAgent(slotId, agentId);
    });

    // Works
    ipcMain.handle('create-work', async (_, workData: any) => {
      return this.createWork(workData);
    });

    // Campaigns
    ipcMain.handle('create-campaign', async (_, campaignData: Omit<Campaign, 'id' | 'status'>) => {
      return this.createCampaign(campaignData);
    });

    ipcMain.handle('trigger-campaign', async (_, campaignId: string) => {
       return this.triggerCampaign(campaignId);
    });
  }
  
  // Public method for testing state
  public getState() {
    return { slots: this.slots, agents: this.agents, works: this.works, campaigns: this.campaigns };
  }

  private async fetchWorks() {
    try {
      const response = await fetch(`${config.API_BASE_URL}/works`);
      if (response.ok) {
        const works = await response.json();
        // Map backend entities to frontend Work interface
        this.works = works.map((w: any) => ({
          id: w.id,
          title: w.title,
          iswc: w.iswc || '',
          writers: w.writers ? w.writers.map((wr: any) => `${wr.name} (${wr.performanceSplit}%)`).join(', ') : '',
          status: 'Registered',
          audioUrl: w.audioUrl // Pass through the presigned URL
        }));
      }
    } catch (error) {
      console.error('Failed to fetch works from API:', error);
    }
  }

  private async fetchCampaigns() {
    try {
        const response = await fetch(`${config.API_BASE_URL}/campaigns`);
        if (response.ok) {
            const campaigns = await response.json();
            this.campaigns = campaigns;
        }
    } catch (error) {
        console.error('Failed to fetch campaigns:', error);
    }
  }

  private async fetchAnalytics() {
    try {
        const response = await fetch(`${config.API_BASE_URL}/campaigns/analytics`);
        if (response.ok) {
            this.analytics = await response.json();
        }
    } catch (error) {
        console.error('Failed to fetch analytics:', error);
    }
  }

  private async fetchAgents() {
    try {
        const workflows = await this.n8nService.getWorkflows();
        this.agents = workflows.map(wf => ({
            id: wf.id,
            name: wf.name,
            type: 'Automation', // Default type
            n8nWorkflowId: wf.id
        }));
    } catch (error) {
        console.error('Failed to fetch n8n workflows as agents:', error);
    }
  }

  public async createAgent(agentData: Omit<Agent, 'id'>): Promise<Agent> {
    const newAgent: Agent = {
      id: `agent-${Date.now()}`,
      ...agentData,
    };
    
    // Create n8n workflow
    try {
        const workflow = await this.n8nService.createWorkflow(newAgent.name);
        if (workflow) {
            newAgent.n8nWorkflowId = workflow.id;
        }
    } catch (e) {
        console.error("Failed to create n8n workflow", e);
    }

    this.agents.push(newAgent);
    this.saveState(); // Persist change
    return newAgent;
  }

  public assignAgent(slotId: string, agentId: string | null): Slot {
    const slotIndex = this.slots.findIndex(s => s.id === slotId);
    if (slotIndex !== -1) {
      this.slots[slotIndex].assignedAgentId = agentId;
      // Update status if assigned
      if (agentId) {
          this.slots[slotIndex].status = 'Active';
      } else {
          this.slots[slotIndex].status = 'Idle';
      }
      this.saveState(); // Persist change
      return this.slots[slotIndex];
    }
    throw new Error(`Slot ${slotId} not found`);
  }

  public async createWork(workData: any): Promise<Work> {
    // Parse writers string: "Name (50%), Name 2 (50%)"
    const writers = workData.writers.split(',').map((s: string) => {
        const match = s.match(/(.*)\s*\((\d+)%\)/);
        if (match) {
            return {
                name: match[1].trim(),
                performanceSplit: parseInt(match[2]),
                mechanicalSplit: parseInt(match[2])
            };
        }
        return { name: s.trim(), performanceSplit: 0, mechanicalSplit: 0 };
    });

    const formData = new FormData();
    formData.append('title', workData.title);
    formData.append('iswc', workData.iswc || '');
    formData.append('writers', JSON.stringify(writers));

    if (workData.audioFilePath) {
        try {
            const fileBuffer = fs.readFileSync(workData.audioFilePath);
            const fileName = path.basename(workData.audioFilePath);
            const blob = new Blob([fileBuffer]);
            formData.append('audioFile', blob, fileName);
        } catch (err) {
            console.error('Failed to read audio file:', err);
        }
    }

    try {
        const response = await fetch(`${config.API_BASE_URL}/works`, {
            method: 'POST',
            body: formData // fetch automatically sets multipart/form-data boundary
        });

        if (response.ok) {
            const savedWork = await response.json();
            const newWork: Work = {
                id: savedWork.id,
                title: savedWork.title,
                iswc: savedWork.iswc || '',
                writers: workData.writers,
                status: 'Registered'
            };
            this.works.push(newWork);
            return newWork;
        } else {
            const text = await response.text();
            console.error('API Error:', text);
        }
    } catch (error) {
         console.error('Failed to create work on API:', error);
    }
    
    // Fallback if API fails (or throw error)
    throw new Error("Failed to create work on backend");
  }

  public async createCampaign(campaignData: Omit<Campaign, 'id' | 'status'>): Promise<Campaign> {
    const payload = {
        name: campaignData.name,
        platform: campaignData.platform,
        contentStrategy: campaignData.contentStrategy,
        status: 'Draft'
    };

    try {
        const response = await fetch(`${config.API_BASE_URL}/campaigns`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            const newCampaign = await response.json();
            this.campaigns.push(newCampaign);
            return newCampaign;
        }
    } catch (error) {
        console.error("Failed to create campaign:", error);
    }
    throw new Error("Failed to create campaign");
  }

  public async triggerCampaign(campaignId: string) {
    try {
        const response = await fetch(`${config.API_BASE_URL}/campaigns/${campaignId}/trigger`, {
            method: 'POST'
        });
        
        if (response.ok) {
            // Update local state
            const campaign = this.campaigns.find(c => c.id === campaignId);
            if (campaign) campaign.status = 'Active';
            return { success: true, message: "Campaign triggered" };
        }
    } catch (error) {
        console.error("Failed to trigger campaign:", error);
    }
    throw new Error("Failed to trigger campaign");
  }
}
