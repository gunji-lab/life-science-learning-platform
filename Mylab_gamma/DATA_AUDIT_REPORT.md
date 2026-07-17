# DATA AUDIT REPORT

Date: 2026-07-17

## Scope

Target department: 東洋大学 生命科学部 生体医工学科

Created folder: `Mylab_gamma`

## Official Sources Checked

- Department page: https://www.toyo.ac.jp/nyushi/undergraduate/lsc/dben/
- Laboratory list: https://www.toyo.ac.jp/nyushi/undergraduate/lsc/dben/laboratory/
- Web lecture list: https://www.toyo.ac.jp/nyushi/column/video-lecture/
- Official syllabus search: https://g-sys.toyo.ac.jp/syllabus/

## Confirmed Department Information

- Department name: 生体医工学科
- Faculty: 生命科学部
- Department theme: biomedical engineering combining life science, medicine, and engineering.
- Two-course structure was confirmed on the official department page:
  - 生体工学コース
  - 医工学コース

## Confirmed Laboratory Count

Official laboratory list confirmed 14 laboratories.

## Added Laboratories

| ID | Laboratory | PI | Position | Official lab page | Web lecture |
|---|---|---|---|---|---|
| `dben_ogoh` | 運動生理学研究室 | 小河 繁彦 | 教授 | confirmed | confirmed |
| `dben_kitamura` | 免疫システム制御学研究室 | 北村 秀光 | 教授 | confirmed | confirmed |
| `dben_kimura_t` | 物質医工学研究室 | 木村 剛 | 教授 | confirmed | confirmed |
| `dben_goda` | バイオエンジニアリング研究室 | 合田 達郎 | 教授 | confirmed | confirmed |
| `dben_suzuki` | 生体信号処理研究室 | 鈴木 裕 | 教授 | confirmed | confirmed |
| `dben_nishino` | 細胞ゲノム工学研究室 | 西野 光一郎 | 教授 | confirmed | confirmed |
| `dben_horiuchi` | ニューロサイエンス研究室 | 堀内 城司 | 教授 | confirmed | confirmed |
| `dben_motohashi` | 量子医工学研究室 | 本橋 健次 | 教授 | confirmed | confirmed |
| `dben_yamauchi` | 医療福祉支援工学研究室 | 山内 康司 | 教授 | confirmed | confirmed |
| `dben_akimoto` | メディカルロボティクス研究室 | 秋元 俊成 | 准教授 | confirmed | confirmed |
| `dben_osawa` | 生体高分子材料研究室 | 大澤 重仁 | 准教授 | confirmed | confirmed |
| `dben_kai` | マイクロ材料工学研究室 | 甲斐 洋行 | 准教授 | confirmed | confirmed |
| `dben_kimura_y` | ヘルスプロモーション研究室 | 木村 鷹介 | 准教授 | confirmed | confirmed |
| `dben_yamazaki` | 生体情報学研究室 | 山崎 享子 | 准教授 | confirmed | not confirmed |

## Data Creation Policy

- `summary`, `question`, `description`, `methods`, `major_categories`, `tags`, `keywords`, and `recommended_for` were edited from official laboratory page content.
- `keywords` were generated from:
  - `tags.targets`
  - `tags.fields`
  - `tags.methods`
- `courses` were left empty because the official syllabus search could not be accessed from this environment.
- `researchmap` links were not added because individual pages were not confirmed.
- KAKEN links were not added to the UI.

## Web Lectures Confirmed

Official Web lecture links were confirmed for 13 of 14 laboratories from the Toyo University official Web lecture pages.

No Web lecture was confirmed for 山崎 享子先生 in the provided official Web lecture list, so no link was added.

## Syllabus Status

The syllabus site returned an Incapsula incident page during access from this environment. Therefore, 2025 and 2026 course assignments could not be verified.

No course titles were inferred from research fields.

## Validation Results

- `python3 -m json.tool Mylab_gamma/data/departments.json`: passed
- `python3 -m json.tool Mylab_gamma/data/labs.json`: passed
- `python3 -m json.tool Mylab_gamma/data/events.json`: passed
- `python3 -m json.tool Mylab_gamma/data/research_compass_questions.json`: passed
- `node --check Mylab_gamma/app.js`: passed
- Duplicate lab IDs: none
- Unknown department references: none
- Existing labs retained: 26
- New labs added: 14
