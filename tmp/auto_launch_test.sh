#!
echo



##  ./BungeeMiningAppPkg-darwin-x64/BungeeMiningAppPkg.app/Contents/Resources/BungeeMiningAppPkg
pkgname="BungeeMiningAppPkg"
pkgname="ElectronCkEditorAppPkg"

echo rm -rf ./${pkgname}-darwin-x64
rm -rf ./${pkgname}-darwin-x64

echo npm run build
npm run build



TARGET_DIR="./${pkgname}-darwin-x64/${pkgname}.app/Contents/MacOS/"
echo cp *.pem ${TARGET_DIR}
cp *.pem ${TARGET_DIR}

chmod 400 *.pem
chmod 400 ${TARGET_DIR}*.pem


echo cd ${TARGET_DIR}
cd ${TARGET_DIR}

echo ./${pkgname}
./${pkgname}





         