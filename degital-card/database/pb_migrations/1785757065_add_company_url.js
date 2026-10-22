/// <reference path="../pb_data/types.d.ts" />

// cards コレクションに「企業URL」を追加。LINEフィールドの直前に挿入する。
migrate((app) => {
  const collection = app.findCollectionByNameOrId("cards");
  const linePos = collection.fields.indexOf(collection.fields.getByName("line"));

  collection.fields.addAt(
    linePos,
    new Field({
      name: "companyUrl",
      type: "url",
      required: false,
    })
  );

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("cards");
  collection.fields.removeByName("companyUrl");
  return app.save(collection);
});
