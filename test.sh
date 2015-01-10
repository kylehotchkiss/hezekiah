echo "Update testing instance..."
git checkout testing >/dev/null
git add --all . >/dev/null
git commit -m "Update testing instance..." >/dev/null
git push -f origin three >/dev/null


git checkout three >/dev/null
