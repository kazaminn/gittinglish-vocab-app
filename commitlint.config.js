// 🎉 init, ✨ feat, 🛠️ fix, 🚑 hotfix, ♻️ refactor, 🚀 perf,
// 🧪 test, 💄 style, 📝 docs, 📖 content, 🔧 config,
// 📦 deps, 👷 ci, 🧹 chore, 🚧 wip
const emojiTypes = [
  '\u{1F389} init',
  '\u{2728} feat',
  '\u{1F6E0}\u{FE0F} fix',
  '\u{1F691} hotfix',
  '\u{267B}\u{FE0F} refactor',
  '\u{1F680} perf',
  '\u{1F9EA} test',
  '\u{1F484} style',
  '\u{1F4DD} docs',
  '\u{1F4D6} content',
  '\u{1F527} config',
  '\u{1F4E6} deps',
  '\u{1F477} ci',
  '\u{1F9F9} chore',
  '\u{1F6A7} wip',
];

const plainTypes = emojiTypes.map((t) => t.split(' ')[1]);
const allAllowedTypes = [...emojiTypes, ...plainTypes];

export default {
  extends: ['@commitlint/config-conventional'],
  parserPreset: {
    parserOpts: {
      headerPattern: /^([^(:]+)(?:\(([^)]+)\))?!?: (.*)$/,
      headerCorrespondence: ['type', 'scope', 'subject'],
    },
  },
  plugins: [
    {
      rules: {
        'type-emoji-vs16-enum': (parsed, _when, expectedValues) => {
          const { type } = parsed;
          if (!type) return [false, 'type is required'];

          const normalizedType = type.replace(/\uFE0F/g, '').trim();
          const normalizedExpected = expectedValues.map((v) =>
            v.replace(/\uFE0F/g, '')
          );

          return [normalizedExpected.includes(normalizedType), 'invalid type'];
        },
      },
    },
  ],
  rules: {
    'type-enum': [0],
    'type-empty': [2, 'never'],
    'type-emoji-vs16-enum': [2, 'always', allAllowedTypes],
    // 日本語 subject に英語ライブラリ名 (Better Auth など) が混ざると
    // sentence-case 判定で reject されるため無効化
    'subject-case': [0],
  },
};
