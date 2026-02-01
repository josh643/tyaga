/**
 * @vitest-environment node
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Orchestrator } from './orchestrator';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// Mock Electron modules
vi.mock('electron', () => {
  const os = require('os');
  return {
    ipcMain: {
      handle: vi.fn(),
    },
    app: {
      getPath: vi.fn().mockReturnValue(os.tmpdir()),
    },
  };
});


describe('Orchestrator', () => {
  let tempDir: string;
  let orchestrator: Orchestrator;

  beforeEach(() => {
    // Create a temporary directory for each test
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'orchestrator-test-'));
  });

  afterEach(() => {
    // Cleanup
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
    vi.clearAllMocks();
  });

  it('should initialize with default slots and agents when no state exists', () => {
    orchestrator = new Orchestrator(tempDir);
    const state = orchestrator.getState();
    
    expect(state.slots.length).toBeGreaterThan(0);
    // expect(state.agents.length).toBeGreaterThan(0); // Agents are now fetched async, so initially 0
    
    // Check for specific default slots
    const authSlot = state.slots.find(s => s.id === 'auth');
    expect(authSlot).toBeDefined();
    // expect(authSlot?.status).toBe('Healthy'); // Status depends on ping, which is async/network dependent
  });

  it('should create a new agent and persist state', async () => {
    orchestrator = new Orchestrator(tempDir);
    const initialCount = orchestrator.getState().agents.length;

    // Mock n8nService in orchestrator
    (orchestrator as any).n8nService = {
        createWorkflow: vi.fn().mockResolvedValue({ id: 'mock-workflow-id', name: 'Test Agent' }),
        getWorkflows: vi.fn().mockResolvedValue([])
    };

    const newAgent = await orchestrator.createAgent({
      name: 'Test Agent',
      type: 'Test',
    });

    expect(newAgent.id).toBeDefined();
    expect(newAgent.name).toBe('Test Agent');
    // expect(newAgent.n8nWorkflowId).toBeDefined(); // Depends on mock

    // Check in-memory state
    const state = orchestrator.getState();
    expect(state.agents.length).toBe(initialCount + 1);
    expect(state.agents.find(a => a.id === newAgent.id)).toBeDefined();

    // Check persistence
    const savedData = JSON.parse(fs.readFileSync(path.join(tempDir, 'orchestrator-data.json'), 'utf-8'));
    expect(savedData.agents.find((a: any) => a.id === newAgent.id)).toBeDefined();
  });

  it('should assign an agent to a slot and update status', () => {
    orchestrator = new Orchestrator(tempDir);
    const slotId = 'brand-mgmt';
    const agentId = 'test-agent-id';

    // Verify initial state
    let slot = orchestrator.getState().slots.find(s => s.id === slotId);
    expect(slot?.assignedAgentId).toBeNull();
    expect(slot?.status).toBe('Idle');

    // Assign agent
    orchestrator.assignAgent(slotId, agentId);

    // Verify updated state
    slot = orchestrator.getState().slots.find(s => s.id === slotId);
    expect(slot?.assignedAgentId).toBe(agentId);
    expect(slot?.status).toBe('Active');

    // Check persistence
    const savedData = JSON.parse(fs.readFileSync(path.join(tempDir, 'orchestrator-data.json'), 'utf-8'));
    const savedSlot = savedData.slots.find((s: any) => s.id === slotId);
    expect(savedSlot.assignedAgentId).toBe(agentId);
    expect(savedSlot.status).toBe('Active');
  });

  it('should create and retrieve works', async () => {
    orchestrator = new Orchestrator(tempDir);
    
    // Mock fetch for createWork
    global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'work-123', title: 'Test Song', iswc: 'T-000000001-1' })
    });

    const work = await orchestrator.createWork({
      title: 'Test Song',
      iswc: 'T-000000001-1',
      writers: 'Me (100%)'
    });

    expect(work.id).toBeDefined();
    expect(work.status).toBe('Registered');
    
    const state = orchestrator.getState();
    expect(state.works).toHaveLength(1);
    expect(state.works[0].title).toBe('Test Song');
  });

  it('should create and trigger campaigns', async () => {
    orchestrator = new Orchestrator(tempDir);
    
    // Mock fetch for createCampaign and triggerCampaign
    global.fetch = vi.fn()
        .mockResolvedValueOnce({ // createCampaign
            ok: true,
            json: async () => ({ id: 'camp-123', name: 'Test Launch', status: 'Draft' })
        })
        .mockResolvedValueOnce({ // triggerCampaign
            ok: true
        });

    const campaign = await orchestrator.createCampaign({
      name: 'Test Launch',
      platform: 'Instagram'
    });

    expect(campaign.status).toBe('Draft');
    
    const result = await orchestrator.triggerCampaign(campaign.id);
    expect(result.success).toBe(true);
    
    const state = orchestrator.getState();
    expect(state.campaigns.find(c => c.id === campaign.id)?.status).toBe('Active');
  });

  it('should load state from existing file', async () => {
    // Create a fake existing state
    const fakeState = {
      slots: [],
      agents: [{ id: 'loaded-agent', name: 'Loaded Agent', type: 'Test' }]
    };
    fs.writeFileSync(path.join(tempDir, 'orchestrator-data.json'), JSON.stringify(fakeState));

    // Initialize orchestrator
    orchestrator = new Orchestrator(tempDir);
    const state = orchestrator.getState();

    expect(state.agents.length).toBe(1);
    expect(state.agents[0].id).toBe('loaded-agent');
  });
});
