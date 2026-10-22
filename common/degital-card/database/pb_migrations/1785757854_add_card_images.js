/// <reference path="../pb_data/types.d.ts" />

// cards コレクションに名刺の表面・裏面の画像URLを追加する。
// 画像そのものは PocketBase には保存せず、既存の /root/common/file-shareing
// (Gokapi) にアップロードした結果のURLだけを保持する。
migrate((app) => {
  const collection = app.findCollectionByNameOrId("cards");
  const pos = collection.fields.indexOf(collection.fields.getByName("created"));

  collection.fields.addAt(
    pos,
    new Field({
      name: "imageUrlFront",
      type: "url",
      required: false,
    }),
    new Field({
      name: "imageUrlBack",
      type: "url",
      required: false,
    })
  );

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("cards");
  collection.fields.removeByName("imageUrlFront");
  collection.fields.removeByName("imageUrlBack");
  return app.save(collection);
});
