d=''
src=open('cine.html').read()
a=src.index('// ---------- helpers'); b=src.index('// ---------- scenes')
helpers=src[a:b]
tail=open('show_tail.js').read()
pre="<script>\nwindow.CINE = (() => {\nconst W = 1080, H = 1920; const RED = '#e0252b';\nconst clamp = (v, a, b) => Math.max(a, Math.min(b, v));\nconst lerp = (a, b, k) => a + (b - a) * k;\nconst sm = (a, b, x) => { const k = clamp((x - a) / (b - a), 0, 1); return k * k * (3 - 2 * k); };\n"+helpers+tail+"</script>\n"
open('show.html','w').write(open('app.html').read()+pre)
