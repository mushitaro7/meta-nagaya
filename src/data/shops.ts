/**
 * メタNAGA屋 - 店舗・商品サンプルデータ
 * 長屋オーナーが出店できる形式（固定ショップ + 将来の動的追加対応）
 */

export interface Owner {
  name: string
  avatar: string      // 絵文字アバター
  bio: string
  since: string
  location?: string
  sns?: {
    twitter?: string
    instagram?: string
    website?: string
  }
}

export interface Product {
  id: string
  name: string
  description: string
  price: number       // 円
  imageEmoji: string  // 商品イメージ（絵文字で代替）
  imageColor: string  // 背景カラー
  category: string
  stock: number       // 在庫数（0で売切れ）
  isAvailable: boolean
  unit?: string       // '個', 'kg', 'セット' etc.
  tags?: string[]
}

export interface Shop {
  id: string
  buildingIndex: number  // 0-9（円状10棟）
  areaId: string         // 'A' | 'B' | 'C' | 'D' | 'E'
  areaLabel: string
  areaEmoji: string
  name: string
  tagline: string
  areaColor: string
  owner: Owner
  products: Product[]
  isOpen: boolean
  rating?: number        // 1-5
  reviewCount?: number
}

export const SHOPS: Shop[] = [
  /* ========== エリアA: 一次産業（棟0） ========== */
  {
    id: 'shop-A1',
    buildingIndex: 0,
    areaId: 'A',
    areaLabel: '一次産業',
    areaEmoji: '🌾',
    name: '田中農園 直売所',
    tagline: '朝採り野菜を産地直送でお届け',
    areaColor: '#4A9960',
    isOpen: true,
    rating: 4.8,
    reviewCount: 124,
    owner: {
      name: '田中 一郎',
      avatar: '👨‍🌾',
      bio: '三代続く農家の長男。農薬を極力使わない野菜作りにこだわっています。土を愛し、食卓を豊かにする野菜をお届けします。',
      since: '2024年4月',
      location: '長野県',
      sns: { instagram: '@tanaka_farm', website: 'tanakafarm.jp' },
    },
    products: [
      {
        id: 'A1-P1',
        name: '朝採りトマト詰め合わせ',
        description: '甘みたっぷりのミニトマト＋大玉トマトセット。毎朝収穫したてをお届け！',
        price: 980,
        imageEmoji: '🍅',
        imageColor: '#FF6B6B',
        category: '野菜',
        stock: 15,
        isAvailable: true,
        unit: 'セット',
        tags: ['朝採り', '無農薬', '長野産'],
      },
      {
        id: 'A1-P2',
        name: '旬の野菜おまかせBOX',
        description: 'その週の旬野菜を厳選して詰め合わせ。どんな野菜が届くかはお楽しみ！',
        price: 1800,
        imageEmoji: '🥬',
        imageColor: '#52C41A',
        category: '野菜',
        stock: 8,
        isAvailable: true,
        unit: 'BOX',
        tags: ['季節の野菜', 'おまかせ', '農家直送'],
      },
      {
        id: 'A1-P3',
        name: '新米コシヒカリ 2kg',
        description: '契約農家から直接仕入れた令和7年産コシヒカリ。粒が大きく甘い！',
        price: 2200,
        imageEmoji: '🌾',
        imageColor: '#FAD961',
        category: '穀物',
        stock: 0,
        isAvailable: false,
        unit: '袋',
        tags: ['新米', 'コシヒカリ', '2kg'],
      },
    ],
  },

  /* ========== エリアA: 一次産業（棟5） ========== */
  {
    id: 'shop-A2',
    buildingIndex: 5,
    areaId: 'A',
    areaLabel: '一次産業',
    areaEmoji: '🌾',
    name: '海の恵み 山本水産',
    tagline: '漁師直送の鮮魚・干物をお届け',
    areaColor: '#4A9960',
    isOpen: true,
    rating: 4.6,
    reviewCount: 89,
    owner: {
      name: '山本 漁子',
      avatar: '👩‍🍳',
      bio: '漁師の妻として30年。夫が獲った魚を美味しく届けたくて出店しました。毎朝5時から仕込みしています。',
      since: '2024年7月',
      location: '石川県',
      sns: { twitter: '@yamamoto_suisan' },
    },
    products: [
      {
        id: 'A2-P1',
        name: '能登の干物セット',
        description: 'アジ・サバ・カレイの干物詰め合わせ。天日干しで旨みが凝縮！',
        price: 2400,
        imageEmoji: '🐟',
        imageColor: '#74B9FF',
        category: '魚介',
        stock: 20,
        isAvailable: true,
        unit: 'セット',
        tags: ['干物', '能登', '天日干し'],
      },
      {
        id: 'A2-P2',
        name: '真鯛の一夜干し',
        description: '漁師が厳選した天然真鯛を一晩干した逸品。塩加減が絶妙。',
        price: 1600,
        imageEmoji: '🐠',
        imageColor: '#FD79A8',
        category: '魚介',
        stock: 5,
        isAvailable: true,
        unit: '枚',
        tags: ['天然', '真鯛', '一夜干し'],
      },
    ],
  },

  /* ========== エリアB: 二次産業（棟1） ========== */
  {
    id: 'shop-B1',
    buildingIndex: 1,
    areaId: 'B',
    areaLabel: '二次産業',
    areaEmoji: '⚙️',
    name: 'てしごと工房 鈴木',
    tagline: '一点ものの手作りクラフトと民芸品',
    areaColor: '#3B7DB5',
    isOpen: true,
    rating: 4.9,
    reviewCount: 201,
    owner: {
      name: '鈴木 職人',
      avatar: '👨‍🔧',
      bio: '木工と革細工を15年。素材の持ち味を活かした手仕事にこだわっています。全品1点もので世界に1つだけの品物です。',
      since: '2024年1月',
      location: '京都府',
      sns: { instagram: '@suzuki_craft', website: 'suzukicraft.com' },
    },
    products: [
      {
        id: 'B1-P1',
        name: '木製お椀（桜材）',
        description: '国産桜の木をくり抜いて仕上げた手作りお椀。使うほどに艶が増します。',
        price: 4800,
        imageEmoji: '🍵',
        imageColor: '#FDCB6E',
        category: '木工',
        stock: 3,
        isAvailable: true,
        unit: '個',
        tags: ['手作り', '桜材', '1点もの'],
      },
      {
        id: 'B1-P2',
        name: '革製キーホルダー（刻印付き）',
        description: '本革を使った手縫いキーホルダー。お名前やメッセージを刻印できます。',
        price: 2200,
        imageEmoji: '🔑',
        imageColor: '#A29BFE',
        category: '革細工',
        stock: 10,
        isAvailable: true,
        unit: '個',
        tags: ['本革', '刻印', 'ギフト'],
      },
      {
        id: 'B1-P3',
        name: '竹製箸 2膳セット',
        description: '京都の職人が1本ずつ削り出した高級箸。プレゼントにも最適。',
        price: 3600,
        imageEmoji: '🥢',
        imageColor: '#81ECEC',
        category: '竹工',
        stock: 7,
        isAvailable: true,
        unit: 'セット',
        tags: ['竹製', '京都', 'ギフト'],
      },
    ],
  },

  /* ========== エリアB: 二次産業（棟6） ========== */
  {
    id: 'shop-B2',
    buildingIndex: 6,
    areaId: 'B',
    areaLabel: '二次産業',
    areaEmoji: '⚙️',
    name: '発酵食品の里 岡田',
    tagline: '伝統製法の味噌・醤油・漬物',
    areaColor: '#3B7DB5',
    isOpen: true,
    rating: 4.7,
    reviewCount: 156,
    owner: {
      name: '岡田 発子',
      avatar: '👵',
      bio: '祖母から受け継いだ発酵食品作り。時間と手間をかけた本物の味をお届けします。添加物は一切使いません。',
      since: '2024年3月',
      location: '秋田県',
      sns: { instagram: '@okada_hakko' },
    },
    products: [
      {
        id: 'B2-P1',
        name: '天然醸造 麦味噌 500g',
        description: '2年間じっくり熟成させた麦味噌。甘みと旨みが深い昔ながらの味。',
        price: 1400,
        imageEmoji: '🍜',
        imageColor: '#D4834A',
        category: '発酵食品',
        stock: 25,
        isAvailable: true,
        unit: '袋',
        tags: ['無添加', '2年熟成', '麦味噌'],
      },
      {
        id: 'B2-P2',
        name: 'ぬか漬けセット（3種）',
        description: '大根・きゅうり・なすのぬか漬け。ご飯のお供に最高です！',
        price: 800,
        imageEmoji: '🥒',
        imageColor: '#00B894',
        category: '漬物',
        stock: 12,
        isAvailable: true,
        unit: 'セット',
        tags: ['ぬか漬け', '無添加', '冷蔵'],
      },
    ],
  },

  /* ========== エリアC: 三次産業（棟2） ========== */
  {
    id: 'shop-C1',
    buildingIndex: 2,
    areaId: 'C',
    areaLabel: '三次産業',
    areaEmoji: '🛒',
    name: 'MOMEKOセレクト',
    tagline: '全国の生産者と消費者をつなぐキュレーターショップ',
    areaColor: '#C05A2B',
    isOpen: true,
    rating: 4.5,
    reviewCount: 312,
    owner: {
      name: 'MOMEKO チーム',
      avatar: '🎀',
      bio: 'メタNAGA屋が厳選した全国の逸品を集めたセレクトショップ。品質・安全・生産者の想いを大切に選んでいます。',
      since: '2024年4月',
      location: 'オンライン',
      sns: { twitter: '@momeko_official', instagram: '@momeko_market', website: 'momeko.jp' },
    },
    products: [
      {
        id: 'C1-P1',
        name: 'にっぽんの味 ギフトBOX',
        description: '全国各地の生産者から厳選した食品詰め合わせ。贈り物に最適。',
        price: 5800,
        imageEmoji: '🎁',
        imageColor: '#FF7675',
        category: 'ギフト',
        stock: 30,
        isAvailable: true,
        unit: 'BOX',
        tags: ['ギフト', '全国', '詰め合わせ'],
      },
      {
        id: 'C1-P2',
        name: 'こどもエコ野菜セット',
        description: '農薬不使用のカラフル野菜セット。子どもが喜ぶ食育にぴったり。',
        price: 2400,
        imageEmoji: '🥕',
        imageColor: '#FDCB6E',
        category: '野菜',
        stock: 10,
        isAvailable: true,
        unit: 'セット',
        tags: ['こども', '食育', '無農薬'],
      },
    ],
  },

  /* ========== エリアC: 三次産業（棟7） ========== */
  {
    id: 'shop-C2',
    buildingIndex: 7,
    areaId: 'C',
    areaLabel: '三次産業',
    areaEmoji: '🛒',
    name: 'お届け便 はなまる',
    tagline: '産地直送サービス・定期便受付中',
    areaColor: '#C05A2B',
    isOpen: true,
    rating: 4.4,
    reviewCount: 67,
    owner: {
      name: '花村 直子',
      avatar: '👩‍💼',
      bio: '農家と都市部の消費者をつなぐ仕事をしています。「顔の見える食べ物」を増やすのが夢です。',
      since: '2024年9月',
      location: '東京都',
      sns: { twitter: '@hanamaru_delivery' },
    },
    products: [
      {
        id: 'C2-P1',
        name: '野菜定期便（月1回）',
        description: '毎月厳選野菜BOXをお届け。生産者の手紙付き。初月500円引き！',
        price: 3200,
        imageEmoji: '📦',
        imageColor: '#6C5CE7',
        category: '定期便',
        stock: 50,
        isAvailable: true,
        unit: '月/回',
        tags: ['定期便', '初月割引', '生産者直送'],
      },
    ],
  },

  /* ========== エリアD: コミュニティ（棟3） ========== */
  {
    id: 'shop-D1',
    buildingIndex: 3,
    areaId: 'D',
    areaLabel: 'コミュニティ',
    areaEmoji: '💬',
    name: 'まなびの庭 体験工房',
    tagline: '農業体験・ものづくりワークショップ',
    areaColor: '#8B5DB5',
    isOpen: true,
    rating: 4.9,
    reviewCount: 88,
    owner: {
      name: '佐々木 学',
      avatar: '👨‍🏫',
      bio: '元小学校教師。こどもたちに本物の体験をさせたくてワークショップを始めました。親子での参加も大歓迎！',
      since: '2024年5月',
      location: '神奈川県',
      sns: { website: 'manabi-niwa.jp', instagram: '@manabi_niwa' },
    },
    products: [
      {
        id: 'D1-P1',
        name: '親子農業体験チケット（1日）',
        description: '田植え・収穫・調理まで体験できる1日農業体験。お弁当付き！',
        price: 4500,
        imageEmoji: '🌱',
        imageColor: '#55EFC4',
        category: '体験',
        stock: 6,
        isAvailable: true,
        unit: '親子1組',
        tags: ['親子', '農業体験', '日帰り'],
      },
      {
        id: 'D1-P2',
        name: '竹細工ワークショップ',
        description: 'プロの職人に教わる竹かご作り体験。作った作品はお持ち帰りできます。',
        price: 2800,
        imageEmoji: '🎍',
        imageColor: '#00B894',
        category: '体験',
        stock: 8,
        isAvailable: true,
        unit: '1名',
        tags: ['竹細工', 'ワークショップ', '持ち帰り'],
      },
    ],
  },

  /* ========== エリアD: コミュニティ（棟8） ========== */
  {
    id: 'shop-D2',
    buildingIndex: 8,
    areaId: 'D',
    areaLabel: 'コミュニティ',
    areaEmoji: '💬',
    name: '縁側カフェ 茶話会',
    tagline: 'コミュニティ運営のオンラインサロン・交流グッズ',
    areaColor: '#8B5DB5',
    isOpen: false,
    rating: 4.3,
    reviewCount: 22,
    owner: {
      name: '中村 縁',
      avatar: '🧑‍🤝‍🧑',
      bio: '地域コミュニティのつながり作りをしています。今は開店準備中です。もうすぐオープン予定！',
      since: '2025年1月予定',
      location: '大阪府',
    },
    products: [],
  },

  /* ========== エリアE: エンタメ（棟4） ========== */
  {
    id: 'shop-E1',
    buildingIndex: 4,
    areaId: 'E',
    areaLabel: 'エンタメ',
    areaEmoji: '☕',
    name: 'MOMEKO カフェ & グッズ',
    tagline: 'オリジナルグッズと限定コラボ商品',
    areaColor: '#B5883B',
    isOpen: true,
    rating: 4.6,
    reviewCount: 445,
    owner: {
      name: 'MOMEKO デザイン',
      avatar: '🎨',
      bio: 'MOMEKOブランドのオリジナルグッズショップ。キャラクターグッズから限定コラボまで、楽しいアイテムをお届けします！',
      since: '2024年4月',
      location: 'メタバース内',
      sns: { twitter: '@momeko_design', instagram: '@momeko_goods', website: 'momeko.jp/shop' },
    },
    products: [
      {
        id: 'E1-P1',
        name: 'MOMEKOオリジナルTシャツ',
        description: 'メタNAGA屋のキャラクターがプリントされた限定Tシャツ。着心地抜群のコットン100%。',
        price: 3800,
        imageEmoji: '👕',
        imageColor: '#FF7675',
        category: 'アパレル',
        stock: 20,
        isAvailable: true,
        unit: '枚',
        tags: ['限定', 'オリジナル', 'コットン'],
      },
      {
        id: 'E1-P2',
        name: 'メタNAGA屋 エコバッグ',
        description: 'MOMEKO公式エコバッグ。マチ広設計で野菜もたっぷり入ります！',
        price: 1800,
        imageEmoji: '👜',
        imageColor: '#FDCB6E',
        category: 'グッズ',
        stock: 35,
        isAvailable: true,
        unit: '個',
        tags: ['エコ', 'バッグ', '実用的'],
      },
      {
        id: 'E1-P3',
        name: '和風アクリルキーホルダーセット',
        description: '5エリアのキャラクターがデザインされたキーホルダー全5種セット。',
        price: 2500,
        imageEmoji: '🗝️',
        imageColor: '#A29BFE',
        category: 'グッズ',
        stock: 50,
        isAvailable: true,
        unit: 'セット（5個）',
        tags: ['アクリル', 'キーホルダー', '全5種'],
      },
    ],
  },

  /* ========== エリアE: エンタメ（棟9） ========== */
  {
    id: 'shop-E2',
    buildingIndex: 9,
    areaId: 'E',
    areaLabel: 'エンタメ',
    areaEmoji: '☕',
    name: 'やまとカフェ',
    tagline: '和風スイーツと厳選コーヒーの通販',
    areaColor: '#B5883B',
    isOpen: true,
    rating: 4.8,
    reviewCount: 189,
    owner: {
      name: '大和 珈琲',
      avatar: '☕',
      bio: '元バリスタが開いた和風カフェの通販部門。地元の抹茶と国産の素材にこだわったスイーツをお届けします。',
      since: '2024年6月',
      location: '静岡県',
      sns: { instagram: '@yamato_cafe_jp', website: 'yamatocafe.jp' },
    },
    products: [
      {
        id: 'E2-P1',
        name: '抹茶バウムクーヘン 個包装',
        description: '国産抹茶を贅沢に使ったしっとりバウムクーヘン。個包装で配りやすい！',
        price: 2200,
        imageEmoji: '🎂',
        imageColor: '#55EFC4',
        category: 'スイーツ',
        stock: 40,
        isAvailable: true,
        unit: '5個入り',
        tags: ['抹茶', '国産', 'ギフト向き'],
      },
      {
        id: 'E2-P2',
        name: '和風ドリップコーヒー10袋',
        description: '静岡の茶葉職人とコラボした独自ブレンド。毎日飲みたい優しい味。',
        price: 1600,
        imageEmoji: '☕',
        imageColor: '#795548',
        category: 'ドリンク',
        stock: 60,
        isAvailable: true,
        unit: '10袋',
        tags: ['ドリップ', '和風', 'コラボ'],
      },
    ],
  },
]

/**
 * buildingIndex から店舗データを取得
 */
export function getShopByBuilding(buildingIndex: number): Shop | undefined {
  return SHOPS.find(s => s.buildingIndex === buildingIndex)
}

/**
 * areaId から全店舗を取得
 */
export function getShopsByArea(areaId: string): Shop[] {
  return SHOPS.filter(s => s.areaId === areaId)
}
