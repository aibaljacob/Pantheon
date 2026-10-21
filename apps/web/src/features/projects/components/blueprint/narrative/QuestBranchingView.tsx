import React, { useState } from 'react';
import {
  GitBranch,
  Plus,
  Trash2,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Flag,
  HelpCircle,
  Target,
  Layers,
} from 'lucide-react';
import type { QuestNode, QuestChoice } from '../../../types';
import { Button } from '../../../../../components/ui/Button';

interface QuestBranchingViewProps {
  quests: QuestNode[];
  onChange: (updated: QuestNode[]) => void;
  onOpenAiAssistant: (section: 'QUEST', promptPreset?: string) => void;
}

export const QuestBranchingView: React.FC<QuestBranchingViewProps> = ({
  quests,
  onChange,
  onOpenAiAssistant,
}) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string>(quests[0]?.id || '');

  const activeIndex = quests.findIndex((q) => q.id === selectedNodeId);
  const activeNode = activeIndex !== -1 ? quests[activeIndex] : quests[0];

  const handleAddNode = () => {
    const nextIdx = quests.length + 1;
    const newNode: QuestNode = {
      id: `q-node-${Date.now()}`,
      title: `Branch Point ${nextIdx}`,
      act: 'ACT I: THE DYING COALS',
      type: 'CHOICE',
      description: 'Describe the dramatic crossroad or critical dilemma...',
      choices: [
        {
          id: `c-${Date.now()}-1`,
          text: 'Path Option A',
          consequence: 'Short-term and long-term consequence of this choice...',
          targetNodeId: undefined,
        },
      ],
      objectives: ['Primary objective to fulfill'],
      isDraft: true,
    };
    const updated = [...quests, newNode];
    onChange(updated);
    setSelectedNodeId(newNode.id);
  };

  const handleUpdateActiveNode = (updated: QuestNode) => {
    if (activeIndex === -1) return;
    const list = [...quests];
    list[activeIndex] = updated;
    onChange(list);
  };

  const handleRemoveActiveNode = () => {
    if (quests.length <= 1) return;
    const remaining = quests.filter((q) => q.id !== activeNode?.id);
    onChange(remaining);
    setSelectedNodeId(remaining[0]?.id || '');
  };

  const handleAddChoice = () => {
    if (!activeNode) return;
    const newChoice: QuestChoice = {
      id: `c-${Date.now()}`,
      text: 'New Decision Choice',
      consequence: 'Consequence that alters faction favor or storyline...',
      targetNodeId: undefined,
    };
    handleUpdateActiveNode({
      ...activeNode,
      choices: [...(activeNode.choices || []), newChoice],
    });
  };

  const handleUpdateChoice = (cIdx: number, updatedChoice: QuestChoice) => {
    if (!activeNode) return;
    const choices = [...(activeNode.choices || [])];
    choices[cIdx] = updatedChoice;
    handleUpdateActiveNode({ ...activeNode, choices });
  };

  const handleRemoveChoice = (cIdx: number) => {
    if (!activeNode) return;
    handleUpdateActiveNode({
      ...activeNode,
      choices: activeNode.choices.filter((_, idx) => idx !== cIdx),
    });
  };

  const handleAddObjective = (objText: string) => {
    if (!activeNode || !objText.trim()) return;
    handleUpdateActiveNode({
      ...activeNode,
      objectives: [...(activeNode.objectives || []), objText.trim()],
    });
  };

  const handleRemoveObjective = (objIdx: number) => {
    if (!activeNode) return;
    handleUpdateActiveNode({
      ...activeNode,
      objectives: activeNode.objectives.filter((_, idx) => idx !== objIdx),
    });
  };

  const typeConfig: Record<
    QuestNode['type'],
    { label: string; color: string; icon: React.ReactNode }
  > = {
    START: {
      label: 'START',
      color: 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40',
      icon: <Flag className="h-3 w-3" />,
    },
    CHOICE: {
      label: 'CHOICE DILEMMA',
      color: 'bg-amber-950/40 text-amber-300 border-amber-500/40',
      icon: <GitBranch className="h-3 w-3" />,
    },
    OBJECTIVE: {
      label: 'OBJECTIVE',
      color: 'bg-blue-950/40 text-blue-300 border-blue-500/40',
      icon: <Target className="h-3 w-3" />,
    },
    CONSEQUENCE: {
      label: 'CONSEQUENCE PATH',
      color: 'bg-orange-950/40 text-orange-300 border-orange-500/40',
      icon: <HelpCircle className="h-3 w-3" />,
    },
    ENDING: {
      label: 'END RESOLUTION',
      color: 'bg-purple-950/40 text-purple-300 border-purple-500/40',
      icon: <CheckCircle2 className="h-3 w-3" />,
    },
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-[#2b2a29] pb-4 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <GitBranch className="h-5 w-5 text-amber-400" />
          <h3 className="font-headline text-base font-bold text-[#ffffff]">
            Quest & Branching Narrative Graph ({quests.length} Story Nodes)
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={<Sparkles className="h-3.5 w-3.5 text-amber-400" />}
            onClick={() =>
              onOpenAiAssistant(
                'QUEST',
                'Generate divergent player choice branches with mutually exclusive consequences and multiple endings',
              )
            }
            className="text-xs font-mono"
          >
            AI Propose Branches
          </Button>

          <Button
            variant="primary"
            size="sm"
            icon={<Plus className="h-3.5 w-3.5 text-[#141312]" />}
            onClick={handleAddNode}
            className="text-xs font-mono font-bold"
          >
            New Quest Node
          </Button>
        </div>
      </div>

      {/* Visual Graph Navigator Strip */}
      <div className="rounded-3xl border border-[#363433] bg-[#141312] p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-mono text-amber-300 uppercase tracking-wider font-semibold">
            <Layers className="h-4 w-4" />
            <span>Interactive Story Map</span>
          </div>
          <span className="text-[10px] font-mono text-[#8c887e]">
            Click node to view decisions & consequences
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          {quests.map((node) => {
            const isSelected = node.id === activeNode?.id;
            const config = typeConfig[node.type] || typeConfig.CHOICE;
            return (
              <button
                key={node.id}
                type="button"
                onClick={() => setSelectedNodeId(node.id)}
                className={`text-left rounded-2xl border p-3.5 transition-all flex flex-col justify-between space-y-2 relative overflow-hidden ${
                  isSelected
                    ? 'border-amber-500/60 bg-[#201f1e] shadow-lg scale-[1.02]'
                    : 'border-[#2b2a29] bg-[#1c1b1a] hover:border-[#363433]'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span
                      className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider font-bold ${config.color}`}
                    >
                      {config.icon}
                      {config.label}
                    </span>
                    {node.isDraft && (
                      <span className="rounded bg-amber-950/60 border border-amber-500/30 px-1 py-0.2 text-[8px] font-mono text-amber-300">
                        DRAFT
                      </span>
                    )}
                  </div>

                  <div className="font-headline text-xs font-bold text-[#ffffff] line-clamp-1">
                    {node.title}
                  </div>
                </div>

                <div className="space-y-1 pt-1 border-t border-[#2b2a29]/60">
                  <div className="text-[9px] font-mono text-amber-300/80 uppercase">
                    {node.act}
                  </div>
                  <div className="text-[10px] font-mono text-[#8c887e]">
                    {node.choices.length} Choice{node.choices.length !== 1 ? 's' : ''} •{' '}
                    {node.objectives.length} Obj.
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Node Editor Workspace */}
      {activeNode ? (
        <div className="rounded-3xl border border-[#363433] bg-[#141312] p-6 sm:p-8 space-y-6 shadow-xl">
          {/* Node Meta Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2b2a29] pb-4">
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={activeNode.act}
                  onChange={(e) => handleUpdateActiveNode({ ...activeNode, act: e.target.value })}
                  className="text-xs font-mono text-amber-400 font-bold bg-transparent border-none focus:outline-none p-0 uppercase"
                  placeholder="ACT / CHAPTER"
                />
                {activeNode.isDraft && (
                  <span className="rounded bg-amber-950/60 border border-amber-500/30 px-1.5 py-0.5 text-[9px] font-mono text-amber-300">
                    EDITABLE DRAFT
                  </span>
                )}
              </div>
              <input
                type="text"
                value={activeNode.title}
                onChange={(e) => handleUpdateActiveNode({ ...activeNode, title: e.target.value })}
                className="w-full font-headline text-xl font-bold text-[#ffffff] bg-transparent border-none focus:outline-none p-0"
                placeholder="Quest / Branch Title..."
              />
            </div>

            <div className="flex items-center gap-3">
              <select
                value={activeNode.type}
                onChange={(e) =>
                  handleUpdateActiveNode({
                    ...activeNode,
                    type: e.target.value as QuestNode['type'],
                  })
                }
                className="rounded-xl border border-[#363433] bg-[#1c1b1a] px-3 py-1.5 text-xs font-mono text-amber-300 focus:outline-none"
              >
                <option value="START">Start Point</option>
                <option value="CHOICE">Choice Dilemma</option>
                <option value="OBJECTIVE">Mission Objective</option>
                <option value="CONSEQUENCE">Consequence Path</option>
                <option value="ENDING">End Resolution</option>
              </select>

              {quests.length > 1 && (
                <button
                  type="button"
                  onClick={handleRemoveActiveNode}
                  className="rounded-xl border border-[#363433] bg-[#1c1b1a] p-2 text-[#8c887e] hover:text-red-400 hover:border-red-500/40 transition-colors"
                  title="Delete Node"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-amber-300 uppercase tracking-wider font-semibold">
              Narrative Context & Dramatic Stakes
            </label>
            <textarea
              rows={3}
              value={activeNode.description}
              onChange={(e) =>
                handleUpdateActiveNode({ ...activeNode, description: e.target.value })
              }
              placeholder="What situation confronts the protagonist? What world event just occurred?"
              className="w-full rounded-xl border border-[#2b2a29] bg-[#1c1b1a] px-3.5 py-2.5 text-xs font-sans leading-relaxed text-[#ffffff] focus:border-amber-500/60 focus:outline-none"
            />
          </div>

          {/* Choices & Consequences */}
          <div className="space-y-4 pt-2 border-t border-[#2b2a29]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-mono text-amber-300 uppercase tracking-wider font-semibold">
                <GitBranch className="h-4 w-4" />
                <span>Player Choices & Divergent Consequences ({activeNode.choices?.length || 0})</span>
              </div>

              <Button
                variant="secondary"
                size="sm"
                icon={<Plus className="h-3 w-3" />}
                onClick={handleAddChoice}
                className="text-xs font-mono"
              >
                Add Choice Path
              </Button>
            </div>

            <div className="space-y-3">
              {(activeNode.choices || []).map((choice, cIdx) => (
                <div
                  key={choice.id || cIdx}
                  className="rounded-2xl border border-[#2b2a29] bg-[#1c1b1a] p-4 space-y-3 transition-all hover:border-[#363433]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 flex-1">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-[10px] font-mono font-bold text-amber-400">
                        {String.fromCharCode(65 + cIdx)}
                      </span>
                      <input
                        type="text"
                        value={choice.text}
                        onChange={(e) =>
                          handleUpdateChoice(cIdx, { ...choice, text: e.target.value })
                        }
                        placeholder="Player decision prompt..."
                        className="w-full rounded-lg border border-[#363433] bg-[#141312] px-3 py-1.5 text-xs font-sans font-bold text-[#ffffff] focus:border-amber-500/50 focus:outline-none"
                      />
                    </div>

                    {/* Target Node Connector Dropdown */}
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 text-xs font-mono text-[#8c887e]">
                        <ArrowRight className="h-3.5 w-3.5 text-amber-400" />
                        <select
                          value={choice.targetNodeId || ''}
                          onChange={(e) =>
                            handleUpdateChoice(cIdx, {
                              ...choice,
                              targetNodeId: e.target.value || undefined,
                            })
                          }
                          className="rounded-lg border border-[#363433] bg-[#141312] px-2 py-1 text-xs font-mono text-amber-300 focus:outline-none"
                        >
                          <option value="">(No branch link)</option>
                          {quests
                            .filter((q) => q.id !== activeNode.id)
                            .map((q) => (
                              <option key={q.id} value={q.id}>
                                → {q.title} ({q.type})
                              </option>
                            ))}
                        </select>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveChoice(cIdx)}
                        className="text-[#8c887e] hover:text-red-400 transition-colors p-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-amber-400 uppercase">
                      Consequence & World Reaction
                    </label>
                    <textarea
                      rows={2}
                      value={choice.consequence}
                      onChange={(e) =>
                        handleUpdateChoice(cIdx, { ...choice, consequence: e.target.value })
                      }
                      placeholder="What changes in the world, character relationships, or future acts?"
                      className="w-full rounded-xl border border-[#2b2a29] bg-[#141312] px-3 py-2 text-xs font-sans text-[#cac6bc] focus:border-amber-500/60 focus:outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mission Objectives */}
          <div className="space-y-3 pt-2 border-t border-[#2b2a29]">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono text-amber-300 uppercase tracking-wider font-semibold">
                Associated Gameplay / Narrative Objectives
              </label>
              <span className="text-[10px] font-mono text-[#8c887e]">
                Direct candidate items for production task conversion
              </span>
            </div>

            <div className="space-y-2">
              {(activeNode.objectives || []).map((obj, oIdx) => (
                <div
                  key={oIdx}
                  className="flex items-center justify-between gap-3 rounded-xl border border-[#2b2a29] bg-[#1c1b1a] px-3 py-2 text-xs font-mono text-[#cac6bc]"
                >
                  <div className="flex items-center gap-2 flex-1">
                    <CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0" />
                    <input
                      type="text"
                      value={obj}
                      onChange={(e) => {
                        const copy = [...activeNode.objectives];
                        copy[oIdx] = e.target.value;
                        handleUpdateActiveNode({ ...activeNode, objectives: copy });
                      }}
                      className="w-full bg-transparent border-none p-0 focus:outline-none text-[#ffffff]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveObjective(oIdx)}
                    className="text-[#8c887e] hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={() => handleAddObjective('New tangible objective')}
                className="flex items-center gap-2 rounded-xl border border-dashed border-[#363433] px-3 py-2 text-xs font-mono text-[#8c887e] hover:text-[#e6e2df] hover:border-amber-500/40 w-full justify-center transition-all"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Objective Item</span>
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
