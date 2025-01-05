---
slug: 20250103_fluent_bit
title: "#9 Fluent Bit と Prometheus でログ監視を実現する"
authors: [um7a]
tags: [Fluent Bit, Prometheus, Monitoring, Alerting]
---

Fluent Bit と Prometheus を使ってログ監視を実現する方法がわかったので整理しておく。

<!--truncate-->

## 1. Fluent Bit の概要

### 1.1. Fluent Bit とは

Fluent Bit はオープンソースのテレメトリーエージェント。幅広い環境にまたがってテレメトリーデータ（ログ、メトリック、トレース）を収集して処理するようデザインされている。

Fluent Bit は Cloud Native Computing Foundation（CNCF）の Fluentd のサブプロジェクトで、ライセンスは Apache License Version 2.0。

### 1.2. Fluent Bit の処理の流れ

Fluent Bit では、データの収集から転送までの流れ全体を **Data Pipeline** と呼ぶ。  
Data Pipeline には **Input**、**Parser**、 **Filter**、**Output** のフェーズがあり、設定ファイルにこれらを定義することで Fluent Bit が動作する。

![Data Pipeline](./fluent_bit_data_pipeline.svg)

#### 1.2.1. Input

色々なデータソースからデータを集めるフェーズ。  
Fluent Bit では、色々なソースから情報を取得するための Input プラグインが実装されている。

##### 1.2.1.1. Input プラグイン

Input プラグインは OS からメトリクスを、もしくはログファイルからログデータを取得する。
Input プラグインがロードされると、Fluent Bit の内部では Input プラグインのインスタンスが生成される。
各インスタンスはそれぞれ異なる設定を保持する。

##### 1.2.1.2. Event、Record

Fluent Bit が取得したデータは **Event** もしくは **Record** と呼ばれる。
例えば以下のような 4 行のログがあった場合、各行のログは 4 つの Event として扱われる。

```
Jan 18 12:52:16 flb systemd[2222]: Starting GNOME Terminal Server
Jan 18 12:52:16 flb dbus-daemon[2243]: [session uid=1000 pid=2243] Successfully activated service 'org.gnome.Terminal'
Jan 18 12:52:16 flb systemd[2222]: Started GNOME Terminal Server.
Jan 18 12:52:16 flb gsd-media-keys[2640]: # watch_fast: "/org/gnome/terminal/legacy/" (establishing: 0, active: 0)
```

Event は以下で構成される。

- timestamp ... 整数もしくは浮動小数点数の、秒数で表されるタイムスタンプ。
- key/value metadata ... Event のメタデータを表すオブジェクト。空の場合もある。
- message ... Event のボディを格納するオブジェクト。

また、Event には必ず **Tag** が付与される。
Tag は後続の処理でどの Filter もしくは Output が提供されるかを決定するために使用される文字列。
ほとんどの場合、Tag は設定によって手動で付与される。
もし Tag の指定がなければ、Fluent Bit はその Event を生成した Input プラグインのインスタンスの名前を Tag として付与する。

#### 1.2.2 Parser

Input プラグインによって取得した非構造化データを構造化データに変換するフェーズ。  
例えば、以下のような HTTP サーバーのログがあった場合、

```
192.168.2.20 - - [28/Jul/2006:10:27:10 -0300] "GET /cgi-bin/try/ HTTP/1.0" 200 3395
```

非構造化データであるログの文字列は、Parser の 1 つである **regular expression parser** によって以下の構造化データに変換できる。

```json
{
  "host": "192.168.2.20",
  "user": "-",
  "method": "GET",
  "path": "/cgi-bin/try/",
  "code": "200",
  "size": "3395",
  "referer": "",
  "agent": ""
}
```

#### 1.2.3. Filter

収集したデータを変更、追加、削除するフェーズ。  
Filter は収集したデータを宛先に転送する前に変更を加える。
例えば以下のような用途で Filter を使用できる。

- Event に IP アドレスのような情報を追加する
- Event の内容のうちの特定の一部分を取得する
- 特定のパターンに一致する Event を削除する

Filter はプラグインとして実装されている。
Filter プラグインは Input プラグインと同様にインスタンスとして動作し、各インスタンスは独立した設定を保持する。

