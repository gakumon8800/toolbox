window.CATEGORY_DEFINITIONS = [
  {
    id: "buying",
    label: "売買",
    description: "購入資金計画や比較検討で使うツール"
  },
  {
    id: "rental",
    label: "賃貸",
    description: "賃貸契約や管理実務で使うツール"
  },
  {
    id: "hearing",
    label: "接客・ヒアリング",
    description: "初回面談や条件整理を進めるツール"
  },
  {
    id: "docs",
    label: "書類・PDF",
    description: "PDF加工や資料づくりに使うツール"
  },
  {
    id: "other",
    label: "その他",
    description: "実験的な機能や補助ツール"
  }
];

window.TOOLS_DATA = [
  {
    title: "購入諸費用計算ツール",
    path: "./tools/buy-cost-calculator/",
    description: "物件購入時の諸費用を概算できるツール",
    category: "buying",
    tags: ["売買", "諸費用", "試算"],
    order: 10
  },
  {
    title: "住宅ローン返済シミュレーター",
    path: "./tools/mortgage-calculator/",
    description: "借入額・金利・期間から毎月返済額を試算",
    category: "buying",
    tags: ["売買", "ローン", "返済"],
    order: 20
  },
  {
    title: "借入可能額シミュレーター",
    path: "./tools/borrowing-capacity-calculator/",
    description: "年収や返済条件から借入可能額の目安を試算",
    category: "buying",
    tags: ["売買", "ローン", "借入可能額"],
    order: 30
  },
  {
    title: "家賃から購入予算逆算ツール",
    path: "./tools/rent-to-budget-calculator/",
    description: "今の家賃感覚から購入予算の目安を逆算",
    category: "buying",
    tags: ["売買", "住み替え", "比較"],
    order: 40
  },
  {
    title: "賃貸初期費用計算ツール",
    path: "./tools/rental-initial-cost/",
    description: "敷金・礼金・仲介手数料など賃貸契約時の初期費用を概算",
    category: "rental",
    tags: ["賃貸", "初期費用", "見積り"],
    order: 10
  },
  {
    title: "家賃値上げリスク診断",
    path: "./tools/rent-increase-check/",
    description: "現在賃料と提案条件から値上げリスクを整理するツール",
    category: "rental",
    tags: ["賃貸", "管理", "更新"],
    order: 20
  },
  {
    title: "原状回復費用の概算ツール",
    path: "./tools/restoration-cost-estimator/",
    description: "退去前に原状回復費用の目安と確認ポイントを整理",
    category: "rental",
    tags: ["賃貸", "退去", "原状回復"],
    order: 30
  },
  {
    title: "法人賃貸借契約リスク判定ツール",
    path: "./tools/corporate-lease-risk-check/",
    description: "法人契約を受け付ける際のリスクを社内判断向けに整理",
    category: "rental",
    tags: ["賃貸", "法人契約", "チェック"],
    order: 40
  },
  {
    title: "売主ヒアリングシート",
    path: "./tools/seller-hearing-sheet/",
    description: "売却相談時の聞き取り項目を整理できるフォーム",
    category: "hearing",
    tags: ["売買", "接客", "ヒアリング"],
    order: 10
  },
  {
    title: "賃貸ヒアリングフォーム",
    path: "./tools/rental-hearing-form/",
    description: "お部屋探しのお客様向けヒアリングフォーム",
    category: "hearing",
    tags: ["賃貸", "接客", "ヒアリング"],
    status: "coming_soon",
    order: 20
  },
  {
    title: "PDF→画像変換",
    path: "./tools/pdf-to-image/",
    description: "PDFを画像化して扱いやすくするツール",
    category: "docs",
    tags: ["PDF", "変換", "画像"],
    order: 10
  },
  {
    title: "PDF画像重ね合わせ",
    path: "./tools/pdf-overlay-export/",
    description: "PDF上に画像を重ねて出力できるツール",
    category: "docs",
    tags: ["PDF", "マイソク", "加工"],
    order: 20
  },
  {
    title: "間取り図クリーナー",
    path: "./tools/floorplan-cleaner/",
    description: "古い図面画像を見ながら見やすい間取り図に清書するツール",
    category: "docs",
    tags: ["図面", "画像", "清書"],
    order: 30
  },
  {
    title: "内見ガチャ",
    path: "./tools/naiken-gacha/",
    description: "内見・発信向けのアイデア出しツール",
    category: "other",
    tags: ["実験", "アイデア"],
    order: 10
  },
  {
    title: "印鑑生成ツール",
    path: "./tools/seal-generator/",
    description: "印鑑風の画像を生成するツール",
    category: "other",
    tags: ["実験", "画像"],
    order: 20
  }
];
