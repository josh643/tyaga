import React, { useState, useEffect, useRef } from 'react';
import { ipcRenderer } from 'electron';
import { Bot, Rocket, AlertCircle, RefreshCw, Save, Globe } from 'lucide-react';
import { config } from '../config';

interface Slot {
  id: string;
  name: string;
  phase: string;
  assignedAgentId: string | null;
  status: string;
}

export default function AgentLab() {
  const [n8nUrl, setN8nUrl] = useState(config.N8N_URL);
  const [agentName, setAgentName] = useState('');
  const [workflowId, setWorkflowId] = useState('');
  const [workflowSelection, setWorkflowSelection] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [slots, setSlots] = useState<Slot[]>([]);
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [isLoadingWorkflows, setIsLoadingWorkflows] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [iframeError, setIframeError] = useState(false);
  
  const webviewRef = useRef<any>(null);

  const fetchSlots = async () => {
    try {
      const data = await ipcRenderer.invoke('get-orchestrator-data');
      setSlots(data.slots);
    } catch (error) {
      console.error('Failed to fetch slots:', error);
    }
  };

  const fetchWorkflows = async () => {
    setIsLoadingWorkflows(true);
    try {
      const data = await ipcRenderer.invoke('get-n8n-workflows');
      setWorkflows(data);
    } catch (error) {
      console.error('Failed to fetch workflows:', error);
    } finally {
      setIsLoadingWorkflows(false);
    }
  };

  useEffect(() => {
    fetchSlots();
    fetchWorkflows();
  }, []);

  // ... (injectLoginScript and auto-login logic remain the same) ...
  const injectLoginScript = () => {
    const webview = webviewRef.current;
    if (!webview) return;

    const loginScript = `
      (function() {
        console.log('[AutoLogin] Checking for n8n login form...');
        
        function tryLogin() {
            const emailInput = document.querySelector('input[name="email"]') || document.querySelector('input[type="email"]');
            const passwordInput = document.querySelector('input[name="password"]') || document.querySelector('input[type="password"]');
            // Find submit button (handle various n8n versions)
            let submitBtn = document.querySelector('button[type="submit"]');
            if (!submitBtn) {
                // Fallback: look for button with specific text
                const buttons = Array.from(document.querySelectorAll('button'));
                submitBtn = buttons.find(b => b.textContent?.includes('Sign in') || b.textContent?.includes('Log in'));
            }

            if (emailInput && passwordInput) {
                console.log('[AutoLogin] Login form found. Attempting to fill...');
                
                // Helper to trigger change events for React/Vue
                const setNativeValue = (element, value) => {
                    const valueSetter = Object.getOwnPropertyDescriptor(element, 'value').set;
                    const prototype = Object.getPrototypeOf(element);
                    const prototypeValueSetter = Object.getOwnPropertyDescriptor(prototype, 'value').set;
                    
                    if (valueSetter && valueSetter !== prototypeValueSetter) {
                        prototypeValueSetter.call(element, value);
                    } else {
                        valueSetter.call(element, value);
                    }
                    
                    element.dispatchEvent(new Event('input', { bubbles: true }));
                    element.dispatchEvent(new Event('change', { bubbles: true }));
                };

                if (!emailInput.value) {
                    setNativeValue(emailInput, "${config.N8N_AUTH.email}");
                    setNativeValue(passwordInput, "${config.N8N_AUTH.password}");

                    setTimeout(() => {
                        // Re-query button just in case
                        const btn = document.querySelector('button[type="submit"]') || 
                                    Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Sign in') || b.textContent?.includes('Log in'));
                        if (btn) {
                            console.log('[AutoLogin] Clicking submit...');
                            btn.click();
                        }
                    }, 500);
                }
            }
        }
        
        // Retry a few times in case of SPA rendering delay
        let attempts = 0;
        const interval = setInterval(() => {
            attempts++;
            if (attempts > 20) clearInterval(interval);
            tryLogin();
        }, 1000);
        
        tryLogin();
      })();
    `;
    
    webview.executeJavaScript(loginScript).catch((err: any) => console.error('Failed to inject login script:', err));
  };

  // Auto-login logic for n8n
  useEffect(() => {
    const webview = webviewRef.current;
    if (!webview) return;

    const handleDomReady = () => {
      injectLoginScript();
    };

    webview.addEventListener('dom-ready', handleDomReady);
    return () => {
      webview.removeEventListener('dom-ready', handleDomReady);
    };
  }, []);

  const handleDeploy = async () => {
    if (!agentName || !selectedSlot) return;
    setDeploying(true);
    try {
      // 1. Create Agent
      const newAgent = await ipcRenderer.invoke('create-agent', { 
        name: agentName, 
        type: 'Custom Build',
        n8nWorkflowId: workflowId || 'draft-workflow' 
      });

      // 2. Assign to Slot
      await ipcRenderer.invoke('assign-agent', { 
        slotId: selectedSlot, 
        agentId: newAgent.id 
      });

      // Reset
      setAgentName('');
      setWorkflowId('');
      setSelectedSlot('');
      fetchSlots();
      alert(`Agent "${newAgent.name}" deployed successfully to slot!`);
    } catch (error) {
      console.error('Deploy failed:', error);
      alert('Deployment failed. Check console.');
    } finally {
      setDeploying(false);
    }
  };

  const emptySlots = slots.filter(s => !s.assignedAgentId);

  return (
    <div className="flex h-full text-white bg-[#0F0720]">
      {/* Sidebar - Controls */}
      <div className="w-80 bg-black/20 border-r border-white/10 p-6 flex flex-col gap-6">
        <div>
            <h1 className="text-2xl font-bold flex items-center gap-2 mb-2">
                <Bot className="text-purple-500" />
                Agent Lab
            </h1>
            <p className="text-white/60 text-sm">Design workflows in n8n and deploy to your microservices.</p>
        </div>

        <div className="space-y-4">
            <div>
                <label className="block text-xs font-semibold text-purple-400 uppercase tracking-wider mb-2">
                    n8n URL
                </label>
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        value={n8nUrl} 
                        onChange={(e) => setN8nUrl(e.target.value)}
                        className="w-full bg-black/40 border border-white/20 rounded px-3 py-2 text-sm text-white outline-none focus:border-purple-500"
                    />
                    <button onClick={() => setIframeError(false)} className="p-2 bg-white/10 rounded hover:bg-white/20" title="Refresh">
                        <RefreshCw size={16} />
                    </button>
                    <button onClick={injectLoginScript} className="p-2 bg-white/10 rounded hover:bg-white/20" title="Trigger Auto Login">
                        <Bot size={16} />
                    </button>
                </div>
            </div>

            <div className="h-px bg-white/10" />

            <div>
                <label className="block text-xs font-semibold text-purple-400 uppercase tracking-wider mb-2">
                    Agent Name
                </label>
                <input 
                    type="text" 
                    value={agentName}
                    onChange={(e) => setAgentName(e.target.value)}
                    placeholder="e.g. Finance Bot v2"
                    className="w-full bg-black/40 border border-white/20 rounded px-3 py-2 text-sm text-white outline-none focus:border-purple-500"
                />
            </div>

            <div>
                <label className="block text-xs font-semibold text-purple-400 uppercase tracking-wider mb-2 flex justify-between">
                    <span>Workflow (n8n)</span>
                    <button onClick={fetchWorkflows} className="hover:text-white" title="Refresh Workflows">
                        <RefreshCw size={12} className={isLoadingWorkflows ? 'animate-spin' : ''} />
                    </button>
                </label>
                {workflows.length > 0 ? (
                  <select
                      value={workflowSelection}
                      onChange={(e) => {
                        setWorkflowSelection(e.target.value);
                        if (e.target.value !== 'custom') {
                          setWorkflowId(e.target.value);
                        } else {
                          setWorkflowId('');
                        }
                      }}
                      className="w-full bg-black/40 border border-white/20 rounded px-3 py-2 text-sm text-white outline-none focus:border-purple-500"
                  >
                      <option value="">Select a Workflow...</option>
                      {workflows.map((wf: any) => (
                          <option key={wf.id} value={wf.id}>
                              {wf.name} {wf.active ? '(Active)' : ''}
                          </option>
                      ))}
                      <option value="custom">-- Enter ID Manually --</option>
                  </select>
                ) : (
                  <input 
                      type="text" 
                      value={workflowId}
                      onChange={(e) => setWorkflowId(e.target.value)}
                      placeholder="e.g. 12345"
                      className="w-full bg-black/40 border border-white/20 rounded px-3 py-2 text-sm text-white outline-none focus:border-purple-500"
                  />
                )}
                {workflowSelection === 'custom' && (
                  <input 
                      type="text" 
                      value={workflowId}
                      onChange={(e) => setWorkflowId(e.target.value)}
                      placeholder="Enter Workflow ID"
                      className="w-full mt-2 bg-black/40 border border-white/20 rounded px-3 py-2 text-sm text-white outline-none focus:border-purple-500"
                  />
                )}
            </div>

            <div>
                <label className="block text-xs font-semibold text-purple-400 uppercase tracking-wider mb-2">
                    Target Slot
                </label>
                <select 
                    value={selectedSlot}
                    onChange={(e) => setSelectedSlot(e.target.value)}
                    className="w-full bg-black/40 border border-white/20 rounded px-3 py-2 text-sm text-white outline-none focus:border-purple-500"
                >
                    <option value="">Select a Slot...</option>
                    {emptySlots.map(slot => (
                        <option key={slot.id} value={slot.id}>
                            {slot.name} ({slot.phase})
                        </option>
                    ))}
                </select>
            </div>

            <button 
                onClick={handleDeploy}
                disabled={!agentName || !selectedSlot || deploying}
                className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                    !agentName || !selectedSlot || deploying
                        ? 'bg-white/5 text-white/20 cursor-not-allowed'
                        : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:shadow-[0_0_20px_rgba(168,85,247,0.5)] text-white'
                }`}
            >
                {deploying ? <RefreshCw className="animate-spin" size={20} /> : <Rocket size={20} />}
                Deploy to Slot
            </button>
        </div>
      </div>

      {/* Main - n8n WebView */}
      <div className="flex-1 bg-white relative">
        {iframeError ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#1a1a2e] text-white">
                <AlertCircle size={48} className="text-red-400 mb-4" />
                <h3 className="text-xl font-bold mb-2">Could not load n8n</h3>
                <p className="text-white/60 mb-4">Ensure n8n is running at {n8nUrl}</p>
                <button 
                    onClick={() => setIframeError(false)}
                    className="px-4 py-2 bg-white/10 rounded hover:bg-white/20"
                >
                    Retry
                </button>
            </div>
        ) : (
            <webview 
                ref={webviewRef}
                src={n8nUrl} 
                className="w-full h-full"
                allowpopups={true}
            />
        )}
      </div>
    </div>
  );
}
