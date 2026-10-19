using System;
using System.Diagnostics;
using System.IO;
using System.Net.NetworkInformation;
using System.Net.Sockets;
using System.Threading;

internal static class StartGame
{
    private const int Port = 3100;
    private static Process serverProcess;

    private static int Main()
    {
        string gameFolder = AppDomain.CurrentDomain.BaseDirectory;
        string serverScript = Path.Combine(gameFolder, "scripts", "lan-server.mjs");

        if (!File.Exists(serverScript) || !Directory.Exists(Path.Combine(gameFolder, "node_modules")))
        {
            Console.Error.WriteLine("Game files are incomplete. Keep Start-Game.exe in the game folder and run npm ci once.");
            WaitForKey();
            return 1;
        }

        Console.CancelKeyPress += delegate(object sender, ConsoleCancelEventArgs e)
        {
            e.Cancel = true;
            StopServer();
        };

        try
        {
            serverProcess = Process.Start(new ProcessStartInfo
            {
                FileName = "node",
                Arguments = "\"" + serverScript + "\" " + Port,
                WorkingDirectory = gameFolder,
                UseShellExecute = false
            });
        }
        catch (Exception exception)
        {
            Console.Error.WriteLine("Could not start Node.js. Install Node.js 22 or newer, then try again.");
            Console.Error.WriteLine(exception.Message);
            WaitForKey();
            return 1;
        }

        Console.WriteLine("Starting the Connector learning game...");
        Console.WriteLine("Game address: http://localhost:" + Port);
        Console.WriteLine("Other devices on this Wi-Fi can use: http://" + GetLanAddress() + ":" + Port);

        if (WaitForPort())
        {
            Process.Start(new ProcessStartInfo("http://localhost:" + Port) { UseShellExecute = true });
        }
        else
        {
            Console.WriteLine("The game is still starting. Refresh http://localhost:" + Port + " in a moment.");
        }

        Console.WriteLine("Keep this window open while playing. Press Ctrl+C to stop the game.");
        serverProcess.WaitForExit();
        return serverProcess.ExitCode;
    }

    private static bool WaitForPort()
    {
        for (int attempt = 0; attempt < 30; attempt++)
        {
            try
            {
                using (var client = new TcpClient())
                {
                    client.Connect("127.0.0.1", Port);
                    return true;
                }
            }
            catch (SocketException)
            {
                Thread.Sleep(500);
            }
        }
        return false;
    }

    private static string GetLanAddress()
    {
        foreach (NetworkInterface networkInterface in NetworkInterface.GetAllNetworkInterfaces())
        {
            if (networkInterface.OperationalStatus != OperationalStatus.Up || networkInterface.NetworkInterfaceType == NetworkInterfaceType.Loopback)
                continue;
            foreach (var address in networkInterface.GetIPProperties().UnicastAddresses)
            {
                if (address.Address.AddressFamily == AddressFamily.InterNetwork && !address.Address.ToString().StartsWith("169.254."))
                    return address.Address.ToString();
            }
        }
        return "<your-computer-IP>";
    }

    private static void StopServer()
    {
        if (serverProcess == null || serverProcess.HasExited)
            return;
        Process.Start(new ProcessStartInfo("taskkill", "/PID " + serverProcess.Id + " /T /F") { CreateNoWindow = true, UseShellExecute = false }).WaitForExit();
    }

    private static void WaitForKey()
    {
        Console.WriteLine("Press any key to close.");
        Console.ReadKey();
    }
}
