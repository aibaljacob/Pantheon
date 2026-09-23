export const createMockGeminiClient = (options: {
  shouldFail?: boolean;
  emptyResponse?: boolean;
  malformedJson?: boolean;
  mockRoles?: any[];
} = {}) => {
  return {
    models: {
      generateContent: jest.fn().mockImplementation(async () => {
        if (options.shouldFail) {
          throw new Error('Google Gemini API service unavailable (quota or network timeout)');
        }

        if (options.emptyResponse) {
          return { text: '' };
        }

        if (options.malformedJson) {
          return { text: 'This is not valid JSON content from LLM' };
        }

        const roles = options.mockRoles || [
          {
            roleId: 'role-tax-1',
            title: 'Lead Gameplay Engineer',
            description: 'Core combat and physics developer for Unreal Engine.',
            experienceLevel: 'SENIOR',
            commitment: 'FULL_TIME',
            skillIds: ['skill-cpp-1', 'skill-network-1'],
            toolIds: ['tool-ue5-1'],
            reasoning: 'Critical for real-time multiplayer combat mechanics.',
          },
        ];

        return {
          text: JSON.stringify(roles),
        };
      }),
    },
  };
};
