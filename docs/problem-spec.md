# gittinglish Problem Spec v2

余計な抽象は抜く。実運用でそのまま使える形だけ出す。

---

# ① 最終形サンプルJSON（完全版）

```json
{
  "id": "nanj_001_w2m_1",
  "sentenceId": "nanj_001",

  "pedagogicalKind": "cloze",
  "interactionType": "select",
  "drillMode": "word_to_meaning",

  "tags": {
    "grammar": ["svo"],
    "vocabulary": [
      { "lemma": "add", "pos": "verb", "meaning": "既にある集合に要素を加える", "target": true, "category": "addition" },
      { "lemma": "workaround", "pos": "noun" }
    ],
    "phrases": [
      { "text": "three months ago", "type": "collocation" }
    ]
  },

  "difficulty": {
    "level": 2,
    "factors": {
      "grammarCount": 1,
      "structureComplexity": 2,
      "distractorSimilarity": 3,
      "rareWordCount": 0
    }
  },

  "prompt": "What does 'add' mean?",

  "stem": "add",
  "choices": [
    { "id": "a", "text": "既にある集合に要素を加える" },
    { "id": "b", "text": "存在しなかったものを新たに生み出す" },
    { "id": "c", "text": "初めて導入する" },
    { "id": "d", "text": "設計・計画されたものを実際に動くようにする" }
  ],
  "choiceAnswerSpec": {
    "mode": "single",
    "correctChoiceIds": ["a"]
  },

  "explanation": {
    "summary": "'add' means: 既にある集合に要素を加える",
    "relatedGrammar": ["svo"]
  }
}
```

---

# ② k/v定義 + 型

## トップレベル（全問題型共通）

| key | 型 | 必須 | 説明 |
|-----|---|------|------|
| id | string | ✓ | 問題ID（ユニーク） |
| sentenceId | string | ✓ | 元英文ID |
| sourceAstId | string | | AST ID（あれば） |
| sourceNodeIds | string[] | | 生成元ASTノードID |
| pedagogicalKind | string (union) | ✓ | 学習上の問題意図 |
| interactionType | string (union) | ✓ | UI操作形式 |
| drillMode | string (union) | ✓ | 学習モード |
| tags | object | ✓ | 学習タグ（多軸） |
| difficulty | object | ✓ | 難易度 |
| prompt | string | ✓ | 問題指示文 |
| explanation | object | ✓ | 解説 |

上記に加え、問題型ごとの固有フィールドが**フラットに**入る（payloadでラップしない）。

---

## drillMode（学習モード）

```ts
type DrillMode =
  | "word_to_meaning"    // 単語→語義 四択
  | "meaning_to_word"    // 語義→単語 四択
  | "word_input"         // 語義→単語 自由入力
  | "sentence_cloze"     // 例文穴埋め四択
  | "sentence_input"     // 例文穴埋め自由入力
  | "reorder"            // chunk並べ替え
  | "flashcard";         // 閲覧のみ（問題データ不要）
```

---

## pedagogicalKind × interactionType（許可される組み合わせ）

| pedagogicalKind | interactionType | 説明 |
|----------------|-----------------|------|
| cloze | select | 穴埋め四択 / 単語四択 |
| cloze | input | 穴埋め自由入力 / 単語入力 |
| reorder | reorder | 並び替え |
| split | transform | 複文→単文分解 |
| merge | transform | 単文→複文結合 |
| error_correction | identify | 誤り特定・訂正 |
| paraphrase | transform | 言い換え |
| grammar_label | select | 文法ラベル選択 |
| translation | input | 和文英訳 |

上記以外の組み合わせは不正。

---

## tags

```ts
type ProblemTags = {
  grammar: GrammarPoint[];       // 1〜3推奨。最低1つ必須
  vocabulary?: VocabularyTag[];  // 0〜5
  phrases?: PhraseTag[];         // 0〜3
};

type VocabularyTag = {
  lemma: string;                 // 原形。必須
  pos?: "noun" | "verb" | "adjective" | "adverb" | "preposition" | "conjunction";
  frequency?: number;            // コーパス頻度（任意）
  meaning?: string;              // 語義（日本語）。target語のみ
  target?: boolean;              // 出題対象語か
  category?: string;             // 動詞カテゴリ（wrong選択肢生成用）
};

type PhraseTag = {
  text: string;                  // チャンクテキスト。必須
  type?: "collocation" | "idiom" | "phrasal_verb" | "compound";
};
```

### grammar に使える値（39個）

