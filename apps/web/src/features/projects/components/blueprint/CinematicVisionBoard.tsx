import React from 'react';
import type { GameBlueprint, ProjectDetail } from '../../types';
import { ArtAndDesignStudio } from './art-design/ArtAndDesignStudio';

interface CinematicVisionBoardProps {
  project: ProjectDetail;
  blueprint: GameBlueprint;
  token?: string;
  onBlueprintUpdated?: (updated: GameBlueprint) => void;
  onOpenEditModal?: () => void;
  onNavigateToTab?: (tab: string) => void;
}

export const CinematicVisionBoard: React.FC<CinematicVisionBoardProps> = ({
  project,
  blueprint,
  token,
  onBlueprintUpdated,
  onNavigateToTab,
}) => {
  return (
    <ArtAndDesignStudio
      project={project}
      blueprint={blueprint}
      token={token}
      onBlueprintUpdated={onBlueprintUpdated}
      onNavigateToTab={onNavigateToTab}
    />
  );
};
