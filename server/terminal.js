const pty = require('node-pty');
const os = require('os');
const path = require('path');
const fs = require('fs');

function setupTerminal(io, getState, getTaskById) {
    const shell = os.platform() === 'win32' ? 'powershell.exe' : 'zsh';
    const sessions = {};

    io.on('connection', (socket) => {
        socket.on('terminal:create', async ({ cols, rows, taskId }) => {
            const { repoPath } = getState();

            if (!repoPath) {
                socket.emit('terminal:error', 'Repository path not configured');
                return;
            }

            const termId = taskId || 'default';

            if (sessions[termId]) {
                sessions[termId].kill();
            }

            let workingDir = repoPath;
            let taskEnv = {}; // Environment variables for the task

            if (taskId && taskId !== 'default') {
                const task = await getTaskById(taskId);
                if (task) {
                    // Only inject details if the task is "in progress"
                    if (task.status === 'inprogress') {
                        taskEnv = {
                            TASK_ID: task.id,
                            TASK_TITLE: task.title,
                            TASK_DESCRIPTION: task.description,
                            TASK_STATUS: task.status,
                            // Add other relevant task details if needed
                        };
                        console.log(`[Terminal] Injected task details for task ${task.id} into environment.`);
                    }

                    const worktreePath = path.join(repoPath, '.vibe-flow', 'worktrees', taskId);
                    if (fs.existsSync(worktreePath)) {
                        workingDir = worktreePath;
                    }
                }
            }

            // Fallback if workingDir doesn't exist
            if (!fs.existsSync(workingDir)) {
                console.warn(`Working directory ${workingDir} does not exist. Falling back to home directory.`);
                workingDir = os.homedir();
            }

            console.log(`[Terminal] Spawning ${shell} in ${workingDir}`);
            console.log(`[Terminal] Cols: ${cols}, Rows: ${rows}`);

            let ptyProcess;
            try {
                // Verify directory exists specifically before spawn
                try {
                    fs.accessSync(workingDir, fs.constants.R_OK | fs.constants.X_OK);
                } catch (err) {
                    console.error(`[Terminal] Directory not accessible: ${workingDir}`, err);
                    socket.emit('terminal:error', `Directory not accessible: ${workingDir}`);
                    return;
                }

                ptyProcess = pty.spawn(shell === 'zsh' ? '/bin/zsh' : shell, [], {
                    name: 'xterm-color',
                    cols: cols || 80,
                    rows: rows || 30,
                    cwd: workingDir,
                    env: { ...process.env, ...taskEnv } // Merge existing and task-specific envs
                });
            } catch (spawnError) {
                console.error('[Terminal] Spawn failed:', spawnError);
                socket.emit('terminal:error', 'Failed to spawn terminal process');
                return;
            }

            sessions[termId] = ptyProcess;

            ptyProcess.onData((data) => {
                socket.emit(`terminal:data:${termId}`, data);
            });

            socket.on(`terminal:input:${termId}`, (data) => {
                ptyProcess.write(data);
            });

            socket.on(`terminal:resize:${termId}`, ({ cols, rows }) => {
                ptyProcess.resize(cols, rows);
            });

            socket.on('disconnect', () => {
                // Cleanup if necessary
            });
        });
    });
}

module.exports = { setupTerminal };
