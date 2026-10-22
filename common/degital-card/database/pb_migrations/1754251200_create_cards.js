/// <reference path="../pb_data/types.d.ts" />

// デジタルめいし: cards コレクション
// - id をそのまま "URLで変えられるオリジナルID" (スラッグ) として使う。
//   別途 slug フィールドを持たないことで二重管理を避ける (DRY)。
// - 認証なし・完全オープン。id (=URL) さえ分かれば誰でも閲覧・作成・編集・削除できる。
// - 一覧 (list) だけは無効化し、全件スキャン/収集はできないようにする。
migrate((app) => {
  const collection = new Collection({
    name: "cards",
    type: "base",
    fields: [
      {
        name: "id",
        type: "text",
        primaryKey: true,
        required: true,
        min: 2,
        max: 40,
        pattern: "^[a-z0-9]([a-z0-9-]{0,38}[a-z0-9])?$",
        autogeneratePattern: "[a-z0-9]{10}",
      },
      {
        name: "name",
        type: "text",
        required: true,
        max: 100,
      },
      {
        name: "title",
        type: "text",
        required: false,
        max: 150,
      },
      {
        name: "email",
        type: "email",
        required: false,
      },
      {
        name: "phone",
        type: "text",
        required: false,
        max: 30,
      },
      {
        name: "line",
        type: "text",
        required: false,
        max: 200,
      },
      {
        name: "facebook",
        type: "text",
        required: false,
        max: 200,
      },
      {
        name: "twitter",
        type: "text",
        required: false,
        max: 200,
      },
      {
        name: "instagram",
        type: "text",
        required: false,
        max: 200,
      },
      {
        name: "created",
        type: "autodate",
        onCreate: true,
        onUpdate: false,
      },
      {
        name: "updated",
        type: "autodate",
        onCreate: true,
        onUpdate: true,
      },
    ],
    listRule: null,
    viewRule: "",
    createRule: "",
    updateRule: "",
    deleteRule: "",
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("cards");
  return app.delete(collection);
});
