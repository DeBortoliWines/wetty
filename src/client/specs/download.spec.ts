import { expect } from 'chai';
import 'mocha';
import * as sinon from 'sinon';

import { JSDOM } from 'jsdom';
import { FileDownloader } from '../download';

const { window } = new JSDOM(`...`);

describe('FileDownloader', () => {
  const FILE_BEGIN = 'BEGIN';
  const FILE_END = 'END';
  let fileDownloader: any;

  beforeEach(() => {
    fileDownloader = new FileDownloader(FILE_BEGIN, FILE_END);
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should set begin and end strings', () => {
    expect(fileDownloader.file_begin).to.equal(FILE_BEGIN);
    expect(fileDownloader.file_end).to.equal(FILE_END);
  });

  it('should return data before file markers', () => {
    const mockFile = `${FILE_BEGIN  }test string${  FILE_END}`;

    const onCompleteFileStub = sinon.stub(fileDownloader, 'onCompleteFile');
    expect(fileDownloader.buffer(`DATA AT THE LEFT${  mockFile}`)).to.equal(
      'DATA AT THE LEFT'
    );
    expect(onCompleteFileStub.calledOnce).to.be.true;
  });

  it('should return data after file markers', () => {
    const mockFile = `${FILE_BEGIN  }test string${  FILE_END}`;

    const onCompleteFileStub = sinon.stub(fileDownloader, 'onCompleteFile');
    expect(fileDownloader.buffer(`${mockFile  }DATA AT THE RIGHT`)).to.equal(
      'DATA AT THE RIGHT'
    );
    expect(onCompleteFileStub.calledOnce).to.be.true;
  });

  it('should return data before and after file markers', () => {
    const mockFile = `${FILE_BEGIN  }test string${  FILE_END}`;

    const onCompleteFileStub = sinon.stub(fileDownloader, 'onCompleteFile');
    expect(
      fileDownloader.buffer(`DATA AT THE LEFT${  mockFile  }DATA AT THE RIGHT`)
    ).to.equal('DATA AT THE LEFTDATA AT THE RIGHT');
    expect(onCompleteFileStub.calledOnce).to.be.true;
  });

  it('should return data before a beginning marker found', () => {
    const mockFile = `${FILE_BEGIN  }test string`;

    const onCompleteFileStub = sinon.stub(fileDownloader, 'onCompleteFile');
    expect(fileDownloader.buffer(`DATA AT THE LEFT${  mockFile}`)).to.equal(
      'DATA AT THE LEFT'
    );
  });

  it('should return data after an ending marker found', () => {
    const mockFilePart1 = `${FILE_BEGIN  }test`;
    const mockFilePart2 = `string${  FILE_END}`;

    const onCompleteFileStub = sinon.stub(fileDownloader, 'onCompleteFile');
    expect(fileDownloader.buffer(mockFilePart1)).to.equal('');
    expect(fileDownloader.buffer(`${mockFilePart2  }DATA AT THE RIGHT`)).to.equal(
      'DATA AT THE RIGHT'
    );
  });

  it('should buffer across incomplete file markers on two calls', () => {
    const mockFilePart1 = `DATA AT THE LEFT${  FILE_BEGIN.substr(0, 3)}`;
    const mockFilePart2 = `${FILE_BEGIN.substr(3)  }FILE DATA`;

    const onCompleteFileStub = sinon.stub(fileDownloader, 'onCompleteFile');
    expect(fileDownloader.buffer(mockFilePart1)).to.equal('DATA AT THE LEFT');
    expect(fileDownloader.buffer(mockFilePart2)).to.equal('');
  });

  it('should buffer across incomplete file markers on n calls', () => {
    fileDownloader = new FileDownloader('BEGIN', 'END');
    const onCompleteFileStub = sinon.stub(fileDownloader, 'onCompleteFile');

    expect(fileDownloader.buffer('B')).to.equal('');
    expect(fileDownloader.buffer('E')).to.equal('');
    expect(fileDownloader.buffer('G')).to.equal('');
    expect(fileDownloader.buffer('I')).to.equal('');
    expect(fileDownloader.buffer('NFILE' + 'END')).to.equal('');
    expect(onCompleteFileStub.calledOnce).to.be.true;
  });

  it('should buffer across incomplete file markers with data on the left and right on n calls', () => {
    fileDownloader = new FileDownloader('BEGIN', 'END');
    const onCompleteFileStub = sinon.stub(fileDownloader, 'onCompleteFile');

    expect(fileDownloader.buffer('DATA AT THE LEFT' + 'B')).to.equal(
      'DATA AT THE LEFT'
    );
    expect(fileDownloader.buffer('E')).to.equal('');
    expect(fileDownloader.buffer('G')).to.equal('');
    expect(fileDownloader.buffer('I')).to.equal('');
    expect(fileDownloader.buffer('NFILE' + 'ENDDATA AT THE RIGHT')).to.equal(
      'DATA AT THE RIGHT'
    );
    expect(onCompleteFileStub.calledOnce).to.be.true;
  });

  it('should buffer across incomplete file markers then handle false positive', () => {
    fileDownloader = new FileDownloader('BEGIN', 'END');
    const onCompleteFileStub = sinon.stub(fileDownloader, 'onCompleteFile');

    expect(fileDownloader.buffer('DATA AT THE LEFT' + 'B')).to.equal(
      'DATA AT THE LEFT'
    );
    expect(fileDownloader.buffer('E')).to.equal('');
    expect(fileDownloader.buffer('G')).to.equal('');
    // This isn't part of the file_begin marker and should trigger the partial
    // file begin marker to be returned with the normal data
    expect(fileDownloader.buffer('ZDATA AT THE RIGHT')).to.equal(
      'BEGZDATA AT THE RIGHT'
    );
    expect(onCompleteFileStub.called).to.be.false;
  });
});
