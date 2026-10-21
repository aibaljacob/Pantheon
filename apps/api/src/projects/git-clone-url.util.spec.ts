import { getGitCloneUrls, getGitHttpBaseUrl } from './git-clone-url.util';

describe('git-clone-url.util', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    delete process.env.GIT_HTTP_BASE_URL;
    delete process.env.API_URL;
    delete process.env.PORT;
    delete process.env.GIT_SSH_HOST;
    delete process.env.GIT_SSH_BASE_URL;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('Development environment default (local Smart HTTP)', () => {
    it('should generate local Smart HTTP clone URL with default port 3000', () => {
      expect(getGitHttpBaseUrl()).toBe('http://localhost:3000/repos');
      const urls = getGitCloneUrls('mythic-odyssey');
      expect(urls.https).toBe('http://localhost:3000/repos/mythic-odyssey.git');
      expect(urls.ssh).toBe('git@localhost:repos/mythic-odyssey.git');
      expect(urls.https).not.toContain('git.pantheon.studio');
      expect(urls.https).not.toContain('/projects/');
    });

    it('should respect custom PORT in development environment', () => {
      process.env.PORT = '8080';
      expect(getGitHttpBaseUrl()).toBe('http://localhost:8080/repos');
      const urls = getGitCloneUrls('cyber-runner');
      expect(urls.https).toBe('http://localhost:8080/repos/cyber-runner.git');
    });
  });

  describe('Production / Configurable Base URL', () => {
    it('should derive clone URL from configured API_URL', () => {
      process.env.API_URL = 'https://api.pantheon.studio';
      const urls = getGitCloneUrls('project-helios');
      expect(urls.https).toBe(
        'https://api.pantheon.studio/repos/project-helios.git',
      );
      expect(urls.ssh).toBe('git@api.pantheon.studio:repos/project-helios.git');
    });

    it('should handle API_URL with trailing slashes gracefully', () => {
      process.env.API_URL = 'https://api.pantheon.studio///';
      const urls = getGitCloneUrls('project-helios');
      expect(urls.https).toBe(
        'https://api.pantheon.studio/repos/project-helios.git',
      );
    });

    it('should derive clone URL from GIT_HTTP_BASE_URL without /repos suffix', () => {
      process.env.GIT_HTTP_BASE_URL = 'https://git.pantheon.studio';
      const urls = getGitCloneUrls('space-odyssey');
      expect(urls.https).toBe(
        'https://git.pantheon.studio/repos/space-odyssey.git',
      );
    });

    it('should derive clone URL from GIT_HTTP_BASE_URL with existing /repos suffix', () => {
      process.env.GIT_HTTP_BASE_URL = 'https://git.pantheon.studio/repos';
      const urls = getGitCloneUrls('space-odyssey');
      expect(urls.https).toBe(
        'https://git.pantheon.studio/repos/space-odyssey.git',
      );
    });

    it('should prioritize GIT_HTTP_BASE_URL over API_URL', () => {
      process.env.API_URL = 'https://api.pantheon.studio';
      process.env.GIT_HTTP_BASE_URL =
        'https://git-edge.pantheon.internal/repos';
      const urls = getGitCloneUrls('internal-game');
      expect(urls.https).toBe(
        'https://git-edge.pantheon.internal/repos/internal-game.git',
      );
    });

    it('should correctly incorporate diverse project slugs', () => {
      process.env.API_URL = 'https://api.pantheon.studio';
      const slugs = ['game-1', 'alpha_v2', 'studio-sub-team-repo'];
      for (const slug of slugs) {
        const urls = getGitCloneUrls(slug);
        expect(urls.https).toBe(
          `https://api.pantheon.studio/repos/${slug}.git`,
        );
      }
    });

    it('should respect custom GIT_SSH_HOST and GIT_SSH_BASE_URL', () => {
      process.env.GIT_SSH_HOST = 'ssh.pantheon.studio';
      let urls = getGitCloneUrls('my-game');
      expect(urls.ssh).toBe('git@ssh.pantheon.studio:repos/my-game.git');

      process.env.GIT_SSH_BASE_URL = 'ssh://git@custom-host:2222/repos';
      urls = getGitCloneUrls('my-game');
      expect(urls.ssh).toBe('ssh://git@custom-host:2222/repos/my-game.git');
    });
  });
});
