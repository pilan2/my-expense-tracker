-- 기존 품목에 이미 쓰인 장르/캐릭터를 카탈로그에 채워 넣어, 새 버튼 선택 UI가
-- 처음부터 비어있지 않도록 한다.
INSERT INTO "Genre" ("id", "name")
SELECT gen_random_uuid()::text, t.genre
FROM (SELECT DISTINCT genre FROM "Item") t
ON CONFLICT ("name") DO NOTHING;

INSERT INTO "Character" ("id", "name", "genreId")
SELECT gen_random_uuid()::text, t.character, g.id
FROM (SELECT DISTINCT genre, character FROM "Item") t
JOIN "Genre" g ON g.name = t.genre
ON CONFLICT ("genreId", "name") DO NOTHING;
