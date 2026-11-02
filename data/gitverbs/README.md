# gitverbs データセット（2026-11-03）

Git・開発で使う動詞100語の問題データ。GitVerbs85（meanings-update/gitverbs85_*.json）の後継で、別のデータセットとして扱う（古い学習履歴は引き継がない）。

## ファイル

| ファイル | 中身 |
| --- | --- |
| gitverbs_word_to_meaning.json | 単語→語義（100問） |
| gitverbs_meaning_to_word.json | 語義→単語（100問） |
| gitverbs_sentence_cloze.json | 穴埋め（100問） |
| id_map.csv | sentenceId・語・分類・gitverbs85 での ID（足した20語は空） |

- 問題 ID は `gitverbs_001_w2m_1` の形（`w2m`・`m2w`・`scloze`）。sentenceId は `gitverbs_001`〜`gitverbs_100` で、分類の順に並ぶ
- 形式は gitverbs-problem-spec（gittinglish-problem-spec.md）と同じ。インデント2、CRLF、末尾の改行なし
- 分類（tags.vocabulary[].category）に `general`（基本・汎用系）を足した

## gitverbs85 からの変更

- 外した5語: wire up・bootstrap・lazy-load・automate・stub
- 足した20語: use・make・allow・show・run・check・apply・include・generate・build・add back・exclude・hide・disable・ignore・skip・avoid・warn・throw・upgrade
- 外した語が誤答に入っていた問題は、同じ分類の語に差し替えた（穴埋めは16問で、解説も直した）
- 語義・選び方・根拠は meanings-update/CHANGES-verbs-v2.md、定義は 動詞v2追加定義リスト_261103.md

## 作り方と確認

```bash
python scripts/verbs_v2.py                  # 語の決定と CHANGES-verbs-v2.md
python scripts/build_gitverbs_dataset.py    # このフォルダの JSON と id_map.csv
python scripts/validate_gitverbs.py         # 整合性の確認
python scripts/check_cloze.py --dataset gitverbs   # 穴埋めの誤答をコミットの件数で確認
```

穴埋めの確認結果は output_v4_2021_2025/cloze_check_gitverbs.csv。
