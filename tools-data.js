window.CATEGORY_DEFINITIONS = [
  {
    id: "buying",
    label: "売買",
    description: "不動産売買の資金計画や収支確認に使えるツールです。"
  },
  {
    id: "rental",
    label: "賃貸",
    description: "賃貸仲介や管理の実務で使いやすいツールです。"
  },
  {
    id: "hearing",
    label: "ヒアリング",
    description: "接客や確認業務の抜け漏れ防止に役立つツールです。"
  },
  {
    id: "docs",
    label: "書面・PDF",
    description: "書面やPDFの確認、加工、整理に使えるツールです。"
  },
  {
    id: "other",
    label: "その他",
    description: "営業や日常業務を支える補助ツールです。"
  }
];

window.TOOLS_DATA = [
  {
    title: "売買諸費用計算ツール",
    path: "./tools/buy-cost-calculator/",
    description: "購入時にかかる諸費用の目安を項目別に確認できます。",
    category: "buying",
    tags: ["売買", "諸費用", "資金計画"],
    order: 10
  },
  {
    title: "住宅ローン返済シミュレーター",
    path: "./tools/mortgage-calculator/",
    description: "金利や返済期間から毎月返済額の目安を確認できます。",
    category: "buying",
    tags: ["売買", "住宅ローン", "返済"],
    order: 20
  },
  {
    title: "借入可能額シミュレーター",
    path: "./tools/borrowing-capacity-calculator/",
    description: "年収や返済比率から借入可能額の目安を確認できます。",
    category: "buying",
    tags: ["売買", "住宅ローン", "借入可能額"],
    order: 30
  },
  {
    title: "家賃から見る購入予算シミュレーター",
    path: "./tools/rent-to-budget-calculator/",
    description: "現在の家賃から無理のない購入予算の目安を確認できます。",
    category: "buying",
    tags: ["売買", "資金計画", "購入予算"],
    order: 40
  },
  {
    title: "固定資産税・都市計画税日割り精算計算ツール",
    path: "./tools/property-tax-proration/",
    description: "固定資産税と都市計画税の日割り精算額を、引渡日ベースで確認できます。",
    category: "buying",
    tags: ["売買", "税金", "日割り精算"],
    order: 50
  },
  {
    title: "賃貸初期費用計算ツール",
    path: "./tools/rental-initial-cost/",
    description: "賃貸契約時にかかる初期費用を項目別に確認できます。",
    category: "rental",
    tags: ["賃貸", "初期費用", "見積もり"],
    order: 10
  },
  {
    title: "賃料増額リスク診断",
    path: "./tools/rent-increase-check/",
    description: "賃料増額請求のリスクや確認事項を整理できるツールです。",
    category: "rental",
    tags: ["賃貸", "賃料改定", "診断"],
    order: 20
  },
  {
    title: "原状回復費用の概算ツール",
    path: "./tools/restoration-cost-estimator/",
    description: "退去時の原状回復費用の目安を確認しやすいツールです。",
    category: "rental",
    tags: ["賃貸", "原状回復", "費用"],
    order: 30
  },
  {
    title: "法人契約リスクチェックツール",
    path: "./tools/corporate-lease-risk-check/",
    description: "法人契約時の確認項目や見落としやすい論点を整理できます。",
    category: "rental",
    tags: ["賃貸", "法人契約", "チェック"],
    order: 40
  },
  {
    title: "売主ヒアリングシート",
    path: "./tools/seller-hearing-sheet/",
    description: "売却相談時に確認したい事項を整理しやすいヒアリングシートです。",
    category: "hearing",
    tags: ["売買", "ヒアリング", "売主"],
    order: 10
  },
  {
    title: "賃貸ヒアリングフォーム",
    path: "./tools/rental-hearing-form/",
    description: "賃貸のお部屋探しで必要な条件整理に使えるフォームです。",
    category: "hearing",
    tags: ["賃貸", "ヒアリング", "接客"],
    status: "coming_soon",
    order: 20
  },
  {
    title: "PDF画像化ツール",
    path: "./tools/pdf-to-image/",
    description: "PDFのページを画像として書き出せるツールです。",
    category: "docs",
    tags: ["PDF", "画像化", "書類"],
    order: 10
  },
  {
    title: "PDF重ね書き出しツール",
    path: "./tools/pdf-overlay-export/",
    description: "PDFに画像や注記を重ねて書き出せるツールです。",
    category: "docs",
    tags: ["PDF", "書き出し", "注記"],
    order: 20
  },
  {
    title: "間取り画像クリーナー",
    path: "./tools/floorplan-cleaner/",
    description: "間取り画像を見やすく整えるための補助ツールです。",
    category: "docs",
    tags: ["書面", "画像", "整形"],
    order: 30
  },
  {
    title: "内見ガチャ",
    path: "./tools/naiken-gacha/",
    description: "SNSや企画用に使いやすい、内見ネタ向けのガチャツールです。",
    category: "other",
    tags: ["その他", "企画", "SNS"],
    order: 10
  },
  {
    title: "印鑑ジェネレーター",
    path: "./tools/seal-generator/",
    description: "簡易な印影イメージを作成できるツールです。",
    category: "other",
    tags: ["その他", "画像", "印鑑"],
    order: 20
  }
];
