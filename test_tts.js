const WebSocket = require('ws');
const crypto = require('crypto');

const connectionId = crypto.randomBytes(16).toString('hex').toLowerCase();
const EDGE_URL = `wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=6A5AA1D4EA5E4079BC77E851D2CB479A&ConnectionId=${connectionId}`;

const ws = new WebSocket(EDGE_URL, {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0',
    'Accept-Encoding': 'gzip, deflate, br',
    'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7'
  }
});

ws.on('open', () => {
  console.log('✅ CONNECTED SUCCESSFULLY!');
  
  const configHeader = `X-Timestamp:${new Date().toISOString()}\r\nContent-Type:application/json; charset=utf-8\r\nPath:speech.config\r\n\r\n{"context":{"synthesis":{"audio":{"metadataversion":"2020.05.30","format":"audio-24khz-48kbitrate-mono-mp3"}}}}`;
  ws.send(configHeader);

  const ssml = `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='ko-KR'><voice name='ko-KR-SunHiNeural'><rate speed='0%'>안녕하세요. 분양 홍보 쇼츠 영상입니다.</rate></voice></speak>`;
  const requestId = crypto.randomBytes(16).toString('hex').toLowerCase();
  const ssmlHeader = `X-RequestId:${requestId}\r\nContent-Type:application/ssml+xml\r\nPath:ssml\r\n\r\n${ssml}`;
  ws.send(ssmlHeader);
});

ws.on('message', (data, isBinary) => {
  if (isBinary) {
    console.log('Received audio chunk bytes:', data.length);
  }
});

ws.on('close', () => {
  console.log('Connection closed cleanly');
});

ws.on('error', (err) => {
  console.error('❌ ERROR:', err.message);
});
