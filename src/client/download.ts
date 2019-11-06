// import * as fileType from 'file-type';
// import Toastify from 'toastify-js';

const DEFAULT_FILE_BEGIN = '\u001b[5i';
const DEFAULT_FILE_END = '\u001b[4i';

export class FileDownloader {
  fileBuffer: string[];
  fileBegin: string;
  fileEnd: string;
  partialFileBegin: string;

  constructor(
    fileBegin: string = DEFAULT_FILE_BEGIN,
    fileEnd: string = DEFAULT_FILE_END
  ) {
    this.fileBuffer = [];
    this.fileBegin = fileBegin;
    this.fileEnd = fileEnd;
    this.partialFileBegin = '';
  }

  bufferCharacter(character: string): string {
    if (this.fileBuffer.length === 0) {
      if (this.partialFileBegin.length === 0) {
        if (character === this.fileBegin[0]) {
          this.partialFileBegin = character;
          return '';
        } else {
          return character;
        }
      }
      // We're currently in the state of buffering a beginner marker...
      else {
        let nextExpectedCharacter = this.fileBegin[
          this.partialFileBegin.length
        ];
        if (character === nextExpectedCharacter) {
          this.partialFileBegin += character;
          if (this.partialFileBegin === this.fileBegin) {
            this.partialFileBegin = '';
            this.fileBuffer = this.fileBuffer.concat(this.fileBegin.split(''));
            return '';
          } else {
            return '';
          }
        } else {
          let dataToReturn = this.partialFileBegin + character;
          this.partialFileBegin = '';
          return dataToReturn;
        }
      }
    } else {
      this.fileBuffer.push(character);
      if (
        this.fileBuffer.length >= this.fileBegin.length + this.fileEnd.length &&
        this.fileBuffer.slice(-this.fileEnd.length).join('') === this.fileEnd
      ) {
        this.onCompleteFile(
          this.fileBuffer
            .slice(
              this.fileBegin.length,
              this.fileBuffer.length - this.fileEnd.length
            )
            .join('')
        );
        this.fileBuffer = [];
      }

      return '';
    }
  }

  buffer(data: string): string {
    let newData = '';
    for (let i = 0; i < data.length; i++) {
      newData += this.bufferCharacter(data[i]);
    }
    return newData;
  }

  onCompleteFile(bufferCharacters: string) {}
}
