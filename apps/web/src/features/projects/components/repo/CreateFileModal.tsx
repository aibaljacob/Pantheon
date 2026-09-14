import React, { useState } from 'react';
import { X, FileCode, Loader2, Sparkles } from 'lucide-react';
import { Button } from '../../../../components/ui/Button';

interface CreateFileModalProps {
  isOpen: boolean;
  onClose: () => void;
  branch: string;
  onCommitFile: (path: string, content: string, commitMessage: string) => Promise<void>;
}

const TEMPLATES: { label: string; path: string; content: string }[] = [
  {
    label: 'C++ Header (.h)',
    path: 'Source/Gameplay/AbilityComponent.h',
    content: `// Copyright Pantheon Studios. All Rights Reserved.\n#pragma once\n\n#include "CoreMinimal.h"\n#include "Components/ActorComponent.h"\n#include "AbilityComponent.generated.h"\n\nUCLASS(ClassGroup=(Custom), meta=(BlueprintSpawnableComponent))\nclass UAbilityComponent : public UActorComponent\n{\n    GENERATED_BODY()\npublic:\n    UAbilityComponent();\n\n    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Abilities")\n    float CooldownDuration;\n};`,
  },
  {
    label: 'C# Script (.cs)',
    path: 'Assets/Scripts/Combat/CombatSystem.cs',
    content: `using UnityEngine;\n\nnamespace Studio.Combat\n{\n    public class CombatSystem : MonoBehaviour\n    {\n        [SerializeField] private float baseDamage = 25f;\n        [SerializeField] private float attackRange = 3.5f;\n\n        public void ExecuteAttack()\n        {\n            Debug.Log($"Attacking with base damage: {baseDamage}");\n        }\n    }\n}`,
  },
  {
    label: 'Custom Shader (.hlsl)',
    path: 'Shaders/CustomOutlinePass.hlsl',
    content: `// Custom Sobel Edge Filter for Cel Shading\nstruct VSOutput\n{\n    float4 Position : SV_POSITION;\n    float2 UV : TEXCOORD0;\n};\n\nfloat4 MainPS(VSOutput input) : SV_Target\n{\n    return float4(0.0, 0.0, 0.0, 1.0);\n}`,
  },
  {
    label: 'Game Config (.json)',
    path: 'Config/BalanceParameters.json',
    content: `{\n  "version": "1.0.0",\n  "playerSpeed": 6.5,\n  "jumpVelocity": 12.0,\n  "gravityScale": 1.4,\n  "abilities": [\n    { "id": "dash", "cooldown": 4.5 },\n    { "id": "shield", "cooldown": 12.0 }\n  ]\n}`,
  },
];

export const CreateFileModal: React.FC<CreateFileModalProps> = ({
  isOpen,
  onClose,
  branch,
  onCommitFile,
}) => {
  const [filePath, setFilePath] = useState('');
  const [fileContent, setFileContent] = useState('');
  const [commitMessage, setCommitMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleApplyTemplate = (tmpl: typeof TEMPLATES[0]) => {
    setFilePath(tmpl.path);
    setFileContent(tmpl.content);
    setCommitMessage(`feat: add ${tmpl.path.split('/').pop()}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!filePath.trim()) {
      setError('Please specify a valid file path.');
      return;
    }
    if (!commitMessage.trim()) {
      setError('Please provide a commit message.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onCommitFile(filePath.trim(), fileContent, commitMessage.trim());
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to commit file.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fadeIn">
      <div className="relative w-full max-w-2xl rounded-3xl border border-[#363433] bg-[#1c1b1a] p-6 space-y-5 shadow-2xl overflow-hidden font-mono">
        <div className="flex items-center justify-between border-b border-[#2b2a29] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-2 text-amber-300">
              <FileCode className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-headline text-lg font-bold text-[#ffffff]">Create New File</h3>
              <p className="text-xs text-[#8c887e]">
                Target branch: <span className="text-amber-300 font-semibold">{branch}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[#363433] bg-[#141312] p-1.5 text-[#8c887e] hover:text-[#ffffff] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Template selector */}
        <div className="space-y-1.5">
          <span className="text-[11px] text-[#8c887e] uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-amber-400" /> Starter Presets:
          </span>
          <div className="flex flex-wrap gap-2">
            {TEMPLATES.map((tmpl) => (
              <button
                key={tmpl.label}
                type="button"
                onClick={() => handleApplyTemplate(tmpl)}
                className="rounded-lg border border-[#2b2a29] bg-[#141312] px-2.5 py-1 text-[11px] text-[#cac6bc] hover:border-[#48473f] hover:text-[#ffffff] transition-colors"
              >
                {tmpl.label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-950/30 p-3 text-xs text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-[#8c887e] mb-1">
              File Path (e.g. Source/Core/GameInstance.cpp) *
            </label>
            <input
              type="text"
              required
              value={filePath}
              onChange={(e) => setFilePath(e.target.value)}
              placeholder="Source/Gameplay/MyAbility.cpp"
              className="w-full rounded-xl border border-[#363433] bg-[#141312] px-3.5 py-2 text-xs text-[#e6e2df] focus:border-[#e6e2df] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs text-[#8c887e] mb-1">File Content</label>
            <textarea
              rows={9}
              value={fileContent}
              onChange={(e) => setFileContent(e.target.value)}
              placeholder="// Write code here..."
              className="w-full rounded-xl border border-[#363433] bg-[#141312] p-3 text-xs font-mono text-[#e6e2df] focus:border-[#e6e2df] focus:outline-none leading-relaxed"
            />
          </div>

          <div>
            <label className="block text-xs text-[#8c887e] mb-1">Commit Message *</label>
            <input
              type="text"
              required
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              placeholder="feat(gameplay): create ability component logic"
              className="w-full rounded-xl border border-[#363433] bg-[#141312] px-3.5 py-2 text-xs text-[#e6e2df] focus:border-[#e6e2df] focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-[#2b2a29]">
            <Button variant="secondary" size="sm" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Committing...
                </span>
              ) : (
                'Commit New File'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
