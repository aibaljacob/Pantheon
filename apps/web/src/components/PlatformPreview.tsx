import React, { useState } from 'react';
import { Badge } from './ui/Badge';
import {
  CheckCircle2,
  Cpu,
  FolderKanban,
  Search,
  Shield,
  Terminal,
  Compass,
  Gamepad2,
  Clock,
} from 'lucide-react';

export const PlatformPreview: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'pipeline' | 'blueprint' | 'playtests'>('pipeline');

  return (
    <section id="workspace" className="py-24 bg-[#141312] relative overflow-hidden">
      {/* Volumetric Section Backdrop Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1100px] h-[600px] section-volumetric-glow rounded-full blur-3xl pointer-events-none opacity-90" />

      <div className="max-w-[1440px] mx-auto px-6 md:px-12 lg:px-20 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-14">
          <Badge variant="accent" className="border-t-[#e6e2df]/40 border-l-[#939188]/30 border-r-[#363433] border-b-[#2b2a29]">
            STUDIO WORKSPACE
          </Badge>

          <h2 className="font-headline font-extrabold text-3xl sm:text-4xl lg:text-5xl text-[#ffffff] tracking-tight">
            Engineered Studio Interface.
          </h2>

          <p className="font-sans text-base sm:text-lg text-[#cac6bc] leading-relaxed">
            Experience the unified workspace where technical directors, artists, and producers coordinate game development from concept to playtest.
          </p>
        </div>

        {/* Mock Dashboard Frame */}
        <div className="filmic-card focal-bloom-dashboard rounded-2xl border border-[#48473f]/60 bg-[#1c1b1a] shadow-2xl overflow-hidden relative">
          {/* Top Light Edge Specular Catch */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#e6e2df]/40 to-transparent pointer-events-none z-20" />
          
          {/* Top Window Title Bar */}
          <div className="bg-[#141312] px-6 py-4 border-b border-[#2b2a29] flex flex-wrap items-center justify-between gap-4 relative z-10">
            
            {/* Left: Window Controls & Active Project */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-[#363433] border border-[#48473f]/40" />
                <div className="w-3 h-3 rounded-full bg-[#363433] border border-[#48473f]/40" />
                <div className="w-3 h-3 rounded-full bg-[#363433] border border-[#48473f]/40" />
              </div>
              <span className="font-mono text-xs text-[#8c887e]">|</span>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#e6e2df]" />
                <span className="font-mono text-xs text-[#e6e2df] font-bold tracking-wider">
                  PROJECT // ETHEREAL_ODYSSEY
                </span>
                <Badge variant="bronze" className="text-[9px] py-0 px-1.5 font-mono border-t-[#e6e2df]/20">
                  v1.2.0-alpha
                </Badge>
              </div>
            </div>

            {/* Search Input Mock */}
            <div className="hidden md:flex items-center gap-2 bg-[#201f1e] border-t border-l border-[#48473f]/40 border-r border-b border-[#2b2a29] px-3 py-1.5 rounded-lg text-xs font-mono text-[#cac6bc]">
              <Search className="w-3.5 h-3.5 text-[#8c887e]" />
              <span>Search tasks, blueprints, team members... (Cmd+K)</span>
            </div>

            {/* Right: Live Telemetry & Status */}
            <div className="flex items-center gap-4 text-xs font-mono text-[#cac6bc]">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[#e6e2df]">GIT SYNCED</span>
              </div>
              <span className="text-[#8c887e]">|</span>
              <div className="flex items-center gap-1.5 text-amber-300">
                <Cpu className="w-3.5 h-3.5 text-amber-400" />
                <span>RUNNER IDLE</span>
              </div>
            </div>
          </div>

          {/* Sub Navigation Bar */}
          <div className="bg-[#1c1b1a] px-6 py-3 border-b border-[#2b2a29] flex items-center justify-between overflow-x-auto relative z-10">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('pipeline')}
                className={`px-4 py-1.5 rounded-lg font-mono text-xs font-semibold transition-all flex items-center gap-2 ${
                  activeTab === 'pipeline'
                    ? 'bg-[#2b2a29] text-[#ffffff] border-t border-l border-[#e6e2df]/40 border-r border-b border-[#363433] shadow-md'
                    : 'text-[#8c887e] hover:text-[#e6e2df] hover:bg-[#201f1e]'
                }`}
              >
                <FolderKanban className="w-3.5 h-3.5" />
                Production Sprints
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('blueprint')}
                className={`px-4 py-1.5 rounded-lg font-mono text-xs font-semibold transition-all flex items-center gap-2 ${
                  activeTab === 'blueprint'
                    ? 'bg-[#2b2a29] text-[#ffffff] border-t border-l border-[#e6e2df]/40 border-r border-b border-[#363433] shadow-md'
                    : 'text-[#8c887e] hover:text-[#e6e2df] hover:bg-[#201f1e]'
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                Game Blueprint
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('playtests')}
                className={`px-4 py-1.5 rounded-lg font-mono text-xs font-semibold transition-all flex items-center gap-2 ${
                  activeTab === 'playtests'
                    ? 'bg-[#2b2a29] text-[#ffffff] border-t border-l border-[#e6e2df]/40 border-r border-b border-[#363433] shadow-md'
                    : 'text-[#8c887e] hover:text-[#e6e2df] hover:bg-[#201f1e]'
                }`}
              >
                <Gamepad2 className="w-3.5 h-3.5" />
                Playtests & Feedback
              </button>
            </div>

            <div className="hidden sm:flex items-center gap-3">
              <span className="font-mono text-xs text-[#8c887e]">ACTIVE SPRINT: #4 (ALPHA SLICE)</span>
              <div className="w-24 h-2 bg-[#2b2a29] rounded-full overflow-hidden border border-[#363433]">
                <div className="w-[85%] h-full bg-[#e6e2df] rounded-full shadow-[0_0_8px_rgba(230,226,223,0.4)]" />
              </div>
              <span className="font-mono text-xs text-[#e6e2df]">85%</span>
            </div>
          </div>

          {/* Main Workspace Body */}
          <div className="p-6 bg-[#141312] min-h-[420px] relative z-10">
            
            {activeTab === 'pipeline' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Column 1: Sprints & Milestones */}
                <div className="lg:col-span-8 space-y-4">
                  <div className="flex items-center justify-between font-mono text-xs text-[#8c887e]">
                    <span>TASKS // ACTIVE SPRINT DELIVERABLES</span>
                    <span>4 ACTIVE CONTRIBUTORS</span>
                  </div>

                  <div className="space-y-3">
                    <div className="bg-[#1c1b1a] p-4 rounded-xl border-t border-l border-[#48473f]/40 border-r border-b border-[#2b2a29] flex flex-wrap items-center justify-between gap-4 hover:border-[#48473f] transition-colors shadow-sm">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        <div>
                          <div className="font-sans font-semibold text-sm text-[#ffffff]">
                            Character Movement & Dodge Controller Pass
                          </div>
                          <div className="font-mono text-xs text-[#8c887e]">
                            Assigned to: Lead Gameplay Programmer
                          </div>
                        </div>
                      </div>
                      <Badge variant="accent" className="text-[10px]">COMPLETED</Badge>
                    </div>

                    <div className="bg-[#1c1b1a] p-4 rounded-xl border-t border-l border-[#48473f]/40 border-r border-b border-[#2b2a29] flex flex-wrap items-center justify-between gap-4 hover:border-[#48473f] transition-colors shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
                        <div>
                          <div className="font-sans font-semibold text-sm text-[#ffffff]">
                            Narrative Dialogue Branching State Tree
                          </div>
                          <div className="font-mono text-xs text-[#8c887e]">
                            Assigned to: Narrative Designer
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[10px] text-amber-300 border-amber-500/40">IN PROGRESS</Badge>
                    </div>

                    <div className="bg-[#1c1b1a] p-4 rounded-xl border-t border-l border-[#48473f]/40 border-r border-b border-[#2b2a29] flex flex-wrap items-center justify-between gap-4 hover:border-[#48473f] transition-colors shadow-sm">
                      <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-[#8c887e]" />
                        <div>
                          <div className="font-sans font-semibold text-sm text-[#cac6bc]">
                            Enemy Patrol & Detection Behavior Trees
                          </div>
                          <div className="font-mono text-xs text-[#8c887e]">
                            Assigned to: AI Systems Lead
                          </div>
                        </div>
                      </div>
                      <Badge variant="bronze" className="text-[10px]">QUEUED</Badge>
                    </div>
                  </div>
                </div>

                {/* Column 2: Build Stream & Live Node Activity */}
                <div className="lg:col-span-4 bg-[#1c1b1a] p-5 rounded-xl border-t border-l border-[#48473f]/40 border-r border-b border-[#2b2a29] space-y-4 shadow-sm">
                  <div className="font-mono text-xs text-[#8c887e] flex items-center justify-between">
                    <span>BUILD & REPO TELEMETRY</span>
                    <Terminal className="w-3.5 h-3.5" />
                  </div>

                  <div className="space-y-3 text-xs font-mono">
                    <div className="p-3 rounded-lg bg-[#141312] border border-[#2b2a29] space-y-1">
                      <div className="text-[#e6e2df] font-semibold">Godot Export Runner</div>
                      <div className="text-[#8c887e]">Target: WebGL / HTML5</div>
                      <div className="text-emerald-400">Build #412 Succeeded in 1.4m</div>
                    </div>

                    <div className="p-3 rounded-lg bg-[#141312] border border-[#2b2a29] space-y-1">
                      <div className="text-[#e6e2df] font-semibold">Git Repository</div>
                      <div className="text-[#8c887e]">Branch: main @ 7c2a10e</div>
                      <div className="text-[#cac6bc]">Clean Tree • 0 Conflicts</div>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {activeTab === 'blueprint' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { name: 'Cyberpunk Neon Palette', type: 'ART PROPOSAL', status: 'Approved (8 votes)', badge: 'APPROVED' },
                  { name: 'Chapter 1: The Outpost Fall', type: 'NARRATIVE ARC', status: '4 Quests Linked', badge: 'ACTIVE' },
                  { name: 'Noir Gold & Bronze Palette', type: 'CURATED PALETTE', status: 'Primary Vision Colors', badge: 'IN USE' },
                  { name: 'Combat & Exploration Loop', type: 'GAMEPLAY LOOP', status: 'Core Loop Diagram', badge: 'VALIDATED' },
                ].map((item, aIdx) => (
                  <div key={aIdx} className="bg-[#1c1b1a] p-4 rounded-xl border-t border-l border-[#48473f]/40 border-r border-b border-[#2b2a29] hover:border-[#48473f] transition-all space-y-3 shadow-sm">
                    <div className="h-24 bg-[#141312] rounded-lg border border-[#2b2a29] flex flex-col items-center justify-center gap-1.5 text-[#8c887e]">
                      <Compass className="w-6 h-6 text-amber-400" />
                      <span className="text-[10px] font-mono text-[#cac6bc]">{item.badge}</span>
                    </div>
                    <div>
                      <div className="font-mono text-xs font-bold text-[#e6e2df] truncate">{item.name}</div>
                      <div className="flex items-center justify-between font-mono text-[10px] text-[#8c887e] mt-1">
                        <span>{item.type}</span>
                        <span className="text-amber-300/80">{item.status}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'playtests' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[#1c1b1a] p-6 rounded-xl border-t border-l border-[#48473f]/40 border-r border-b border-[#2b2a29] space-y-2 shadow-sm">
                  <div className="font-mono text-xs text-[#8c887e]">ACTIVE PLAYTEST SESSIONS</div>
                  <div className="font-headline font-extrabold text-3xl text-[#ffffff]">3 Sessions</div>
                  <div className="font-mono text-xs text-emerald-400">18 Player Feedback Reports</div>
                </div>

                <div className="bg-[#1c1b1a] p-6 rounded-xl border-t border-l border-[#48473f]/40 border-r border-b border-[#2b2a29] space-y-2 shadow-sm">
                  <div className="font-mono text-xs text-[#8c887e]">AVERAGE RATING</div>
                  <div className="font-headline font-extrabold text-3xl text-[#ffffff]">4.8 / 5.0</div>
                  <div className="font-mono text-xs text-amber-300">Playable WebGL Build v0.4</div>
                </div>

                <div className="bg-[#1c1b1a] p-6 rounded-xl border-t border-l border-[#48473f]/40 border-r border-b border-[#2b2a29] space-y-2 shadow-sm">
                  <div className="font-mono text-xs text-[#8c887e]">BUILD RUNNER SUCCESS</div>
                  <div className="font-headline font-extrabold text-3xl text-[#ffffff]">100%</div>
                  <div className="font-mono text-xs text-emerald-400">CI/CD Deployments Verified</div>
                </div>
              </div>
            )}

          </div>

        </div>

      </div>
    </section>
  );
};
