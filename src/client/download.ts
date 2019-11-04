import * as fileType from 'file-type';
import Toastify from 'toastify-js';

const FILE_BEGIN = '\u001b[5i';
const FILE_END = '\u001b[4i';
let fileBuffer: string[] = [];

export function processFile(data: string) {
  const indexOfFileBegin = data.indexOf(FILE_BEGIN);
  const indexOfFileEnd = data.indexOf(FILE_END);

  // If we've got the entire file in one chunk
  if (indexOfFileBegin !== -1 && indexOfFileEnd !== -1) {
    fileBuffer.push(data);
    onCompleteFile();
  }
  // If we've found a beginning marker
  else if (indexOfFileBegin !== -1) {
    fileBuffer.push(data);
  }
  // If we've found an ending marker
  else if (indexOfFileEnd !== -1) {
    fileBuffer.push(data);
    onCompleteFile();
  }
  // If we've found the continuation of a file
  else if (fileBuffer.length > 0) {
    fileBuffer.push(data);
  }
  // We don't have a file...
  else {
    return false;
  }
  return true;
}

function onCompleteFile() {
  let bufferCharacters = fileBuffer.join('');
  bufferCharacters = bufferCharacters.substring(
    bufferCharacters.lastIndexOf(FILE_BEGIN) + FILE_BEGIN.length,
    bufferCharacters.lastIndexOf(FILE_END)
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

  const blob = new Blob([new Uint8Array(bytes.buffer)], { type: mimeType });
  const blobUrl = URL.createObjectURL(blob);

  fileBuffer = [];

  Toastify({
    text: `Download ready: <a href="${blobUrl}" target="_blank" download="${fileName}">${fileName}</a>`,
    duration: 10000,
    newWindow: true,
    gravity: 'bottom',
    position: 'right',
    backgroundColor: '#fff',
    stopOnFocus: true,
  }).showToast();
}