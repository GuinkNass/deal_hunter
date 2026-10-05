const fs = require('fs');

async function test() {
  const query = 'fritadeira mondial air fryer';
  const url = `https://lista.mercadolivre.com.br/${encodeURIComponent(query.replace(/\s+/g, '-'))}`;
  
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'pt-BR,pt;q=0.9'
    }
  });

  const html = await res.text();
  fs.writeFileSync('server/sample_ml.html', html);
  console.log('Saved HTML to server/sample_ml.html, length:', html.length);

  // Search for any MLB links
  const mlbMatches = html.match(/https:\/\/[^"'\s<>]*MLB[^"'\s<>]*/g) || [];
  console.log('Found MLB links in HTML:', mlbMatches.length);
  const uniqueMlbs = [...new Set(mlbMatches)];
  console.log('Unique MLB links:', uniqueMlbs.slice(0, 5));
}

test();
