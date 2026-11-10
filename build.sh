#!/bin/sh
# Junta src/shell.html + src/js/*.js num único muvi.html (o arquivo publicado no claude.ai)
cd "$(dirname "$0")"
OUT=muvi.html
cat src/shell.html > $OUT
echo '<script>' >> $OUT
for f in core render story places toon brands objs things cine cinethings places3 doc audio ai viralfx roteiro media export uistory uidoc trends novela history viral ui; do echo "/* ---- $f.js ---- */" >> $OUT; cat src/js/$f.js >> $OUT; echo >> $OUT; done
echo '</script>' >> $OUT
echo "Pronto: $OUT ($(wc -c < $OUT) bytes)"
