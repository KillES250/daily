const { spawn } = require('child_process');

module.exports = function handleSpawn(command, args, res, successMessage, errorMessage) {
    // 使用 spawn 创建一个新的 CMD 进程，并使用 start 命令打开新的 CMD 窗口
    const child = spawn('cmd.exe', ['/c', 'start', 'cmd.exe', '/k', `${command} ${args.join(' ')}`]);

    child.on('close', (code) => {
        if (code !== 0) {
            console.error(`子进程退出码为 ${code}`);
            return res.status(500).json({ error: errorMessage });
        }
        res.json({ message: successMessage });
    });
}

// module.exports = function handleSpawn(command, args, res, successMessage, errorMessage) {
//     const disableQuickEditCommand = 'reg add "HKEY_CURRENT_USER\\Console" /v QuickEdit /t REG_DWORD /d 0 /f';
//     const enableQuickEditCommand = 'reg add "HKEY_CURRENT_USER\\Console" /v QuickEdit /t REG_DWORD /d 1 /f';

//     const fullCommand = `${disableQuickEditCommand} && start cmd.exe /k "${command} ${args.join(' ')}" && ${enableQuickEditCommand}`;

//     const child = spawn('cmd.exe', ['/c', fullCommand]);

//     child.on('close', (code) => {
//         if (code !== 0) {
//             console.error(`子进程退出码为 ${code}`);
//             return res.status(500).json({ error: errorMessage });
//         }
//         res.json({ message: successMessage });
//     });
// }