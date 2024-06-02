---
slug: 20240602_systemd_introduction
title: "#6 systemd に入門する"
authors: [um7a]
tags: [systemd]
---

systemd についての情報をまとめておく。

<!--truncate-->

## systemd

Linux ディストリビューションにおける init の実装の一つ。  
init の主目的である、システムに必要なプロセスの開始と停止を行う。

## systemd が使われていることの確認

init の実装には systemd 意外に System V init などがある。  
そのシステムがどの init の実装を使っているかは `man 1 init` を実行すれば確認できる。

```
$ man 1 init

SYSTEMD(1)                                          systemd                                         SYSTEMD(1)

NAME
       systemd, init - systemd system and service manager

SYNOPSIS
       /usr/lib/systemd/systemd [OPTIONS...]

       init [OPTIONS...] {COMMAND}

DESCRIPTION
       systemd is a system and service manager for Linux operating systems. When run as first process on boot
       (as PID 1), it acts as init system that brings up and maintains userspace services. Separate instances
       are started for logged-in users to start their services.
...
```

また、`/usr/lib/systemd` や `/etc/systemd` ディレクトリが存在すれば systemd を使っている。

## systemd の設定ファイル

systemd の設定が置かれている主要なディレクトリは以下の二つ。

- **system unit directory**  
  通常は `/lib/systemd/system` もしくは `/usr/lib/systemd/system` 。  
  ディストリビュージョンが管理しているので、このディレクトリを編集することは避ける。
- **system configuration directory**  
  通常は `/etc/systemd/system` 。  
  必要な場合はこちらを編集する。

以下のコマンドでそれぞれのパスを確認できる。

```
# system unit directory のパス
$ pkg-config systemd --variable=systemdsystemunitdir
/usr/lib/systemd/system

# system configuration directory のパス
$ pkg-config systemd --variable=systemdsystemconfdir
/etc/systemd/system
```

## Unit

systemd はシステムのタスクに対して unit と呼ばれるゴールを定義する。  
プロセスの操作だけでなく、ファイルシステムのマウント、ネットワーク接続要求の監視、タイマーの実行なども unit として定義することができる。

### Unit の一覧を確認する

active な unit の一覧を表示する。

```
$ systemctl list-units
```

active でない unit も含む全ての unit の一覧を表示する。

```
# systemctl list-units --all
```

### Unit の状態を表示する

Unit のステータス、unit ファイルのパス、紐づくプロセス ID、Unit の開始時間、実行されたコマンドライン、終了ステータス、直近のログメッセージなどを表示。

```
$ systemctl status <unit name>
```

### Unit のログメッセージを表示する

全ての Unit のログメッセージを表示する。

```
$ sudo journalctl
```

特定の Unit のログメッセージを表示する。

```
$ sudo journalctl --unit=<unit name>
```

時刻を降順にして表示する。

```
$ sudo journalctl -r
```

特定の時間のログメッセージを表示する。

```
$ sudo journalctl -S -4h                 # 4時間前から現在まで
$ sudo journalctl -S 09:00:00            # 9:00 から現在まで
$ sudo journalctl -S '2024-06-02 21:30'  # 2024-06-02 21:30 から現在まで
```

### Unit の有効化、無効化、リロード、job の確認

Unit の有効化

```
$ sudo systemctl start <unit name>
```

Unit の無効化

```
$ sudo systemctl stop <unit name>
```

システム起動時に Unit を有効化

```
$ sudo systemctl enable <unit name>
```

:::note

- unit ファイルに `[Install]` セクションがある場合のみ必要。
- unit ファイルに `[Install]` セクションがない場合は暗黙的にシステム起動時に有効化される。

:::

システム起動時に Unit を有効化しない

```
$ sudo systemctl disable <unit name>
```

:::note

- unit ファイルに `[Install]` セクションがある場合のみ動作。
- unit ファイルに `[Install]` セクションがない場合、上記コマンドを実行しても unit はシステム起動時に有効化される。

:::

特定の Unit のリロード

```
$ sudo systemctl reload <unit name>
```

全ての Unit のリロード

