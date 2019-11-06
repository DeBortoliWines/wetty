import * as fileType from 'file-type';
// import Toastify from 'toastify-js';

const DEFAULT_FILE_BEGIN = '\u001b[5i';
const DEFAULT_FILE_END = '\u001b[4i';
const fileBuffer: string[] = [];

export class FileDownloader {
  fileBuffer: string[];

  file_begin: string;

  file_end: string;

  partial_file_begin: string;

  constructor(
    file_begin: string = DEFAULT_FILE_BEGIN,
    file_end: string = DEFAULT_FILE_END
  ) {
    this.file_begin = file_begin;
    this.file_end = file_end;
    this.partial_file_begin = '';
    this.fileBuffer = [];
  }

  buffer(data: string): string {
    let remainingCharacters = data;
    if (this.partial_file_begin !== '') {
      const nextExpectedCharacter = this.file_begin[
        this.partial_file_begin.length
      ];
      // Have we found more of the file_begin marker?
      if (data.substr(0, 1) === nextExpectedCharacter) {
        this.partial_file_begin += nextExpectedCharacter;
        const newData = data.substr(1);
        if (this.partial_file_begin === this.file_begin) {
          this.partial_file_begin = '';
          // return all the data as if it wasn't split across different buffer calls
          return this.buffer(this.file_begin + newData);
        }
        // We found the next expected character but we still haven't got the completed file_begin sequence
        return newData ? this.buffer(newData) : '';
      }

      // The next expected character wasn't part of the marker, it was a false positive
      // return all the data as if it wasn't split across different buffer calls
      const newData = this.partial_file_begin + data;
      this.partial_file_begin = '';
      return this.buffer(newData);
    }
    const indexOfFileBegin = data.indexOf(this.file_begin);
    const indexOfFileEnd = data.indexOf(this.file_end);

    // If we've got the entire file in one chunk
    if (indexOfFileBegin !== -1 && indexOfFileEnd !== -1) {
      const bufferCharacters = data.substring(
        indexOfFileBegin + this.file_begin.length,
        indexOfFileEnd
      );
      remainingCharacters = data.replace(
        this.file_begin + bufferCharacters + this.file_end,
        ''
      );
      this.fileBuffer.push(bufferCharacters);
      this.onCompleteFile(this.fileBuffer.join(''));
      this.fileBuffer = [];
      return this.buffer(remainingCharacters);
    }

    // If we've found a beginning marker
    else if (indexOfFileBegin !== -1) {
      const bufferCharacters = data.substring(
        indexOfFileBegin + this.file_begin.length
      );
      remainingCharacters = data.replace(
        this.file_begin + bufferCharacters,
        ''
      );
      this.fileBuffer.push(bufferCharacters);
    }

    // If we've found an ending marker
    else if (indexOfFileEnd !== -1) {
      const bufferCharacters = data.substring(0, indexOfFileEnd);
      remainingCharacters = data.replace(bufferCharacters + this.file_end, '');
      this.fileBuffer.push(bufferCharacters);
      this.onCompleteFile(this.fileBuffer.join(''));
      this.fileBuffer = [];
      // return this.buffer(remainingCharacters);
    }

    // If we're in the middle of buffering a file...
    else if (this.fileBuffer.length > 0) {
      const currentBuffer = this.fileBuffer.join('');
      const potentialFileEndIndexOf = (currentBuffer + data).indexOf(
        this.file_end
      );
      if (potentialFileEndIndexOf !== -1) {
        remainingCharacters = (currentBuffer + data).substr(
          potentialFileEndIndexOf + this.file_end.length
        );
        this.onCompleteFile(
          this.fileBuffer.join('').substr(0, potentialFileEndIndexOf)
        );
        this.fileBuffer = [];
        return this.buffer(remainingCharacters);
      } else {
        remainingCharacters = '';
        this.fileBuffer.push(data);
      }
    }

    // Check if there's potential for the start of a partial file marker
    // we only check the end of the data
    else {
      for (let i = this.file_begin.length - 1; i > 0; i--) {
        if (this.file_begin.substr(0, i) === data.substr(-i)) {
          this.partial_file_begin = data.substr(-i);
          remainingCharacters = data.substr(0, data.length - i);
          break;
        }
      }
    }

    return remainingCharacters;
  }

  onCompleteFile(bufferCharacters: string) {
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
