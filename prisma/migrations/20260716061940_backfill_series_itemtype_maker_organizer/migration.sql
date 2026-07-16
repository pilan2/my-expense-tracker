-- 기존 품목에 이미 쓰인 물품 종류/제작자/공구자/시리즈를 카탈로그에 채워 넣는다.
INSERT INTO "ItemType" ("id", "name")
SELECT gen_random_uuid()::text, t."itemType"
FROM (SELECT DISTINCT "itemType" FROM "Item") t
ON CONFLICT ("name") DO NOTHING;

INSERT INTO "Maker" ("id", "name", "genreId")
SELECT gen_random_uuid()::text, t.maker, g.id
FROM (SELECT DISTINCT genre, maker FROM "Item" WHERE maker IS NOT NULL AND maker <> '') t
JOIN "Genre" g ON g.name = t.genre
ON CONFLICT ("genreId", "name") DO NOTHING;

INSERT INTO "Organizer" ("id", "name", "genreId")
SELECT gen_random_uuid()::text, t.organizer, g.id
FROM (SELECT DISTINCT genre, organizer FROM "Item" WHERE organizer IS NOT NULL AND organizer <> '') t
JOIN "Genre" g ON g.name = t.genre
ON CONFLICT ("genreId", "name") DO NOTHING;

INSERT INTO "Series" ("id", "name", "characterId")
SELECT gen_random_uuid()::text, t.series, c.id
FROM (SELECT DISTINCT genre, character, series FROM "Item" WHERE series IS NOT NULL AND series <> '') t
JOIN "Genre" g ON g.name = t.genre
JOIN "Character" c ON c."genreId" = g.id AND c.name = t.character
ON CONFLICT ("characterId", "name") DO NOTHING;
