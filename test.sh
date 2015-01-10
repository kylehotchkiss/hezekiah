echo "Update testing instance..."
git checkout testing > /dev/null 2>&1
git add --all . > /dev/null 2>&1
git commit -m "Update testing instance..." > /dev/null 2>&1
git push -f testing three:master > /dev/null 2>&1

mocha

git checkout three > /dev/null 2>&1