```
$ sudo systemctl daemon-reload
```

Unit の有効化など unit の状態を変更する要求は systemd では job として扱われる。  
現在の job の一覧を確認する。

```
$ sudo systemctl list-jobs
```

## Unit の作成

systemd に unit を追加するには、system configuration directory に unit ファイルを追加する。

### Unit Type

ユニットには実行する処理に応じて unit type が存在する。  
例えば以下のようなもの。

| Unit Type    | Unit の処理                                    |
| ------------ | ---------------------------------------------- |
| Service unit | サービスのプロセスを制御する。                 |
| Target unit  | 他の unit をグループにまとめることで制御する。 |
| Mount unit   | ファイルシステムのマウントポイントを制御する。 |

それぞれの unit type に応じて unit ファイルの記述方法が異なる。  
その他の Unit Type は `man 1 init` で確認できる。

```
$ man 1 init

...

       The following unit types are available:

        1. Service units, which start and control daemons and the processes they consist of. For details, see
           systemd.service(5).

        2. Socket units, which encapsulate local IPC or network sockets in the system, useful for socket-based
           activation. For details about socket units, see systemd.socket(5), for details on socket-based
           activation and other forms of activation, see daemon(7).

        3. Target units are useful to group units, or provide well-known synchronization points during
           boot-up, see systemd.target(5).

        4. Device units expose kernel devices in systemd and may be used to implement device-based activation.
           For details, see systemd.device(5).

        5. Mount units control mount points in the file system, for details see systemd.mount(5).

        6. Automount units provide automount capabilities, for on-demand mounting of file systems as well as
           parallelized boot-up. See systemd.automount(5).

        7. Timer units are useful for triggering activation of other units based on timers. You may find
           details in systemd.timer(5).

        8. Swap units are very similar to mount units and encapsulate memory swap partitions or files of the
           operating system. They are described in systemd.swap(5).

        9. Path units may be used to activate other services when file system objects change or are modified.
           See systemd.path(5).

       10. Slice units may be used to group units which manage system processes (such as service and scope
           units) in a hierarchical tree for resource management purposes. See systemd.slice(5).

       11. Scope units are similar to service units, but manage foreign processes instead of starting them as
           well. See systemd.scope(5).

       Units are named as their configuration files. Some units have special semantics. A detailed list is
       available in systemd.special(7).
```

### unit ファイルの書式

unit ファイルは ini 形式に似ており、`[]` の中にセクション名を入れて、各セクションで変数とその値を記述する。

以下は何もしない `test1.target` unit の unit ファイル。

```
$ cat /etc/systemd/system/test1.target
[Unit]
Description=test 1
```

`[Unit]` セクションでは unit の詳細を記述する。unit の説明と依存関係の情報が含まれる。

### Unit の依存関係

以下を記述することで、unit 間の依存関係を指定することができる。

