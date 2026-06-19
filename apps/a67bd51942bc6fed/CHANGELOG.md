# CSV Editor — Changelog

## Changelog
- 2026-06-19 — `Open` doesn't load the file - VM385 about:srcdoc:71 Uncaught (in promise) TypeError: Cannot read properties of null (reading 'length') at parseCSV (VM385 about:srcdoc:71:17) VM385 about:srcdoc:71 Uncaught (in promise) TypeError: Cannot read properties of null (reading 'length') at parseCSV (VM385 about:srcdoc:71:17) at VM385 about:srcdoc:498:18 parseCSV @ VM385 about:srcdoc:71 (anonymous) @ VM385 about:srcdoc:498 Promise.then (async) (anonymous) @ VM385 about:srcdoc:497 Promise.then (async) openCSV @ VM385 about:srcdoc:495
- 2026-06-19 — VM209 about:srcdoc:109 Uncaught TypeError: val.indexOf is not a function at toCSV (VM209 about:srcdoc:109:14) at HTMLButtonElement.saveCSV (VM209 about:srcdoc:504:13)
- 2026-06-19 — Lets make sure the Open/Save/Save As are updated to use the new OS functions
- 2026-06-19 — This is still preventing Open/Save functionality [one_OS] os.fs.openFile() is not available in this OS (anonymous) @ VM199 about:srcdoc:30 openCSV
- 2026-06-19 — I'm getting the following error when trying to Open - [one_OS] os.fs.openFile() is not available in this OS
- 2026-06-19 — Created — Create me an excel like application to manage data. I want it only to deal with CSV formats. I should be able to open th
