import { Terminal } from 'xterm';
import { isNull } from 'lodash';

import { library, dom } from '@fortawesome/fontawesome-svg-core';
import { faCogs } from '@fortawesome/free-solid-svg-icons/faCogs';
import { socket } from './socket';
import { overlay, terminal } from './elements';
import { FileDownloader } from './download';
import verifyPrompt from './verify';
import disconnect from './disconnect';
import mobileKeyboard from './mobile';
import resize from './resize';
import loadOptions from './options';
import { copySelected, copyShortcut } from './copyToClipboard';
import * as fileType from 'file-type';
import Toastify from 'toastify-js';
import './wetty.scss';
import './favicon.ico';
import startWeTTy from '../server/wetty';

// Setup for fontawesome
library.add(faCogs);
dom.watch();

socket.on('connect', () => {
  const term = new Terminal();
  if (isNull(terminal)) return;
  term.open(terminal);

  const options = loadOptions();
  Object.entries(options).forEach(([key, value]) => {
    term.setOption(key, value);
  });
  const code = JSON.stringify(options, null, 2);
  const editor = document.querySelector('#options .editor');
  if (!isNull(editor)) {
    editor.value = code;
    editor.addEventListener('keyup', () => {
      try {
        const updated = JSON.parse(editor.value);
        const updatedCode = JSON.stringify(updated, null, 2);
        editor.value = updatedCode;
        editor.classList.remove('error');
        localStorage.options = updatedCode;
        Object.keys(updated).forEach(key => {
          const value = updated[key];
          term.setOption(key, value);
        });
        resize(term)();
      } catch {
        // skip
        editor.classList.add('error');
      }
    });
    const toggle = document.querySelector('#options .toggler');
    const optionsElem = document.getElementById('options');
    if (!isNull(toggle) && !isNull(optionsElem)) {
      toggle.addEventListener('click', e => {
        optionsElem.classList.toggle('opened');
        e.preventDefault();
      });
    }
  }
  if (!isNull(overlay)) overlay.style.display = 'none';
  window.addEventListener('beforeunload', verifyPrompt, false);

  term.attachCustomKeyEventHandler(copyShortcut);

  document.addEventListener(
    'mouseup',
    () => {
      if (term.hasSelection()) copySelected(term.getSelection());
    },
    false
  );

  window.onresize = resize(term);
  resize(term)();
  term.focus();
  mobileKeyboard();

  term.on('data', data => {
    socket.emit('input', data);
  });
  term.on('resize', size => {
    socket.emit('resize', size);
  });

  if (window.wettyConfig.enablefiledownload) {
    const fileDownloader = new FileDownloader(function(
      bufferCharacters: string
    ) {
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

      Toastify({
        text: `Download ready: <a href="${blobUrl}" target="_blank" download="${fileName}">${fileName}</a>`,
        duration: 10000,
        newWindow: true,
        gravity: 'bottom',
        position: 'right',
        backgroundColor: '#fff',
        stopOnFocus: true,
      }).showToast();
    });

    socket.on('data', (data: string) => {
      data = fileDownloader.buffer(data);
      if (data) {
        term.write(data);
      }
    });
  } else {
    socket.on('data', (data: string) => {
      term.write(data);
    });
  }

  socket
    .on('login', () => {
      term.writeln('');
      resize(term)();
    })
    .on('logout', disconnect)
    .on('disconnect', disconnect)
    .on('error', (err: string | null) => {
      if (err) disconnect(err);
    });
});
