Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

appDir = fso.GetParentFolderName(WScript.ScriptFullName)
desktopPath = WshShell.SpecialFolders("Desktop")

' Find pythonw.exe
pythonwPath = WshShell.ExpandEnvironmentStrings("%LOCALAPPDATA%") & "\Programs\Python\Python313\pythonw.exe"
If Not fso.FileExists(pythonwPath) Then
    pythonwPath = WshShell.ExpandEnvironmentStrings("%LOCALAPPDATA%") & "\Programs\Python\Python312\pythonw.exe"
End If
If Not fso.FileExists(pythonwPath) Then
    pythonwPath = WshShell.ExpandEnvironmentStrings("%LOCALAPPDATA%") & "\Programs\Python\Python311\pythonw.exe"
End If
If Not fso.FileExists(pythonwPath) Then
    ' Try system python
    pythonwPath = "C:\Python313\pythonw.exe"
End If
If Not fso.FileExists(pythonwPath) Then
    pythonwPath = "C:\Python312\pythonw.exe"
End If
If Not fso.FileExists(pythonwPath) Then
    ' Fallback: just use pythonw from PATH
    pythonwPath = "pythonw.exe"
End If

Set shortcut = WshShell.CreateShortcut(desktopPath & "\Taydesk.lnk")
shortcut.TargetPath = pythonwPath
shortcut.Arguments = """" & appDir & "\taydesk.pyw"""
shortcut.WorkingDirectory = appDir
shortcut.IconLocation = appDir & "\taydesk.ico"
shortcut.Description = "Taydesk — RustDesk Dashboard"
shortcut.WindowStyle = 7  ' Minimized (hidden)
shortcut.Save

WScript.Echo "Shortcut created on Desktop: Taydesk.lnk"
