git filter-branch -f --index-filter 'git rm --cached --ignore-unmatch BungeeMiningAppPkg-darwin-x64/BungeeMiningAppPkg.app/Contents/Frameworks/Electron'

git filter-branch -f --index-filter 'git rm --cached --ignore-unmatch BungeeMiningAppPkg-darwin-x64'
