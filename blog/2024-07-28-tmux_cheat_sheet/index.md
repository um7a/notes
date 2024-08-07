---
slug: 20240728_tmux_cheat_sheet
title: "#7 tmux cheat sheet"
authors: [um7a]
tags: [tmux]
---

tmux のチートシート。

<!--truncate-->

## Session 操作

| 操作                 | コマンド                                                                                                                                |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| session を新規作成   | `$ tmux` もしくは `$ tmux new -s <session name>`<br/><br/>※ session 名は tmux 起動後の画面で左下に表示される。                          |
| session をデタッチ   | `Ctrl` + `b` → `d`                                                                                                                      |
| session の一覧を確認 | `$ tmux ls`                                                                                                                             |
| session の削除       | 特定のセッションを削除する場合<br/>`$ tmux kill=-session -t <session name>`<br/>全てのセッションを削除する場合<br/>`$ tmux kill-server` |
| session のアタッチ   | 最近の session にアタッチする場合<br/>`$ tmux a`<br/>session 名を指定する場合<br/>`$ tmux -t <session name>`                            |

## Window 操作

| 操作                  | コマンド                                                                                                                                                    |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| window を新規作成     | `Ctrl` + `b` → `c`<br/><br/>※ window のインデックスは tmux 起動後の画面で左下の session 名の右に表示される。現在表示されている window には `*` が表示される |
| 次の window に移動    | `Ctrl` + `b` → `n`                                                                                                                                          |
| window を選択して移動 | `Ctrl` + `b` → `w`<br/><br/>※ 別の session の window にも移動できる                                                                                         |
| window の名前変更     | `Ctrl` + `b` → `,` → `<window name>`                                                                                                                        |
| window の削除         | `Ctrl` + `b` → `&`                                                                                                                                          |

## Pane 操作

| 操作                                 | コマンド                                                                                                                                                                                                                                                                                                                                                           |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 垂直に pane を分割                   | `Ctrl` + `b` → `%`                                                                                                                                                                                                                                                                                                                                                 |
| 水平に pane を分割                   | `Ctrl` + `b` → `"`                                                                                                                                                                                                                                                                                                                                                 |
| pane を移動                          | `Ctrl` + `b` → `↑`,`→`,`↓`,`←`<br/>`Ctrl` + `b` → `q` → `0 ~ 9`                                                                                                                                                                                                                                                                                                    |
| pane を最大化、最小化                | `Ctrl` + `b` → `z`                                                                                                                                                                                                                                                                                                                                                 |
| pane を削除                          | `Ctrl` + `b` → `x`                                                                                                                                                                                                                                                                                                                                                 |
| pane をリサイズ                      | 上に行数を増やす<br/>`Ctrl` + `b` → `:resize-pane -U <number of lines>`<br/>下に行数を増やす<br/>`Ctrl` + `b` → `:resize-pane -D <number of lines>`<br/>左に行数を増やす<br/>`Ctrl` + `b` → `:resize-pane -L <number of lines>`<br/>右に行数を増やす<br/>`Ctrl` + `b` → `:resize-pane -R <number of lines>`                                                        |
| 定義されたレイアウトに pane を並べる | pane を横一列に並べる<br/>`Ctrl` + `b` → `Option` + `1`<br/>pane を縦一列に並べる<br/>`Ctrl` + `b` → `Option` + `2`<br/>一つの pane を上に大きく、残りを下に横一列に並べる<br/>`Ctrl` + `b` → `Option` + `3`<br/>一つの pane を左に大きく、残りを右に縦一列に並べる<br/>`Ctrl` + `b` → `Option` + `4`<br/>格子状に pane を並べる<br/>`Ctrl` + `b` → `Option` + `5` |

## その他

| 操作             | コマンド                                                                                                                  |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------- |
| コピー           | `Ctrl` + `b` → `[` → コピー開始位置に移動 → `Space` → コピー終了位置に移動 → `Enter`                                      |
| ペースト         | `Ctrl` + `b` → `]`                                                                                                        |
| 設定の再読み込み | `$ tmux source-file <file path (e.g. ~/.tmux.conf)>`<br/>もしくは tmux 内で<br/>`Ctrl` + `b` → `:source-file <file path>` |
