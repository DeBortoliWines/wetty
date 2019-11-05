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

  it('should return data around file markers', () => {
    const mockFile = FILE_BEGIN + window.atob('test string') + FILE_END;
    
    let onCompleteFileStub = sinon.stub(fileDownloader, 'onCompleteFile');
    expect(fileDownloader.buffer('SOME RANDOM DATA' + mockFile)).to.equal('SOME RANDOM DATA')
    expect(onCompleteFileStub.calledOnce).to.be.true;

    // fileDownloader = new FileDownloader(FILE_BEGIN, FILE_END);
    // expect(fileDownloader.buffer(mockFile + 'DATA AT THE END')).to.equal('DATA AT THE END');

    // fileDownloader = new FileDownloader(FILE_BEGIN, FILE_END);
    // expect(
    //   fileDownloader.buffer(
    //     'DATA AT THE BEGINNING' + mockFile + 'DATA AT THE END'
    //   )
    // ).to.equal('DATA AT THE BEGINNINGDATA AT THE END');
  });
});
