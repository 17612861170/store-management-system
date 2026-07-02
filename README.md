# 门店经营系统 GitHub Pages 发布版

这个目录用于发布「门店经营系统」外网访问版。

## 发布内容

- `index.html`
- `data/daily_coefficients_2026.js`
- `data/new_store_investment_return.js`
- `data/opening_execution_template.js`
- `data/feishu_targets_2026.json`
- `data/new_store_investment_return.json`

## 不发布内容

原始营收 TSV、飞书同步脚本、过程文件不放入此发布目录，避免把底层明细文件直接暴露到公网。

## GitHub Pages 设置

仓库推送后，在 GitHub 仓库中设置：

```text
Settings -> Pages -> Build and deployment -> Source: Deploy from a branch
Branch: main
Folder: /root
```

最终链接格式：

```text
https://你的GitHub用户名.github.io/仓库名/
```