#### 1.2.4. Output

宛先にデータを転送するフェーズ。  
一般的な宛先としては、リモートのシステム、ローカルのファイルシステムなど。

Output はプラグインとして実装されている。
Output プラグインは Input プラグインと同様にインスタンスとして動作し、各インスタンスは独立した設定を保持する。

## 2. Fluent Bit の設定

Fluent Bit の実行ファイルは `fluent-bit`。  
設定ファイルはコマンドラインオプション `--config=<path>` として指定する。

```bash
fluent-bit --config=<path>
```

Fluent Bit の設定ファイルには Classic mode と YAML 形式の 2 つのフォーマットがある。
Classic mode は 2025 年末に非推奨になるため、YAML フォーマットを利用することにした。

### 2.1. 設定ファイルの全体像

Fluent Bit の YAML 形式の設定ファイルには以下の 7 つのセクションがある。

- `service`  
  グローバルな設定を記述。  
  このセクションはオプショナル。記述しない場合はデフォルトの値が使用される。

- `parsers`  
  Input、Processor、Filter、Output プラグインで使用される Parser のリストを記述する。  
  複数の `parsers` セクションを記載可能。また複数の外部ファイルから読み込みも可能。

- `multiline_parsers`  
  `parsers` セクションと同様に **Multiline Parser** のリストを記述する。  
  複数の `multiline_parsers` セクションの定義が可能。また複数の外部ファイルから読み込みも可能。

- `pipeline`  
  Input、Processor、Filter、Output プラグインで構成される Pipeline を定義する。  
  `pipeline` セクションは複数定義できるが、独立に動く訳ではなく、1 つの Pipeline に内部でマージされる。

- `plugins`  
  Fluent Bit のランタイムが読み込む外部のプラグイン（.so ファイル）へのパスを指定する。

- `upstream_servers`  
  この機能をサポートする Output プラグインによって参照される node の endpoint のグループを記述する。

- `env`  
  Fluent Bit のための環境変数のリストを記述する。  
  ここで環境変数を記述しても適用されるのは Fluent Bit のみなので注意。

### 2.2. ログ監視用の設定

Fluent Bit でログファイル `/var/log/secure` から ssh ログイン失敗のログを監視する場合を考える。
ssh ログイン失敗時 `/var/log/secure` には以下のようなログが出力される。

```
<Month> <Day> HH:MM:SS <hostname> <process>[<pid>]: Connection closed by (invalid|authenticating) user <user> <client ip> port <client port> [preauth]

# e.g.
# Jan  1 00:00:00 localhost program[1234]: Connection closed by authenticating user ci 192.168.1.2 port 59995 [preauth]
```

以下の設定で Fluent Bit で `/var/log/secure` を監視し、上記のログの出力回数を Prometheus の Exporter の形式で提供する。

```yaml
parsers:
  - name: ssh_invalid_login_message
    format: regex
    # Example: "Jan  1 00:00:00 localhost program[1234]: Connection closed by authenticating user ci 192.168.1.2 port 59995 [preauth]"
    regex: '^(?<time>[A-Za-z]{3} [ \d]{1,2} [0-2]\d:[0-5]\d:[0-5]\d) (?<host>[^ ]+) (?<program>[^\[]+)\[(?<pid>\d+)\]: (?<message>Connection closed by (authenticating|invalid) user (?<user>[^ ]+) .*)$'
    time_key: time
    time_format: "%b %d %H:%M:%S"

pipeline:
  inputs:
    - name: tail
      tag: ssh_invalid_login
      path: /var/log/secure
      parser: ssh_invalid_login_message

  filters:
    - name: log_to_metrics
      match: ssh_invalid_login
      metric_mode: counter
      metric_name: count_invalid_ssh_login
      metric_description: This metric counts the number of invalid SSH logins
      tag: count_invalid_ssh_login
      regex: "message Connection closed by (authenticating|invalid) user .*"
      label_field: host
      label_field: user

  outputs:
    - name: stdout
      match: count_invalid_ssh_login

    - name: prometheus_exporter
      match: count_invalid_ssh_login
      host: 0.0.0.0
      port: 2021
```

