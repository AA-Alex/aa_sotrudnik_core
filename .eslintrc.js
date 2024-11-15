{
  "env": {
    "browser": true,
      "node": true,
        "es6": true,
          "mocha": true
  },
  "extends": [
    "airbnb-typescript/base",
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking"
  ],
    "parser": "@typescript-eslint/parser",
      "parserOptions": {
    "project": "./tsconfig.eslint.json"
  },
  "plugins": [
    "@typescript-eslint",
    "autofix",
    // "jest",
    "import"
  ],
    "rules": {
    "@typescript-eslint/indent": [
      "error",
      4
    ],
      "no-unused-vars": [2, {"vars": "all", "args": "after-used"}],
        // "indent": [
        // 	"error",
        // 	"tab"
        // ],
        "arrow-body-style": [
          "error",
          "as-needed"
        ],
          "no-tabs": 0,
            "import/prefer-default-export": 0,
              "no-console": 0,
                "max-len": [
                  "error",
                  {
                    "code": 150
                  }
                ],
                  // ==============================
                  // Автоформатирование
                  // ==============================
                  "autofix/semi-style": [
                    "error",
                    "last"
                  ], // точка с запятой в конце
                    "autofix/brace-style": [
                      "error",
                      "1tbs"
                    ], // блочные if конструкции
                      "autofix/linebreak-style": [
                        "error",
                        "unix"
                      ], // Стиль переноса строки
                        "autofix/func-call-spacing": [
                          "error",
                          "never"
                        ], // разрыв декларирования функции
                          "autofix/function-paren-newline": [
                            "error",
                            "consistent"
                          ], // Перенос параметров определения функции на новую строку
                            "autofix/function-call-argument-newline": [
                              "error",
                              "consistent"
                            ], // Перенос аргументов при вызове функции
                              "autofix/object-curly-newline": [
                                "error",
                                {
                                  "consistent": true
                                }
                              ],
                                "autofix/newline-per-chained-call": [
                                  "error",
                                  {
                                    "ignoreChainWithDepth": 2
                                  }
                                ],
                                  // ==============================
                                  // Правила
                                  // ==============================
                                  "@typescript-eslint/no-floating-promises": [
                                    "error",
                                    {
                                      "ignoreVoid": true
                                    }
                                  ], // Разрешить помечать void для асинхронных функциий, без обещания
                                    "@typescript-eslint/no-unsafe-member-access": 0,
                                      "@typescript-eslint/no-explicit-any": 0,
                                        "@typescript-eslint/no-unsafe-assignment": 0,
                                          "@typescript-eslint/no-misused-promises": 0,
                                            "@typescript-eslint/require-await": 0,
                                              "no-void": [
                                                "error",
                                                {
                                                  "allowAsStatement": true
                                                }
                                              ], // Разрешить использование войд для пометки, ингнорирования ожидания promise
                                                "no-return-await": 0,
                                                  "class-methods-use-this": 0,
                                                    "no-await-in-loop": 0,
                                                      "no-plusplus": 0,
                                                        "no-namespace": 0,
                                                          "@typescript-eslint/no-namespace": 0,
                                                            "@typescript-eslint/no-empty-interface": 0,
                                                              "no-inner-declarations": 0,
                                                                "no-bitwise": 0,
                                                                  "prefer-destructuring": 0,
                                                                    "@typescript-eslint/camelcase": 0,
                                                                      "arrow-parens": 0,
                                                                        "import/order": 0, // Сортировка импортов
                                                                          "@typescript-eslint/comma-dangle": 0,
                                                                            "no-continue": 0,
                                                                              "require-jsdoc": [
                                                                                "error",
                                                                                { // Требования к к коментариям функции
                                                                                  "require": {
                                                                                    "FunctionDeclaration": true,
                                                                                    "MethodDefinition": true,
                                                                                    "ClassDeclaration": false,
                                                                                    "ArrowFunctionExpression": true,
                                                                                    "FunctionExpression": true
                                                                                  }
                                                                                }
                                                                              ],
                                                                                "no-trailing-spaces": [
                                                                                  "error"
                                                                                ]
  },
  "overrides": [
    {
      "files": [
        "src/index.ts"
      ],
      "rules": {
        "import/first": 0, // Сортировка импортов
        "import/newline-after-import": 0
      }
    },
    {
      "files": [
        "src/**/*V.ts"
      ],
      "rules": {
        "autofix/newline-per-chained-call": [
          "error",
          {
            "ignoreChainWithDepth": 1
          }
        ]
      }
    },
    {
      "files": [
        "src/**/*E.ts"
      ],
      "rules": {
        "autofix/newline-per-chained-call": [
          "error",
          {
            "ignoreChainWithDepth": 1
          }
        ]
      }
    },
    {
      "files": [
        "src/**/*QL.ts"
      ],
      "rules": {
        "autofix/newline-per-chained-call": [
          "error",
          {
            "ignoreChainWithDepth": 1
          }
        ]
      }
    },
    {
      "files": [
        "src/**/Migrations/*.ts"
      ],
      "rules": {
        "autofix/newline-per-chained-call": [
          "error",
          {
            "ignoreChainWithDepth": 1
          }
        ]
      }
    },
    {
      "files": [
        "src/**/*Ctrl.ts"
      ],
      "rules": {
        "@typescript-eslint/no-unsafe-argument": 0 // из за параметра ctx.body
      }
    }

  ]
}
