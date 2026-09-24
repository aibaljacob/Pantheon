const fs = require('fs');
const path = require('path');
const { runGodotBuild } = require('./godot-build-strategy');

// A very simple mock for tests. We could use Jest, but runner tests might run via jest in the main project, or node test runner.
// Let's write them using standard Jest since the project uses Jest.

jest.mock('child_process', () => {
  return {
    execFile: jest.fn(),
    execSync: jest.fn(),
  };
});

jest.mock('fs', () => {
  return {
    existsSync: jest.fn(),
    readFileSync: jest.fn(),
    mkdirSync: jest.fn(),
    statSync: jest.fn(),
  };
});

const child_process = require('child_process');
const mockedFs = require('fs');

describe('GodotBuildStrategy', () => {
  let logFn;
  
  beforeEach(() => {
    jest.clearAllMocks();
    logFn = jest.fn();
    process.env.GODOT_EXECUTABLE = 'C:\\godot.exe';
    
    mockedFs.existsSync.mockImplementation((filePath) => {
      // By default, everything exists
      return true;
    });
    
    mockedFs.readFileSync.mockImplementation((filePath) => {
      if (filePath.endsWith('export_presets.cfg')) {
        return 'name="Windows Desktop"';
      }
      return 'dummy';
    });
    
    mockedFs.statSync.mockReturnValue({ size: 1024 });
    
    child_process.execFile.mockImplementation((exe, args, opts, callback) => {
      if (typeof opts === 'function') {
        callback = opts;
      }
      if (callback) callback(null, { stdout: 'success', stderr: '' });
    });
  });

  afterEach(() => {
    delete process.env.GODOT_EXECUTABLE;
  });

  it('1. should detect godot executable and run successfully', async () => {
    const res = await runGodotBuild('job1', 'repoDir', 'buildDir', logFn);
    expect(res).toHaveProperty('zipPath');
    expect(res).toHaveProperty('checksum');
    expect(child_process.execFile.mock.calls.length).toBe(2);
  });

  it('2. should fail if godot executable is missing in env', async () => {
    delete process.env.GODOT_EXECUTABLE;
    await expect(runGodotBuild('job1', 'repoDir', 'buildDir', logFn))
      .rejects.toThrow('GODOT_EXECUTABLE environment variable is not set');
  });
  
  it('3. should fail if godot executable does not exist on disk', async () => {
    mockedFs.existsSync.mockImplementation((f) => f !== 'C:\\godot.exe');
    await expect(runGodotBuild('job1', 'repoDir', 'buildDir', logFn))
      .rejects.toThrow('Godot executable not found');
  });

  it('4. should fail if project.godot is missing', async () => {
    mockedFs.existsSync.mockImplementation((f) => !f.endsWith('project.godot'));
    await expect(runGodotBuild('job1', 'repoDir', 'buildDir', logFn))
      .rejects.toThrow('project.godot missing in repository root');
  });

  it('5. should fail if export_presets.cfg is missing', async () => {
    mockedFs.existsSync.mockImplementation((f) => !f.endsWith('export_presets.cfg'));
    await expect(runGodotBuild('job1', 'repoDir', 'buildDir', logFn))
      .rejects.toThrow('Windows export preset is missing');
  });

  it('6. should fail if Windows Desktop preset is not in export_presets.cfg', async () => {
    mockedFs.readFileSync.mockReturnValue('name="Linux/X11"');
    await expect(runGodotBuild('job1', 'repoDir', 'buildDir', logFn))
      .rejects.toThrow('"Windows Desktop" not found in export_presets.cfg');
  });

  it('7. should execute Godot with secure arguments and no shell', async () => {
    await runGodotBuild('job1', 'repoDir', 'buildDir', logFn);
    const exportCall = child_process.execFile.mock.calls[1];
    expect(exportCall[0]).toBe('C:\\godot.exe');
    expect(exportCall[1]).toEqual(['--headless', '--path', 'repoDir', '--export-release', 'Windows Desktop', expect.stringContaining('PantheonGame.exe')]);
    expect(exportCall[2]).toEqual(expect.objectContaining({ shell: false }));
  });

  it('8. should fail if Godot process returns non-zero code', async () => {
    child_process.execFile.mockImplementationOnce((exe, args, opts, cb) => {
      if(typeof opts === 'function') cb = opts;
      if(cb) cb(null, {stdout: ''});
    }); // version
    child_process.execFile.mockImplementationOnce((exe, args, opts, cb) => {
      if(typeof opts === 'function') cb = opts;
      if(cb) cb(new Error('exit code 1'), {stdout: '', stderr: ''});
    }); // export
    
    await expect(runGodotBuild('job1', 'repoDir', 'buildDir', logFn))
      .rejects.toThrow('Godot export failed');
  });

  it('9. should fail if output artifact is missing after build', async () => {
    mockedFs.existsSync.mockImplementation((f) => !f.endsWith('PantheonGame.exe'));
    await expect(runGodotBuild('job1', 'repoDir', 'buildDir', logFn))
      .rejects.toThrow('Godot did not produce the expected executable');
  });
  
  it('10. should handle timeout correctly', async () => {
    child_process.execFile.mockImplementationOnce((exe, args, opts, cb) => {
      if(typeof opts === 'function') cb = opts;
      if(cb) cb(null, {stdout: ''});
    }); // version
    child_process.execFile.mockImplementationOnce((exe, args, opts, cb) => {
      if(typeof opts === 'function') cb = opts;
      const err = new Error('timeout');
      err.killed = true;
      if(cb) cb(err, {stdout: '', stderr: ''});
    }); // export
    
    await expect(runGodotBuild('job1', 'repoDir', 'buildDir', logFn))
      .rejects.toThrow('Godot build timed out');
  });
});