Input プラグインとして `tail`、Filter プラグインとして `log_to_metrics`、Output プラグインとして `stdout` と `prometheus_exporter` を使用。Prometheus の Exporter のフォーマットでメトリクスを出力するだけであれば `stdout` は不要。

### 動作確認

今回はオフィシャルに提供されている Docker イメージを利用した。

```bash
$ docker pull fluent/fluent-bit:3.2.3
```

Fluent Bit を起動。

```bash
$ docker run -it --rm --name fluent-bit-test --network=host -v .:/etc/fluent-bit -v /var/log:/var/log flue
nt/fluent-bit:3.2.3 --config=/etc/fluent-bit/fluent-bit.yml
```

ログインに失敗してみる。

```bash
$ ssh invalid-user@192.168.1.10
invalid-user@192.168.1.10's password:
Permission denied, please try again.
invalid-user@192.168.1.10's password:
Permission denied, please try again.
invalid-user@192.168.1.10's password:
invalid-user@192.168.1.10: Permission denied (publickey,gssapi-keyex,gssapi-with-mic,password).
```

カウンターが上がっていることが確認できる。

```bash
[um7a@compute01 ~]$ curl http://localhost:2021/metrics
# HELP log_metric_counter_count_invalid_ssh_login This metric counts the number of invalid SSH logins
# TYPE log_metric_counter_count_invalid_ssh_login counter
log_metric_counter_count_invalid_ssh_login{host="compute01",user="invalid-user"} 1
```

Output として `stdout` も設定しているので、コンテナのログからもカウンターが上がっていることが確認できる。

```bash
[um7a@compute01 ~]$ docker run -it --rm --name fluent-bit-test --network=host -v .:/etc/fluent-bit -v /var/log:/var/log flue
nt/fluent-bit:3.2.3 --config=/etc/fluent-bit/fluent-bit.yml
Fluent Bit v3.2.3
* Copyright (C) 2015-2024 The Fluent Bit Authors
* Fluent Bit is a CNCF sub-project under the umbrella of Fluentd
* https://fluentbit.io

______ _                  _    ______ _ _           _____  _____
|  ___| |                | |   | ___ (_) |         |____ |/ __  \
| |_  | |_   _  ___ _ __ | |_  | |_/ /_| |_  __   __   / /`' / /'
|  _| | | | | |/ _ \ '_ \| __| | ___ \ | __| \ \ / /   \ \  / /
| |   | | |_| |  __/ | | | |_  | |_/ / | |_   \ V /.___/ /./ /___
\_|   |_|\__,_|\___|_| |_|\__| \____/|_|\__|   \_/ \____(_)_____/


[2025/01/04 01:16:57] [ info] [fluent bit] version=3.2.3, commit=44a2d0d43f, pid=1
[2025/01/04 01:16:57] [ info] [storage] ver=1.5.2, type=memory, sync=normal, checksum=off, max_chunks_up=128
[2025/01/04 01:16:57] [ info] [simd    ] disabled
[2025/01/04 01:16:57] [ info] [cmetrics] version=0.9.9
[2025/01/04 01:16:57] [ info] [ctraces ] version=0.5.7
[2025/01/04 01:16:57] [ info] [input:tail:tail.0] initializing
[2025/01/04 01:16:57] [ info] [input:tail:tail.0] storage_strategy='memory' (memory only)
[2025/01/04 01:16:57] [ info] [input:emitter:emitter_for_log_to_metrics.0] initializing
[2025/01/04 01:16:57] [ info] [input:emitter:emitter_for_log_to_metrics.0] storage_strategy='memory' (memory only)
[2025/01/04 01:16:57] [ info] [output:stdout:stdout.0] worker #0 started
[2025/01/04 01:16:57] [ info] [output:prometheus_exporter:prometheus_exporter.1] listening iface=0.0.0.0 tcp_port=2021
[2025/01/04 01:16:57] [ info] [sp] stream processor started
[2025/01/04 01:16:57] [ info] [input:tail:tail.0] inotify_fs_add(): inode=3313 watch_fd=1 name=/var/log/secure
2025-01-04T01:17:03.968011409Z log_metric_counter_count_invalid_ssh_login{host="compute01",user="invalid-user"} = 1
```

後は Prometheus でこのメトリクスの取得とアラートルールを作成すればログ監視が実現できる。
