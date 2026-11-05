const { chromium } = require('playwright'); const { spawn } = require('child_process');
(async () => {
  const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  pg.on('pageerror', e => console.log('ERR', e.message));
  await pg.goto('file://' + __dirname + '/' + (process.argv[2] || 'cine.html')); await pg.waitForFunction('window.__ready');
  const T = await pg.evaluate('window.__INFO.TOTAL'), FPS = 30, N = Math.ceil(T * FPS);
  const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', '30', '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-pix_fmt', 'yuv420p', process.argv[3] || 'video.mp4']);
  for (let i = 0; i < N; i++) {
    const d = await pg.evaluate(t => { frame(t); return document.getElementById('cv').toDataURL('image/jpeg', .93); }, i / FPS);
    if (!ff.stdin.write(Buffer.from(d.split(',')[1], 'base64'))) await new Promise(r => ff.stdin.once('drain', r));
  }
  ff.stdin.end(); await new Promise(r => ff.on('close', r)); await b.close(); console.log('frames', N, 'T', T);
})();
