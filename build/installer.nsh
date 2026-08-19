; Protect The Starship installer compatibility and update bridge.
; The original Windows build used com.manus.tyrian2000. Electron Builder normally
; looks up only the current app GUID, so add the legacy uninstall key as a second
; upgrade source. The standard upgrade routine removes the old app silently while
; preserving user data, then installs the current build in its place.
!macro customHeader
  !define UNINSTALL_REGISTRY_KEY_2 "Software\Microsoft\Windows\CurrentVersion\Uninstall\8485e181-bb67-5320-87c3-9bd14aafae5f"
!macroend

; Electron can leave the named desktop executable or one of its child processes
; alive briefly after its window closes. Override the default retry/cancel dialog
; with two forced, tree-wide termination attempts for this game executable only.
; The installer itself has a different file name, so it is never targeted.
!macro customCheckAppRunning
  DetailPrint "Closing a remaining Protect The Starship process."
  nsExec::Exec `"$SYSDIR\cmd.exe" /C taskkill /F /T /IM "Protect The Starship.exe" >nul 2>&1`
  Pop $0
  Sleep 1000
  nsExec::Exec `"$SYSDIR\cmd.exe" /C taskkill /F /T /IM "Protect The Starship.exe" >nul 2>&1`
  Pop $0
  Sleep 500
!macroend
