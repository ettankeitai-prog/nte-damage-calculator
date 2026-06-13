// ==========================================
// NTE ダメージ計算機 プリセットデータ管理ファイル
// ==========================================

window.NTE_DATA = {
  "presets": [
    {
      "id": "custom",
      "name": "カスタム（手動入力）",
      "type": "custom"
    },
    {
      "id": "sagiri_ult",
      "name": "早霧ULT",
      "type": "attacker_base_ratio",
      "hasLv": false,
      "ratio": 30,
      "description": "早霧の基礎攻撃力 × 30% を全キャラに実数値加算"
    },
    {
      "id": "hania_skill",
      "name": "ハニアスキル",
      "type": "attacker_base_ratio",
      "hasLv": true,
      "description": "ハニアの基礎攻撃力 × スキルLvの% を全キャラに実数値加算",
      "ratios": {
        "1": 11,
        "2": 12,
        "3": 13,
        "4": 14,
        "5": 15,
        "6": 16,
        "7": 17,
        "8": 18,
        "9": 19,
        "10": 20,
        "11": 21
      }
    },
    {
      "id": "hania_ult",
      "name": "ハニアULT",
      "type": "attacker_base_ratio",
      "hasLv": true,
      "description": "ハニアの基礎攻撃力 × スキルLvの% を全キャラに実数値加算",
      "ratios": {
        "1": 11,
        "2": 12,
        "3": 13,
        "4": 14,
        "5": 15,
        "6": 16,
        "7": 17,
        "8": 18,
        "9": 19,
        "10": 20,
        "11": 21
      }
    },
    {
      "id": "sonic_hedgehog",
      "name": "ギア：音速ヘッジホッグ",
      "type": "main_char_base_ratio",
      "hasLv": false,
      "ratio": 15,
      "description": "チーム全員キャラ攻撃力に +15% を加算（操作キャラの基礎攻撃力起算）"
    },
    {
      "id": "nanari_skill",
      "name": "ナナリスキル",
      "type": "critDmg",
      "hasLv": false,
      "description": "ナナリのクリダメ+30%",
      "ratio": 30
    }
  ],
  "arcs": [
    {
      "id": "custom",
      "name": "カスタム（手動入力）"
    },
    {
      "id": "last_rose",
      "name": "ラストローズ",
      "baseAtkMin": 45,
      "baseAtkMax": 570,
      "subStatType": "critRate",
      "subStatMin": 2.4,
      "subStatMax": 24,
      "effect1Type": "atkPercent",
      "effect1Values": [
        14,
        16.8,
        19.6,
        22.4,
        25.2,
        28
      ],
      "effect2Type": "critDmg",
      "effect2Values": [
        60,
        72,
        84,
        96,
        108,
        120
      ]
    }
  ]
};