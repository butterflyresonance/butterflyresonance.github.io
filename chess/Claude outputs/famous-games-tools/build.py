import json, re
from find import find
G = [
 # id, file, white, black, date-prefix, round, title, key, tags, why
 ('opera', 'Morphy.pgn', 'Morphy', 'Duke', '1858', None, 'The Opera Game', '16.Qb8+', ['development', 'attack', 'sacrifice'],
  'Played in a box at the Paris opera. Every move develops or attacks; the opponents waste time, and Morphy finishes with a queen sacrifice and a textbook mate.'),
 ('immortal', 'Anderssen.pgn', 'Anderssen', 'Kieseritzky', '1851', None, 'The Immortal Game', '18.Bd6', ['attack', 'sacrifice', 'history'],
  'Anderssen gives up a bishop, both rooks and his queen, and mates with his three remaining minor pieces. The romantic era at its most extravagant.'),
 ('evergreen', 'Anderssen.pgn', 'Anderssen', 'Dufresne', '1852', None, 'The Evergreen Game', '21.Qxd7+', ['attack', 'sacrifice'],
  'A quiet rook move lets Black take a knight and threaten mate. Anderssen has seen further: a rook sacrifice, a queen sacrifice, and mate by the bishops.'),
 ('paulsen-morphy', 'Morphy.pgn', 'Paulsen', 'Morphy', '1857', '6', 'Morphy’s queen sacrifice', '17...Qxf3', ['attack', 'sacrifice'],
  'Morphy gives up his queen for a knight to tear open White’s king, then finishes the job with bishops and rooks.'),
 ('steinitz-bardeleben', 'Steinitz.pgn', 'Steinitz', 'Bardeleben', '1895', None, 'Steinitz’s rook dance', '22.Rxe7+', ['attack', 'king hunt'],
  'A rook checks endlessly on the seventh rank and cannot be taken. Von Bardeleben left the hall rather than resign; Steinitz showed the mate afterwards.'),
 ('zukertort-blackburne', 'Zukertort.pgn', 'Zukertort', 'Blackburne', '1883', '', 'Zukertort’s queen sacrifice', '28.Qb4', ['attack', 'sacrifice'],
  'Zukertort puts his queen where it can be taken, and taking it loses. A combination that runs all the way to the end of the game.'),
 ('lasker-bauer', 'Lasker.pgn', 'Lasker', 'Bauer, Johann', '1889', None, 'The double bishop sacrifice', '15.Bxh7+', ['attack', 'sacrifice', 'pattern'],
  'The first famous double bishop sacrifice: both bishops are given up to strip away the pawns in front of the castled king. Still taught as a pattern.'),
 ('rubinstein-lasker', 'Rubinstein.pgn', 'Rubinstein', 'Lasker', '1909', None, 'Rubinstein beats Lasker', None, ['positional', 'endgame'],
  'Small advantages turned into a won endgame against the world champion: active pieces, then a slow, exact squeeze.'),
 ('reti-tartakower', 'Reti.pgn', 'Reti', 'Tartakower', '1910', None, 'Réti’s miniature', '9.Qd8+', ['attack', 'sacrifice', 'development'],
  'Black grabs material and keeps the king in the centre. Réti sacrifices his queen and mates in two with bishop and rook. Eleven moves.'),
 ('rotlewi-rubinstein', 'Rubinstein.pgn', 'Rotlewi', 'Rubinstein', '1907', '', 'Rubinstein’s Immortal', '22...Rxc3', ['attack', 'sacrifice'],
  'Black’s pieces are all aimed at the king; a chain of sacrifices (rook, queen) leaves White without a defence against mate.'),
 ('levitsky-marshall', 'Marshall.pgn', 'Levitsky', 'Marshall', '1912', None, 'The “gold coins” game', '23...Qg3', ['attack', 'sacrifice'],
  'Marshall puts his queen where three White pieces can take it, and every capture loses. Spectators are said to have showered the board with gold coins.'),
 ('lasker-capablanca-1914', 'Lasker.pgn', 'Lasker', 'Capablanca', '1914', None, 'Lasker’s f5', '12.f5', ['positional', 'pawn structure'],
  'A pawn push that gives Black a fine square on e5 but cramps his bishop and locks it out of the game. Positional judgement over rules of thumb.'),
 ('capablanca-marshall', 'Capablanca.pgn', 'Capablanca', 'Marshall', '1918', None, 'The first Marshall Attack', '8...d5', ['defence', 'opening'],
  'Marshall springs a pawn sacrifice he is said to have kept for years. Capablanca takes it, defends calmly against a ferocious attack, and wins.'),
 ('saemisch-nimzowitsch', 'Nimzowitsch.pgn', 'Saemisch', 'Nimzowitsch', '1923', '', 'The Immortal Zugzwang Game', '25...h6', ['zugzwang', 'positional'],
  'Black ends with a quiet pawn move: White still has pieces, but every possible move loses something. Winning by leaving your opponent without a good move.'),
 ('capablanca-tartakower', 'Capablanca.pgn', 'Capablanca', 'Tartakower', '1924', None, 'Capablanca’s rook endgame', None, ['endgame'],
  'An active king and rook beat a material advantage: Capablanca gives up pawns to march his king up the board. A model rook endgame.'),
 ('torre-lasker', 'TorreRepetto.pgn', 'Torre', 'Lasker', '1925', None, 'The windmill', '25.Bf6', ['tactics', 'pattern', 'sacrifice'],
  'A rook and bishop discovered check repeat over and over, collecting Black’s pieces one by one. The classic windmill.'),
 ('alekhine-nimzowitsch', 'Alekhine.pgn', 'Alekhine', 'Nimzowitsch', '1930', None, 'Alekhine’s gun', '26.Qc1', ['positional', 'domination'],
  'Two rooks and the queen lined up on one open file. Black is never attacked directly; he simply runs out of moves that don’t lose.'),
 ('euwe-alekhine', 'Euwe.pgn', 'Euwe', 'Alekhine', '1935', '26', 'The Pearl of Zandvoort', '30.Rg1', ['attack', 'exchange sacrifice', 'world championship'],
  'Euwe’s centre pawns roll forward, and he gives up a rook to keep them rolling. A highlight of the match that made him world champion.'),
 ('botvinnik-capablanca', 'Botvinnik.pgn', 'Botvinnik', 'Capablanca', '1938', None, 'Botvinnik’s combination', '30.Ba3', ['tactics', 'passed pawn'],
  'Everything turns on a passed pawn: a bishop sacrifice, then a knight sacrifice, clear its way, and Black’s king is chased into the open.'),
 ('byrne-fischer', 'Fischer.pgn', 'Byrne', 'Fischer', '1956', None, 'The Game of the Century', '17...Be6', ['sacrifice', 'tactics'],
  'Thirteen-year-old Fischer gives up his queen, takes back a pile of material, and his pieces chase White’s king until it is mated.'),
 ('botvinnik-tal-1960', 'Tal.pgn', 'Botvinnik', 'Tal', '1960', '6', 'Tal’s knight sacrifice', '21...Nf4', ['sacrifice', 'attack', 'world championship'],
  'The game that set the tone for Tal taking the world title: a knight sacrifice that analysts argued about for years. Watch the eval bar against Tal.'),
 ('spassky-bronstein', 'Spassky.pgn', 'Spassky', 'Bronstein', '1960', None, 'Spassky’s King’s Gambit', '15.Nd6', ['attack', 'sacrifice', 'opening'],
  'Spassky lets Black make a new queen, with check, because his own pieces are already deep in Black’s camp. The final position appears in the James Bond film From Russia with Love.'),
 ('tal-hecht', 'Tal.pgn', 'Tal', 'Hecht', '1962', None, 'Tal leaves a bishop hanging', '19.exf6', ['attack', 'sacrifice'],
  'Black attacks Tal’s bishop; Tal ignores it and opens lines towards the king instead, and the initiative carries him into a won endgame.'),
 ('tal-larsen', 'Tal.pgn', 'Tal', 'Larsen', '1965', '10', 'Tal’s Nd5', '16.Nd5', ['sacrifice', 'attack'],
  'A knight sacrifice in the centre that engines still don’t fully agree with. Larsen defends well and still loses: Tal’s practical chances at work.'),
 ('petrosian-spassky-1966', 'Petrosian.pgn', 'Petrosian', 'Spassky', '1966', '10', 'Petrosian’s exchange sacrifice', '30.Qh8+', ['positional', 'exchange sacrifice', 'world championship'],
  'Petrosian, the great defender, gives up material to take control of the squares, then ends with a queen sacrifice.'),
 ('botvinnik-portisch', 'Botvinnik.pgn', 'Botvinnik', 'Portisch', '1968', None, 'Botvinnik’s double rook sacrifice', '16.Rxc7', ['attack', 'sacrifice'],
  'Botvinnik gives up both rooks to break open the king. A combination calculated through to the end.'),
 ('fischer-spassky-1972', 'Fischer.pgn', 'Fischer', 'Spassky', '1972', '6', 'Fischer’s 1.c4', None, ['positional', 'world championship'],
  'Fischer, who almost always opened 1.e4, plays a Queen’s Gambit and outplays Spassky in his own territory. Spassky applauded at the end.'),
 ('karpov-unzicker', 'Karpov.pgn', 'Karpov', 'Unzicker', '1974', None, 'Karpov’s squeeze', None, ['positional', 'space'],
  'Karpov gains space, takes away every useful square and slowly suffocates Black. A model of the strategic squeeze.'),
 ('karpov-kasparov-1985', 'Karpov.pgn', 'Karpov', 'Kasparov', '1985', '16', 'The octopus knight', '16...Nd3', ['positional', 'outpost', 'world championship'],
  'A Black knight lands on d3, deep in White’s camp, and paralyses everything. Kasparov’s most famous win on the way to the world title.'),
 ('deep-blue-kasparov', 'Kasparov.pgn', 'Deep Blue', 'Kasparov', '1997', '6', 'Deep Blue beats Kasparov', '8.Nxe6', ['history', 'man vs machine'],
  'The deciding game of the 1997 match: Kasparov allows a known knight sacrifice and is lost in 19 moves. The first time a computer beat a world champion in a match.'),
 ('kasparov-topalov', 'Kasparov.pgn', 'Kasparov', 'Topalov', '1999.01', None, 'Kasparov’s Immortal', '24.Rxd4', ['sacrifice', 'king hunt', 'attack'],
  'A rook sacrifice starts a king hunt that runs the whole length of the board. Often called the finest attacking game of the modern era.'),
 ('polgar-kasparov-2002', 'PolgarJ.pgn', 'Polgar', 'Kasparov', '2002.09', None, 'Judit Polgar beats Kasparov', None, ['endgame', 'history'],
  'Judit Polgar’s first win over Kasparov, from a quiet Berlin endgame: patient pressure until the extra activity tells.'),
 ('carlsen-karjakin-2016', 'Carlsen.pgn', 'Carlsen', 'Karjakin', '2016.11.30', '4', 'Carlsen’s Qh6+', '50.Qh6+', ['tactics', 'world championship'],
  'The last move of the 2016 world championship: a queen sacrifice that forces mate, to win the rapid tiebreak.'),
]
out, problems = [], []
for (gid, f, w, b, y, rnd, title, key, tags, why) in G:
    found = find(f, w, b, y)
    if rnd: found = [x for x in found if x[0].get('Round', '').split('.')[0] == rnd] or found
    # the canonical game: prefer the one whose key move appears; else the first
    def has_key(mv):
        if not key: return True
        n, dots, s = re.match(r'(\d+)(\.\.\.|\.)(.+)', key).groups()
        pat = rf'(^|\s){n}\. \S+ {re.escape(s)}(\s|$)' if dots == '...' else rf'(^|\s){n}\. {re.escape(s)}(\s|$)'
        return re.search(pat, mv) is not None
    cand = [x for x in found if has_key(x[1])]
    if not cand: problems.append((gid, 'no game with key ' + str(key), len(found))); continue
    h, mv = cand[0]
    sans = [t for t in mv.split() if not re.match(r'^\d+\.+$', t) and not re.match(r'^(1-0|0-1|1/2-1/2|\*)$', t)]
    sans = [re.sub(r'^\d+\.+', '', t) for t in sans]
    sans = [t for t in sans if t and not t.startswith('$')]
    out.append({'id': gid, 'title': title, 'white': h.get('White'), 'black': h.get('Black'), 'event': h.get('Event'), 'site': h.get('Site'),
                'date': h.get('Date'), 'round': h.get('Round'), 'result': h.get('Result'), 'key': key, 'tags': tags, 'why': why, 'moves': sans})
json.dump(out, open('raw.json', 'w'), ensure_ascii=False, indent=1)
print(len(out), 'games;', 'problems:', problems)
