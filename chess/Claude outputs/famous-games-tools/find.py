import sys, re, glob
SRC = '/tmp/claude-0/-home-claude/e5547a63-b37c-5dfe-a9ad-ff053755f07a/scratchpad/dl/games/cd/PgnMentor/'
def games(fname):
    txt = open(SRC + fname, encoding='latin-1').read()
    for chunk in re.split(r'\n(?=\[Event )', txt):
        h = dict(re.findall(r'\[(\w+) "([^"]*)"\]', chunk))
        body = re.sub(r'\[[^\]]*\]\s*', '', chunk)
        body = re.sub(r'\{[^}]*\}', '', body)
        yield h, ' '.join(body.split())
def find(fname, white, black, year):
    out = []
    for h, b in games(fname):
        if white.lower() in h.get('White','').lower() and black.lower() in h.get('Black','').lower() and h.get('Date','').startswith(year):
            out.append((h, b))
    return out
if __name__ == '__main__':
    f, w, bl, y = sys.argv[1:5]
    for h, b in find(f, w, bl, y):
        print(h.get('White'), '-', h.get('Black'), h.get('Event'), h.get('Site'), h.get('Date'), h.get('Round'), h.get('Result'))
        print('   ', b[:120], '...', b[-90:])