```ts
type GrammarPoint =
  // 文型
  | "sv" | "svc" | "svo" | "svoo" | "svoc"
  // 時制
  | "present" | "past" | "present_perfect" | "future"
  // 節・句
  | "relative_clause" | "relative_adverb" | "participle_clause"
  | "noun_clause_that" | "noun_clause_wh"
  // 仮定法
  | "subjunctive_present" | "subjunctive_past" | "subjunctive_past_perfect"
  // 構文
  | "cleft_sentence" | "inversion" | "comparison" | "passive" | "causative"
  | "existential_there" | "inanimate_subject" | "question_exclamation"
  // 準動詞
  | "gerund" | "infinitive" | "participial_adjective"
  // 品詞・語法
  | "modal" | "conjunction" | "phrasal_verb" | "perception"
  | "article" | "preposition"
  // 文法機能
  | "apposition" | "ellipsis" | "parallelism" | "negation"
  // 話法
  | "reported_speech";
```

### 制約

* grammar: **最低1つ必須**。3つを超えたらノイズ
* vocabulary: 学習対象のみ。全単語を入れない
* phrases: 明確なまとまりのみ

---

## difficulty

```ts
type Difficulty = {
  level: 1 | 2 | 3 | 4 | 5;
  factors?: {
    grammarCount?: number;
    structureComplexity?: number;
    distractorSimilarity?: number;
    rareWordCount?: number;
    clauseCount?: number;
    transformDepth?: number;
  };
};
```

---

## 問題型ごとの固有フィールド

### cloze + select（穴埋め四択 / 単語四択）

```ts
{
  stem: string;                         // 穴埋め文 or 単語 or 語義
  choices: { id: string; text: string }[];
  choiceAnswerSpec: {
    mode: "single" | "multiple";
    correctChoiceIds: string[];
  };
}
```

### cloze + input（穴埋め自由入力 / 単語入力）

```ts
{
  stem: string;
  answerSpec: {
    judgeType: "exact" | "normalized" | "unordered" | "partial" | "contains";
    answers: string[];
    caseSensitive?: boolean;
    trimWhitespace?: boolean;
    ignorePunctuation?: boolean;
  };
}
```

### reorder（並び替え）

```ts
{
  chunks: { id: string; text: string }[];
  correctOrder: string[];
}
```

### split + transform / merge + transform / paraphrase + transform

```ts
{
  stem: string;          // split/paraphrase: 変換元の英文
  inputs?: string[];     // merge: 結合元の英文（2つ以上）
  answerSpec: { ... };
}
```

### error_correction + identify

```ts
{
  stem: string;
  corrections: { span: { start: number; end: number }; replacement: string }[];
}
```

### grammar_label + select

```ts
{
  stem: string;
  choices: { id: string; text: string }[];
  choiceAnswerSpec: { mode: "single" | "multiple"; correctChoiceIds: string[] };
}
```

### translation + input

```ts
{
  sourceJa: string;
  constraints?: { type: "must_use" | "forbid" | "structure"; value: string }[];
  answerSpec: { ... };
}
```

---

## explanation

```ts
type Explanation = {
  summary: string;
  details?: string[];
  relatedGrammar?: GrammarPoint[];
};
```

---

# 元英文データ（RawSentenceRecord）

```json
{
  "id": "nanj_001",
  "originalText": "Code added a \"temporary\" workaround to the login page three months ago, and it is still there.",
  "sourceJa": "Codeがログインページに「一時的な」回避策を入れたのは3ヶ月前で、まだそこにある",
  "grammarPoints": ["svo"],
  "vocabulary": [
    { "lemma": "add", "pos": "verb", "meaning": "既にある集合に要素を加える", "target": true, "category": "addition" },
    { "lemma": "workaround", "pos": "noun" },
    { "lemma": "temporary", "pos": "adjective" }
  ],
  "phrases": [
    { "text": "three months ago", "type": "collocation" }
  ]
}
```

---

# 最小制約まとめ

* `pedagogicalKind` × `interactionType` は許可された組み合わせのみ
* `drillMode` は必須。問題がどのモードで使われるかを示す
* 固有フィールドはpayloadでラップせず**フラット**に入れる
* `tags.grammar` は最低1つ。GrammarPoint 39個の許可値から選ぶ
* `tags.vocabulary` は `{ lemma, pos?, meaning?, target?, category? }` の型付き
* `tags.phrases` は `{ text, type? }` の型付き
* `choices.id` と `choiceAnswerSpec.correctChoiceIds` は一致すること
* `corrections.span` は `{ start, end }` で文字位置指定
* `difficulty.level` はUI用。factors はロジック・分析用
* `explanation.relatedGrammar` は `tags.grammar` と同じ値セットを使う