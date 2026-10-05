async function testDDG() {
  const q = 'site:produto.mercadolivre.com.br/MLB- fritadeira mondial afn 40';
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(q)}`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
    }
  });

  console.log('Status:', res.status);
  const html = await res.text();
  
  // Extract result titles and urls
  const results = [];
  const blocks = html.split('class="result__body"');
  for (let i = 1; i < blocks.length; i++) {
    const b = blocks[i];
    const urlMatch = b.match(/href="([^"]*uddg=([^"&]+)[^"]*)"/i) || b.match(/class="result__url"[^>]*>\s*([^\s<]+)/i);
    const titleMatch = b.match(/class="result__snippet"[^>]*>([\s\S]*?)<\/a>/i) || b.match(/class="result__title"[^>]*>[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/i);

    let rawUrl = urlMatch ? (urlMatch[2] ? decodeURIComponent(urlMatch[2]) : urlMatch[1]) : '';
    if (rawUrl.includes('mercadolivre.com.br/MLB-') || rawUrl.includes('produto.mercadolivre.com.br/MLB')) {
      results.push({
        url: rawUrl.trim(),
        title: titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : ''
      });
    }
  }

  console.log('Found results:', results.length);
  console.log(JSON.stringify(results.slice(0, 3), null, 2));
}

testDDG();
