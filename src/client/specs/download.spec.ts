import { FileDownloader } from '../download';
import { expect } from 'chai';
import 'mocha';
import * as sinon from 'sinon';

import { JSDOM } from 'jsdom';

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
    const mockFile = FILE_BEGIN + 'test string' + FILE_END;

    let onCompleteFileStub = sinon.stub(fileDownloader, 'onCompleteFile');
    expect(fileDownloader.buffer('DATA AT THE LEFT' + mockFile)).to.equal(
      'DATA AT THE LEFT'
    );
    expect(onCompleteFileStub.calledOnce).to.be.true;
  });

  it('should return data after file markers', () => {
    const mockFile = FILE_BEGIN + 'test string' + FILE_END;

    let onCompleteFileStub = sinon.stub(fileDownloader, 'onCompleteFile');
    expect(fileDownloader.buffer(mockFile + 'DATA AT THE RIGHT')).to.equal(
      'DATA AT THE RIGHT'
    );
    expect(onCompleteFileStub.calledOnce).to.be.true;
  });

  it('should return data before and after file markers', () => {
    const mockFile = FILE_BEGIN + 'test string' + FILE_END;

    let onCompleteFileStub = sinon.stub(fileDownloader, 'onCompleteFile');
    expect(
      fileDownloader.buffer('DATA AT THE LEFT' + mockFile + 'DATA AT THE RIGHT')
    ).to.equal('DATA AT THE LEFTDATA AT THE RIGHT');
    expect(onCompleteFileStub.calledOnce).to.be.true;
  });
});
