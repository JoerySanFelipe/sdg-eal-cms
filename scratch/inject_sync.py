import glob

files = glob.glob('sdg-reports/sdg*.html') + glob.glob('indicators/*.html')
count = 0
for f in files:
    with open(f, 'r', encoding='utf-8') as fp:
        content = fp.read()
    if 'firebase-public-sync.js' not in content:
        if '<script src="../js/global-charts.js" defer></script>' in content:
            content = content.replace(
                '<script src="../js/global-charts.js" defer></script>',
                '<script src="../js/global-charts.js" defer></script>\n  <script src="../js/firebase-public-sync.js" defer></script>'
            )
        elif '<script src="../js/eco-components.js" defer></script>' in content:
            content = content.replace(
                '<script src="../js/eco-components.js" defer></script>',
                '<script src="../js/eco-components.js" defer></script>\n  <script src="../js/firebase-public-sync.js" defer></script>'
            )
        elif '</head>' in content:
            content = content.replace(
                '</head>',
                '  <script src="../js/firebase-public-sync.js" defer></script>\n</head>'
            )
        with open(f, 'w', encoding='utf-8') as fp:
            fp.write(content)
        count += 1
        print(f"Updated {f}")

print(f"Total updated: {count}")
