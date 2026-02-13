import { exec } from 'child_process';
import util from 'util';
import os from 'os';
import path from 'path';
import fs from 'fs';
import { Request, Response, Application } from 'express';

const execAsync = util.promisify(exec);

interface AiToolCheckResult {
    [key: string]: boolean;
}

function setupSystemRoutes(app: Application): void {

    app.get('/api/system/pick-folder', async (req: Request, res: Response) => {
        try {
            let command: string | undefined;
            if (os.platform() === 'darwin') {
                // macOS
                command = `osascript -e 'POSIX path of (choose folder with prompt "Select a Git Repository")'`;
            } else if (os.platform() === 'win32') {
                // Windows (PowerShell)
                command = `powershell -Command "Add-Type -AssemblyName System.Windows.Forms; $f = New-Object System.Windows.Forms.FolderBrowserDialog; $f.ShowDialog() | Out-Null; $f.SelectedPath"`;
            } else {
                throw new Error('Directory picker not supported on this platform yet. Please paste the path.');
            }

            if (command) {
                const { stdout } = await execAsync(command);
                const resultPath = stdout.trim(); // Renamed to avoid conflict with imported 'path'
                if (resultPath) {
                    res.json({ path: resultPath });
                } else {
                    res.json({ canceled: true });
                }
            }
        } catch (e: any) {
            console.error('Pick folder error:', e);
            if (e.message.includes('User canceled')) {
                return res.json({ canceled: true });
            }
            res.status(500).json({ error: e.message });
        }
    });

    app.get('/api/system/ai-tools', async (req: Request, res: Response) => {
        const tools: string[] = ['claude', 'codex', 'gemini'];
        const results: AiToolCheckResult = {};

        // Expand PATH to include common locations
        const commonPaths = [
            '/opt/homebrew/bin',
            '/usr/local/bin',
            '/usr/bin',
            '/bin',
            (process.env.HOME || '') + '/.local/bin',
            (process.env.HOME || '') + '/bin',
        ];
        const envPath = process.env.PATH || '';
        const extendedPath = commonPaths.join(path.delimiter) + path.delimiter + envPath;

        console.log('Checking AI tools with PATH:', extendedPath);

        for (const tool of tools) {
            let found = false;

            // 1. Check executable in PATH
            try {
                const cmd = os.platform() === 'win32' ? `where ${tool}` : `which ${tool}`;
                const { stdout } = await execAsync(cmd, {
                    env: { ...process.env, PATH: extendedPath }
                });
                if (stdout.trim()) {
                    console.log(`[System] Tool ${tool} found via which at: ${stdout.trim()}`);
                    found = true;
                }
            } catch (e) {
                // Ignore error, try next method
            }

            // 2. Direct binary check in common paths
            if (!found) {
                for (const p of commonPaths) {
                    const binaryPath = path.join(p, tool + (os.platform() === 'win32' ? '.exe' : ''));
                    if (fs.existsSync(binaryPath)) {
                        console.log(`[System] Tool ${tool} found via direct check at: ${binaryPath}`);
                        found = true;
                        break;
                    }
                }
            }

            // 3. Check for configuration directory/files (fallback like vibe-kanban)
            if (!found) {
                try {
                    const home = os.homedir();
                    let configPath: string | undefined;
                    if (tool === 'gemini') {
                        configPath = path.join(home, '.gemini');
                    } else if (tool === 'claude') {
                        configPath = path.join(home, '.anthropic');
                    } else if (tool === 'codex') {
                        configPath = path.join(home, '.codex');
                    }

                    if (configPath && fs.existsSync(configPath)) {
                        console.log(`[System] Tool ${tool} config directory found at: ${configPath}`);
                        found = true;
                    }
                } catch (e) {
                    console.log(`[System] Config check failed for ${tool}:`, e);
                }
            }

            results[tool] = found;
        }
        res.json(results);
    });

}

export { setupSystemRoutes };
