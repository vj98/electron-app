import React, { useState, useEffect } from "react";

function App() {
  const [command, setCommand] = useState("");
  const [output, setOutput] = useState("");

  const handleRunCommand = () => {
    if (window.electronAPI) {
      window.electronAPI.runCommand(command);
    }
  };

  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.onCommandOutput((data) => {
        console.log("Raw data received in UI:", data); // Debug log for raw data

        // Clean up control characters and the bash prompt
        const cleanedData = data
          .replace(/\x1B\[\??\d+[a-zA-Z]/g, "") // Remove control sequences like [?2004h
          .replace(/bash-[\d.]+\$\s?/g, "") // Remove the bash prompt (e.g., bash-5.2$)
          .trim(); // Trim any leading/trailing whitespace

        console.log("Cleaned data received in UI:", cleanedData); // Debug log for cleaned data
        setOutput((prevOutput) => cleanedData + "\n"); // Append cleaned data
      });
    }
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Command Runner</h1>
      <input
        type="text"
        value={command}
        onChange={(e) => setCommand(e.target.value)}
        placeholder="Enter a command"
        className="border border-gray-300 rounded w-full p-2 mb-4"
      />
      <button
        onClick={handleRunCommand}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Run Command
      </button>
      <div className="mt-4 bg-gray-100 p-4 rounded">
        <h2 className="text-lg font-semibold">Output:</h2>
        <pre className="whitespace-pre-wrap">{output}</pre>
      </div>
    </div>
  );
}

export default App;
