#!
echo



##  ./BungeeMiningAppPkg-darwin-x64/BungeeMiningAppPkg.app/Contents/Resources/BungeeMiningAppPkg
echo rm -rf ./BungeeMiningAppPkg-darwin-x64
rm -rf ./BungeeMiningAppPkg-darwin-x64

echo npm run build
npm run build



TARGET_DIR="./BungeeMiningAppPkg-darwin-x64/BungeeMiningAppPkg.app/Contents/MacOS/"
echo cp *.pem ${TARGET_DIR}
cp *.pem ${TARGET_DIR}

chmod 400 *.pem
chmod 400 ${TARGET_DIR}*.pem


echo cd ${TARGET_DIR}
cd ${TARGET_DIR}

echo ./BungeeMiningAppPkg
./BungeeMiningAppPkg





         