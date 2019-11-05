import * as fileType from 'file-type';
// import Toastify from 'toastify-js';

const DEFAULT_FILE_BEGIN: string = '\u001b[5i';
const DEFAULT_FILE_END: string = '\u001b[4i';
let fileBuffer: string[] = [];

export class FileDownloader {
  fileBuffer: string[];
  file_begin: string;
  file_end: string;

  constructor(
    file_begin: string = DEFAULT_FILE_BEGIN,
    file_end: string = DEFAULT_FILE_END
  ) {
    this.file_begin = file_begin;
    this.file_end = file_end;
    this.fileBuffer = [];
  }

  buffer(data: string) {
    const indexOfFileBegin = data.indexOf(this.file_begin);
    const indexOfFileEnd = data.indexOf(this.file_end);
    let remainingCharacters = '';

    // If we've got the entire file in one chunk
    if (indexOfFileBegin !== -1 && indexOfFileEnd !== -1) {
      let bufferCharacters = data.substring(
        indexOfFileBegin + this.file_begin.length,
        indexOfFileEnd
      );
      remainingCharacters = data.replace(
        this.file_begin + bufferCharacters + this.file_end,
        ''
      );
      this.fileBuffer.push(bufferCharacters);
      this.onCompleteFile();
    }
    // If we've found a beginning marker
    // else if (indexOfFileBegin !== -1) {
    //   let bufferCharacters = data.substring(
    //     data.lastIndexOf(this.file_begin) + this.file_begin.length
    //   );
    //   remainingCharacters = data.replace(
    //     this.file_begin + bufferCharacters,
    //     ''
    //   );
    //   this.fileBuffer.push(bufferCharacters);
    // }
    // // If we've found an ending marker
    // else if (indexOfFileEnd !== -1) {
    //   this.fileBuffer.push(data);
    //   this.onCompleteFile();
    // }
    // If we've found the continuation of a file
    // else if (this.fileBuffer.length > 0) {
    //   this.fileBuffer.push(data);
    // }
    // We don't have a file...
    return remainingCharacters;
  }

  onCompleteFile() {
    let bufferCharacters = this.fileBuffer.join('');
    bufferCharacters = bufferCharacters.substring(
      bufferCharacters.lastIndexOf(this.file_begin) + this.file_begin.length,
      bufferCharacters.lastIndexOf(this.file_end)
    );

    // Try to decode it as base64, if it fails we assume it's not base64
    try {
      bufferCharacters = window.atob(bufferCharacters);
    } catch (err) {
      // Assuming it's not base64...
    }

    const bytes = new Uint8Array(bufferCharacters.length);
    for (let i = 0; i < bufferCharacters.length; i += 1) {
      bytes[i] = bufferCharacters.charCodeAt(i);
    }

    let mimeType = 'application/octet-stream';
    let fileExt = '';
    const typeData = fileType(bytes);
    if (typeData) {
      mimeType = typeData.mime;
      fileExt = typeData.ext;
    }
    const fileName = `file-${new Date()
      .toISOString()
      .split('.')[0]
      .replace(/-/g, '')
      .replace('T', '')
      .replace(/:/g, '')}${fileExt ? `.${fileExt}` : ''}`;

    const blob = new Blob([new Uint8Array(bytes.buffer)], {
      type: mimeType,
    });
    const blobUrl = URL.createObjectURL(blob);

    this.fileBuffer = [];

    // Toastify({
    //   text: `Download ready: <a href="${blobUrl}" target="_blank" download="${fileName}">${fileName}</a>`,
    //   duration: 10000,
    //   newWindow: true,
    //   gravity: 'bottom',
    //   position: 'right',
    //   backgroundColor: '#fff',
    //   stopOnFocus: true,
    // }).showToast();

    return blob;
  }
}