| 記述                      | 意味                                                                                                                                                                                     |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Requires=<unit name>`    | `Requires` が記述された unit を有効化する場合、systemd は `Requires` で指定した unit の有効かも試みて、この依存 unit の有効化が失敗した場合、`Requires` が記述された unit を無効化する。 |
| `Wants=<unit name>`       | `Wants` が記述された unit を有効化すると、systemd は `Wants` で指定した unit の有効化も試みるが、これが失敗しても気にしない。                                                            |
| `Conflicts=<unit name>`   | `Conflicts` で指定した unit がアクティブであれば、unit の有効化を失敗させる。                                                                                                            |
| `WantedBy=<unit name>`    | この記述は `[Install]` セクションに記述するので注意。<br/>指定した unit がこの unit を `Wants` で指定した場合と同じ。                                                                    |
| `RequestedBy=<unit name>` | この記述は `[Install]` セクションに記述するので注意。<br/>指定した unit がこの unit を `Requires` で指定した場合と同じ。                                                                 |

### 条件付き依存関係

以下のパラメーターを使って、OS の状態を検査できる。  
systemd は unit ファイル内の条件付き依存関係が偽の場合、その unit を有効化しない。

| 記述                              | 意味                                        |
| --------------------------------- | ------------------------------------------- |
| `ConditionPathExists=<path>`      | path が存在すれば真。                       |
| `ConditionPathIsDirectory=<path>` | path がディレクトリならば真。               |
| `ConditionFileNotEmpty=<path>`    | path がファイルで 0 byte より大きければ真。 |

### Unit の順序付け

以下を記述することで、unit の有効化の順序を指定することができる。

| 記述                 | 意味                                            |
| -------------------- | ----------------------------------------------- |
| `Before=<unit name>` | `Before` で列挙された unit の前に有効化される。 |
| `After=<unit name>`  | `After` で列挙された unit の後に有効化される。  |

systemd は `Wants` として列挙された unit に `After` を追加する(設定ファイルには反映されない)。  
もしこれを無効化したい場合は unit に `DefaultDependencies=no` を追加することで、このデフォルトの依存関係 (default dependency) を無効にできる。

### Unit の `Type`

systemd が unit の生成するプロセスを追跡することを可能にするために、`Type` オプションを指定する。

| 記述           | 意味                                                                                                                                                                                                                                                                                                                                                   |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `Type=simple`  | プロセスはフォークせず、終了もしない。<br/>この Type は service の開始に時間を要することを考慮していない。                                                                                                                                                                                                                                             |
| `Type=forkin`  | プロセスはフォークして、systemd は元々のプロセスが終了することを期待する。<br/>systemd は元々のプロセスが終了したことを確認して、サービスの準備が整ったとみなす。                                                                                                                                                                                      |
| `Type=notify`  | プロセスは準備が整ったら特別な関数を呼び出して systemd に固有の通知を送信する。                                                                                                                                                                                                                                                                        |
| `Type=dbus`    | ロセスは準備が整ったら D-Bus (Desktop Bus) に登録する。                                                                                                                                                                                                                                                                                                |
| `Type=oneshot` | プロセスは起動後に子プロセスを持つことなく完全に終了する。<br/>systemd はプロセスが終了するまでサービスが開始したとはみなさない。<br/>`Requires` による厳密な依存関係はプロセスの終了まで開始されない。<br/>この Type を使っているサービスはデフォルトで `RemainAfterExit=yes` となり、プロセスが終了した後も systemd がサービスをアクティブとみなす。 |
| `Type=idle`    | `Type=simple` と同様に動作するが、全てのアクティブな job が終了するまで service を開始しない。<br/>他の全ての job の終了を待つことで、他に開始しようとしている unit がないことを保証する。                                                                                                                                                             |

### 変数

`$OPTIONS` や `$MAINPID` など `$` で始まるものは変数。

変数の成り立ちには色々ある。  
`$MAINPID` には systemd が unit を有効化したい際に systemd が PID を保存する。  
`EnvironmentFile` で指定したファイルに変数を定義することも可能。

### 指定子

指定子も unit ファイルで利用できる変数のような機能だが、`%` で始まる。  
`%n` は現在のユニット名。  
`%H` は現在のホスト名。

`/usr/lib/systemd/system/getty@.service` のように unit ファイルにはファイル名の `.` の前に `@` をつけたものがある。これは、1 つの unit ファイルから複数の unit のコピーを作成するための仕組み。この unit ファイルを使って `getty@tty1` や `getty@tty2` といった unit を動的に作成することができる。この `@` の後の部分をインスタンスと呼ぶ。`%I` もしくは `%i` はこのインスタンスを指す。

## 参考

- [スーパーユーザーなら知っておくべき Linux システムの仕組み](https://www.amazon.co.jp/%E3%82%B9%E3%83%BC%E3%83%91%E3%83%BC%E3%83%A6%E3%83%BC%E3%82%B6%E3%83%BC%E3%81%AA%E3%82%89%E7%9F%A5%E3%81%A3%E3%81%A6%E3%81%8A%E3%81%8F%E3%81%B9%E3%81%8DLinux%E3%82%B7%E3%82%B9%E3%83%86%E3%83%A0%E3%81%AE%E4%BB%95%E7%B5%84%E3%81%BF-Brian-Ward/dp/4295013498)
