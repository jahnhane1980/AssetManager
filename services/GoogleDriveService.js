// services/GoogleDriveService.js
// Modus: Code-Buddy | Regel 6: Full-Body | Regel 7: Prettify
// Fokus: Kapselung der Google Drive API Kommunikation (Upload & Download)
// Update: Detailliertes Error-Logging über response.text() integriert

import { Config } from '../constants/Config';

class GoogleDriveService {
  constructor() {
    this.accessToken = null;
  }

  setAccessToken(token) {
    this.accessToken = token;
  }

  /**
   * Sucht nach dem Backup-Ordner oder erstellt ihn.
   */
  async getOrCreateBackupFolder() {
    if (!this.accessToken) throw new Error("Nicht authentifiziert.");
    
    const query = encodeURIComponent(`name = '${Config.GOOGLE_DRIVE.FOLDER_NAME}' and mimeType = '${Config.GOOGLE_DRIVE.MIME_TYPE_FOLDER}' and trashed = false`);
    const response = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}`, {
      headers: { Authorization: `Bearer ${this.accessToken}` }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Fehler beim Suchen des Ordners (${response.status}): ${errorText}`);
    }
    
    const data = await response.json();
    if (data.files && data.files.length > 0) {
      return data.files[0].id;
    }

    const createResponse = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: Config.GOOGLE_DRIVE.FOLDER_NAME,
        mimeType: Config.GOOGLE_DRIVE.MIME_TYPE_FOLDER
      })
    });
    
    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      throw new Error(`Fehler beim Erstellen des Ordners (${createResponse.status}): ${errorText}`);
    }
    
    const folder = await createResponse.json();
    return folder.id;
  }

  /**
   * Listet alle Backups auf.
   */
  async listBackups(folderId) {
    const query = encodeURIComponent(`'${folderId}' in parents and trashed = false`);
    const response = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id, name, createdTime)&orderBy=createdTime desc`, {
      headers: { Authorization: `Bearer ${this.accessToken}` }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Fehler beim Laden der Backups (${response.status}): ${errorText}`);
    }
    
    const data = await response.json();
    return data.files || [];
  }

  /**
   * Lädt die binäre .db Datei hoch (Multipart).
   */
  async uploadBackup(folderId, fileName, fileContentBase64) {
    const metadata = {
      name: fileName,
      parents: [folderId],
      mimeType: Config.GOOGLE_DRIVE.MIME_TYPE_DB
    };

    const boundary = 'foo_bar_baz';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const body = 
      delimiter + 'Content-Type: application/json; charset=UTF-8\r\n\r\n' + JSON.stringify(metadata) +
      delimiter + 'Content-Type: ' + Config.GOOGLE_DRIVE.MIME_TYPE_DB + '\r\n' + 'Content-Transfer-Encoding: base64\r\n\r\n' + fileContentBase64 +
      closeDelimiter;

    const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`
      },
      body: body
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Upload fehlgeschlagen (${response.status}): ${errorText}`);
    }
    
    return await response.json();
  }

  /**
   * Lädt eine Datei vom Drive herunter.
   */
  async downloadFile(fileId) {
    const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
      headers: { Authorization: `Bearer ${this.accessToken}` }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Download fehlgeschlagen (${response.status}): ${errorText}`);
    }
    
    // Wir benötigen den Inhalt als Base64 für das FileSystem
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}

export default new GoogleDriveService();