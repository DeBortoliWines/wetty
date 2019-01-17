import { Terminal } from 'xterm';
import { isUndefined } from 'lodash';
import * as io from 'socket.io-client';
import { fit } from 'xterm/lib/addons/fit/fit';
import './wetty.scss';
import './favicon.ico';

const userRegex = new RegExp('ssh/[^/]+$');
const trim = (str: string): string => str.replace(/\/*$/, '');
const socketBase = trim(window.location.pathname).replace(userRegex, '');
const socket = io(window.location.origin, {
  path: `${trim(socketBase)}/socket.io`,
});

const FILE_BEGIN = '\u001b[5i';
const FILE_END = '\u001b[4i';

socket.on('connect', () => {
  const term = new Terminal();
  let pdfBuffer = [];
  term.open(document.getElementById('terminal'));
  term.setOption('fontSize', 14);
  document.getElementById('overlay').style.display = 'none';
  window.addEventListener('beforeunload', handler, false);
  /*
    term.scrollPort_.screen_.setAttribute('contenteditable', 'false');
  */

  term.attachCustomKeyEventHandler(e => {
    // Ctrl + Shift + C
    if (e.ctrlKey && e.shiftKey && e.keyCode === 67) {
      e.preventDefault();
      document.execCommand('copy');
      return false;
    }
    return true;
  });

  function resize(): void {
    fit(term);
    socket.emit('resize', { cols: term.cols, rows: term.rows });
  }
  window.onresize = resize;
  resize();
  term.focus();

  function kill(data: string): void {
    disconnect(data);
  }

  function onCompleteFile() {
    let bufferCharacters = pdfBuffer.join('');
    bufferCharacters = bufferCharacters.substring(
      bufferCharacters.lastIndexOf(FILE_BEGIN) + FILE_BEGIN.length,
      bufferCharacters.lastIndexOf(FILE_END)
    );

    // Try to decode it as base64, if it fails we assume it's not base64
    try {
      bufferCharacters = window.atob(bufferCharacters);
    } catch (err) {}

    const bytes = new Uint8Array(bufferCharacters.length);
    for (let i = 0; i < bufferCharacters.length; i++) {
      bytes[i] = bufferCharacters.charCodeAt(i);
    }

    let mimeType = 'application/octet-stream';
    if (bufferCharacters.indexOf('%PDF') === 0) mimeType = 'application/pdf';

    const blob = new Blob([new Uint8Array(bytes.buffer)], { type: mimeType });
    const blobUrl = URL.createObjectURL(blob);

    window.open(blobUrl);

    pdfBuffer = [];
  }

  term.on('data', data => {
    socket.emit('input', data);
  });
  term.on('resize', size => {
    socket.emit('resize', size);
  });
  socket
    .on('data', (data: string) => {
      const indexOfFileBegin = data.indexOf(FILE_BEGIN);
      const indexOfFileEnd = data.indexOf(FILE_END);

      // If we've got the entire file in one chunk
      if (indexOfFileBegin !== -1 && indexOfFileEnd !== -1) {
        pdfBuffer.push(data);
        onCompleteFile();
      }
      // If we've found a beginning marker
      else if (indexOfFileBegin !== -1) {
        pdfBuffer.push(data);
      }
      // If we've found an ending marker
      else if (indexOfFileEnd !== -1) {
        pdfBuffer.push(data);
        onCompleteFile();
      }
      // If we've found the continuation of a file
      else if (pdfBuffer.length > 0) {
        pdfBuffer.push(data);
      }
      // Just treat it as normal data
      else {
        term.write(data);
      }
    })
    .on('login', () => {
      term.writeln('');
      resize();
    })
    .on('logout', kill)
    .on('disconnect', kill)
    .on('error', (err: string | null) => {
      if (err) disconnect(err);
    });
});

function disconnect(reason: string): void {
  document.getElementById('overlay').style.display = 'block';
  if (!isUndefined(reason)) document.getElementById('msg').innerHTML = reason;
  window.removeEventListener('beforeunload', handler, false);
}

function handler(e: { returnValue: string }): string {
  e.returnValue = 'Are you sure?';
  return e.returnValue;
}
