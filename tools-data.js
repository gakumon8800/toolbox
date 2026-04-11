window.CATEGORY_DEFINITIONS = [
  {
    id: "buying",
    label: "売買",
    description: "不動産売買の資金計画や費用確認に使うツール"
  },
  {
    id: "rental",
    label: "賃貸",
    description: "賃貸実務や管理業務で使いやすいツール"
  },
  {
    id: "hearing",
    label: "ヒアリング",
    description: "接客や聞き取り、確認項目の整理に使うツール"
  },
  {
    id: "docs",
    label: "図面・PDF",
    description: "図面、PDF、画像まわりの実務ツール"
  },
  {
    id: "other",
    label: "その他",
    description: "上記以外の便利ツール"
  }
];

window.TOOLS_DATA = [
  {
    title: "売買諸費用計算ツール",
    path: "./tools/buy-cost-calculator/",
    description: "購入時にかかる諸費用や初期費用の目安を確認できるツール",
    category: "buying",
    tags: ["売買", "諸費用", "資金計画"],
    order: 10
  },
  {
    title: "住宅ローン返済シミュレーター",
    path: "./tools/mortgage-calculator/",
    description: "借入額、金利、返済期間から毎月返済額を確認できるツール",
    category: "buying",
    tags: ["売買", "住宅ローン", "返済"],
    order: 20
  },
  {
    title: "借入可能額シミュレーター",
    path: "./tools/borrowing-capacity-calculator/",
    description: "年収や返済条件から借入可能額の目安を確認できるツール",
    category: "buying",
    tags: ["売買", "住宅ローン", "借入可能額"],
    order: 30
  },
  {
    title: "賃料から見る購入予算シミュレーター",
    path: "./tools/rent-to-budget-calculator/",
    description: "現在の賃料から、無理のない購入予算の目安を確認できるツール",
    category: "buying",
    tags: ["売買", "資金計画", "購入予算"],
    order: 40
  },
  {
    title: "固定資産税・都市計画税 日割り精算計算ツール",
    path: "./tools/property-tax-proration/",
    description: "引渡し時の固定資産税・都市計画税の精算額を、税目別内訳と計算根拠つきで確認できるツール",
    category: "buying",
    tags: ["売買", "税金精算", "日割り計算"],
    order: 50
  },
  {
    title: "賃貸初期費用計算ツール",
    path: "./tools/rental-initial-cost/",
    description: "賃貸契約時にかかる初期費用を項目別に確認できるツール",
    category: "rental",
    tags: ["賃貸", "初期費用", "見積もり"],
    order: 10
  },
  {
    title: "賃料増額リスク診断",
    path: "./tools/rent-increase-check/",
    description: "賃料増額請求のリスクや注意点を整理するためのツール",
    category: "rental",
    tags: ["賃貸", "賃料改定", "診断"],
    order: 20
  },
  {
    title: "原状回復費用の概算ツール",
    path: "./tools/restoration-cost-estimator/",
    description: "退去時の原状回復費用の目安と説明材料を整理できるツール",
    category: "rental",
    tags: ["賃貸", "原状回復", "見積もり"],
    order: 30
  },
  {
    title: "法人契約リスクチェックツール",
    path: "./tools/corporate-lease-risk-check/",
    description: "法人契約時の確認項目や注意点を整理できるチェックツール",
    category: "rental",
    tags: ["賃貸", "法人契約", "チェック"],
    order: 40
  },
  {
    title: "売主ヒアリングシート",
    path: "./tools/seller-hearing-sheet/",
    description: "売却相談時に必要な確認項目を整理しやすいヒアリングツール",
    category: "hearing",
    tags: ["売買", "ヒアリング", "売主"],
    order: 10
  },
  {
    title: "賃貸ヒアリングフォーム",
    path: "./tools/rental-hearing-form/",
    description: "賃貸のお客様向けヒアリング項目を整理しやすいフォーム",
    category: "hearing",
    tags: ["賃貸", "ヒアリング", "接客"],
    status: "coming_soon",
    order: 20
  },
  {
    title: "PDF画像変換",
    path: "./tools/pdf-to-image/",
    description: "PDFのページを画像化して保存できるツール",
    category: "docs",
    tags: ["PDF", "画像", "変換"],
    order: 10
  },
  {
    title: "PDF画像付き書き出し",
    path: "./tools/pdf-overlay-export/",
    description: "PDFに画像や注記を重ねて書き出しできるツール",
    category: "docs",
    tags: ["PDF", "書き出し", "注記"],
    order: 20
  },
  {
    title: "間取り画像クリーナー",
    path: "./tools/floorplan-cleaner/",
    description: "間取り画像を見やすく整えるための画像補正ツール",
    category: "docs",
    tags: ["図面", "画像", "補正"],
    order: 30
  },
  {
    title: "内見ガチャ",
    path: "./tools/naiken-gacha/",
    description: "SNSや企画用に使いやすい、内見ネタ向けのガチャツール",
    category: "other",
    tags: ["その他", "企画", "SNS"],
    order: 10
  },
  {
    title: "印鑑ジェネレーター",
    path: "./tools/seal-generator/",
    description: "簡易的な印影画像を生成できるツール",
    category: "other",
    tags: ["その他", "画像", "印鑑"],
    order: 20
  }
];
