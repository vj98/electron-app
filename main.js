const { app, BrowserWindow, ipcMain } = require("electron");
const { exec } = require("child_process");
const path = require("path");

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    title: "vijay-command-app",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
    },
  });

  win.loadURL(
    process.env.NODE_ENV === "development"
      ? "http://localhost:8080"
      : `file://${path.join(__dirname, "dist/index.html")}`
  );
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

// ipcMain.on("run-command", (event, command) => {
//   exec(command, (error, stdout, stderr) => {
//     if (error) {
//       event.reply("command-output", `Error: ${error.message}`);
//       return;
//     }
//     if (stderr) {
//       event.reply("command-output", `stderr: ${stderr}`);
//       return;
//     }
//     event.reply("command-output", `stdout: ${stdout}`);
//   });
// });

// const { spawn } = require("child_process");

// ipcMain.on("run-command", (event, command) => {
//   const shell = spawn("bash", [], { shell: true });

//   //   if (command.toString().includes("cd")) {
//   //     shell.stdin.write(`cd ..\n`);
//   //   } else {
//   shell.stdin.write(`${command}\n`);
//   //   }
//   shell.stdin.end();

//   let output = "";
//   shell.stdout.on("data", (data) => {
//     output += data.toString();
//   });

//   shell.stderr.on("data", (data) => {
//     output += `stderr: ${data}`;
//   });

//   shell.on("close", (code) => {
//     event.reply("command-output", output || `Process exited with code ${code}`);
//   });
// });

const pty = require("node-pty");
const os = require("os");

// ipcMain.on("run-command", (event, command) => {
//   const shell = os.platform() === "win32" ? "powershell.exe" : "bash";
//   const ptyProcess = pty.spawn(shell, [], {
//     name: "xterm-color",
//     cols: 80,
//     rows: 24,
//     cwd: process.env.HOME,
//     env: process.env,
//   });

//   ptyProcess.on("data", (data) => {
//     event.reply("command-output", data);
//   });

//   ptyProcess.write(`${command}\r`);
// });

ipcMain.on("run-command", (event, command) => {
  console.log(`Running command: ${command}`); // Debug log

  // Determine shell based on OS
  const shell = os.platform() === "win32" ? "powershell.exe" : "bash";

  // Spawn a new pty process
  const ptyProcess = pty.spawn(shell, [], {
    name: "xterm-color",
    cols: 80,
    rows: 24,
    cwd: process.env.HOME,
    env: process.env,
  });

  // Log when pty process starts
  console.log("pty process started");

  let outputBuffer = ""; // Accumulate data here

  // Initialize current directory as the user's home directory
  let currentDirectory = process.env.HOME || process.env.USERPROFILE;

  ipcMain.on("run-command", (event, command) => {
    // Handle "cd" commands manually
    if (command.startsWith("cd ")) {
      const targetDir = command.split(" ")[1].trim();

      // Resolve the new directory path
      if (targetDir === "..") {
        currentDirectory = path.resolve(currentDirectory, ".."); // Go up one directory
      } else if (path.isAbsolute(targetDir)) {
        currentDirectory = targetDir; // Set to an absolute path
      } else {
        currentDirectory = path.join(currentDirectory, targetDir); // Set to a relative path
      }

      // Send updated directory message back to the renderer
      event.reply(
        "command-output",
        `Directory changed to: ${currentDirectory}\n`
      );
      return;
    }

    // Spawn a shell session to run the command in the current directory
    const shell = os.platform() === "win32" ? "powershell.exe" : "bash";

    const ptyProcess = pty.spawn(shell, [], {
      name: "xterm-color",
      cols: 80,
      rows: 24,
      cwd: currentDirectory, // Set the shell to start in the current directory
      env: process.env,
    });

    let outputBuffer = ""; // Accumulate data here

    ptyProcess.on("data", (data) => {
      outputBuffer += data; // Append new data to the buffer

      // Check if the buffer contains the shell prompt, indicating command completion
      if (outputBuffer.includes("bash")) {
        // Adjust this prompt based on your setup
        // Clean up and send the output
        const cleanedOutput = outputBuffer
          .replace(/\x1B\[\??\d+[a-zA-Z]/g, "") // Remove control sequences
          .replace(/bash-[\d.]+\$\s?/g, "") // Remove the bash prompt
          .trim();

        event.reply("command-output", cleanedOutput); // Send to renderer
        outputBuffer = ""; // Clear the buffer for the next command
      }
    });

    ptyProcess.write(`${command}\r`);
  });

  // Listen for errors
  ptyProcess.on("error", (err) => {
    console.error("Error in pty process:", err); // Debug log
    event.reply("command-output", `Error: ${err.message}`);
  });

  // Send the command to the shell
  ptyProcess.write(`${command}\r`);
});
