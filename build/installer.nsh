; Protect The Starship installer compatibility bridge.
; The original Windows build used com.manus.tyrian2000. Electron Builder normally
; looks up only the current app GUID, so add the legacy uninstall key as a second
; upgrade source. The standard upgrade routine removes the old app silently while
; preserving user data, then installs the current build in its place.
!macro customHeader
  !define UNINSTALL_REGISTRY_KEY_2 "Software\Microsoft\Windows\CurrentVersion\Uninstall\8485e181-bb67-5320-87c3-9bd14aafae5f"
!macroend
