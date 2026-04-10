# AI Toolbox

不動産・賃貸実務で使えるシンプルな Web ツール集です。  
GitHub Pages でそのまま公開できる、HTML / CSS / JavaScript のみの構成です。

公開ページ:
[https://gakumon8800.github.io/toolbox/](https://gakumon8800.github.io/toolbox/)

## 構成

- `index.html`: トップページ
- `styles.css`: トップページ用スタイル
- `script.js`: トップページの描画処理
- `tools-data.js`: トップページ掲載ツールの定義
- `tools/`: 各ツール本体

## トップページ掲載ツールの追加方法

1. `tools/` 配下に新しいツールフォルダを作成する
2. `tools-data.js` にツール情報を1件追加する
3. `category` と `order` を設定する
4. GitHub に push するとトップページへ反映される

`tools-data.js` の主な項目:

- `title`
- `path`
- `description`
- `category`
- `tags`
- `status`
- `order`

`category` は以下の固定値を使います。

- `buying`
- `rental`
- `hearing`
- `docs`
- `other`

`status: "coming_soon"` を付けると、トップページでは「準備中」として非リンク表示になります。
