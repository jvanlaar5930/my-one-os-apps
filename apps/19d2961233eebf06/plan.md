Pending Application Name: "Password Vault" 🔒

A secure, categorized credential manager with a master password lock and auto-relocking functionality.

Features:
- Master Password Authentication: Protects the vault with a single required passphrase.
- Categorized Storage: Organize credentials into API Keys, Username/Password, or Secure Notes.
- Auto-Lock Security: Automatically triggers the lock screen when the app is minimized or loses focus.
- Clipboard Integration: One-tap copying of passwords and keys to the system clipboard.
- Full CRUD: Create, Read, Update, and Delete entries with search and category filtering.

Bridge & data:
- `os.database`: Stores credentials in a `credentials` table (id, title, type, username, password, note, timestamp).
- `os.storage`: Stores the hashed master password and salt for authentication.
- `os.clipboard`: For secure copying of sensitive strings.
- `os.notify`: To alert the user when the vault is locked or unlocked.

Layout:
A single-page interface using a view-switcher pattern: Lock Screen (centered form) $\leftrightarrow$ Dashboard (search bar, category tabs, and list) $\leftrightarrow$ Entry Editor (form).

Build steps:
1. **Database & Auth Setup**: Initialize `os.database` with the credentials schema; implement a hashing function using `SubtleCrypto` to verify the master password against `os.storage`.
2. **Lock Screen Implementation**: Create a high-z-index overlay that intercepts all interactions until the correct password is provided; use `document.visibilitychange` and `window.onblur` to trigger this view.
3. **Credential Management**: Build the CRUD logic using `os.database.run` for inserts/updates and `os.database.query` for retrieving entries, including a search filter.
4. **UI Components**: Develop the category-based filtering system (API Key, User/Pass, Note) and the entry editor form with validation.
5. **Security Hardening**: Implement "Copy to Clipboard" functionality that clears the clipboard after a short delay; ensure all sensitive data is cleared from memory when the lock screen is active.